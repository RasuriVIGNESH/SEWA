// SEWA style reminder: realtime should degrade gracefully, disclose its source, and normalize backend messages before they reach clinical UI components.

import { useEffect, useMemo, useState } from "react";
import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { websocketEndpoint, type AlertRecord } from "@/lib/api";

export interface LiveVitals {
  heartRate?: number;
  spo2?: number;
  temperature?: number;
  systolicBP?: number;
  diastolicBP?: number;
  meanArterialPressure?: number;
  respiratoryRate?: number;
  lactate?: number;
  timestamp?: string;
  fhirPatientId?: string;
  sepsisLabel?: number;
  [key: string]: unknown;
}

type RealtimeStatus = "CONNECTING" | "LIVE" | "OFFLINE" | "DEMO";

type BackendAlert = AlertRecord & {
  alertMessage?: string;
  bedNumber?: string;
};

function parse<T>(message: IMessage): T | null {
  try {
    return JSON.parse(message.body) as T;
  } catch {
    return null;
  }
}

function normalizeAlert(raw: BackendAlert): AlertRecord {
  const message = raw.message ?? raw.alertMessage ?? raw.explanation ?? "Sepsis risk signal";
  const patientId = raw.patientId ?? (raw.fhirPatientId ? Number.NaN : undefined);
  const severity = raw.severity ?? raw.riskLevel ?? "high";
  return {
    ...raw,
    id: raw.id ?? `${raw.fhirPatientId ?? "alert"}-${raw.timestamp ?? Date.now()}`,
    patientId: Number.isFinite(patientId) ? patientId : undefined,
    fhirPatientId: raw.fhirPatientId,
    patientName: raw.patientName,
    severity,
    riskLevel: raw.riskLevel ?? severity,
    message,
    explanation: raw.explanation ?? message,
    timestamp: raw.timestamp,
    acknowledged: Boolean(raw.acknowledged),
    status: raw.status ?? (raw.acknowledged ? "ACKNOWLEDGED" : "ACTIVE"),
  };
}

function appendAlert(current: AlertRecord[], next: AlertRecord) {
  return [next, ...current.filter((item) => String(item.id) !== String(next.id))].slice(0, 30);
}

export function useClinicalRealtime(fhirPatientId?: string) {
  const [vitals, setVitals] = useState<LiveVitals | null>(null);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [status, setStatus] = useState<RealtimeStatus>(import.meta.env.VITE_WS_URL ? "CONNECTING" : "DEMO");
  const [systemStatus, setSystemStatus] = useState(import.meta.env.VITE_WS_URL ? "Connecting to ICU channel" : "Local demonstration mode");

  useEffect(() => {
    const configuredEndpoint = import.meta.env.VITE_WS_URL as string | undefined;
    if (!configuredEndpoint) {
      setStatus("DEMO");
      setSystemStatus("Local demonstration mode");
      return;
    }

    let disposed = false;
    let client: Client | null = null;
    let subscriptions: StompSubscription[] = [];

    const start = async () => {
      setStatus("CONNECTING");
      setSystemStatus("Connecting to ICU channel");

      try {
        const browserGlobal = globalThis as typeof globalThis & { global?: typeof globalThis };
        browserGlobal.global ??= globalThis;
        const { default: SockJS } = await import("sockjs-client");
        if (disposed) return;

        client = new Client({
          reconnectDelay: 5000,
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,
          webSocketFactory: () => new SockJS(websocketEndpoint) as unknown as WebSocket,
          onConnect: () => {
            if (disposed || !client) return;
            setStatus("LIVE");
            setSystemStatus("ICU channel online");
            subscriptions.forEach((subscription) => subscription.unsubscribe());
            subscriptions = [];

            if (fhirPatientId) {
              subscriptions.push(
                client.subscribe(`/topic/vitals/${fhirPatientId}`, (message) => {
                  const next = parse<LiveVitals>(message);
                  if (next) setVitals(next);
                }),
                client.subscribe(`/topic/alerts/${fhirPatientId}`, (message) => {
                  const next = parse<BackendAlert>(message);
                  if (next) setAlerts((current) => appendAlert(current, normalizeAlert(next)));
                }),
              );
            }

            subscriptions.push(
              client.subscribe("/topic/alerts/global", (message) => {
                const next = parse<BackendAlert>(message);
                if (next) setAlerts((current) => appendAlert(current, normalizeAlert(next)));
              }),
              client.subscribe("/topic/system/status", (message) => {
                const next = parse<{ status?: string; message?: string }>(message);
                if (next) setSystemStatus(next.message || next.status || "ICU status updated");
              }),
            );
          },
          onStompError: () => {
            setStatus("OFFLINE");
            setSystemStatus("Clinical channel error");
          },
          onWebSocketClose: () => {
            setStatus("OFFLINE");
            setSystemStatus("Clinical channel offline");
          },
          onWebSocketError: () => {
            setStatus("OFFLINE");
            setSystemStatus("Unable to reach clinical channel");
          },
        });

        client.activate();
      } catch {
        setStatus("OFFLINE");
        setSystemStatus("Unable to load realtime transport");
      }
    };

    void start();

    return () => {
      disposed = true;
      subscriptions.forEach((subscription) => subscription.unsubscribe());
      subscriptions = [];
      void client?.deactivate();
    };
  }, [fhirPatientId]);

  return useMemo(() => ({ vitals, alerts, status, systemStatus }), [vitals, alerts, status, systemStatus]);
}
