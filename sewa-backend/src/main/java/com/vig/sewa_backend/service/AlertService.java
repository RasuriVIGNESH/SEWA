package com.vig.sewa_backend.service;

import com.vig.sewa_backend.DTO.AlertResponse;
import com.vig.sewa_backend.Entity.Alert;
import com.vig.sewa_backend.repository.AlertRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public List<AlertResponse> getActiveAlerts() {
        return alertRepository.findByAcknowledgedFalseOrderByTimestampDesc()
                .stream().map(AlertService::toResponse).toList();
    }

    public List<AlertResponse> getAlertsForPatient(String fhirPatientId) {
        return alertRepository.findByFhirPatientIdOrderByTimestampDesc(fhirPatientId)
                .stream().map(AlertService::toResponse).toList();
    }

    @Transactional
    public AlertResponse acknowledgeAlert(Long alertId) {
        return alertRepository.findByIdWithPatient(alertId).map(alert -> {
            alert.setAcknowledged(true);
            return toResponse(alertRepository.save(alert));
        }).orElse(null);
    }
    public static AlertResponse toResponse(Alert a) {
        return AlertResponse.builder()
                .id(a.getId())
                .fhirPatientId(a.getFhirPatientId())
                .patientName(a.getPatientName())
                .bedNumber(a.getBedNumber())
                .alertMessage(a.getAlertMessage())
                .timestamp(a.getTimestamp())
                .acknowledged(a.isAcknowledged())
                .patientId(a.getPatient() != null ? a.getPatient().getId() : null)
                .build();
    }

    public void sendAlertToFrontend(Alert alert) {
        messagingTemplate.convertAndSend("/topic/alerts/" + alert.getFhirPatientId(), alert);
        log.info("Sent alert to frontend for patient {}: {}", alert.getFhirPatientId(), alert.getAlertMessage());
    }

    public void sendGlobalAlertToFrontend(Alert alert) {
        messagingTemplate.convertAndSend("/topic/alerts/global", alert);
        log.info("Sent global alert to frontend: {}", alert.getAlertMessage());
    }
}
