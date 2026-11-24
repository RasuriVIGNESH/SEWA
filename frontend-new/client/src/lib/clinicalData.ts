/*
 * SEWA design reminder: quiet clinical surfaces, navy command shell, teal live signal,
 * coral only for risk, and evidence beside action. This module owns bounded demo data
 * and normalization so UI components remain fast and presentation-focused.
 */

export type RiskLevel = "stable" | "watch" | "high";

export type VitalReading = {
  timestamp: number;
  heartRate: number;
  oxygenSaturation: number;
  respiratoryRate: number;
  temperature: number;
  systolicBP: number;
  diastolicBP: number;
  meanArterialPressure: number;
  lactate: number;
  wbc: number;
  creatinine: number;
  glucose: number;
  riskScore: number;
};

export type Patient = {
  id: string;
  fhirPatientId: string;
  name: string;
  age: number;
  sex: "F" | "M";
  bed: string;
  unit: string;
  admitted: string;
  diagnosis: string;
  risk: RiskLevel;
  riskScore: number;
  careTeam: string;
  latest: VitalReading;
  history: VitalReading[];
};

export type ClinicalAlert = {
  id: string;
  patientId: string;
  patientName: string;
  bed: string;
  severity: "high" | "watch";
  title: string;
  detail: string;
  createdAt: number;
  acknowledged: boolean;
  evidence: string[];
};

const STORAGE_KEY = "sewa-clinical-snapshot-v2";
const ALERTS_KEY = "sewa-clinical-alerts-v2";
const MAX_HISTORY = 36;

const now = Date.now();

function historyFor(seed: number, risk: RiskLevel): VitalReading[] {
  return Array.from({ length: 18 }, (_, index) => {
    const progress = index / 17;
    const isHigh = risk === "high";
    const isWatch = risk === "watch";
    const wave = Math.sin(index * 0.9 + seed) * 2.2;
    return {
      timestamp: now - (17 - index) * 5 * 60_000,
      heartRate: Math.round(76 + wave + (isHigh ? progress * 18 : isWatch ? progress * 7 : 0) + seed),
      oxygenSaturation: Number((isHigh ? 96 - progress * 5 : isWatch ? 97 - progress * 2 : 98 + wave / 8).toFixed(1)),
      respiratoryRate: Math.round(17 + wave / 2 + (isHigh ? progress * 8 : isWatch ? progress * 3 : 0)),
      temperature: Number((36.8 + (isHigh ? progress * 1.1 : isWatch ? progress * 0.45 : progress * 0.05) + wave / 18).toFixed(1)),
      systolicBP: Math.round(122 - (isHigh ? progress * 30 : isWatch ? progress * 14 : 0) + wave),
      diastolicBP: Math.round(74 - (isHigh ? progress * 12 : isWatch ? progress * 6 : 0) + wave / 2),
      meanArterialPressure: Math.round(90 - (isHigh ? progress * 18 : isWatch ? progress * 8 : 0) + wave / 2),
      lactate: Number((1.1 + (isHigh ? progress * 2.2 : isWatch ? progress * 0.8 : progress * 0.12) + Math.abs(wave) / 16).toFixed(1)),
      wbc: Number((7.8 + (isHigh ? progress * 5.7 : isWatch ? progress * 2.2 : progress * 0.3) + wave / 6).toFixed(1)),
      creatinine: Number((0.9 + (isHigh ? progress * 0.9 : isWatch ? progress * 0.3 : progress * 0.04)).toFixed(2)),
      glucose: Math.round(106 + (isHigh ? progress * 24 : isWatch ? progress * 10 : 0) + wave * 2),
      riskScore: Math.max(4, Math.min(98, Math.round((isHigh ? 72 : isWatch ? 39 : 12) + progress * (isHigh ? 18 : isWatch ? 9 : 3) + wave * 1.8))),
    };
  });
}

