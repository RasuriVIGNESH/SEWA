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
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository   patientRepository;
    private final DoctorRepository    doctorRepository;
    private final FhirPollerService   fhirPollerService;
    private final FhirPatientService  fhirPatientService;

    // ── CREATE ─────────────────────────────────────────────────────────────────

    /**
     * Flow:
     *  1. Save patient to DB (no FHIR ID yet).
     *  2. Auto-assign the logged-in doctor to this patient.
     *  3. Create patient in FHIR → get FHIR ID.
     *  4. Persist FHIR ID back to DB.
     *  5. Warm the cache so the poller can stream vitals immediately.
     */
    @Transactional
    public PatientResponse create(PatientRequest req) {
        // 1. Build and save to DB
        Patient p = new Patient();
        p.setStatus(Status.UNDER_OBSERVATION);
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
        log.info("Patient saved to DB → dbId={} name={}", saved.getId(), saved.getName());

        // 2. Auto-assign the doctor who is creating this patient
        Long doctorId = getCurrentDoctorId();
        if (doctorId != null) {
            patientRepository.assignDoctor(saved.getId(), doctorId);
            // Reload so the response includes the doctor name
            saved = findById(saved.getId());
            log.info("Doctor auto-assigned → patientId={} doctorId={}", saved.getId(), doctorId);
        } else {
            log.warn("No authenticated doctor found — patient created without doctor assignment.");
        }

        // 3. Create in FHIR (only if FHIR ID not already supplied by caller)
        if (saved.getFhirPatientId() == null || saved.getFhirPatientId().isBlank()) {
            String fhirId = fhirPatientService.createPatientInFhir(saved);

            if (fhirId != null) {
                // 4. Persist FHIR ID back to DB
                patientRepository.updateFhirPatientId(saved.getId(), fhirId);
                saved.setFhirPatientId(fhirId);
                log.info("FHIR ID persisted → dbId={} fhirId={}", saved.getId(), fhirId);
            } else {
                log.warn("Could not create patient in FHIR now → dbId={}. Will retry on next startup.",
                        saved.getId());
            }
        }

        // 5. Warm cache if we have a FHIR ID
        if (saved.getFhirPatientId() != null) {
            fhirPollerService.refreshCache(saved.getFhirPatientId());
        }

        return toResponse(saved);
    }

    // ── UPDATE ─────────────────────────────────────────────────────────────────

    @Transactional
    public PatientResponse update(Long id, PatientRequest req) {
        Patient p = findById(id);
        String oldFhirId = p.getFhirPatientId();
        applyRequest(p, req);

        if (p.getPatientDetails() == null) p.setPatientDetails(new PatientDetails());
        PatientDetails d = p.getPatientDetails();
        if (req.getGender() != null)         d.setGender(req.getGender());
        if (req.getBloodGroup() != null)      d.setBloodGroup(req.getBloodGroup());
        if (req.getAdmissionDate() != null)   d.setAdmissionDate(req.getAdmissionDate());
        if (req.getAddress() != null)         d.setAddress(req.getAddress());
        if (req.getAdmissionReason() != null) d.setAdmissionReason(req.getAdmissionReason());
        if (req.getMedicalHistory() != null)  d.setMedicalHistory(req.getMedicalHistory());

        Patient saved = patientRepository.save(p);

        String fhirId = saved.getFhirPatientId() != null ? saved.getFhirPatientId() : oldFhirId;
        if (fhirId != null) fhirPollerService.refreshCache(fhirId);

        return toResponse(saved);
    }

    // ── ASSIGN DOCTOR ──────────────────────────────────────────────────────────

    @Transactional
    public void assign(Long patientId, Long doctorId) {
        if (!patientRepository.existsById(patientId))
            throw new RuntimeException("Patient not found: " + patientId);
        if (!doctorRepository.existsById(doctorId))
            throw new RuntimeException("Doctor not found: " + doctorId);

        patientRepository.assignDoctor(patientId, doctorId);

        patientRepository.findById(patientId)
                .filter(p -> p.getFhirPatientId() != null)
                .ifPresent(p -> fhirPollerService.refreshCache(p.getFhirPatientId()));
    }

    // ── DISCHARGE ──────────────────────────────────────────────────────────────

    @Transactional
    public void discharge(Long id) {
        Patient p = findById(id);
        patientRepository.updateStatus(id, Status.DISCHARGED);
        if (p.getFhirPatientId() != null)
            fhirPollerService.evictFromCache(p.getFhirPatientId());
    }

    // ── READ ───────────────────────────────────────────────────────────────────

    public List<PatientResponse> getAll() {
        return patientRepository.findAllWithDetails().stream()
                .map(PatientService::toResponse).toList();
    }

    public List<PatientResponse> getUnassigned() {
        return patientRepository.findUnassigned().stream()
                .map(PatientService::toResponse).toList();
    }

    public List<PatientResponse> getByStatus(Status status) {
        return patientRepository.findByStatus(status).stream()
                .map(PatientService::toResponse).toList();
    }

    public PatientResponse getById(Long id) {
        return toResponse(findById(id));
    }

    // ── DELETE ─────────────────────────────────────────────────────────────────

    @Transactional
    public void delete(Long id) {
        Patient p = findById(id);
        if (p.getFhirPatientId() != null)
            fhirPollerService.evictFromCache(p.getFhirPatientId());
        patientRepository.deleteById(id);
    }

    // ── HELPERS ────────────────────────────────────────────────────────────────

    /**
     * Extracts the email from the JWT principal (set by JwtFilter),
     * looks up the Doctor in DB, and returns their ID.
     * Returns null if no authenticated user is found (e.g. startup/test context).
     */
    private Long getCurrentDoctorId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;

        String email = auth.getName(); // Spring User sets getName() = email
        return doctorRepository.findByEmail(email)
                .map(doctor -> doctor.getId())
                .orElseGet(() -> {
                    log.warn("Doctor not found in DB for email={}", email);
                    return null;
                });
    }

    private void applyRequest(Patient p, PatientRequest req) {
        if (req.getName() != null)          p.setName(req.getName());
        if (req.getPhoneNumber() != null)   p.setPhoneNumber(req.getPhoneNumber());
        if (req.getBedNumber() != null)     p.setBedNumber(req.getBedNumber());
        if (req.getFhirPatientId() != null) p.setFhirPatientId(req.getFhirPatientId());
        if (req.getStatus() != null)        p.setStatus(req.getStatus());
    }

    private Patient findById(Long id) {
        return patientRepository.findByIdWithDetails(id)
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