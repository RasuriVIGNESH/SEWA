import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore, useAlertStore, useVitalsStore } from '../store';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';

export function useVitalsWS(patients = []) {
  const clientRef = useRef(null);
  const subscriptionsRef = useRef({});
  const [connected, setConnected] = useState(false); // Track actual connection status

  const token = useAuthStore(state => state.token);
  const addAlert = useAlertStore(state => state.addAlert);

  const vitalsMap = useVitalsStore(state => state.vitals);
  const updateVitals = useVitalsStore(state => state.updateVitals);

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
        setConnected(true); // Signal that it's safe to subscribe
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
    // CRITICAL FIX: Only subscribe if the connection is established (connected === true)
    if (!connected || !clientRef.current || !clientRef.current.connected) {
      return;
    }

    const client = clientRef.current;

    patients.forEach(patient => {
      const id = patient.fhirPatientId;

      // If patient exists and we haven't subscribed yet
      if (id && !subscriptionsRef.current[id]) {
        console.log(`STOMP: Subscribing to vitals for ${id}`);

        try {
          subscriptionsRef.current[id] = client.subscribe(`/topic/vitals/${id}`, message => {
            if (message.body) {
              const data = JSON.parse(message.body);
              updateVitals(id, data);

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

    // Cleanup logic: If a patient is no longer in the list, we could unsubscribe here
    // but usually, it's fine to keep them for the session unless the list is huge.

  }, [patients, connected, updateVitals, addAlert]);

  // Return the global cache (immediately available from sessionStorage via store)
  return vitalsMap;
}