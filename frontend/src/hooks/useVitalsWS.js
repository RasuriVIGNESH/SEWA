import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore, useAlertStore, useVitalsStore } from '../store';
import { useVitalsHistoryStore } from '../store';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';

export function useVitalsWS(patients = []) {
  const clientRef = useRef(null);
  const subscriptionsRef = useRef({});
  const [connected, setConnected] = useState(false);

  const token = useAuthStore(state => state.token);
  const addAlert = useAlertStore(state => state.addAlert);

  const vitalsMap = useVitalsStore(state => state.vitals);
  const updateVitals = useVitalsStore(state => state.updateVitals);

  // Enhanced history store integration for chart support
  const addVitalReading = useVitalsHistoryStore(state => state.addVitalReading);

  // 1. Manage WebSocket Connection Lifecycle
  useEffect(() => {
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => {
        const socket = new SockJS(WS_URL);
        socket.transports = ['websocket'];
        return socket;
      },
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('STOMP: Connected successfully');
        setConnected(true);
      },
      onDisconnect: () => {
        console.log('STOMP: Disconnected');
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame.headers['message']);
        setConnected(false);
      }
    });

    client.activate();
    clientRef.current = client;

    return () => {
      console.log('STOMP: Deactivating client...');
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, [token]);

  // 2. Manage Individual Subscriptions
  useEffect(() => {
    if (!connected || !clientRef.current || !clientRef.current.connected) {
      return;
    }

    const client = clientRef.current;

    patients.forEach(patient => {
      const id = patient.fhirPatientId;

      if (id && !subscriptionsRef.current[id]) {
        console.log(`STOMP: Subscribing to vitals for ${id}`);

        try {
          subscriptionsRef.current[id] = client.subscribe(`/topic/vitals/${id}`, message => {
            if (message.body) {
              const data = JSON.parse(message.body);

              // Update main vitals store (latest reading)
              updateVitals(id, data);

              // Add to enhanced history store for chart rendering
              // This stores the complete vital object with timestamp
              addVitalReading(id, data);

              // Check for sepsis alert
              if (data.sepsisLabel === 1) {
                addAlert({
                  patientId: patient.id,
                  patientName: patient.name,
                  bedNumber: patient.bedNumber || 'TBA',
                  fhirPatientId: id,
                  message: `Sepsis Alert — ${patient.name} | Bed ${patient.bedNumber}`,
                });
              }
            }
          });
        } catch (err) {
          console.error(`STOMP: Subscription failed for ${id}`, err);
        }
      }
    });

  }, [patients, connected, updateVitals, addAlert, addVitalReading]);

  return vitalsMap;
}