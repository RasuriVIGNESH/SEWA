package com.vig.sewa_backend.controller;

import com.vig.sewa_backend.DTO.AlertResponse;
import com.vig.sewa_backend.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @GetMapping("/active")
    public ResponseEntity<List<AlertResponse>> getActiveAlerts() {
        return ResponseEntity.ok(alertService.getActiveAlerts());
    }

    @GetMapping("/patient/{fhirPatientId}")
    public ResponseEntity<List<AlertResponse>> getAlertsForPatient(@PathVariable String fhirPatientId) {
        return ResponseEntity.ok(alertService.getAlertsForPatient(fhirPatientId));
    }

    @PatchMapping("/{alertId}/acknowledge")
    public ResponseEntity<AlertResponse> acknowledgeAlert(@PathVariable Long alertId) {
        AlertResponse acknowledgedAlert = alertService.acknowledgeAlert(alertId);
        if (acknowledgedAlert != null) {
            return ResponseEntity.ok(acknowledgedAlert);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
