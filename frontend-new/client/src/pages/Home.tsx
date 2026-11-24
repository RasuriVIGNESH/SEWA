/*
 * SEWA design reminder: quiet command center, navy shell, teal live signal, coral only
 * for risk, evidence beside action, and motion under 220ms. This page is the primary
 * clinician workflow and remains useful in cached/demo mode while the backend connects.
 */
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Command,
  Database,
  FileText,
  HeartPulse,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { ClinicalTrendChart, type Metric } from "@/components/ClinicalTrendChart";
import { ClinicalAlertItem, ConnectionBadge, LastUpdated, PatientListItem, PatientMetricStrip, RiskPill, SectionHeading } from "@/components/ClinicalPieces";
import { useClinicalData } from "@/hooks/useClinicalData";
import { formatAgo, formatTime, getStatusLabel, type Patient } from "@/lib/clinicalData";

const logoUrl = "/manus-storage/sewa-logo-mark_eb074295.png";
const pathwayUrl = "/manus-storage/sewa-care-pathway_5a08af7a.jpg";
const atmosphereUrl = "/manus-storage/sewa-clinical-atmosphere_30fe9d4b.jpg";
const detailUrl = "/manus-storage/sewa-icu-detail_52cd577d.jpg";

const navItems = [
  { id: "overview", label: "Ward overview", icon: LayoutDashboard },
  { id: "patients", label: "Patient census", icon: Users },
  { id: "alerts", label: "Alert queue", icon: Bell },
] as const;

type View = (typeof navItems)[number]["id"];

