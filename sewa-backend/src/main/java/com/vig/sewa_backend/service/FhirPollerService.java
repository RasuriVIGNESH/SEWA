package com.vig.sewa_backend.service;

import ca.uhn.fhir.rest.client.api.IGenericClient;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.vig.sewa_backend.DTO.VitalReadingDTO;
import com.vig.sewa_backend.Entity.Patient;
import com.vig.sewa_backend.repository.PatientRepository;
import com.vig.sewa_backend.serviceInterface.iPoolerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hl7.fhir.r4.model.Bundle;
import org.hl7.fhir.r4.model.IntegerType;
import org.hl7.fhir.r4.model.Observation;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Collections;
import java.util.Date;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@Service
@RequiredArgsConstructor
public class FhirPollerService implements iPoolerService {

    private static final String KAFKA_TOPIC = "sewa.vitals";
    private static final String WEBSOCKET_TOPIC_PREFIX = "/topic/vitals/";

    private final IGenericClient fhirClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final SimpMessagingTemplate messaging;
    private final PatientRepository patientRepository;

    private final AtomicBoolean pollerEnabled =
            new AtomicBoolean(false);

    private final Map<String, Patient> activePatientCache =
            new ConcurrentHashMap<>();

    private final Set<String> processedIds =
            Collections.synchronizedSet(new HashSet<>());

    private volatile Instant lastPollTime =
            Instant.now().minusSeconds(5);

    @Override
    public void setPollerEnabled(boolean enabled) {
        pollerEnabled.set(enabled);
        log.info("FHIR poller enabled={}", enabled);
    }

    public boolean isPollerEnabled() {
        return pollerEnabled.get();
    }

    @Scheduled(fixedDelayString = "${fhir.poll.interval-ms:3000}")
    @Override
    public void pollAndBroadcast() {
        if (!pollerEnabled.get()) {
            log.debug("FHIR poller is disabled");
            return;
        }

        Instant pollStart = Instant.now();

        log.debug(
                "FHIR poll started: lastPollTime={} cacheSize={} processedCount={}",
                lastPollTime,
                activePatientCache.size(),
                processedIds.size()
        );

        try {
            Bundle bundle = fhirClient.search()
                    .forResource(Observation.class)
                    .where(
                            Observation.DATE.afterOrEquals()
                                    .second(Date.from(lastPollTime))
                    )
                    .and(
                            Observation.CATEGORY.exactly()
                                    .code("vital-signs")
                    )
                    .count(100)
                    .returnBundle(Bundle.class)
                    .execute();

            if (processedIds.size() > 5000) {
                processedIds.clear();
                log.info("Cleared processed observation ID cache");
            }

//            int entryCount = bundle.getEntry().size();

//            log.info("FHIR poll returned {} observation(s)", entryCount);

            for (Bundle.BundleEntryComponent entry : bundle.getEntry()) {
                processObservation(entry);
            }

            /*
             * Advance the time window after the complete poll.
             */
            lastPollTime = pollStart;

        } catch (Exception exception) {
            /*
             * Do not update lastPollTime when the FHIR request itself fails.
             * The next poll will retry the same time window.
             */
            log.error("FHIR poll failed", exception);
        }
    }

