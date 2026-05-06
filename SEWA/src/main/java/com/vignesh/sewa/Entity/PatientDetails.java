package com.vignesh.sewa.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "patient_details")
@NoArgsConstructor
@AllArgsConstructor
@Getter @Setter
public class PatientDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(mappedBy = "patientDetails")
    private Patient patient;

    private String gender;

    private String bloodGroup;

    private LocalDate admissionDate;

    private String address;

    private String admissionReason;

    @Column(columnDefinition = "TEXT")
    private String medicalHistory;
}