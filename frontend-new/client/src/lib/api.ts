// SEWA style reminder: keep clinical workflows calm, evidence-led, and explicit; API failures must be visible without exposing sensitive details.

export type Status = "UNDER_OBSERVATION" | "STABLE" | "CRITICAL" | "DISCHARGED";

export interface AuthSession {
  token: string;
  name: string;
  doctorId: number;
  email?: string;
}

export interface Patient {
  id: number;
  name: string;
  phoneNumber?: string;
  bedNumber?: string;
  fhirPatientId?: string;
  status: Status;
  gender?: string;
  bloodGroup?: string;
  admissionDate?: string;
  admissionReason?: string;
  doctorName?: string;
  doctorId?: number;
  address?: string;
  medicalHistory?: string;
}

export interface PatientPayload {
  name: string;
  phoneNumber?: string;
  bedNumber?: string;
  fhirPatientId?: string;
  status?: Status;
  gender?: string;
  bloodGroup?: string;
  admissionDate?: string;
  address?: string;
  admissionReason?: string;
  medicalHistory?: string;
}

export interface Doctor {
  id: number;
  name: string;
  email?: string;
  specialization?: string;
  phoneNumber?: string;
}

export interface DoctorPayload {
  name: string;
  email: string;
  password: string;
  specialization?: string;
  phoneNumber?: string;
}

export interface AlertRecord {
  id: number | string;
  patientId?: number;
  fhirPatientId?: string;
  patientName?: string;
  severity?: string;
  riskLevel?: string;
  message?: string;
  explanation?: string;
  timestamp?: string;
  acknowledged?: boolean;
  status?: string;
  probability?: number;
}

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");
const SESSION_KEY = "sewa-auth-session";

export const backendOrigin = API_URL.replace(/\/api$/, "");
export const websocketEndpoint = (import.meta.env.VITE_WS_URL || `${backendOrigin}/ws`).replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function readSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function getAuthSession() {
  return readSession();
}

export function saveAuthSession(session: AuthSession) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

async function request<T>(path: string, options: RequestInit = {}, allowUnauthenticated = false): Promise<T> {
  const session = readSession();
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  if (session?.token && !allowUnauthenticated) headers.set("Authorization", `Bearer ${session.token}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (error) {
    throw new ApiError("The clinical backend is unavailable. Check that Spring Boot is running.", 0, error);
  }
  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    const message = typeof body === "object" && body && "message" in body ? String(body.message) : `Request failed (${response.status})`;
    if (response.status === 401) clearAuthSession();
    throw new ApiError(message, response.status, body);
  }
  return body as T;
}

function normalizeAlert(raw: AlertRecord & { alertMessage?: string; bedNumber?: string }): AlertRecord {
  const message = raw.message ?? raw.alertMessage ?? raw.explanation ?? "Sepsis risk signal";
  const severity = raw.severity ?? raw.riskLevel ?? "high";
  return {
    ...raw,
    message,
    explanation: raw.explanation ?? message,
    severity,
    riskLevel: raw.riskLevel ?? severity,
    status: raw.status ?? (raw.acknowledged ? "ACKNOWLEDGED" : "ACTIVE"),
  };
}

async function normalizedAlerts(path: string) {
  const records = await request<Array<AlertRecord & { alertMessage?: string; bedNumber?: string }>>(path);
  return records.map(normalizeAlert);
}

export const api = {
  login: (payload: { email: string; password: string }) => request<AuthSession>("/auth/login", { method: "POST", body: JSON.stringify(payload) }, true),
  register: (payload: DoctorPayload) => request<AuthSession>("/auth/register", { method: "POST", body: JSON.stringify(payload) }, true),
  patients: () => request<Patient[]>("/patients"),
  patient: (id: number) => request<Patient>(`/patients/${id}`),
  createPatient: (payload: PatientPayload) => request<Patient>("/patients/new", { method: "POST", body: JSON.stringify(payload) }),
  updatePatient: (id: number, payload: PatientPayload) => request<Patient>(`/patients/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  dischargePatient: (id: number) => request<void>(`/patients/${id}/discharge`, { method: "POST" }),
  deletePatient: (id: number) => request<void>(`/patients/${id}`, { method: "DELETE" }),
  assignPatient: (patientId: number, doctorId: number) => request<void>("/patients/assign", { method: "POST", body: JSON.stringify({ patientId, doctorId }) }),
  unassignedPatients: () => request<Patient[]>("/patients/unassigned"),
  doctors: () => request<Doctor[]>("/doctors"),
  doctor: (id: number) => request<Doctor>(`/doctors/${id}`),
  doctorPatients: (id: number) => request<Patient[]>(`/doctors/${id}/patients`),
  activeAlerts: () => normalizedAlerts("/alerts/active"),
  patientAlerts: (fhirPatientId: string) => normalizedAlerts(`/alerts/patient/${encodeURIComponent(fhirPatientId)}`),
  acknowledgeAlert: async (id: number | string) => normalizeAlert(await request<AlertRecord & { alertMessage?: string }>(`/alerts/${id}/acknowledge`, { method: "PATCH" })),
};

export function apiErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Your session has expired. Please sign in again.";
    if (error.status === 0) return "The clinical backend is unavailable. Check that Spring Boot is running.";
    return error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