    private void processObservation(
            Bundle.BundleEntryComponent entry
    ) {
        if (!(entry.getResource() instanceof Observation observation)) {
            return;
        }

        String observationId =
                observation.getIdElement().getIdPart();

        if (observationId == null || observationId.isBlank()) {
            log.warn("Skipping FHIR Observation without an ID");
            return;
        }

        if (processedIds.contains(observationId)) {
            log.debug(
                    "Skipping already processed observationId={}",
                    observationId
            );
            return;
        }

        if (!observation.hasSubject()
                || !observation.getSubject().hasReference()
                || !observation.getSubject()
                .getReference()
                .startsWith("Patient/")) {

            log.warn(
                    "Skipping observationId={} because the Patient reference is invalid",
                    observationId
            );
            return;
        }

        String fhirPatientId = observation
                .getSubject()
                .getReference()
                .substring("Patient/".length());

        Patient patient = resolvePatient(fhirPatientId);

        if (patient == null) {
            /*
             * Important: do not add the observation ID to processedIds here.
             * The observation must be retried after the patient mapping exists.
             */
//            log.warn(
//                    "No local patient mapping for fhirPatientId={}; observation will be retried",
//                    fhirPatientId
//            );
            return;
        }

        VitalReadingDTO dto = mapToDTO(observation, patient);

        if (dto == null) {
            log.warn(
                    "Skipping observationId={} because it has no usable components",
                    observationId
            );
            return;
        }

        publishVital(fhirPatientId, dto);

        /*
         * Mark as processed only after the patient was resolved and
         * the vital was sent to Kafka/WebSocket.
         */
        processedIds.add(observationId);

        log.debug(
                "Processed observationId={} for fhirPatientId={}",
                observationId,
                fhirPatientId
        );
    }

    private void publishVital(
            String fhirPatientId,
            VitalReadingDTO dto
    ) {
        String websocketDestination =
                WEBSOCKET_TOPIC_PREFIX + fhirPatientId;

        /*
         * Kafka publication.
         */
        kafkaTemplate
                .send(KAFKA_TOPIC, fhirPatientId, dto)
                .whenComplete((result, exception) -> {
                    if (exception != null) {
                        log.error(
                                "Failed to publish vital to Kafka: topic={} patient={}",
                                KAFKA_TOPIC,
                                fhirPatientId,
                                exception
                        );
                        return;
                    }

                    if (result != null) {
                        log.info(
                                "Vital published to Kafka: topic={} partition={} offset={} patient={}",
                                result.getRecordMetadata().topic(),
                                result.getRecordMetadata().partition(),
                                result.getRecordMetadata().offset(),
                                fhirPatientId
                        );
                    }
                });

        /*
         * Send the DTO directly.
         * Spring's Jackson message converter serializes it as JSON.
         */
        messaging.convertAndSend(websocketDestination, dto);

        log.info(
                "Vital sent to WebSocket: destination={} patient={} observation={}",
                websocketDestination,
                fhirPatientId,
                dto.getFhirObservationId()
        );
    }

    private Patient resolvePatient(String fhirPatientId) {
        Patient cachedPatient =
                activePatientCache.get(fhirPatientId);

        if (cachedPatient != null) {
            return cachedPatient;
        }

        return patientRepository
                .findByFhirPatientId(fhirPatientId)
                .map(patient -> {
                    activePatientCache.put(fhirPatientId, patient);
                    return patient;
                })
                .orElse(null);
    }

