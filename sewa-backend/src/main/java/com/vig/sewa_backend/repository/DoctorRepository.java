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

    // Fetch all doctors with patient count — no N+1
    @Query("""
        SELECT new com.vig.sewa_backend.DTO.DoctorResponse(
            d.id, d.name, d.specialization, d.email, d.phoneNumber,
            CAST(COUNT(p.id) AS int)
        )
        FROM Doctor d LEFT JOIN d.patients p
        GROUP BY d.id, d.name, d.specialization, d.email, d.phoneNumber
    """)
    List<DoctorResponse> findAllWithPatientCount();

    // Doctor's patients — only needed columns, no cartesian join
    @Query("""
        SELECT p FROM Patient p
        WHERE p.doctor.id = :doctorId
        ORDER BY p.bedNumber
    """)
    List<Patient> findPatientsByDoctorId(@Param("doctorId") Long doctorId);
}