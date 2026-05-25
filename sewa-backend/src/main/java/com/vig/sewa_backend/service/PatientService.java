package com.vig.sewa_backend.service;

import com.vig.sewa_backend.DTO.PatientRequest;
import com.vig.sewa_backend.DTO.PatientResponse;
import com.vig.sewa_backend.Entity.Patient;
import com.vig.sewa_backend.Entity.PatientDetails;
import com.vig.sewa_backend.Entity.Status;
import com.vig.sewa_backend.repository.DoctorRepository;
import com.vig.sewa_backend.repository.PatientRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final FhirPollerService fhirPollerService;

    // ── CREATE ─────────────────────────────────────────────────────────────

    @Transactional
    public PatientResponse create(PatientRequest req) {
        Patient p = new Patient();
        applyRequest(p, req);

        PatientDetails details = new PatientDetails();
        details.setGender(req.getGender());
        details.setBloodGroup(req.getBloodGroup());
        details.setAdmissionDate(req.getAdmissionDate());
        details.setAddress(req.getAddress());
        details.setAdmissionReason(req.getAdmissionReason());
        details.setMedicalHistory(req.getMedicalHistory());
        p.setPatientDetails(details);

        Patient saved = patientRepository.save(p);

        // If fhirPatientId present, warm the cache immediately
        if (saved.getFhirPatientId() != null)
            fhirPollerService.refreshCache(saved.getFhirPatientId());

        return toResponse(saved);
    }

    // ── UPDATE (doctor fills in name/bed for auto-created patient) ─────────

    @Transactional
    public PatientResponse update(Long id, PatientRequest req) {
        Patient p = findById(id);
        String oldFhirId = p.getFhirPatientId();
        applyRequest(p, req);

        if (p.getPatientDetails() == null) p.setPatientDetails(new PatientDetails());
        PatientDetails d = p.getPatientDetails();
        if (req.getGender() != null)          d.setGender(req.getGender());
        if (req.getBloodGroup() != null)       d.setBloodGroup(req.getBloodGroup());
        if (req.getAdmissionDate() != null)    d.setAdmissionDate(req.getAdmissionDate());
        if (req.getAddress() != null)          d.setAddress(req.getAddress());
        if (req.getAdmissionReason() != null)  d.setAdmissionReason(req.getAdmissionReason());
        if (req.getMedicalHistory() != null)   d.setMedicalHistory(req.getMedicalHistory());

        Patient saved = patientRepository.save(p);

        // Refresh cache so next WebSocket broadcast has updated name/bed
        String fhirId = saved.getFhirPatientId() != null ? saved.getFhirPatientId() : oldFhirId;
        if (fhirId != null) fhirPollerService.refreshCache(fhirId);

        return toResponse(saved);
    }

    // ── ASSIGN DOCTOR ──────────────────────────────────────────────────────

    @Transactional
    public void assign(Long patientId, Long doctorId) {
        if (!patientRepository.existsById(patientId))
            throw new RuntimeException("Patient not found: " + patientId);
        if (!doctorRepository.existsById(doctorId))
            throw new RuntimeException("Doctor not found: " + doctorId);

        // Single UPDATE query — no load-save cycle
        patientRepository.assignDoctor(patientId, doctorId);

        // Refresh cache so broadcast carries updated doctor context if needed
        patientRepository.findById(patientId)
                .filter(p -> p.getFhirPatientId() != null)
                .ifPresent(p -> fhirPollerService.refreshCache(p.getFhirPatientId()));
    }

    // ── DISCHARGE ──────────────────────────────────────────────────────────

    @Transactional
    public void discharge(Long id) {
        Patient p = findById(id);
        // Single UPDATE — no full entity load needed
        patientRepository.updateStatus(id, Status.DISCHARGED);
        if (p.getFhirPatientId() != null)
            fhirPollerService.evictFromCache(p.getFhirPatientId());
    }

    // ── READ ───────────────────────────────────────────────────────────────

    public List<PatientResponse> getAll() {
        return patientRepository.findAllWithDetails().stream().map(PatientService::toResponse).toList();
    }

    public List<PatientResponse> getUnassigned() {
        return patientRepository.findUnassigned().stream().map(PatientService::toResponse).toList();
    }

    public List<PatientResponse> getByStatus(Status status) {
        return patientRepository.findByStatus(status).stream().map(PatientService::toResponse).toList();
    }

    public PatientResponse getById(Long id) {
        return toResponse(findById(id));
    }

    // ── DELETE ─────────────────────────────────────────────────────────────

    @Transactional
    public void delete(Long id) {
        Patient p = findById(id);
        if (p.getFhirPatientId() != null)
            fhirPollerService.evictFromCache(p.getFhirPatientId());
        patientRepository.deleteById(id);
    }

    // ── HELPERS ────────────────────────────────────────────────────────────

    private void applyRequest(Patient p, PatientRequest req) {
        if (req.getName() != null)          p.setName(req.getName());
        if (req.getPhoneNumber() != null)   p.setPhoneNumber(req.getPhoneNumber());
        if (req.getBedNumber() != null)     p.setBedNumber(req.getBedNumber());
        if (req.getFhirPatientId() != null) p.setFhirPatientId(req.getFhirPatientId());
        if (req.getStatus() != null)        p.setStatus(req.getStatus());
    }

    private Patient findById(Long id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found: " + id));
    }

    public static PatientResponse toResponse(Patient p) {
        PatientDetails d = p.getPatientDetails();
        return PatientResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .phoneNumber(p.getPhoneNumber())
                .bedNumber(p.getBedNumber())
                .fhirPatientId(p.getFhirPatientId())
                .status(p.getStatus())
                .gender(d != null ? d.getGender() : null)
                .bloodGroup(d != null ? d.getBloodGroup() : null)
                .admissionDate(d != null ? d.getAdmissionDate() : null)
                .admissionReason(d != null ? d.getAdmissionReason() : null)
                .doctorName(p.getDoctor() != null ? p.getDoctor().getName() : null)
                .doctorId(p.getDoctor() != null ? p.getDoctor().getId() : null)
                .build();
    }
}