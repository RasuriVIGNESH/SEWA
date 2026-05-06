/**
 * useVitalsStream — Real-time vitals via STOMP over SockJS
 *
 * Spring Boot WebSocket endpoint: /ws
 * Subscribe to: /topic/vitals/{fhirPatientId}
 *
 * Publishes VitalReadingDTO every ~2 seconds per patient.
 */

import { useEffect, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const WS_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080') + '/ws';

/**
 * @param {Object}   options
 * @param {string[]} options.fhirPatientIds  - FHIR patient IDs to subscribe to
 * @param {Function} options.onVital         - Called with each VitalReadingDTO
 * @param {Function} [options.onStatus]      - Called with { connected: bool }
 * @param {boolean}  [options.enabled=true]
 */
export function useVitalsStream({ fhirPatientIds, onVital, onStatus, enabled = true }) {
    const clientRef = useRef(null);
    const subscriptionsRef = useRef({});
    const destroyedRef = useRef(false);

    const latestRef = useRef({ fhirPatientIds, onVital, onStatus });
    latestRef.current = { fhirPatientIds, onVital, onStatus };

    const subscribeToPatients = useCallback((client, ids) => {
        if (!ids || ids.length === 0) return;

        // Unsubscribe removed patients
        Object.keys(subscriptionsRef.current).forEach((fhirId) => {
            if (!ids.includes(fhirId)) {
                subscriptionsRef.current[fhirId]?.unsubscribe();
                delete subscriptionsRef.current[fhirId];
            }
        });

        // Subscribe to new patients
        ids.forEach((fhirId) => {
            if (!fhirId || subscriptionsRef.current[fhirId]) return;
            subscriptionsRef.current[fhirId] = client.subscribe(
                `/topic/vitals/${fhirId}`,
                (message) => {
                    try {
                        const vital = JSON.parse(message.body);
                        latestRef.current.onVital?.(vital);
                    } catch (e) {
                        console.warn('[STOMP] Parse error:', e);
                    }
                }
            );
        });
    }, []);

    useEffect(() => {
        if (!enabled) return;

        destroyedRef.current = false;

        const stompClient = new Client({
            webSocketFactory: () => new SockJS(WS_URL),
            reconnectDelay: 3000,
            onConnect: () => {
                if (destroyedRef.current) return;
                console.log('[STOMP] Connected');
                latestRef.current.onStatus?.({ connected: true });
                subscribeToPatients(stompClient, latestRef.current.fhirPatientIds || []);
            },
            onDisconnect: () => {
                console.log('[STOMP] Disconnected');
                latestRef.current.onStatus?.({ connected: false });
            },
            onStompError: (frame) => {
                console.warn('[STOMP] Error:', frame);
            },
        });

        clientRef.current = stompClient;
        stompClient.activate();

        return () => {
            destroyedRef.current = true;
            Object.values(subscriptionsRef.current).forEach((sub) => {
                try { sub?.unsubscribe(); } catch { }
            });
            subscriptionsRef.current = {};
            try { stompClient.deactivate(); } catch { }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled]);

    // When patient list changes on an already-connected client, update subscriptions
    useEffect(() => {
        const client = clientRef.current;
        if (client?.connected && fhirPatientIds?.length > 0) {
            subscribeToPatients(client, fhirPatientIds);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [(fhirPatientIds || []).join(',')]);
}
