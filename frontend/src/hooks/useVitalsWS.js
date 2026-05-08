import { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore, useAlertStore } from '../store';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';
export function useVitalsWS(fhirPatientIds) {
  const [vitals, setVitals] = useState({});
  const clientRef = useRef(null);
  const token = useAuthStore(state => state.token);
  const addAlert = useAlertStore(state => state.addAlert);
  useEffect(() => {
    if (!fhirPatientIds.length) return;
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 3000,
      onConnect: () => {
        console.log('WS Connected');
        fhirPatientIds.forEach(id => {
          client.subscribe(`/topic/vitals/${id}`, message => {
            if (message.body) {
              const data = JSON.parse(message.body);
              setVitals(prev => ({
                ...prev,
                [id]: data
              }));
              if (data.sepsisLabel === 1) {
                // Determine patient mapping outside or inside, simplified for now
                // addAlert
                addAlert({
                  patientId: parseInt(id) || 0,
                  // In reality, we need a mapping between fhirPatientId and DB Id
                  bedNumber: 'LIVE',
                  // Needs resolving from patient data
                  message: `Critical Sepsis Alert for patient ${id}!`,
                  riskScore: 100 // Or whatever based on data
                });
              }
            }
          });
        });
      },
      onStompError: frame => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      }
    });
    client.activate();
    clientRef.current = client;
    return () => {
      client.deactivate();
    };
  }, [fhirPatientIds.join(','), token]);
  return vitals;
}