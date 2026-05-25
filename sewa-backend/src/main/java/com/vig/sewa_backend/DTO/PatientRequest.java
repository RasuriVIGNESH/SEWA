package com.vig.sewa_backend.DTO;

import com.vig.sewa_backend.Entity.Status;
import lombok.Data;

import java.time.LocalDate;

@Data
public class PatientRequest {
    private String name;
    private String phoneNumber;
    private String bedNumber;
    private String fhirPatientId;
    private Status status;

    // Details
    private String gender;
    private String bloodGroup;
    private LocalDate admissionDate;
    private String address;
    private String admissionReason;
    private String medicalHistory;
}
