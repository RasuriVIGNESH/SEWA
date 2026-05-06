import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzePatientRisk } from '../Components/sewa/SepsisEngine';
import PatientCard from '../Components/sewa/PatientCard';
import PatientDetailView from '../Components/sewa/PatientDetailView';
import AdmissionModal from '../Components/sewa/PatientManagement/AdmissionModal';
import DischargeModal from '../Components/sewa/PatientManagement/DischargeModal';
import { useVitalsStream } from '../hooks/useVitalsStream';
import { Users, UserPlus, Stethoscope, Search, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { patientsApi } from '../api/patientsApi';

/**
 * Map Spring Boot PatientResponse → shape PatientCard / PatientDetailView expect.
 * Spring Boot uses `id`; old frontend used `patient_id`.
 * We keep both so downstream components work without mass-refactoring.
 */
function normalizePatient(p) {
    return {
        ...p,
        patient_id: p.id,          // alias for old component refs
        status: p.status || 'STABLE',
    };
}

export default function Dashboard() {
    const [patients, setPatients] = useState([]);
    const [readings, setReadings] = useState({});       // keyed by fhirPatientId
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [isAdmissionOpen, setIsAdmissionOpen] = useState(false);
    const [isDischargeOpen, setIsDischargeOpen] = useState(false);
    const [patientToDischarge, setPatientToDischarge] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [streamConnected, setStreamConnected] = useState(false);

    // ── Bootstrap: load patients for the logged-in doctor ────────────────
    useEffect(() => {
        const bootstrap = async () => {
            setIsLoading(true);
            try {
                const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                const doctorId = storedUser?.doctorId;

                let raw = [];
                if (doctorId) {
                    raw = await patientsApi.getDoctorPatients(doctorId);
                } else {
                    raw = await patientsApi.getPatients();
                }

                const normalized = (raw || []).map(normalizePatient);
                setPatients(normalized);
                if (normalized.length > 0) {
                    setSelectedPatientId(normalized[0].id);
                }
            } catch (err) {
                console.error('[Dashboard] Bootstrap error:', err.message);
                setPatients([]);
            } finally {
                setIsLoading(false);
            }
        };
        bootstrap();
    }, []);

    // ── WebSocket: STOMP vital callbacks ──────────────────────────────────
    const handleVital = useCallback((reading) => {
        // reading = VitalReadingDTO from Spring Boot
        const fhirId = reading.fhirPatientId;

        setReadings(prev => {
            const existing = prev[fhirId] || [];
            const updated = [...existing, reading].slice(-50);

            // Update patient status based on sepsis risk (non-blocking)
            setTimeout(() => {
                setPatients(prevPatients => prevPatients.map(p => {
                    if (p.fhirPatientId !== fhirId) return p;
                    const risk = analyzePatientRisk(updated, p);
                    const statusMap = { HIGH: 'CRITICAL', MODERATE: 'UNDER_OBSERVATION', LOW: 'STABLE' };
                    const newStatus = statusMap[risk.riskLevel] || p.status;
                    return p.status !== newStatus ? { ...p, status: newStatus } : p;
                }));
            }, 0);

            return { ...prev, [fhirId]: updated };
        });
    }, []);

    const handleStatus = useCallback((status) => {
        setStreamConnected(!!status?.connected);
    }, []);

    // FHIR IDs for STOMP subscriptions (only patients with fhirPatientId)
    const fhirPatientIds = patients
        .map(p => p.fhirPatientId)
        .filter(Boolean);

    useVitalsStream({
        fhirPatientIds,
        onVital: handleVital,
        onStatus: handleStatus,
        enabled: !isLoading && fhirPatientIds.length > 0,
    });

    // ── Derived ───────────────────────────────────────────────────────────
    const selectedPatient = patients.find(p => p.id === selectedPatientId);
    const selectedFhirId = selectedPatient?.fhirPatientId;
    const selectedPatientReadings = selectedFhirId ? readings[selectedFhirId] || [] : [];
    const selectedPatientRisk = selectedPatient
        ? analyzePatientRisk(selectedPatientReadings, selectedPatient)
        : null;
    const filteredPatients = patients.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ── Loading ───────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
                    />
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest animate-pulse">
                        Synchronizing Clinical Data...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-4rem)] bg-slate-50 flex overflow-hidden font-sans selection:bg-blue-100">

            {/* ── LEFT SIDEBAR: PATIENT REGISTRY ── */}
            <aside className="w-85 bg-white border-r border-slate-200 flex flex-col shadow-sm z-20">
                <div className="p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            <h2 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                                Patient Registry
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <div
                                title={streamConnected ? 'Live stream active' : 'Waiting for stream'}
                                className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${streamConnected
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : 'bg-slate-100 text-slate-400'
                                    }`}
                            >
                                {streamConnected
                                    ? <><Wifi className="w-3 h-3" /> Live</>
                                    : <><WifiOff className="w-3 h-3" /> Offline</>
                                }
                            </div>
                            <Badge className="bg-blue-50 text-blue-700 border-none font-bold">
                                {patients.length}
                            </Badge>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search census..."
                                className="pl-9 h-10 bg-slate-50 border-none text-xs rounded-xl focus:ring-2 focus:ring-blue-500/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={() => setIsAdmissionOpen(true)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 font-bold text-xs transition-all active:scale-95 shadow-lg shadow-blue-100"
                        >
                            <UserPlus className="w-3.5 h-3.5 mr-2" /> Admit Patient
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                    <AnimatePresence mode="popLayout">
                        {filteredPatients.map((patient, idx) => (
                            <motion.div
                                key={patient.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: idx * 0.04 }}
                            >
                                <PatientCard
                                    patient={patient}
                                    latestVitals={
                                        patient.fhirPatientId
                                            ? readings[patient.fhirPatientId]?.[
                                                readings[patient.fhirPatientId].length - 1
                                            ]
                                            : undefined
                                    }
                                    isSelected={patient.id === selectedPatientId}
                                    onClick={() => setSelectedPatientId(patient.id)}
                                />
                                {streamConnected && patient.id === selectedPatientId && (
                                    <motion.div
                                        className="h-0.5 bg-blue-500 mt-1 rounded-full mx-4"
                                        animate={{ opacity: [0.2, 1, 0.2] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    />
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </aside>

            {/* ── CENTER: CLINICAL COMMAND CENTER ── */}
            <main className="flex-1 overflow-y-auto relative no-scrollbar">
                <div className="max-w-6xl mx-auto p-8">
                    {selectedPatient ? (
                        <motion.div
                            key={selectedPatient.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <PatientDetailView
                                patient={selectedPatient}
                                readings={selectedPatientReadings}
                                riskAssessment={selectedPatientRisk}
                                onDischarge={(id) => {
                                    setPatientToDischarge(id);
                                    setIsDischargeOpen(true);
                                }}
                            />
                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center py-24">
                            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6">
                                <Stethoscope className="w-10 h-10 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2">No Selection</h2>
                            <p className="text-slate-500 max-w-sm">
                                Select a patient from the registry to view real-time diagnostics
                                and sepsis risk stratification.
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* ── MODALS ── */}
            <AdmissionModal
                isOpen={isAdmissionOpen}
                onClose={() => setIsAdmissionOpen(false)}
                onAdmit={async (formData) => {
                    try {
                        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                        // Map AdmissionModal snake_case → Spring Boot camelCase PatientRequest
                        const payload = {
                            name: formData.name,
                            phoneNumber: formData.phone || formData.phoneNumber,
                            bedNumber: formData.bed_number || formData.bedNumber,
                            fhirPatientId: formData.fhir_patient_id || formData.fhirPatientId,
                            status: formData.status || 'STABLE',
                            gender: formData.gender,
                            bloodGroup: formData.blood_group || formData.bloodGroup,
                            admissionDate: new Date().toISOString().slice(0, 10), // yyyy-MM-dd
                            address: formData.address,
                            admissionReason: formData.admission_reason || formData.admissionReason,
                            medicalHistory: Array.isArray(formData.medical_history)
                                ? formData.medical_history.join(', ')
                                : formData.medical_history,
                        };
                        const raw = await patientsApi.admitPatient(payload);
                        const admitted = normalizePatient(raw);

                        // Auto-assign to logged-in doctor if doctorId available
                        if (storedUser?.doctorId) {
                            try {
                                await patientsApi.assignPatient(admitted.id, storedUser.doctorId);
                            } catch { /* assignment optional */ }
                        }

                        setPatients(prev => [admitted, ...prev]);
                        setSelectedPatientId(admitted.id);
                        setIsAdmissionOpen(false);
                    } catch {
                        alert('Admission failed. Please check your connection and try again.');
                    }
                }}
            />

            <DischargeModal
                isOpen={isDischargeOpen}
                onClose={() => setIsDischargeOpen(false)}
                onDischarge={async () => {
                    try { await patientsApi.dischargePatient(patientToDischarge); } catch { }
                    const next = patients.filter(p => p.id !== patientToDischarge);
                    const discharged = patients.find(p => p.id === patientToDischarge);
                    setPatients(next);
                    if (discharged?.fhirPatientId) {
                        setReadings(prev => {
                            const copy = { ...prev };
                            delete copy[discharged.fhirPatientId];
                            return copy;
                        });
                    }
                    setSelectedPatientId(next.length > 0 ? next[0].id : null);
                    setIsDischargeOpen(false);
                    setPatientToDischarge(null);
                }}
                patientName={patients.find(p => p.id === patientToDischarge)?.name}
            />
        </div>
    );
}
