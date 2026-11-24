package com.vig.sewa_backend.DTO;

import lombok.*;
import java.time.Instant;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VitalReadingDTO {

    private String fhirObservationId;
    private String fhirPatientId;
    private String bedNumber;
    private String patientName;
    private Instant timestamp;

    // --- Core Vitals ---
    private Double hr;
    private Double o2Sat;
    private Double temp;
    private Double sbp;
    private Double map;
    private Double dbp;
    private Double resp;
    private Double etCO2;

    // --- Laboratory: Blood Gas ---
    private Double baseExcess;
    private Double hco3;
    private Double fiO2;
    private Double ph;
    private Double paCO2;
    private Double saO2;

    // --- Laboratory: Chemistry & Hematology ---
    private Double ast;
    private Double bun;
    private Double alkalinephos;
    private Double calcium;
    private Double chloride;
    private Double creatinine;
    private Double bilirubin_direct;
    private Double glucose;
    private Double lactate;
    private Double magnesium;
    private Double phosphate;
    private Double potassium;
    private Double bilirubin_total;
    private Double troponinI;
    private Double hct;
    private Double hgb;
    private Double ptt;
    private Double wbc;
    private Double fibrinogen;
    private Double platelets;

    // --- Demographics & ICU Metrics ---
    private Double age;
    private Double gender;
    private Double iculos;

    // --- Target Label (Ground Truth from Simulator) ---
    private Integer sepsisLabel;
}
