package com.vignesh.sewa.serviceInterface;

import com.vignesh.sewa.Entity.Doctor;
import com.vignesh.sewa.Entity.Patient;

import java.util.List;

public interface iDoctorService {
    public List<Patient> getAllMyPatients();

    public Patient createPatient();

    public Patient updatePatient();

    public boolean dischargePatient();

    public Doctor updateDoctorDetails();
}
