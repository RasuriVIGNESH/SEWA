package com.vig.sewa_backend.controller;

import com.vig.sewa_backend.DTO.AssignPatientRequest;
import com.vig.sewa_backend.DTO.PatientRequest;
import com.vig.sewa_backend.DTO.PatientResponse;
import com.vig.sewa_backend.Entity.Status;
import com.vig.sewa_backend.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    @Autowired
    private final PatientService patientService;

    @PostMapping("/new")
    public ResponseEntity<PatientResponse> create(@RequestBody PatientRequest req) {
        return ResponseEntity.ok(patientService.create(req));
    }

    @GetMapping
    public ResponseEntity<List<PatientResponse>> getAll() {
        return ResponseEntity.ok(patientService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PatientResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(patientService.getById(id));
    }

    @GetMapping("/unassigned")
    public ResponseEntity<List<PatientResponse>> getUnassigned() {
        return ResponseEntity.ok(patientService.getUnassigned());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<PatientResponse>> getByStatus(@PathVariable Status status) {
        return ResponseEntity.ok(patientService.getByStatus(status));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<PatientResponse> update(@PathVariable Long id,
                                                  @RequestBody PatientRequest req) {
        return ResponseEntity.ok(patientService.update(id, req));
    }

    @PostMapping("/assign")
    public ResponseEntity<Void> assign(@RequestBody AssignPatientRequest req) {
        patientService.assign(req.getPatientId(), req.getDoctorId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/discharge")
    public ResponseEntity<Void> discharge(@PathVariable Long id) {
        patientService.discharge(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        patientService.delete(id);
        return ResponseEntity.noContent().build();
    }
}