    private VitalReadingDTO mapToDTO(
            Observation observation,
            Patient patient
    ) {
        if (!observation.hasComponent()) {
            return null;
        }

        VitalReadingDTO dto = new VitalReadingDTO();

        dto.setFhirObservationId(
                observation.getIdElement().getIdPart()
        );

        dto.setFhirPatientId(
                patient.getFhirPatientId()
        );

        dto.setBedNumber(patient.getBedNumber());
        dto.setPatientName(patient.getName());
        dto.setTimestamp(getObservationTimestamp(observation));

        observation.getExtension()
                .stream()
                .filter(extension ->
                        "http://sewa.local/extension/sepsisLabel"
                                .equals(extension.getUrl( ))
                )
                .findFirst()
                .ifPresent(extension -> {
                    if (extension.getValue() instanceof IntegerType integerType) {
                        dto.setSepsisLabel(integerType.getValue());
                    }
                });

        for (Observation.ObservationComponentComponent component
                : observation.getComponent()) {

            if (!component.hasCode()
                    || !component.getCode().hasCoding()
                    || !component.getCode()
                    .getCodingFirstRep()
                    .hasCode()) {

                log.warn(
                        "Skipping observation component without a valid code: observationId={}",
                        dto.getFhirObservationId()
                );
                continue;
            }

            if (!component.hasValueQuantity()
                    || !component.getValueQuantity().hasValue()) {
                continue;
            }

            String code = component
                    .getCode()
                    .getCodingFirstRep()
                    .getCode();

            double value = component
                    .getValueQuantity()
                    .getValue()
                    .doubleValue();

            switch (code) {
                /*
                 * Core vitals.
                 */
                case "8867-4" -> dto.setHr(value);
                case "59408-5" -> dto.setO2Sat(value);
                case "8310-5" -> dto.setTemp(value);
                case "8480-6" -> dto.setSbp(value);
                case "8478-0" -> dto.setMap(value);
                case "8462-4" -> dto.setDbp(value);
                case "9279-1" -> dto.setResp(value);
                case "19889-5" -> dto.setEtCO2(value);

                /*
                 * Blood gas.
                 */
                case "1927-5" -> dto.setBaseExcess(value);
                case "1963-0" -> dto.setHco3(value);
                case "19994-3" -> dto.setFiO2(value);
                case "11558-4" -> dto.setPh(value);
                case "11557-6" -> dto.setPaCO2(value);
                case "2708-6" -> dto.setSaO2(value);

                /*
                 * Chemistry and hematology.
                 */
                case "1920-8" -> dto.setAst(value);
                case "2823-3" -> dto.setBun(value);
                case "6768-6" -> dto.setAlkalinephos(value);
                case "17861-6" -> dto.setCalcium(value);
                case "2075-0" -> dto.setChloride(value);
                case "2160-0" -> dto.setCreatinine(value);
                case "1968-9" -> dto.setBilirubin_direct(value);
                case "2339-0" -> dto.setGlucose(value);
                case "2524-7" -> dto.setLactate(value);
                case "19123-9" -> dto.setMagnesium(value);
                case "2777-1" -> dto.setPhosphate(value);
                case "1975-4" -> dto.setBilirubin_total(value);
                case "10839-9" -> dto.setTroponinI(value);
                case "20570-8" -> dto.setHct(value);
                case "718-7" -> dto.setHgb(value);
                case "3173-2" -> dto.setPtt(value);
                case "6690-2" -> dto.setWbc(value);
                case "2276-4" -> dto.setFibrinogen(value);
                case "777-3" -> dto.setPlatelets(value);

                /*
                 * ICU metrics.
                 */
                case "30525-0" -> dto.setAge(value);
                case "76689-9" -> dto.setGender(value);
                case "ICU-LOS" -> dto.setIculos(value);

                default -> log.debug(
                        "Ignoring unsupported FHIR vital code={} observationId={}",
                        code,
                        dto.getFhirObservationId()
                );
            }
        }

        return dto;
    }

    private Instant getObservationTimestamp(
            Observation observation
    ) {
        if (observation.hasEffectiveDateTimeType()
                && observation
                .getEffectiveDateTimeType()
                .getValue() != null) {

            return observation
                    .getEffectiveDateTimeType()
                    .getValue()
                    .toInstant();
        }

        if (observation.hasEffectiveInstantType()
                && observation
                .getEffectiveInstantType()
                .getValue() != null) {

            return observation
                    .getEffectiveInstantType()
                    .getValue()
                    .toInstant();
        }

        if (observation.hasEffectivePeriod()
                && observation
                .getEffectivePeriod()
                .hasStart()) {

            return observation
                    .getEffectivePeriod()
                    .getStart()
                    .toInstant();
        }

        return Instant.now();
    }

    @Override
    public void refreshCache(String fhirPatientId) {
        patientRepository
                .findByFhirPatientId(fhirPatientId)
                .ifPresent(patient ->
                        activePatientCache.put(fhirPatientId, patient)
                );
    }

    @Override
    public void evictFromCache(String fhirPatientId) {
        activePatientCache.remove(fhirPatientId);
    }

    @Override
    public Set<String> getCachedPatientIds() {
        return Collections.unmodifiableSet(
                activePatientCache.keySet()
        );
    }

    public int getProcessedCount() {
        return processedIds.size();
    }
}
