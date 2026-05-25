package com.vig.sewa_backend.repository;

import com.vig.sewa_backend.Entity.Patient;
import com.vig.sewa_backend.Entity.Status;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.*;

public interface PatientRepository extends JpaRepository<Patient, Long> {

    Optional<Patient> findByFhirPatientId(String fhirPatientId);

    boolean existsByBedNumber(String bedNumber);

    // All patients with doctor name in one query — avoids lazy load per row
    @Query("""
        SELECT p FROM Patient p
        LEFT JOIN FETCH p.doctor
        LEFT JOIN FETCH p.patientDetails
        ORDER BY p.bedNumber
    """)
    List<Patient> findAllWithDetails();

    // Unassigned patients — for doctor assignment screen
    @Query("SELECT p FROM Patient p WHERE p.doctor IS NULL ORDER BY p.admissionDate DESC")
    List<Patient> findUnassigned();

    // Patients by status — ICU dashboard filter
    @Query("SELECT p FROM Patient p LEFT JOIN FETCH p.doctor WHERE p.status = :status")
    List<Patient> findByStatus(@Param("status") Status status);

    // Bulk update status — discharge without loading each entity
    @Modifying
    @Query("UPDATE Patient p SET p.status = :status WHERE p.id = :id")
    int updateStatus(@Param("id") Long id, @Param("status") Status status);

    // Assign doctor — single UPDATE, no load-save cycle
    @Modifying
    @Query("UPDATE Patient p SET p.doctor.id = :doctorId WHERE p.id = :patientId")
    int assignDoctor(@Param("patientId") Long patientId, @Param("doctorId") Long doctorId);
}