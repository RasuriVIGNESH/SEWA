package com.vig.sewa_backend.DTO;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class AlertResponse {
    private Long id;
    private String fhirPatientId;
    private String patientName;
    private String bedNumber;
    private String alertMessage;
    private Instant timestamp;
    private boolean acknowledged;
    private Long patientId;
}