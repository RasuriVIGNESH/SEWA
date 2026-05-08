package com.vignesh.sewa.service;

import ca.uhn.fhir.rest.client.api.IGenericClient;
import com.vignesh.sewa.Entity.Patient;
import com.vignesh.sewa.Entity.Status;
import com.vignesh.sewa.DTO.VitalReadingDTO;
import com.vignesh.sewa.repository.PatientRepository;
import com.vignesh.sewa.serviceInterface.iPoolerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hl7.fhir.r4.model.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class FhirPollerService implements iPoolerService {

    private final IGenericClient fhirClient;
    private final SimpMessagingTemplate messaging;
    private final PatientRepository patientRepository;

    // ── IN-MEMORY CACHE ──────────────────────────────────────────────────────
    // Key: fhirPatientId | Value: Patient entity (only active/bedded patients)
    // Max ~5 entries in ICU — zero DB hits after first observation per patient.
    private final Map<String, Patient> activePatientCache = new ConcurrentHashMap<>();

    private final Set<String> processedIds = Collections.synchronizedSet(new HashSet<>());

    private static final String LAST_POLL_FILE = "last_poll_time.txt";
    private Instant lastPollTime = loadLastPollTime();

    private Instant loadLastPollTime() {
        try {
            java.nio.file.Path path = java.nio.file.Paths.get(LAST_POLL_FILE);
            if (java.nio.file.Files.exists(path)) {
                String content = java.nio.file.Files.readString(path).trim();
                return Instant.parse(content);
            }
        } catch (Exception e) {
            log.warn("Could not read last poll time, defaulting to 3s ago");
        }
        return Instant.now().minusSeconds(3);
    }

    // ── POLL ─────────────────────────────────────────────────────────────────

    @Scheduled(fixedDelayString = "${fhir.poll.interval-ms:2000}")
    @Override
    public void pollAndBroadcast() {
        try {
            Bundle bundle = fhirClient.search()
                    .forResource(Observation.class)
                    .where(Observation.DATE.afterOrEquals().second(Date.from(lastPollTime)))
                    .and(Observation.CATEGORY.exactly().code("vital-signs"))
                    .count(100)
                    .returnBundle(Bundle.class)
                    .execute();

            if (processedIds.size() > 5000) {
                processedIds.clear();
            }
            Instant pollStart = Instant.now();
            if (bundle.getEntry().isEmpty()) return;

            for (Bundle.BundleEntryComponent entry : bundle.getEntry()) {
                if (!(entry.getResource() instanceof Observation obs)) continue;

                String obsId = obs.getIdElement().getIdPart();
                if (processedIds.contains(obsId)) continue;
                processedIds.add(obsId);

                String fhirPatientId = obs.getSubject().getReference().replace("Patient/", "");

                Patient patient = resolvePatient(fhirPatientId);
                VitalReadingDTO dto = mapToDTO(obs, patient);
                if (dto == null) continue;

                messaging.convertAndSend("/topic/vitals/" + fhirPatientId, dto);
                log.debug("Broadcast → patient={} bed={}", fhirPatientId, dto.getBedNumber());
            }
            lastPollTime = pollStart;
            try {
                java.nio.file.Files.writeString(
                        java.nio.file.Paths.get(LAST_POLL_FILE),
                        lastPollTime.toString()
                );
            } catch (Exception e) {
                log.warn("Could not persist last poll time");
            }

        } catch (Exception e) {
//            log.error("FHIR poll error", e);
            log.warn("No info from FHIR");
        }
    }

    // ── PATIENT RESOLUTION ───────────────────────────────────────────────────

    /**
     * 1. Cache hit  → return immediately (every call after first observation)
     * 2. DB hit     → load into cache, return
     * 3. Neither    → auto-create minimal record, cache, return
     *                 Doctor fills name/bed/details later via API
     */
    private Patient resolvePatient(String fhirPatientId) {

        // 1. RAM — no DB call
        Patient cached = activePatientCache.get(fhirPatientId);
        if (cached != null) return cached;

        // 2. DB
        Optional<Patient> fromDb = patientRepository.findByFhirPatientId(fhirPatientId);
        if (fromDb.isPresent()) {
            activePatientCache.put(fhirPatientId, fromDb.get());
            log.info("Cache loaded from DB → fhirId={}", fhirPatientId);
            return fromDb.get();
        }

        // 3. Auto-create — FHIR data arrived before doctor registered this patient
        Patient p = new Patient();
        p.setFhirPatientId(fhirPatientId);
        p.setName("Unknown");           // doctor updates later
        p.setBedNumber("ICU-" + (activePatientCache.size() + 1));  // doctor updates later
        p.setStatus(Status.UNDER_OBSERVATION);
        Patient saved = patientRepository.save(p);

        activePatientCache.put(fhirPatientId, saved);
        log.info("Auto-created patient → fhirId={} dbId={}", fhirPatientId, saved.getId());
        return saved;
    }

    // ── CACHE MANAGEMENT — called by PatientService ───────────────────────────

    /** Doctor updated patient details → refresh so next broadcast has fresh name/bed. */
    @Override
    public void refreshCache(String fhirPatientId) {
        patientRepository.findByFhirPatientId(fhirPatientId)
                .ifPresent(p -> activePatientCache.put(fhirPatientId, p));
    }

    /** Patient discharged → remove from active cache. */
    @Override
    public void evictFromCache(String fhirPatientId) {
        activePatientCache.remove(fhirPatientId);
        log.info("Evicted patient from cache → fhirId={}", fhirPatientId);
    }

    /** Debug/admin — who is currently live in RAM. */
    @Override
    public Set<String> getCachedPatientIds() {
        return Collections.unmodifiableSet(activePatientCache.keySet());
    }

    // ── MAPPING ──────────────────────────────────────────────────────────────

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
            double value = comp.getValueQuantity().getValue().doubleValue();
            switch (code) {
                case "8867-4"  -> dto.setHeartRate(value);
                case "59408-5" -> dto.setSpo2(value);
                case "8310-5"  -> dto.setTemperature(value);
                case "8480-6"  -> dto.setSystolicBP(value);
                case "8462-4"  -> dto.setDiastolicBP(value);
                case "8478-0"  -> dto.setMeanArterialPressure(value);
                case "9279-1"  -> dto.setRespiratoryRate(value);
            }
        }
        return dto;
    }
}