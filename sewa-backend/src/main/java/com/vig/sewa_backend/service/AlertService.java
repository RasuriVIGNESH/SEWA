package com.vig.sewa_backend.service;

import com.vig.sewa_backend.Entity.Alert;
import com.vig.sewa_backend.repository.AlertRepository;
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

    public List<Alert> getActiveAlerts() {
        return alertRepository.findByAcknowledgedFalseOrderByTimestampDesc();
    }

    public List<Alert> getAlertsForPatient(String fhirPatientId) {
        return alertRepository.findByFhirPatientIdOrderByTimestampDesc(fhirPatientId);
    }

    public Alert acknowledgeAlert(Long alertId) {
        return alertRepository.findById(alertId).map(alert -> {
            alert.setAcknowledged(true);
            return alertRepository.save(alert);
        }).orElse(null);
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
