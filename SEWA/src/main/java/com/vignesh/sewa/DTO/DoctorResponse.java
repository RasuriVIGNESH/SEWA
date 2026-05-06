package com.vignesh.sewa.DTO;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DoctorResponse {
    private Long id;
    private String name;
    private String specialization;
    private String email;
    private String phoneNumber;
    private int patientCount;
}