function makePatient(
  id: string,
  name: string,
  age: number,
  sex: "F" | "M",
  bed: string,
  unit: string,
  diagnosis: string,
  risk: RiskLevel,
  seed: number,
): Patient {
  const history = historyFor(seed, risk);
  return {
    id,
    fhirPatientId: `demo-${id}`,
    name,
    age,
    sex,
    bed,
    unit,
    admitted: "Today, 06:42",
    diagnosis,
    risk,
    riskScore: history[history.length - 1].riskScore,
    careTeam: "Dr. A. Rao · ICU Team 2",
    latest: history[history.length - 1],
    history,
  };
}

export const seedPatients: Patient[] = [
  makePatient("p-104", "Maya Chen", 64, "F", "ICU-04", "North ICU", "Pneumonia · day 2", "high", 2),
  makePatient("p-118", "Ethan Brooks", 51, "M", "ICU-07", "North ICU", "Post-operative monitoring", "watch", 5),
  makePatient("p-121", "Nora Williams", 73, "F", "ICU-09", "North ICU", "Acute kidney injury", "watch", 7),
  makePatient("p-132", "Ravi Menon", 46, "M", "ICU-12", "North ICU", "Respiratory support", "stable", 10),
  makePatient("p-139", "Lena Ortiz", 38, "F", "ICU-15", "North ICU", "Sepsis recovery", "stable", 12),
  makePatient("p-144", "Jon Bell", 59, "M", "ICU-18", "North ICU", "Cardiac observation", "stable", 15),
];

export const seedAlerts: ClinicalAlert[] = [
  {
    id: "alert-104",
    patientId: "p-104",
    patientName: "Maya Chen",
    bed: "ICU-04",
    severity: "high",
    title: "Sepsis risk elevated",
    detail: "Model score crossed the intervention threshold.",
    createdAt: now - 6 * 60_000,
    acknowledged: false,
    evidence: ["MAP trending down", "Lactate 3.2 mmol/L", "Temperature 38.1°C"],
  },
  {
    id: "alert-118",
    patientId: "p-118",
    patientName: "Ethan Brooks",
    bed: "ICU-07",
    severity: "watch",
    title: "Respiratory trend changed",
    detail: "Respiratory rate increased over the last 30 minutes.",
    createdAt: now - 24 * 60_000,
    acknowledged: false,
    evidence: ["Respiratory rate 24 /min", "SpO₂ 95.2%"],
  },
  {
    id: "alert-121",
    patientId: "p-121",
    patientName: "Nora Williams",
    bed: "ICU-09",
    severity: "watch",
    title: "Lab review due",
    detail: "Creatinine and urine output need a clinician review.",
    createdAt: now - 52 * 60_000,
    acknowledged: true,
    evidence: ["Creatinine 1.2 mg/dL", "MAP 82 mmHg"],
  },
];

export function readSnapshot(): Patient[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return seedPatients;
    const parsed = JSON.parse(stored) as Patient[];
    return Array.isArray(parsed) && parsed.length ? parsed : seedPatients;
  } catch {
    return seedPatients;
  }
}

export function writeSnapshot(patients: Patient[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients.map((patient) => ({ ...patient, history: patient.history.slice(-MAX_HISTORY) }))));
  } catch {
    // Storage is an enhancement; live state remains authoritative.
  }
}

export function readAlerts(): ClinicalAlert[] {
  try {
    const stored = localStorage.getItem(ALERTS_KEY);
    if (!stored) return seedAlerts;
    const parsed = JSON.parse(stored) as ClinicalAlert[];
    return Array.isArray(parsed) ? parsed : seedAlerts;
  } catch {
    return seedAlerts;
  }
}

export function writeAlerts(alerts: ClinicalAlert[]) {
  try {
    localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts.slice(0, 50)));
  } catch {
    // Storage is optional and must not block clinical monitoring.
  }
}

