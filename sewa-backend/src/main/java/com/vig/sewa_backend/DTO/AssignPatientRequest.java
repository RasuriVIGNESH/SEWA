package com.vig.sewa_backend.DTO;

import lombok.Data;

@Data
public class AssignPatientRequest {
    private Long patientId;
    private Long doctorId;
}
