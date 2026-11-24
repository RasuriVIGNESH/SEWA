/*
 * SEWA design reminder: use a restrained clinical palette, keep status semantics consistent,
 * and make every high-risk state obvious without turning the whole interface into an alarm.
 */
import { Activity, ArrowUpRight, BellRing, Check, Clock3, Droplets, HeartPulse, Thermometer, Wind } from "lucide-react";
import { formatAgo, formatTime, getStatusLabel, type ClinicalAlert, type Patient, type RiskLevel } from "@/lib/clinicalData";

const riskStyles: Record<RiskLevel, { label: string; dot: string; text: string; bg: string; rail: string }> = {
  stable: { label: "Stable", dot: "bg-teal", text: "text-teal-dark", bg: "bg-teal/10", rail: "bg-teal" },
  watch: { label: "Watch", dot: "bg-amber", text: "text-amber-dark", bg: "bg-amber/10", rail: "bg-amber" },
  high: { label: "High risk", dot: "bg-coral", text: "text-coral-dark", bg: "bg-coral/10", rail: "bg-coral" },
};

export function RiskPill({ risk }: { risk: RiskLevel }) {
  const style = riskStyles[risk];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${style.bg} ${style.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

export function ConnectionBadge({ state, isDemo }: { state: "live" | "connecting" | "offline" | "demo"; isDemo: boolean }) {
  const live = state === "live";
  const connecting = state === "connecting";
  const label = live ? "Live telemetry" : connecting ? "Connecting" : isDemo ? "Simulation mode" : "Offline cache";
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/80">
      <span className={`relative flex h-2 w-2 ${live || isDemo ? "" : "opacity-60"}`}>
        {(live || isDemo) && <span className="absolute inset-0 animate-ping rounded-full bg-signal-teal/70" />}
        <span className={`relative h-2 w-2 rounded-full ${live ? "bg-signal-teal" : connecting ? "bg-amber" : "bg-white/40"}`} />
      </span>
      {label}
    </div>
  );
}

export function MetricTile({ label, value, unit, icon: Icon, tone = "teal", note, trend }: {
  label: string;
  value: string | number;
  unit?: string;
  icon: typeof Activity;
  tone?: "teal" | "blue" | "amber" | "coral" | "purple";
  note?: string;
  trend?: string;
}) {
  const tones = {
    teal: "bg-teal/10 text-teal-dark",
    blue: "bg-blue/10 text-blue-dark",
    amber: "bg-amber/10 text-amber-dark",
    coral: "bg-coral/10 text-coral-dark",
    purple: "bg-purple/10 text-purple-dark",
  };
  return (
    <div className="group rounded-2xl border border-line bg-white p-4 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}><Icon size={17} strokeWidth={2.2} /></span>
        {trend && <span className="rounded-full bg-ice px-2 py-1 text-[10px] font-bold text-slate-500">{trend}</span>}
      </div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.17em] text-slate-400">{label}</p>
      <p className="mt-1 font-display text-[28px] font-semibold leading-none tracking-tight text-ink">
        {value}<span className="ml-1 text-xs font-medium text-slate-400">{unit}</span>
      </p>
      {note && <p className="mt-2 text-[11px] leading-4 text-slate-500">{note}</p>}
    </div>
  );
}

export function PatientListItem({ patient, selected, onSelect }: { patient: Patient; selected: boolean; onSelect: () => void }) {
  const latest = patient.latest;
  return (
    <button onClick={onSelect} className={`group relative w-full overflow-hidden rounded-2xl border bg-white p-4 text-left transition duration-200 ${selected ? "border-teal/50 shadow-card-hover ring-2 ring-teal/10" : "border-line shadow-card hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-card-hover"}`}>
      <span className={`absolute inset-y-0 left-0 w-1 ${riskStyles[patient.risk].rail}`} />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display text-[15px] font-semibold text-ink">{patient.name}</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">{patient.bed}</span>
          </div>
          <p className="mt-1 truncate text-xs text-slate-500">{patient.diagnosis}</p>
        </div>
        <RiskPill risk={patient.risk} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 pl-2">
        <MiniValue label="HR" value={latest.heartRate} unit="bpm" />
        <MiniValue label="SpO₂" value={latest.oxygenSaturation} unit="%" />
        <MiniValue label="MAP" value={latest.meanArterialPressure} unit="mmHg" />
      </div>
      <div className="mt-3 flex items-center justify-between pl-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        <span>Updated {formatTime(latest.timestamp)}</span>
        <ArrowUpRight size={13} className={`transition duration-200 ${selected ? "text-teal" : "text-slate-300 group-hover:text-teal"}`} />
      </div>
    </button>
  );
}

