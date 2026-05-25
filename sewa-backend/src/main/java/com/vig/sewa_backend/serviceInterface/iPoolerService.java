package com.vig.sewa_backend.serviceInterface;

import java.util.Set;

public interface iPoolerService {
    public void pollAndBroadcast();


    /** Doctor updated patient details → refresh so next broadcast has fresh name/bed. */
    public void refreshCache(String fhirPatientId);


    /** Patient discharged → remove from active cache. */
    public void evictFromCache(String fhirPatientId);

    /** Debug/admin — who is currently live in RAM. */
    public Set<String> getCachedPatientIds();
}
