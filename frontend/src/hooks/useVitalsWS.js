import { useEffect, useState } from 'react';
import { useAuthStore, useAlertStore, useVitalsStore, useVitalsHistoryStore } from '../store';
import { websocketService } from '../services/websocketService';

export function useVitalsWS(patients = []) {
  const [connected, setConnected] = useState(websocketService.isConnected());
  const token = useAuthStore(state => state.token);
  const addAlert = useAlertStore(state => state.addAlert);
  const vitalsMap = useVitalsStore(state => state.vitals);
  const updateVitals = useVitalsStore(state => state.updateVitals);
  const addVitalReading = useVitalsHistoryStore(state => state.addVitalReading);

  useEffect(() => {
    if (!token) return;

    websocketService.onConnect(() => setConnected(true));
    websocketService.onDisconnect(() => setConnected(false));
    websocketService.connect(token);

    return () => {
      // We might not want to disconnect globally if other components use it, 
      // but for this app's structure, it's usually fine.
    };
  }, [token]);

  useEffect(() => {
    if (!connected) return;

    patients.forEach(patient => {
      const id = patient.fhirPatientId;
      if (id) {
        websocketService.subscribe(`/topic/vitals/${id}`, (data) => {
          updateVitals(id, data);
          addVitalReading(id, data);

          if (data.sepsisLabel === 1) {
            addAlert({
              patientId: patient.id,
              patientName: patient.name,
              bedNumber: patient.bedNumber || 'TBA',
              fhirPatientId: id,
              message: `Sepsis Alert — ${patient.name} | Bed ${patient.bedNumber}`,
            });
          }
        });
      }
    });

    return () => {
      // Cleanup subscriptions if needed
      // patients.forEach(patient => {
      //   websocketService.unsubscribe(`/topic/vitals/${patient.fhirPatientId}`);
      // });
    };
  }, [patients, connected, updateVitals, addAlert, addVitalReading]);

  return vitalsMap;
}
