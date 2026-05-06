package com.vignesh.sewa.DTO;

import lombok.Data;

@Data
public class DoctorRequest {
    private String name;

    private String email;
    private String password;
    private String specialization;
    private String phoneNumber;
}
