package com.vig.sewa_backend.service;

import com.vig.sewa_backend.Entity.Alert;
import com.vig.sewa_backend.repository.AlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.Map;

/**
 * Consumes high-risk alerts published by the FastAPI ML Service.
 * Persists them to PostgreSQL and broadcasts to React frontend via WebSockets.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KafkaAlertConsumer {

    private final AlertRepository alertRepository;
    private final AlertService alertService;

    @KafkaListener(topics = "sewa.alerts", groupId = "sewa-backend-group")
    public void consumeAlert(Map<String, Object> alertData) {
        log.info("🚨 Received Sepsis Alert from ML Service: {}", alertData);

        try {
            Alert alert = new Alert();
            alert.setFhirPatientId((String) alertData.get("fhir_patient_id"));
            alert.setPatientName((String) alertData.get("patient_name"));
            alert.setBedNumber((String) alertData.get("bed_number"));
            alert.setAlertMessage((String) alertData.get("alert_message"));
            alert.setTimestamp(Instant.parse((String) alertData.get("timestamp")));
            alert.setAcknowledged(false);

            // 1. Persist to DB
            Alert savedAlert = alertRepository.save(alert);

            // 2. Broadcast to Frontend (Patient specific and Global)
            alertService.sendAlertToFrontend(savedAlert);
            alertService.sendGlobalAlertToFrontend(savedAlert);

        } catch (Exception e) {
            log.error("Failed to process incoming Kafka alert", e);
        }
    }
}
