package com.vig.sewa_backend.service;

import ca.uhn.fhir.rest.client.api.IGenericClient;
import com.vig.sewa_backend.Entity.Patient;
import com.vig.sewa_backend.DTO.VitalReadingDTO;
import com.vig.sewa_backend.repository.PatientRepository;
import com.vig.sewa_backend.serviceInterface.iPoolerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hl7.fhir.r4.model.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@Service
@RequiredArgsConstructor
public class FhirPollerService implements iPoolerService {

    private final IGenericClient fhirClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final SimpMessagingTemplate messaging;
    private final PatientRepository patientRepository;
    // Use a locally initialized ObjectMapper to avoid requiring a global bean
    private final ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    private final AtomicBoolean pollerEnabled = new AtomicBoolean(false);
    private final Map<String, Patient> activePatientCache = new ConcurrentHashMap<>();
    private final Set<String> processedIds = Collections.synchronizedSet(new HashSet<>());
    private Instant lastPollTime = Instant.now().minusSeconds(5);

    @Override
    public void setPollerEnabled(boolean enabled) {
        pollerEnabled.set(enabled);
        log.info("FhirPollerService pollerEnabled={}", enabled);
    }

    @Scheduled(fixedDelayString = "${fhir.poll.interval-ms:3000}")
    @Override
    public void pollAndBroadcast() {
        if (!pollerEnabled.get()) return;

        try {
            Bundle bundle = fhirClient.search()
                    .forResource(Observation.class)
                    .where(Observation.DATE.afterOrEquals().second(Date.from(lastPollTime)))
                    .and(Observation.CATEGORY.exactly().code("vital-signs"))
                    .count(100)
                    .returnBundle(Bundle.class)
                    .execute();

            if (processedIds.size() > 5000) processedIds.clear();
            Instant pollStart = Instant.now();

            if (bundle.getEntry().isEmpty()) return;

            for (Bundle.BundleEntryComponent entry : bundle.getEntry()) {
                if (!(entry.getResource() instanceof Observation obs)) continue;

                String obsId = obs.getIdElement().getIdPart();
                if (processedIds.contains(obsId)) continue;
                processedIds.add(obsId);

                String fhirPatientId = obs.getSubject().getReference().replace("Patient/", "");
                Patient patient = resolvePatient(fhirPatientId);
                if (patient == null) continue;

                VitalReadingDTO dto = mapToDTO(obs, patient);
                if (dto == null) continue;

                // ── Kafka ──
                kafkaTemplate.send("sewa.vitals", fhirPatientId, dto);

                // ── WebSocket ──
                try {
                    String payload = objectMapper.writeValueAsString(dto);
                    String dest = "/topic/vitals/" + fhirPatientId;
                    messaging.convertAndSend(dest, payload);
                    log.info("Vitals broadcast → dest={} patient={} bed={} payloadLen={}", dest, fhirPatientId, dto.getBedNumber(), payload.length());
                } catch (JsonProcessingException jpe) {
                    log.error("Failed to serialize VitalReadingDTO to JSON for fhirPatientId={}", fhirPatientId, jpe);
                }
            }
            lastPollTime = pollStart;
        } catch (Exception e) {
            log.warn("FHIR poll error: {}", e.getMessage());
        }
    }

    private Patient resolvePatient(String fhirPatientId) {
        Patient cached = activePatientCache.get(fhirPatientId);
        if (cached != null) return cached;

        return patientRepository.findByFhirPatientId(fhirPatientId)
                .map(p -> {
                    activePatientCache.put(fhirPatientId, p);
                    return p;
                }).orElse(null);
    }

    private VitalReadingDTO mapToDTO(Observation obs, Patient patient) {
        if (!obs.hasComponent()) return null;

        VitalReadingDTO dto = new VitalReadingDTO();
        dto.setFhirObservationId(obs.getIdElement().getIdPart());
        dto.setFhirPatientId(patient.getFhirPatientId());
        dto.setBedNumber(patient.getBedNumber());
        dto.setPatientName(patient.getName());

        if (obs.hasEffectiveDateTimeType())
            dto.setTimestamp(obs.getEffectiveDateTimeType().getValue().toInstant());

        obs.getExtension().stream()
                .filter(e -> "http://sewa.local/extension/sepsisLabel".equals(e.getUrl()))
                .findFirst()
                .ifPresent(ext -> dto.setSepsisLabel(((IntegerType) ext.getValue()).getValue()));

        for (Observation.ObservationComponentComponent comp : obs.getComponent()) {
            String code = comp.getCode().getCodingFirstRep().getCode();
            if (!comp.hasValueQuantity()) continue;
            double val = comp.getValueQuantity().getValue().doubleValue();

            switch (code) {
                // Vitals
                case "8867-4"  -> dto.setHr(val);
                case "59408-5" -> dto.setO2Sat(val);
                case "8310-5"  -> dto.setTemp(val);
                case "8480-6"  -> dto.setSbp(val);
                case "8478-0"  -> dto.setMap(val);
                case "8462-4"  -> dto.setDbp(val);
                case "9279-1"  -> dto.setResp(val);
                case "19889-5" -> dto.setEtCO2(val);

                // Blood Gas
                case "1927-5"  -> dto.setBaseExcess(val);
                case "1963-0"  -> dto.setHco3(val);
                case "19994-3" -> dto.setFiO2(val);
                case "11558-4" -> dto.setPh(val);
                case "11557-6" -> dto.setPaCO2(val);
                case "2708-6"  -> dto.setSaO2(val);

                // Chemistry
                case "1920-8"  -> dto.setAst(val);
                case "2823-3"  -> dto.setBun(val);
                case "6768-6"  -> dto.setAlkalinephos(val);
                case "17861-6" -> dto.setCalcium(val);
                case "2075-0"  -> dto.setChloride(val);
                case "2160-0"  -> dto.setCreatinine(val);
                case "1968-9"  -> dto.setBilirubin_direct(val);
                case "2339-0"  -> dto.setGlucose(val);
                case "2524-7"  -> dto.setLactate(val);
                case "19123-9" -> dto.setMagnesium(val);
                case "2777-1"  -> dto.setPhosphate(val);
                case "1975-4"  -> dto.setBilirubin_total(val);
                case "10839-9" -> dto.setTroponinI(val);
                case "20570-8" -> dto.setHct(val);
                case "718-7"   -> dto.setHgb(val);
                case "3173-2"  -> dto.setPtt(val);
                case "6690-2"  -> dto.setWbc(val);
                case "2276-4"  -> dto.setFibrinogen(val);
                case "777-3"   -> dto.setPlatelets(val);

                // Metrics
                case "30525-0" -> dto.setAge(val);
                case "76689-9" -> dto.setGender(val);
                case "ICU-LOS" -> dto.setIculos(val);
            }
        }
        return dto;
    }

    @Override public void refreshCache(String id) { patientRepository.findByFhirPatientId(id).ifPresent(p -> activePatientCache.put(id, p)); }
    @Override public void evictFromCache(String id) { activePatientCache.remove(id); }
    @Override public Set<String> getCachedPatientIds() { return Collections.unmodifiableSet(activePatientCache.keySet()); }
}
