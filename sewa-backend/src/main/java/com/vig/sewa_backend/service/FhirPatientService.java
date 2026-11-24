package com.vig.sewa_backend.service;

import ca.uhn.fhir.rest.api.MethodOutcome;
import ca.uhn.fhir.rest.client.api.IGenericClient;
import ca.uhn.fhir.rest.server.exceptions.BaseServerResponseException;
import com.vig.sewa_backend.Entity.Patient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hl7.fhir.r4.model.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FhirPatientService {

    private final IGenericClient fhirClient;

    // ── CONNECTIVITY CHECK ────────────────────────────────────────────────────

    public boolean isFhirReachable() {
        try {
            fhirClient.capabilities().ofType(CapabilityStatement.class).execute();
            log.info("FHIR server is reachable.");
            return true;
        } catch (Exception e) {
            log.warn("FHIR server is NOT reachable: {}", e.getMessage());
            return false;
        }
    }

    // ── FETCH ALL PATIENTS FROM FHIR ─────────────────────────────────────────

    /**
     * Fetches all Patient resources from FHIR (handles pagination).
     * Returns an empty list if FHIR is offline or returns nothing.
     */
    public List<org.hl7.fhir.r4.model.Patient> fetchAllFhirPatients() {
        List<org.hl7.fhir.r4.model.Patient> result = new ArrayList<>();
        try {
            Bundle bundle = fhirClient.search()
                    .forResource(org.hl7.fhir.r4.model.Patient.class)
                    .count(200)
                    .returnBundle(Bundle.class)
                    .execute();

            while (bundle != null) {
                for (Bundle.BundleEntryComponent entry : bundle.getEntry()) {
                    if (entry.getResource() instanceof org.hl7.fhir.r4.model.Patient p) {
                        result.add(p);
                    }
                }
                // Handle pagination
                if (bundle.getLink(Bundle.LINK_NEXT) != null) {
                    bundle = fhirClient.loadPage().next(bundle).execute();
                } else {
                    bundle = null;
                }
            }
            log.info("Fetched {} patient(s) from FHIR.", result.size());
        } catch (Exception e) {
            log.error("Failed to fetch patients from FHIR: {}", e.getMessage());
        }
        return Collections.unmodifiableList(result);
    }

    // ── CREATE PATIENT IN FHIR ───────────────────────────────────────────────

    /**
     * Creates a FHIR Patient resource from our DB Patient entity.
     * Returns the FHIR-assigned ID string, or null if creation failed.
     */
    public String createPatientInFhir(Patient patient) {
        try {
            org.hl7.fhir.r4.model.Patient fhirPatient = toFhirPatient(patient);

            MethodOutcome outcome = fhirClient.create()
                    .resource(fhirPatient)
                    .execute();

            if (outcome.getCreated() != null && outcome.getCreated()
                    && outcome.getId() != null) {
                String fhirId = outcome.getId().getIdPart();
                log.info("Created patient in FHIR → dbId={} fhirId={}", patient.getId(), fhirId);
                return fhirId;
            } else {
                log.warn("FHIR create returned no ID for patient dbId={}", patient.getId());
                return null;
            }
        } catch (BaseServerResponseException e) {
            log.error("FHIR server rejected patient create → dbId={} status={} message={}",
                    patient.getId(), e.getStatusCode(), e.getMessage());
            return null;
        } catch (Exception e) {
            log.error("Unexpected error creating patient in FHIR → dbId={}", patient.getId(), e);
            return null;
        }
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────

    /**
     * Maps our Patient entity to a FHIR R4 Patient resource.
     */
    private org.hl7.fhir.r4.model.Patient toFhirPatient(Patient patient) {
        org.hl7.fhir.r4.model.Patient fhirPatient = new org.hl7.fhir.r4.model.Patient();

        // Active status
        fhirPatient.setActive(true);

        // Name
        if (patient.getName() != null && !patient.getName().isBlank()) {
            HumanName humanName = new HumanName();
            humanName.setText(patient.getName());
            // Try to split into given/family if there's a space
            String[] parts = patient.getName().trim().split("\\s+", 2);
            if (parts.length == 2) {
                humanName.setFamily(parts[1]);
                humanName.addGiven(parts[0]);
            } else {
                humanName.setFamily(patient.getName());
            }
            fhirPatient.addName(humanName);
        }

        // Phone
        if (patient.getPhoneNumber() != null && !patient.getPhoneNumber().isBlank()) {
            fhirPatient.addTelecom()
                    .setSystem(ContactPoint.ContactPointSystem.PHONE)
                    .setValue(patient.getPhoneNumber())
                    .setUse(ContactPoint.ContactPointUse.MOBILE);
        }

        // Gender from PatientDetails (if available)
        if (patient.getPatientDetails() != null
                && patient.getPatientDetails().getGender() != null) {
            String gender = patient.getPatientDetails().getGender().toLowerCase();
            switch (gender) {
                case "male"   -> fhirPatient.setGender(Enumerations.AdministrativeGender.MALE);
                case "female" -> fhirPatient.setGender(Enumerations.AdministrativeGender.FEMALE);
                default       -> fhirPatient.setGender(Enumerations.AdministrativeGender.UNKNOWN);
            }
        } else {
            fhirPatient.setGender(Enumerations.AdministrativeGender.UNKNOWN);
        }

        // Bed number as an identifier
        if (patient.getBedNumber() != null && !patient.getBedNumber().isBlank()) {
            fhirPatient.addIdentifier()
                    .setSystem("http://sewa.local/bed-number")
                    .setValue(patient.getBedNumber());
        }

        // Admission date as an extension
        if (patient.getPatientDetails() != null
                && patient.getPatientDetails().getAdmissionDate() != null) {
            fhirPatient.addExtension()
                    .setUrl("http://sewa.local/extension/admissionDate")
                    .setValue(new DateType(
                            patient.getPatientDetails().getAdmissionDate().toString()));
        }

        return fhirPatient;
    }
}