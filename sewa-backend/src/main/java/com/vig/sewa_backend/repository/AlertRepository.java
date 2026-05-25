package com.vig.sewa_backend.repository;

import com.vig.sewa_backend.Entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByFhirPatientIdOrderByTimestampDesc(String fhirPatientId);
    List<Alert> findByAcknowledgedFalseOrderByTimestampDesc();
}
