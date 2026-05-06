package com.vignesh.sewa.DTO;

import com.vignesh.sewa.Entity.Status;
import lombok.*;

import java.time.LocalDate;

@Data @Builder public class PatientResponse {
    private Long id;
    private String name;
    private String phoneNumber;
    private String bedNumber;
    private String fhirPatientId;
    private Status status;
    private String gender;
    private String bloodGroup;
    private LocalDate admissionDate;
    private String admissionReason;
    private String doctorName;
    private Long doctorId;
}