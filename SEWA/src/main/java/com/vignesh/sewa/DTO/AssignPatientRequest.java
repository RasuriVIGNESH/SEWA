package com.vignesh.sewa.DTO;

import lombok.Data;

@Data
public class AssignPatientRequest {
    private Long patientId;
    private Long doctorId;
}