export default function Home() {
  const [view, setView] = useState<View>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [metric, setMetric] = useState<Metric>("heartRate");
  const [focusedAlert, setFocusedAlert] = useState<string | null>(null);
  const {
    patients,
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
    isDemo,
  } = useClinicalData();

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return patients;
    return patients.filter((patient) => `${patient.name} ${patient.bed} ${patient.diagnosis}`.toLowerCase().includes(query));
  }, [patients, search]);

  const highRiskCount = patients.filter((patient) => patient.risk === "high").length;
  const watchCount = patients.filter((patient) => patient.risk === "watch").length;
  const stableCount = patients.filter((patient) => patient.risk === "stable").length;
  const currentAlert = alerts.find((alert) => alert.id === focusedAlert);

  function selectPatient(patient: Patient) {
    setSelectedPatientId(patient.id);
    setView("overview");
    setMobileNavOpen(false);
  }

  return (
    <div className="min-h-screen bg-ice text-ink">
      <div className="flex min-h-screen">
        <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col bg-navy text-white shadow-2xl shadow-navy/15 transition duration-200 lg:static ${railCollapsed ? "lg:w-[84px]" : ""} ${mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
          <div className="flex h-[78px] items-center justify-between border-b border-white/10 px-5">
            <button className={`flex items-center gap-3 text-left ${railCollapsed ? "lg:mx-auto" : ""}`} onClick={() => setView("overview")} aria-label="Go to ward overview">
              <img src={logoUrl} alt="SEWA" className="h-9 w-9 rounded-xl bg-white/95 object-contain p-1.5" />
              {!railCollapsed && <span className="block"><span className="font-display text-[17px] font-bold tracking-[0.14em]">SEWA</span><span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.18em] text-white/45">Clinical command</span></span>}
            </button>
            <button className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white lg:hidden" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation"><X size={18} /></button>
          </div>

          <div className={`px-4 pt-6 ${railCollapsed ? "lg:px-3" : ""}`}>
            {!railCollapsed && <p className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Clinical workspace</p>}
            <nav className="mt-3 space-y-1.5" aria-label="Primary navigation">
              {navItems.map(({ id, label, icon: Icon }) => {
                const active = view === id;
                const alertNav = id === "alerts" && activeAlerts.length > 0;
                return (
                  <button key={id} onClick={() => { setView(id); setMobileNavOpen(false); }} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition duration-200 ${active ? "bg-white text-navy shadow-lg shadow-black/10" : "text-white/62 hover:bg-white/[0.08] hover:text-white"}`} title={railCollapsed ? label : undefined}>
                    <Icon size={17} strokeWidth={active ? 2.3 : 1.9} />
                    {!railCollapsed && <span className="flex-1 text-xs font-semibold">{label}</span>}
                    {!railCollapsed && alertNav && <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold ${active ? "bg-coral/10 text-coral-dark" : "bg-coral text-white"}`}>{activeAlerts.length}</span>}
                  </button>
                );
              })}
            </nav>
          </div>

          {!railCollapsed && (
            <div className="mt-8 px-4">
              <p className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">System confidence</p>
              <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06]">
                <div className="relative h-28 overflow-hidden"><img src={pathwayUrl} alt="Abstract care pathway" className="h-full w-full object-cover opacity-45 mix-blend-screen" /><div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" /><div className="absolute bottom-3 left-3 flex items-center gap-2"><ShieldCheck size={15} className="text-signal-teal" /><span className="text-[11px] font-semibold text-white/85">Data loop active</span></div></div>
                <div className="p-3"><div className="flex items-center justify-between text-[10px] font-semibold text-white/50"><span>Telemetry coverage</span><span className="text-signal-teal">98.4%</span></div><div className="mt-2 h-1 rounded-full bg-white/10"><div className="h-1 w-[98.4%] rounded-full bg-signal-teal" /></div></div>
              </div>
            </div>
          )}

          <div className="mt-auto border-t border-white/10 p-4">
            <div className={`flex items-center gap-3 rounded-xl bg-white/[0.06] p-3 ${railCollapsed ? "lg:justify-center lg:p-2" : ""}`}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal/20 font-display text-xs font-bold text-signal-teal">AR</div>
              {!railCollapsed && <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-white/90">Dr. Anika Rao</p><p className="mt-0.5 truncate text-[10px] text-white/40">ICU team 2 · On duty</p></div>}
              {!railCollapsed && <Settings2 size={14} className="text-white/35" />}
            </div>
            <button onClick={() => setRailCollapsed((collapsed) => !collapsed)} className="mt-3 hidden w-full items-center justify-center gap-2 rounded-lg py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35 transition hover:bg-white/[0.08] hover:text-white lg:flex">{railCollapsed ? <PanelLeftOpen size={15} /> : <><PanelLeftClose size={15} /> Collapse rail</>}</button>
          </div>
        </aside>

        {mobileNavOpen && <button className="fixed inset-0 z-30 bg-navy/35 backdrop-blur-sm lg:hidden" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation overlay" />}

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur-xl">
            <div className="flex h-[78px] items-center gap-4 px-4 sm:px-6 xl:px-9">
              <button className="rounded-xl border border-line bg-white p-2.5 text-slate-500 shadow-sm lg:hidden" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Menu size={19} /></button>
              <div className="min-w-0 flex-1"><p className="hidden text-[10px] font-bold uppercase tracking-[0.19em] text-slate-400 sm:block">North ICU <span className="mx-1 text-slate-300">/</span> Clinical command</p><h1 className="truncate font-display text-sm font-semibold tracking-tight text-ink sm:mt-1 sm:text-lg">{view === "overview" ? "Ward overview" : view === "patients" ? "Patient census" : "Alert queue"}</h1></div>
              <div className="hidden items-center gap-2 rounded-xl border border-line bg-ice px-3 py-2 md:flex"><Search size={15} className="text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a patient" className="w-36 bg-transparent text-xs font-medium text-ink outline-none placeholder:text-slate-400" /><kbd className="rounded-md border border-line bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-400">⌘ K</kbd></div>
              <div className="hidden sm:block"><ConnectionBadge state={transportState} isDemo={isDemo} /></div>
              <button onClick={() => refreshPatients()} className="rounded-xl border border-line bg-white p-2.5 text-slate-500 shadow-sm transition hover:border-teal/40 hover:text-teal-dark" aria-label="Refresh ward data"><RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} /></button>
              <button onClick={() => setView("alerts")} className="relative rounded-xl border border-line bg-white p-2.5 text-slate-500 shadow-sm transition hover:border-coral/40 hover:text-coral-dark" aria-label={`${activeAlerts.length} active alerts`}><Bell size={17} />{activeAlerts.length > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[9px] font-bold text-white">{activeAlerts.length}</span>}</button>
            </div>
          </header>

          <div className="mx-auto max-w-[1700px] px-4 py-7 sm:px-6 xl:px-9">
            <div className="mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
              <div><div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400"><span className="h-2 w-2 rounded-full bg-signal-teal" /> Morning handoff · {formatTime(Date.now())}</div><h2 className="mt-2 font-display text-[28px] font-semibold tracking-[-0.035em] text-ink sm:text-[34px]">Good morning, Dr. Rao<span className="text-teal">.</span></h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">A focused view of the North ICU. Review active risk, then open evidence for the patient who needs your attention.</p></div>
              <div className="flex items-center gap-3"><div className="rounded-xl border border-line bg-white px-3 py-2.5 shadow-sm"><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">Last sync</p><p className="mt-1 text-xs font-semibold text-ink"><LastUpdated timestamp={lastUpdate} /></p></div><button className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-3 text-xs font-bold text-white shadow-lg shadow-navy/15 transition duration-200 hover:bg-navy-light active:scale-[0.98]" onClick={() => setView("patients")}><ClipboardList size={15} /> Review census <ChevronRight size={14} /></button></div>
            </div>

            {isDemo && <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber/25 bg-amber/[0.07] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><div className="mt-0.5 rounded-lg bg-amber/15 p-1.5 text-amber-dark"><CircleHelp size={15} /></div><p className="text-xs leading-5 text-amber-dark"><strong className="font-bold">Simulation mode is active.</strong> The dashboard is using local, synthetic telemetry until the Spring WebSocket endpoint is configured. No clinical decision should be made from this mode.</p></div><span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-dark">Demo data</span></div>}

            <SummaryBar patients={patients} highRiskCount={highRiskCount} watchCount={watchCount} stableCount={stableCount} activeAlerts={activeAlerts.length} />

            {view === "overview" && selectedPatient && <OverviewView patients={filteredPatients} selectedPatient={selectedPatient} selectedPatientId={selectedPatientId} selectPatient={selectPatient} alerts={alerts} activeAlerts={activeAlerts} acknowledgeAlert={acknowledgeAlert} metric={metric} setMetric={setMetric} setView={setView} setFocusedAlert={setFocusedAlert} />}
            {view === "patients" && <PatientsView patients={filteredPatients} selectedPatientId={selectedPatientId} selectPatient={selectPatient} search={search} setSearch={setSearch} />}
            {view === "alerts" && <AlertsView alerts={alerts} acknowledgeAlert={acknowledgeAlert} selectPatient={(patientId) => { setSelectedPatientId(patientId); setView("overview"); }} />}

            <footer className="mt-10 flex flex-col justify-between gap-3 border-t border-line pt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 sm:flex-row sm:items-center"><span>SEWA · Clinical decision support</span><span className="flex items-center gap-2"><Database size={13} /> Recent telemetry is stored locally for continuity</span></footer>
          </div>
        </main>
      </div>

      {currentAlert && <AlertDrawer alert={currentAlert} onClose={() => setFocusedAlert(null)} onAcknowledge={() => acknowledgeAlert(currentAlert.id)} />}
    </div>
  );
}

function SummaryBar({ patients, highRiskCount, watchCount, stableCount, activeAlerts }: { patients: Patient[]; highRiskCount: number; watchCount: number; stableCount: number; activeAlerts: number }) {
  return <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4"><SummaryCell label="Census" value={patients.length} note="patients monitored" icon={Users} tone="teal" /><SummaryCell label="Priority review" value={highRiskCount} note="high-risk patients" icon={AlertTriangle} tone="coral" /><SummaryCell label="Watch list" value={watchCount} note="trend needs review" icon={SlidersHorizontal} tone="amber" /><SummaryCell label="Alert queue" value={activeAlerts} note={`${stableCount} stable patients`} icon={Bell} tone="blue" /></div>;
}

function SummaryCell({ label, value, note, icon: Icon, tone }: { label: string; value: number; note: string; icon: typeof Users; tone: "teal" | "coral" | "amber" | "blue" }) {
  const styles = { teal: "bg-teal/10 text-teal-dark", coral: "bg-coral/10 text-coral-dark", amber: "bg-amber/10 text-amber-dark", blue: "bg-blue/10 text-blue-dark" };
  return <div className="rounded-2xl border border-line bg-white px-4 py-4 shadow-card"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-slate-400">{label}</p><p className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">{value}</p><p className="mt-1 text-[11px] text-slate-500">{note}</p></div><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${styles[tone]}`}><Icon size={16} /></span></div></div>;
}

function OverviewView({ patients, selectedPatient, selectedPatientId, selectPatient, alerts, activeAlerts, acknowledgeAlert, metric, setMetric, setView, setFocusedAlert }: { patients: Patient[]; selectedPatient: Patient; selectedPatientId: string; selectPatient: (patient: Patient) => void; alerts: ReturnType<typeof useClinicalData>["alerts"]; activeAlerts: ReturnType<typeof useClinicalData>["activeAlerts"]; acknowledgeAlert: (id: string) => void; metric: Metric; setMetric: (metric: Metric) => void; setView: (view: View) => void; setFocusedAlert: (id: string) => void }) {
  return <>
    <div className="grid gap-6 xl:grid-cols-[minmax(260px,0.76fr)_minmax(0,1.7fr)]">
      <section className="min-w-0"><SectionHeading eyebrow="Patient watchlist" title="Who needs attention" action={<button onClick={() => setView("patients")} className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal-dark transition hover:text-teal">View census <ChevronRight className="inline" size={13} /></button>} /><div className="space-y-3">{patients.map((patient) => <PatientListItem key={patient.id} patient={patient} selected={patient.id === selectedPatientId} onSelect={() => selectPatient(patient)} />)}</div></section>
      <section className="min-w-0"><SectionHeading eyebrow="Clinical focus" title="Evidence for the selected patient" action={<div className="flex items-center gap-2"><span className="hidden text-[10px] font-semibold text-slate-400 sm:inline">{selectedPatient.fhirPatientId}</span><RiskPill risk={selectedPatient.risk} /></div>} /><div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card"><div className="relative min-h-[132px] overflow-hidden"><img src={detailUrl} alt="ICU telemetry workstation" className="absolute inset-0 h-full w-full object-cover opacity-40" /><div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/20" /><div className="relative flex min-h-[132px] flex-col justify-end p-5 sm:p-6"><div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">{selectedPatient.bed} · {selectedPatient.unit}</p><h3 className="mt-1 font-display text-2xl font-semibold tracking-tight text-white">{selectedPatient.name}</h3><p className="mt-1 text-xs text-white/65">{selectedPatient.age} years · {selectedPatient.sex === "F" ? "Female" : "Male"} · {selectedPatient.diagnosis}</p></div><div className="text-right"><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-white/50">Risk score</p><p className={`mt-1 font-display text-3xl font-semibold ${selectedPatient.risk === "high" ? "text-coral-light" : selectedPatient.risk === "watch" ? "text-amber-light" : "text-signal-teal"}`}>{selectedPatient.riskScore}<span className="ml-1 text-sm font-medium text-white/50">/100</span></p></div></div></div></div><div className="p-5 sm:p-6"><PatientMetricStrip patient={selectedPatient} /><div className="mt-7 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Trend evidence</p><p className="mt-1 text-xs leading-5 text-slate-500">Monitor the latest signal alongside the patient’s risk score.</p></div><div className="flex flex-wrap gap-1 rounded-xl bg-ice p-1">{(["heartRate", "oxygenSaturation", "meanArterialPressure", "lactate"] as Metric[]).map((item) => <button key={item} onClick={() => setMetric(item)} className={`rounded-lg px-2.5 py-2 text-[10px] font-bold uppercase tracking-[0.1em] transition ${metric === item ? "bg-white text-ink shadow-sm" : "text-slate-400 hover:text-slate-700"}`}>{item === "heartRate" ? "HR" : item === "oxygenSaturation" ? "SpO₂" : item === "meanArterialPressure" ? "MAP" : "Lactate"}</button>)}</div></div><div className="mt-5"><ClinicalTrendChart patient={selectedPatient} metric={metric} /></div><div className="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-3"><DetailStat label="Admitted" value={selectedPatient.admitted} /><DetailStat label="Care team" value={selectedPatient.careTeam} /><DetailStat label="Last signal" value={formatTime(selectedPatient.latest.timestamp)} /></div></div></div></section>
    </div>

    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <section className="min-w-0"><SectionHeading eyebrow="Recent signal" title="Live telemetry across the ward" action={<span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-signal-teal" /> Rolling window</span>} /><div className="grid gap-4 md:grid-cols-2"><TelemetryCard patient={patients[0]} metric="heartRate"/><TelemetryCard patient={patients[1] ?? patients[0]} metric="oxygenSaturation"/></div></section>
      <section className="min-w-0"><SectionHeading eyebrow="Action queue" title="Review before handoff" action={<button onClick={() => setView("alerts")} className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal-dark transition hover:text-teal">Open queue <ChevronRight className="inline" size={13} /></button>} /><div className="space-y-3">{activeAlerts.slice(0, 2).map((alert) => <ClinicalAlertItem key={alert.id} alert={alert} onAcknowledge={() => acknowledgeAlert(alert.id)} onSelect={() => setFocusedAlert(alert.id)} />)}{activeAlerts.length === 0 && <div className="rounded-2xl border border-line bg-white p-6 text-sm text-slate-500 shadow-card">No active alerts. The ward is quiet right now.</div>}</div></section>
    </div>
  </>;
}

function DetailStat({ label, value }: { label: string; value: string }) { return <div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p><p className="mt-1 truncate text-xs font-semibold text-ink">{value}</p></div>; }

function TelemetryCard({ patient, metric }: { patient: Patient; metric: Metric }) { return <div className="rounded-2xl border border-line bg-white p-4 shadow-card"><div className="flex items-center justify-between gap-2"><div><p className="font-display text-sm font-semibold text-ink">{patient.name}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">{patient.bed} · {getStatusLabel(patient.risk)}</p></div><span className="rounded-lg bg-ice px-2 py-1 text-[10px] font-bold text-slate-500">{metric === "heartRate" ? "Heart rate" : "SpO₂"}</span></div><div className="mt-4"><ClinicalTrendChart patient={patient} metric={metric} compact /></div><div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-slate-400"><span>Latest {formatTime(patient.latest.timestamp)}</span><span className="text-ink">{metric === "heartRate" ? `${patient.latest.heartRate} bpm` : `${patient.latest.oxygenSaturation}%`}</span></div></div>; }

function PatientsView({ patients, selectedPatientId, selectPatient, search, setSearch }: { patients: Patient[]; selectedPatientId: string; selectPatient: (patient: Patient) => void; search: string; setSearch: (value: string) => void }) {
  return <section><div className="mb-5 flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-dark">North ICU · 6 monitored</p><h2 className="mt-1 font-display text-xl font-semibold text-ink">Patient census</h2></div><div className="flex items-center gap-2 rounded-xl border border-line bg-ice px-3 py-2.5 sm:w-72"><Search size={15} className="text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, bed, diagnosis" className="w-full bg-transparent text-xs font-medium outline-none placeholder:text-slate-400" /></div></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{patients.map((patient) => <PatientListItem key={patient.id} patient={patient} selected={patient.id === selectedPatientId} onSelect={() => selectPatient(patient)} />)}</div>{patients.length === 0 && <EmptySearch />}</section>;
}

function EmptySearch() { return <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center"><Search className="mx-auto text-slate-300" size={28} /><p className="mt-3 font-display text-sm font-semibold text-ink">No patients match that search</p><p className="mt-1 text-xs text-slate-500">Try a name, bed number, or diagnosis.</p></div>; }

function AlertsView({ alerts, acknowledgeAlert, selectPatient }: { alerts: ReturnType<typeof useClinicalData>["alerts"]; acknowledgeAlert: (id: string) => void; selectPatient: (patientId: string) => void }) { return <section><div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-coral-dark">Clinical review queue</p><h2 className="mt-1 font-display text-xl font-semibold text-ink">Alert history</h2><p className="mt-1 text-sm text-slate-500">Every alert is retained locally for the current browser session.</p></div><span className="rounded-full bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 shadow-sm">{alerts.filter((alert) => !alert.acknowledged).length} open · {alerts.length} total</span></div><div className="grid gap-3 lg:grid-cols-2">{alerts.map((alert) => <ClinicalAlertItem key={alert.id} alert={alert} onAcknowledge={() => acknowledgeAlert(alert.id)} onSelect={() => selectPatient(alert.patientId)} />)}</div></section>; }

function AlertDrawer({ alert, onClose, onAcknowledge }: { alert: ReturnType<typeof useClinicalData>["alerts"][number]; onClose: () => void; onAcknowledge: () => void }) { return <><button className="fixed inset-0 z-40 bg-navy/20 backdrop-blur-[2px]" onClick={onClose} aria-label="Close alert evidence" /><aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-line bg-white p-5 shadow-2xl shadow-navy/20 sm:p-7"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-coral-dark">Alert evidence</p><h2 className="mt-1 font-display text-xl font-semibold text-ink">{alert.patientName}</h2></div><button onClick={onClose} className="rounded-xl border border-line p-2 text-slate-500 transition hover:border-coral/40 hover:text-coral-dark" aria-label="Close alert"><X size={17} /></button></div><div className="mt-6 overflow-hidden rounded-2xl bg-navy"><div className="relative h-36"><img src={atmosphereUrl} alt="Clinical environment" className="h-full w-full object-cover opacity-45" /><div className="absolute inset-0 bg-gradient-to-t from-navy to-transparent" /><div className="absolute bottom-4 left-4 right-4 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-white/55">{alert.bed}</p><p className="mt-1 font-display text-lg font-semibold text-white">{alert.title}</p></div><RiskPill risk={alert.severity === "high" ? "high" : "watch"} /></div></div><div className="p-4"><p className="text-xs leading-5 text-white/65">{alert.detail}</p></div></div><div className="mt-7"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Contributing evidence</p><div className="mt-3 space-y-2">{alert.evidence.map((item) => <div key={item} className="flex items-center gap-3 rounded-xl border border-line bg-ice p-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-coral/10 text-coral-dark"><HeartPulse size={14} /></span><span className="text-xs font-semibold text-ink">{item}</span></div>)}</div></div><div className="mt-8 rounded-2xl border border-line bg-ice p-4"><div className="flex items-start gap-3"><FileText size={17} className="mt-0.5 text-teal-dark" /><div><p className="text-xs font-bold text-ink">Clinical note</p><p className="mt-1 text-xs leading-5 text-slate-500">This risk signal is intended to support clinician review. Confirm against the bedside assessment and current care protocol.</p></div></div></div><div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5"><span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Raised {formatAgo(alert.createdAt)}</span>{!alert.acknowledged ? <button onClick={() => { onAcknowledge(); onClose(); }} className="rounded-xl bg-navy px-4 py-3 text-xs font-bold text-white shadow-lg shadow-navy/15 transition hover:bg-navy-light">Acknowledge alert</button> : <span className="text-xs font-bold text-teal-dark">Acknowledged</span>}</div></aside></>; }
