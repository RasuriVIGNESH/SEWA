package com.vig.sewa_backend.serviceInterface;

import com.vig.sewa_backend.Entity.Doctor;
import com.vig.sewa_backend.Entity.Patient;

import java.util.List;

public interface iDoctorService {
    public List<Patient> getAllMyPatients();

    public Patient createPatient();

    public Patient updatePatient();

    public boolean dischargePatient();

    public Doctor updateDoctorDetails();
}