export function normalizePatient(raw: any, fallback: Patient): Patient {
  const source = raw ?? {};
  const latest = source.latest ?? source.vitals ?? source;
  const normalized: VitalReading = {
    timestamp: Number(new Date(latest.timestamp ?? Date.now()).getTime()),
    heartRate: Number(latest.heartRate ?? latest.hr ?? fallback.latest.heartRate),
    oxygenSaturation: Number(latest.oxygenSaturation ?? latest.spo2 ?? latest.o2Sat ?? fallback.latest.oxygenSaturation),
    respiratoryRate: Number(latest.respiratoryRate ?? latest.resp ?? fallback.latest.respiratoryRate),
    temperature: Number(latest.temperature ?? latest.temp ?? fallback.latest.temperature),
    systolicBP: Number(latest.systolicBP ?? latest.sbp ?? fallback.latest.systolicBP),
    diastolicBP: Number(latest.diastolicBP ?? latest.dbp ?? fallback.latest.diastolicBP),
    meanArterialPressure: Number(latest.meanArterialPressure ?? latest.map ?? fallback.latest.meanArterialPressure),
    lactate: Number(latest.lactate ?? fallback.latest.lactate),
    wbc: Number(latest.wbc ?? latest.WBC ?? fallback.latest.wbc),
    creatinine: Number(latest.creatinine ?? fallback.latest.creatinine),
    glucose: Number(latest.glucose ?? fallback.latest.glucose),
    riskScore: Number(latest.riskScore ?? latest.sepsisProbability ?? fallback.riskScore),
  };
  const risk: RiskLevel = normalized.riskScore >= 70 ? "high" : normalized.riskScore >= 35 ? "watch" : "stable";
  return {
    ...fallback,
    ...source,
    id: source.id ?? fallback.id,
    latest: normalized,
    risk,
    riskScore: normalized.riskScore,
    history: [...(fallback.history ?? []), normalized].slice(-MAX_HISTORY),
  };
}

export function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(timestamp);
}

export function formatAgo(timestamp: number) {
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes === 1) return "1 min ago";
  return `${minutes} min ago`;
}

export function getStatusLabel(risk: RiskLevel) {
  return risk === "high" ? "High risk" : risk === "watch" ? "Watch" : "Stable";
}

export function simulateTick(patient: Patient): Patient {
  const reading = patient.latest;
  const drift = patient.risk === "high" ? 0.8 : patient.risk === "watch" ? 0.35 : -0.12;
  const noise = (Math.random() - 0.5) * 1.4;
  const next: VitalReading = {
    ...reading,
    timestamp: Date.now(),
    heartRate: Math.round(Math.max(44, Math.min(150, reading.heartRate + noise + drift))),
    oxygenSaturation: Number(Math.max(86, Math.min(100, reading.oxygenSaturation - noise * 0.06 - (patient.risk === "high" ? 0.08 : 0))).toFixed(1)),
    respiratoryRate: Math.round(Math.max(8, Math.min(42, reading.respiratoryRate + noise * 0.18 + drift * 0.08))),
    temperature: Number(Math.max(35, Math.min(41, reading.temperature + noise * 0.015 + (patient.risk === "high" ? 0.012 : 0))).toFixed(1)),
    systolicBP: Math.round(Math.max(70, Math.min(180, reading.systolicBP - drift * 0.35 + noise))),
    diastolicBP: Math.round(Math.max(40, Math.min(110, reading.diastolicBP - drift * 0.18 + noise / 2))),
    meanArterialPressure: Math.round(Math.max(50, Math.min(125, reading.meanArterialPressure - drift * 0.26 + noise / 2))),
    lactate: Number(Math.max(0.4, Math.min(6.5, reading.lactate + (patient.risk === "high" ? 0.03 : -0.01) + noise * 0.01)).toFixed(1)),
    wbc: Number(Math.max(2, Math.min(30, reading.wbc + (patient.risk === "high" ? 0.05 : 0.01) + noise * 0.03)).toFixed(1)),
    creatinine: Number(Math.max(0.4, Math.min(4.5, reading.creatinine + (patient.risk === "high" ? 0.008 : 0))).toFixed(2)),
    glucose: Math.round(Math.max(60, Math.min(260, reading.glucose + noise * 2))),
    riskScore: Math.round(Math.max(3, Math.min(99, reading.riskScore + drift * 0.4 + noise))),
  };
  const risk: RiskLevel = next.riskScore >= 70 ? "high" : next.riskScore >= 35 ? "watch" : "stable";
  return { ...patient, latest: next, risk, riskScore: next.riskScore, history: [...patient.history, next].slice(-MAX_HISTORY) };
}
