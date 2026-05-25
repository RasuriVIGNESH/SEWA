package com.vig.sewa_backend.DTO;

import lombok.Data;

@Data
public class DoctorRequest {
    private String name;

    private String email;
    private String password;
    private String specialization;
    private String phoneNumber;
}
