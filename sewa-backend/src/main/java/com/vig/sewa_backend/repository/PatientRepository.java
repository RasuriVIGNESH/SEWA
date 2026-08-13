package com.vig.sewa_backend.repository;

import com.vig.sewa_backend.Entity.Patient;
import com.vig.sewa_backend.Entity.Status;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.*;

public interface PatientRepository extends JpaRepository<Patient, Long> {

    Optional<Patient> findByFhirPatientId(String fhirPatientId);

    boolean existsByBedNumber(String bedNumber);

    // Single patient with all associations — use this everywhere toResponse() is called
    @Query("""
        SELECT p FROM Patient p
        LEFT JOIN FETCH p.patientDetails
        LEFT JOIN FETCH p.doctor
        WHERE p.id = :id
    """)
    Optional<Patient> findByIdWithDetails(@Param("id") Long id);

    // All patients with doctor and details in one query — avoids N+1
    @Query("""
        SELECT p FROM Patient p
        LEFT JOIN FETCH p.doctor
        LEFT JOIN FETCH p.patientDetails
        ORDER BY p.bedNumber
    """)
    List<Patient> findAllWithDetails();

    // Unassigned patients
    @Query("""
        SELECT p FROM Patient p
        LEFT JOIN FETCH p.patientDetails
        WHERE p.doctor IS NULL
        ORDER BY p.id DESC
    """)
    List<Patient> findUnassigned();

    // Patients by status
    @Query("""
        SELECT p FROM Patient p
        LEFT JOIN FETCH p.doctor
        LEFT JOIN FETCH p.patientDetails
        WHERE p.status = :status
    """)
    List<Patient> findByStatus(@Param("status") Status status);

    // All active (non-discharged) — used by FhirSyncService on startup
    @Query("""
        SELECT p FROM Patient p
        LEFT JOIN FETCH p.patientDetails
        WHERE p.status <> com.vig.sewa_backend.Entity.Status.DISCHARGED
    """)
    List<Patient> findActivePatients();

    @Modifying
    @Query("UPDATE Patient p SET p.status = :status WHERE p.id = :id")
    int updateStatus(@Param("id") Long id, @Param("status") Status status);

    @Modifying
    @Query("UPDATE Patient p SET p.doctor.id = :doctorId WHERE p.id = :patientId")
    int assignDoctor(@Param("patientId") Long patientId, @Param("doctorId") Long doctorId);

    @Modifying
    @Query("UPDATE Patient p SET p.fhirPatientId = :fhirId WHERE p.id = :id")
    int updateFhirPatientId(@Param("id") Long id, @Param("fhirId") String fhirId);
}