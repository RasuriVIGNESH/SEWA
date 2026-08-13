package com.vig.sewa_backend.serviceInterface;

import java.util.Set;

public interface iPoolerService {

    /** Main scheduled poll — fetches vitals from FHIR and broadcasts. */
    void pollAndBroadcast();

    /**
     * Enable or disable the scheduler.
     * Called by StartupOrchestrator:
     *   - false (default) → poller silently skips every tick until FHIR is confirmed online.
     *   - true            → normal polling begins.
     */
    void setPollerEnabled(boolean enabled);

    /** Doctor updated patient details → refresh cache so next broadcast has fresh data. */
    void refreshCache(String fhirPatientId);

    /** Patient discharged → remove from active cache. */
    void evictFromCache(String fhirPatientId);

    /** Debug/admin — which patients are currently live in RAM. */
    Set<String> getCachedPatientIds();
}