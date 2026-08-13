package com.vig.sewa_backend.service;

import ca.uhn.fhir.rest.client.api.IGenericClient;
import com.vig.sewa_backend.Entity.Patient;
import com.vig.sewa_backend.DTO.VitalReadingDTO;
import com.vig.sewa_backend.repository.PatientRepository;
import com.vig.sewa_backend.serviceInterface.iPoolerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hl7.fhir.r4.model.*;
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

    // ── POLLER GUARD ──────────────────────────────────────────────────────────
    // Disabled by default; StartupOrchestrator enables it after FHIR check.
    private final AtomicBoolean pollerEnabled = new AtomicBoolean(false);

    // ── IN-MEMORY CACHE ───────────────────────────────────────────────────────
    // Key: fhirPatientId | Value: Patient snapshot (used for diff → DB update)
    private final Map<String, Patient> activePatientCache = new ConcurrentHashMap<>();

    // Dedup guard — prevents re-processing the same observation ID
    private final Set<String> processedIds = Collections.synchronizedSet(new HashSet<>());

    // Rolling poll window — fetch observations newer than this
    private Instant lastPollTime = Instant.now().minusSeconds(5);

    // ── ENABLE / DISABLE (called by StartupOrchestrator) ─────────────────────

    @Override
    public void setPollerEnabled(boolean enabled) {
        pollerEnabled.set(enabled);
        log.info("FhirPollerService pollerEnabled={}", enabled);
    }

    // ── SCHEDULED POLL ───────────────────────────────────────────────────────

    /**
     * Runs every fhir.poll.interval-ms (default 3 s, tunable in properties).
     * Does nothing until StartupOrchestrator calls setPollerEnabled(true).
     */
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

            // Prevent processedIds growing unbounded in long-running sessions
            if (processedIds.size() > 5000) processedIds.clear();

            Instant pollStart = Instant.now();

            if (bundle.getEntry().isEmpty()) return;

            for (Bundle.BundleEntryComponent entry : bundle.getEntry()) {
                if (!(entry.getResource() instanceof Observation obs)) continue;

                String obsId = obs.getIdElement().getIdPart();
                if (processedIds.contains(obsId)) continue;
                processedIds.add(obsId);

                String fhirPatientId = obs.getSubject().getReference().replace("Patient/", "");

                // Resolve patient from cache (no DB hit if already cached)
                Patient patient = resolvePatient(fhirPatientId);
                if (patient == null) continue;

                // Diff patient fields from FHIR observation extensions → update DB if changed
                checkAndSyncPatientDetails(obs, patient);

                VitalReadingDTO dto = mapToDTO(obs, patient);
                if (dto == null) continue;

                // ── Kafka ──
                kafkaTemplate.send("sewa.vitals", fhirPatientId, dto)
                        .whenComplete((result, ex) -> {
                            if (ex != null) {
                                log.error("Kafka publish failed → patient={}", fhirPatientId, ex);
                            } else {
                                log.debug("Kafka published → partition={} offset={}",
                                        result.getRecordMetadata().partition(),
                                        result.getRecordMetadata().offset());
                            }
                        });

                // ── WebSocket ──
                messaging.convertAndSend("/topic/vitals/" + fhirPatientId, dto);
                log.info("Vitals broadcast → patient={} bed={}", fhirPatientId, dto.getBedNumber());
            }

            lastPollTime = pollStart;

        } catch (Exception e) {
            log.warn("FHIR poll error — ICU may be temporarily unavailable: {}", e.getMessage());
        }
    }

    // ── PATIENT RESOLUTION ────────────────────────────────────────────────────

    /**
     * Resolution order:
     *  1. Cache hit  → return immediately (zero DB call)
     *  2. DB hit     → load into cache, return
     *  3. Neither    → vitals arrived for a patient not yet in DB (race on startup).
     *                  Log a warning; return null so this observation is skipped.
     *                  On the next scheduler tick the sync will have completed and
     *                  the patient will be in DB.
     */
    private Patient resolvePatient(String fhirPatientId) {

        // 1. Cache
        Patient cached = activePatientCache.get(fhirPatientId);
        if (cached != null) return cached;

        // 2. DB
        Optional<Patient> fromDb = patientRepository.findByFhirPatientId(fhirPatientId);
        if (fromDb.isPresent()) {
            activePatientCache.put(fhirPatientId, fromDb.get());
            log.info("Cache loaded from DB → fhirId={}", fhirPatientId);
            return fromDb.get();
        }

        // 3. Unknown — startup sync is still in progress or patient never registered
        log.warn("Vitals received for unknown fhirId={} — skipping until patient is synced.",
                fhirPatientId);
        return null;
    }

    // ── CACHE DIFF → DB UPDATE ────────────────────────────────────────────────

    /**
     * Compares the FHIR Patient-level extensions/identifiers carried in the
     * Observation against the current cache snapshot.
     * If anything changed (FHIR ID updated, bed number changed, etc.) → update DB.
     *
     * Currently watches:
     *  - fhirPatientId confirmation (ICU may set this via observation subject)
     *  - bed number carried as an Observation extension
     */
    private void checkAndSyncPatientDetails(Observation obs, Patient cached) {
        boolean dirty = false;

        // Check for bed-number extension on the observation (ICU device may emit this)
        String newBed = obs.getExtension().stream()
                .filter(e -> "http://sewa.local/extension/bedNumber".equals(e.getUrl()))
                .findFirst()
                .map(e -> e.getValue().toString())
                .orElse(null);

        if (newBed != null && !newBed.equals(cached.getBedNumber())) {
            log.info("Bed change detected → fhirId={} old={} new={}",
                    cached.getFhirPatientId(), cached.getBedNumber(), newBed);
            cached.setBedNumber(newBed);
            dirty = true;
        }

        // Check for fhirPatientId update extension (ICU confirms the link)
        String confirmedFhirId = obs.getExtension().stream()
                .filter(e -> "http://sewa.local/extension/confirmedFhirId".equals(e.getUrl()))
                .findFirst()
                .map(e -> e.getValue().toString())
                .orElse(null);

        if (confirmedFhirId != null
                && !confirmedFhirId.equals(cached.getFhirPatientId())) {
            log.info("FHIR ID update from ICU → dbId={} old={} new={}",
                    cached.getId(), cached.getFhirPatientId(), confirmedFhirId);
            // Update DB with new FHIR ID, re-key cache
            patientRepository.updateFhirPatientId(cached.getId(), confirmedFhirId);
            activePatientCache.remove(cached.getFhirPatientId());
            cached.setFhirPatientId(confirmedFhirId);
            activePatientCache.put(confirmedFhirId, cached);
            dirty = false; // already persisted above
        }

        if (dirty) {
            patientRepository.save(cached);
            log.debug("DB updated for patient dbId={}", cached.getId());
        }
    }

    // ── CACHE MANAGEMENT (called by PatientService & FhirSyncService) ─────────

    @Override
    public void refreshCache(String fhirPatientId) {
        patientRepository.findByFhirPatientId(fhirPatientId)
                .ifPresent(p -> {
                    activePatientCache.put(fhirPatientId, p);
                    log.debug("Cache refreshed → fhirId={}", fhirPatientId);
                });
    }

    @Override
    public void evictFromCache(String fhirPatientId) {
        activePatientCache.remove(fhirPatientId);
        log.info("Cache evicted → fhirId={}", fhirPatientId);
    }

    @Override
    public Set<String> getCachedPatientIds() {
        return Collections.unmodifiableSet(activePatientCache.keySet());
    }

    // ── MAPPING ───────────────────────────────────────────────────────────────

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