/*
 * SEWA design reminder: the hook owns data flow, not visual policy. Keep histories bounded,
 * persist only what helps continuity, and make cached/demo/live status explicit.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ClinicalAlert,
  Patient,
  normalizePatient,
  readAlerts,
  readSnapshot,
  simulateTick,
  writeAlerts,
  writeSnapshot,
} from "@/lib/clinicalData";
import { clinicalTransport, type TransportState } from "@/services/clinicalTransport";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "");

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  if (!API_URL) throw new Error("API is not configured");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`Request failed with ${response.status}`);
  return response.json() as Promise<T>;
}

export function useClinicalData() {
  const [patients, setPatients] = useState<Patient[]>(() => readSnapshot());
  const [alerts, setAlerts] = useState<ClinicalAlert[]>(() => readAlerts());
  const [transportState, setTransportState] = useState<TransportState>(() => clinicalTransport.getState());
  const [selectedPatientId, setSelectedPatientId] = useState("p-104");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const liveRef = useRef(false);

  const upsertPatient = useCallback((payload: unknown, patientId?: string) => {
    setPatients((current) => {
      const index = current.findIndex((patient) => patient.id === patientId || patient.fhirPatientId === patientId);
      if (index === -1) return current;
      const next = [...current];
      next[index] = normalizePatient(payload, current[index]);
      return next;
    });
    setLastUpdate(Date.now());
  }, []);

  useEffect(() => {
    const dispose = clinicalTransport.onState(setTransportState);
    return () => {
      dispose();
    };
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem("sewa-token");
    clinicalTransport.connect(token);
    return () => clinicalTransport.disconnect();
  }, []);

  useEffect(() => {
    const cleanup: Array<() => void> = [];
    patients.forEach((patient) => {
      const topic = `/topic/vitals/${patient.fhirPatientId}`;
      const handler = (payload: unknown) => {
        liveRef.current = true;
        upsertPatient(payload, patient.id);
      };
      clinicalTransport.subscribe(topic, handler);
      cleanup.push(() => clinicalTransport.unsubscribe(topic, handler));
    });
    return () => cleanup.forEach((dispose) => dispose());
  }, [patients.length, upsertPatient]);

  useEffect(() => {
    if (transportState === "live") return;
    const interval = window.setInterval(() => {
      setPatients((current) => current.map(simulateTick));
      setLastUpdate(Date.now());
    }, 5000);
    return () => window.clearInterval(interval);
  }, [transportState]);

  useEffect(() => {
    writeSnapshot(patients);
  }, [patients]);

  useEffect(() => {
    writeAlerts(alerts);
  }, [alerts]);

  const refreshPatients = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const remote = await request<unknown[]>("/patients");
      setPatients((current) => remote.map((item, index) => normalizePatient(item, current[index] ?? current[0])));
      setTransportState("live");
    } catch {
      // Keep the cached/demo view alive. The UI exposes the current transport state.
    } finally {
      setIsRefreshing(false);
      setLastUpdate(Date.now());
    }
  }, []);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    setAlerts((current) => current.map((alert) => (alert.id === alertId ? { ...alert, acknowledged: true } : alert)));
    try {
      await request(`/alerts/${alertId}/acknowledge`, { method: "POST" });
    } catch {
      // Local acknowledgement remains useful for demo mode; backend can be retried later.
    }
  }, []);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) ?? patients[0],
    [patients, selectedPatientId],
  );
  const activeAlerts = useMemo(() => alerts.filter((alert) => !alert.acknowledged), [alerts]);

  return {
    patients,
    setPatients,
    alerts,
    activeAlerts,
    selectedPatient,
    selectedPatientId,
    setSelectedPatientId,
    acknowledgeAlert,
    refreshPatients,
    isRefreshing,
    transportState,
    lastUpdate,
    isDemo: transportState === "demo" || (!liveRef.current && transportState !== "live"),
  };
}
