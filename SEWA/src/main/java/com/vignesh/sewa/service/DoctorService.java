package com.vignesh.sewa.service;

import com.vignesh.sewa.Entity.Doctor;
import com.vignesh.sewa.DTO.*;
import com.vignesh.sewa.Exception.DuplicateDoctorException;
import com.vignesh.sewa.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository DoctorRepository;
    private final PasswordEncoder passwordEncoder;

    public DoctorResponse create(DoctorRequest req) {
        if (DoctorRepository.existsByEmail(req.getEmail())) {
            throw new DuplicateDoctorException("Email already registered");
        }
        Doctor d = new Doctor();
        d.setName(req.getName());
        d.setSpecialization(req.getSpecialization());
        d.setEmail(req.getEmail());
        d.setPhoneNumber(req.getPhoneNumber());
        d.setPassword(passwordEncoder.encode(req.getPassword()));
        Doctor saved = DoctorRepository.save(d);
        return toResponse(saved, 0);
    }

    public Doctor getByEmail(String email) {
        return DoctorRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Doctor not found: " + email));
    }

    public List<DoctorResponse> getAll() {
        return DoctorRepository.findAllWithPatientCount();  // single aggregated query
    }

    public DoctorResponse getById(Long id) {
        Doctor d = DoctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found: " + id));
        return toResponse(d, d.getPatients() == null ? 0 : d.getPatients().size());
    }

    public List<PatientResponse> getPatients(Long doctorId) {
        return DoctorRepository.findPatientsByDoctorId(doctorId)
                .stream().map(PatientService::toResponse).toList();
    }

    private DoctorResponse toResponse(Doctor d, int count) {
        return DoctorResponse.builder()
                .id(d.getId())
                .name(d.getName())
                .specialization(d.getSpecialization())
                .email(d.getEmail())
                .phoneNumber(d.getPhoneNumber())
                .patientCount(count)
                .build();
    }
}