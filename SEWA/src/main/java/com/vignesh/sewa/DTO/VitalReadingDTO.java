package com.vignesh.sewa.DTO;

import lombok.*;

import java.time.Instant;

/**
 * Sent over WebSocket to frontend for every vital-signs panel polled from FHIR.
 * Nulls are fine — not every row in the dataset has every vital.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VitalReadingDTO {

    private String fhirObservationId;

    // Patient reference
    private String fhirPatientId;
    private String bedNumber;
    private String patientName;
    private Instant timestamp;
    private Double heartRate;
    private Double spo2;
    private Double temperature;
    private Double systolicBP;
    private Double diastolicBP;
    private Double meanArterialPressure;
    private Double respiratoryRate;

    // Carried from FHIR extension (used later by FastAPI/ML)
    private Integer sepsisLabel;
}