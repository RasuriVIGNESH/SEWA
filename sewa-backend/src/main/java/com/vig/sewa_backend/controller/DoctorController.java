package com.vig.sewa_backend.controller;

import com.vig.sewa_backend.DTO.DoctorResponse;
import com.vig.sewa_backend.DTO.PatientResponse;
import com.vig.sewa_backend.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;

    @GetMapping
    public ResponseEntity<List<DoctorResponse>> getAll() {
        return ResponseEntity.ok(doctorService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DoctorResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(doctorService.getById(id));
    }

    @GetMapping("/{id}/patients")
    public ResponseEntity<List<PatientResponse>> getPatients(@PathVariable Long id) {
        return ResponseEntity.ok(doctorService.getPatients(id));
    }
}