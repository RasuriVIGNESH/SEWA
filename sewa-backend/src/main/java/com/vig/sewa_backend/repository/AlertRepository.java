package com.vig.sewa_backend.repository;

import com.vig.sewa_backend.Entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    @Query("SELECT a FROM Alert a LEFT JOIN FETCH a.patient WHERE a.fhirPatientId = :fhirPatientId ORDER BY a.timestamp DESC")
    List<Alert> findByFhirPatientIdOrderByTimestampDesc(@Param("fhirPatientId") String fhirPatientId);

    @Query("SELECT a FROM Alert a LEFT JOIN FETCH a.patient WHERE a.acknowledged = false ORDER BY a.timestamp DESC")
    List<Alert> findByAcknowledgedFalseOrderByTimestampDesc();

    @Query("SELECT a FROM Alert a LEFT JOIN FETCH a.patient WHERE a.id = :id")
    Optional<Alert> findByIdWithPatient(@Param("id") Long id);
}
