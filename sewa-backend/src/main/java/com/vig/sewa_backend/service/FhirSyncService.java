package com.vig.sewa_backend.service;

import com.vig.sewa_backend.Entity.Patient;
import com.vig.sewa_backend.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FhirSyncService {

    private final PatientRepository  patientRepository;
    private final FhirPatientService fhirPatientService;
    private final FhirPollerService  fhirPollerService;

    // ── ENTRY POINT ───────────────────────────────────────────────────────────

    public void syncOnStartup() {
        log.info("=== FHIR Startup Sync Begin ===");

        // 1. Get all FHIR patient IDs currently in server
        Set<String> fhirIds = fhirPatientService.fetchAllFhirPatients()
                .stream()
                .map(fp -> fp.getIdElement().getIdPart())
                .collect(Collectors.toSet());

        log.info("FHIR currently has {} patient(s).", fhirIds.size());

        // 2. All active (non-discharged) patients in our DB
        List<Patient> activeDbPatients = patientRepository.findActivePatients();
        log.info("DB has {} active patient(s).", activeDbPatients.size());

        // 3. Sequential stream — each patient gets its own @Transactional method call
        //    (parallelStream loses Spring transaction context on ForkJoin threads)
        for (Patient patient : activeDbPatients) {
            boolean missingInFhir = patient.getFhirPatientId() == null
                    || patient.getFhirPatientId().isBlank()
                    || !fhirIds.contains(patient.getFhirPatientId());

            if (missingInFhir) {
                log.info("Patient missing in FHIR → pushing → dbId={} name={}",
                        patient.getId(), patient.getName());
                pushToFhirAndPersist(patient);
            } else {
                // Already in FHIR — just warm the cache
                fhirPollerService.refreshCache(patient.getFhirPatientId());
                log.debug("Patient already in FHIR → cache warmed → fhirId={}",
                        patient.getFhirPatientId());
            }
        }

        log.info("=== FHIR Startup Sync Complete ===");
    }

    // ── INTERNAL ──────────────────────────────────────────────────────────────

    /**
     * Each patient push runs in its own transaction.
     * If one patient fails, the rest are not affected.
     */
    public void pushToFhirAndPersist(Patient patient) {
        String fhirId = fhirPatientService.createPatientInFhir(patient);

        if (fhirId == null) {
            log.warn("Could not create patient in FHIR during sync → dbId={}", patient.getId());
            return;
        }

        // Persist FHIR ID back to DB. Use repository.save() which opens a transaction
        // for the single entity operation to avoid @Transactional proxy pitfalls when
        // calling methods on the same bean from within the bean.
        patient.setFhirPatientId(fhirId);
        patientRepository.save(patient);

        // Warm cache so poller picks up vitals immediately
        fhirPollerService.refreshCache(fhirId);

        log.info("Synced patient to FHIR → dbId={} fhirId={}", patient.getId(), fhirId);
    }
}