function MiniValue({ label, value, unit }: { label: string; value: string | number; unit: string }) {
  return (
    <div className="rounded-xl bg-ice px-2.5 py-2">
      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">{label}</p>
      <p className="mt-1 font-display text-sm font-semibold text-ink">{value}<span className="ml-0.5 text-[9px] font-medium text-slate-400">{unit}</span></p>
    </div>
  );
}

export function ClinicalAlertItem({ alert, onAcknowledge, onSelect }: { alert: ClinicalAlert; onAcknowledge: () => void; onSelect: () => void }) {
  const high = alert.severity === "high";
  return (
    <div className={`rounded-2xl border p-4 ${high ? "border-coral/25 bg-coral/[0.045]" : "border-amber/25 bg-amber/[0.045]"}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${high ? "bg-coral/10 text-coral-dark" : "bg-amber/10 text-amber-dark"}`}>
          <BellRing size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button onClick={onSelect} className="text-left font-display text-sm font-semibold text-ink hover:text-teal-dark">{alert.title}</button>
            <span className="text-[10px] font-semibold text-slate-400">{formatAgo(alert.createdAt)}</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-600"><span className="font-bold text-ink">{alert.patientName}</span> · {alert.bed} · {alert.detail}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {alert.evidence.map((item) => <span key={item} className="rounded-lg bg-white/80 px-2 py-1 text-[10px] font-semibold text-slate-500">{item}</span>)}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${high ? "text-coral-dark" : "text-amber-dark"}`}>{high ? "Priority review" : "Review when able"}</span>
            {!alert.acknowledged ? (
              <button onClick={onAcknowledge} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-600 transition hover:border-teal/40 hover:text-teal-dark"><Check size={12} /> Acknowledge</button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-teal-dark"><Check size={12} /> Acknowledged</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SectionHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-dark">{eyebrow}</p>
        <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-ink">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function PatientMetricStrip({ patient }: { patient: Patient }) {
  const latest = patient.latest;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
      <MetricTile label="Heart rate" value={latest.heartRate} unit="bpm" icon={HeartPulse} tone="teal" note="Telemetry" />
      <MetricTile label="SpO₂" value={latest.oxygenSaturation} unit="%" icon={Droplets} tone="blue" note="Pulse oximetry" />
      <MetricTile label="Respiratory" value={latest.respiratoryRate} unit="/min" icon={Wind} tone="amber" note="Bedside monitor" />
      <MetricTile label="Temperature" value={latest.temperature} unit="°C" icon={Thermometer} tone="coral" note="Core reading" />
      <MetricTile label="MAP" value={latest.meanArterialPressure} unit="mmHg" icon={Activity} tone="purple" note={`${latest.systolicBP}/${latest.diastolicBP} BP`} />
      <MetricTile label="Lactate" value={latest.lactate} unit="mmol/L" icon={Activity} tone={latest.lactate >= 2 ? "coral" : "teal"} note="Most recent lab" />
      <MetricTile label="Risk score" value={latest.riskScore} unit="/100" icon={BellRing} tone={patient.risk === "high" ? "coral" : patient.risk === "watch" ? "amber" : "teal"} note={getStatusLabel(patient.risk)} />
    </div>
  );
}

export function LastUpdated({ timestamp }: { timestamp: number }) {
  return <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"><Clock3 size={12} /> Updated {formatTime(timestamp)}</span>;
}
