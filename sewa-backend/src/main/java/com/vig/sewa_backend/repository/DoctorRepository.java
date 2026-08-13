package com.vig.sewa_backend.repository;

import com.vig.sewa_backend.Entity.Patient;
import com.vig.sewa_backend.Entity.Doctor;
import com.vig.sewa_backend.DTO.DoctorResponse;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    Optional<Doctor> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("""
        SELECT new com.vig.sewa_backend.DTO.DoctorResponse(
            d.id, d.name, d.specialization, d.email, d.phoneNumber,
            CAST(COUNT(p.id) AS int)
        )
        FROM Doctor d LEFT JOIN d.patients p
        GROUP BY d.id, d.name, d.specialization, d.email, d.phoneNumber
    """)
    List<DoctorResponse> findAllWithPatientCount();

    // Fetch patientDetails AND doctor together — prevents LazyInitializationException in toResponse()
    @Query("""
        SELECT p FROM Patient p
        LEFT JOIN FETCH p.patientDetails
        LEFT JOIN FETCH p.doctor
        WHERE p.doctor.id = :doctorId
        ORDER BY p.bedNumber
    """)
    List<Patient> findPatientsByDoctorId(@Param("doctorId") Long doctorId);
}