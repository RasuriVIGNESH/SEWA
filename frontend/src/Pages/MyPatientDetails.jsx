import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { api } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { useVitalsWS } from '../hooks/useVitalsWS';
import {
    Loader2, Clock, User, Save, ChevronLeft, AlertCircle, FileText,
    ShieldCheck, MapPin, Hash, Droplets, Phone, FileOutput, Activity,
    Zap, TrendingUp, Wind, Gauge, Thermometer, TestTube, Heart
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Shared vital config (panel display + chart thresholds/domains) ────────────
const vitalConfigs = {
    heart_rate: { label: 'Heart Rate', unit: 'bpm', icon: Heart, normalRange: [60, 100], color: '#ef4444', thresholds: { low: 60, high: 100 }, domain: [40, 160] },
    respiratory_rate: { label: 'Resp. Rate', unit: '/min', icon: Wind, normalRange: [12, 20], color: '#10b981', thresholds: { high: 22 }, domain: [8, 40] },
    map: { label: 'MAP', unit: 'mmHg', icon: Gauge, normalRange: [65, 100], color: '#6366f1', thresholds: { low: 65, high: 100 }, domain: [40, 120] },
    temperature: { label: 'Temp', unit: '°C', icon: Thermometer, normalRange: [36, 38], color: '#8b5cf6', thresholds: { low: 36, high: 38.3 }, domain: [35, 41] },
    spo2: { label: 'SpO₂', unit: '%', icon: Activity, normalRange: [94, 100], color: '#3b82f6', thresholds: { low: 94 }, domain: [85, 100] },
    lactate: { label: 'Lactate', unit: 'mmol/L', icon: Droplets, normalRange: [0.5, 2], color: '#f59e0b', thresholds: { high: 2 }, domain: [0, 6] },
    wbc: { label: 'WBC', unit: '×10³/μL', icon: TestTube, normalRange: [4, 12], color: '#64748b', thresholds: {}, domain: [0, 20] },
    creatinine: { label: 'Creatinine', unit: 'mg/dL', icon: TestTube, normalRange: [0.6, 1.2], color: '#64748b', thresholds: {}, domain: [0, 5] },
};

const PANEL_KEYS = ['heart_rate', 'respiratory_rate', 'map', 'spo2', 'temperature', 'lactate', 'wbc', 'creatinine'];
const CHART_TABS = [
    { key: 'heart_rate', label: 'HR' },
    { key: 'spo2', label: 'SpO₂' },
    { key: 'map', label: 'MAP' },
    { key: 'respiratory_rate', label: 'RR' },
    { key: 'temperature', label: 'Temp' },
    { key: 'lactate', label: 'Lactate' },
];

// ─── VitalItem ────────────────────────────────────────────────────────────────
function VitalItem({ vitalKey, value }) {
    const cfg = vitalConfigs[vitalKey];
    if (!cfg) return null;
    const Icon = cfg.icon;

    const status = value == null ? 'unknown'
        : value < cfg.normalRange[0] ? 'low'
            : value > cfg.normalRange[1] ? 'high'
                : 'normal';

    const wrap = { normal: 'bg-emerald-50 border-emerald-200', low: 'bg-blue-50 border-blue-200', high: 'bg-red-50 border-red-200', unknown: 'bg-slate-50 border-slate-200' }[status];
    const ico = { normal: 'text-emerald-500', low: 'text-blue-500', high: 'text-red-500', unknown: 'text-slate-400' }[status];
    const display = value == null ? '--' : (typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(1) : value);

    return (
        <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${wrap}`}>
            <div className={`p-2 rounded-lg bg-white/60 ${ico}`}><Icon className="w-4 h-4" /></div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 font-medium">{cfg.label}</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold">{display}</span>
                    <span className="text-xs text-slate-400">{cfg.unit}</span>
                </div>
            </div>
            {(status === 'high' || status === 'low') && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status === 'high' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {status === 'high' ? '↑' : '↓'}
                </span>
            )}
        </div>
    );
}

// ─── VitalsPanel ──────────────────────────────────────────────────────────────
function VitalsPanel({ vitals }) {
    if (!vitals) return <div className="text-center py-8 text-slate-400">No vital signs data available</div>;
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {PANEL_KEYS.map(k => <VitalItem key={k} vitalKey={k} value={vitals[k]} />)}
        </div>
    );
}

// ─── VitalTrendChart ──────────────────────────────────────────────────────────
// readings: [{ timestamp, heart_rate, spo2, map, respiratory_rate, temperature, lactate, ... }]
function VitalTrendChart({ readings, vitalKey, height = 180 }) {
    const cfg = vitalConfigs[vitalKey];

    if (!cfg || !readings?.length) {
        return <div className="flex items-center justify-center h-32 bg-slate-50 rounded-lg text-slate-400 text-sm">No data available</div>;
    }

    const chartData = readings
        .map(r => ({ time: format(new Date(r.timestamp), 'HH:mm'), value: r[vitalKey] }))
        .filter(d => d.value != null);

    if (!chartData.length) return (
        <div className="flex items-center justify-center h-32 bg-slate-50 rounded-lg text-slate-400 text-sm">No {cfg.label} data</div>
    );

    const TooltipContent = ({ active, payload, label }) =>
        active && payload?.length ? (
            <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-slate-200">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-sm font-semibold" style={{ color: cfg.color }}>{payload[0].value} {cfg.unit}</p>
            </div>
        ) : null;

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700">{cfg.label}</h3>
                <span className="text-xs text-slate-400">{cfg.unit}</span>
            </div>
            <ResponsiveContainer width="100%" height={height}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                    <YAxis domain={cfg.domain} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} width={35} />
                    <Tooltip content={<TooltipContent />} />
                    {cfg.thresholds.low && <ReferenceLine y={cfg.thresholds.low} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={1} />}
                    {cfg.thresholds.high && <ReferenceLine y={cfg.thresholds.high} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={1} />}
                    <Line type="monotone" dataKey="value" stroke={cfg.color} strokeWidth={2} dot={{ fill: cfg.color, r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── EditableItem ─────────────────────────────────────────────────────────────
function EditableItem({ label, name, value, isEditing, onChange, icon: Icon }) {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                {Icon && <Icon size={12} className="text-blue-500" />} {label}
            </span>
            {isEditing ? (
                <input name={name} value={value} onChange={onChange}
                    className="bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300" />
            ) : (
                <p className="text-sm font-bold text-slate-800">{value || '--'}</p>
            )}
        </div>
    );
}

// ─── MyPatientDetails ─────────────────────────────────────────────────────────
export default function MyPatientDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [activeChart, setActiveChart] = useState('heart_rate');

    const [editForm, setEditForm] = useState({
        name: '', phoneNumber: '', bedNumber: '', fhirPatientId: '',
        status: '', gender: '', bloodGroup: '', admissionDate: '',
        address: '', admissionReason: '', medicalHistory: ''
    });

    const { data: patient, isLoading, isError } = useQuery({
        queryKey: ['patient', id],
        queryFn: async () => (await api.get(`/patients/${id}`)).data
    });

    useEffect(() => {
        if (patient) {
            setEditForm({
                name: patient.name || '', phoneNumber: patient.phoneNumber || '',
                bedNumber: patient.bedNumber || '', fhirPatientId: patient.fhirPatientId || '',
                status: patient.status || 'STABLE', gender: patient.gender || '',
                bloodGroup: patient.bloodGroup || '', admissionDate: patient.admissionDate || '',
                address: patient.address || '', admissionReason: patient.admissionReason || '',
                medicalHistory: patient.medicalHistory || ''
            });
        }
    }, [patient]);

    // vitalsMap[fhirPatientId] = { heart_rate, spo2, map, ..., readings: [{timestamp, ...}] }
    const patientList = useMemo(() => patient ? [patient] : [], [patient]);
    const vitalsMap = useVitalsWS(patientList);
    const vitals = patient?.fhirPatientId ? vitalsMap[patient.fhirPatientId] : null;
    const readings = vitals?.readings ?? [];

    const updateMutation = useMutation({
        mutationFn: async () => { await api.patch(`/patients/${id}`, editForm); },
        onSuccess: () => {
            toast.success('Record Updated');
            queryClient.invalidateQueries({ queryKey: ['patient', id] });
            setIsEditing(false);
        },
        onError: () => toast.error('Failed to update record')
    });

    const dischargeMutation = useMutation({
        mutationFn: async () => await api.post(`/patients/${id}/discharge`),
        onSuccess: () => { toast.success('Patient Discharged'); navigate('/'); },
        onError: () => toast.error('Discharge failed')
    });

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Loading Patient Record...</p>
            </div>
        </div>
    );

    if (isError || !patient) return (
        <div className="flex h-screen items-center justify-center bg-white">
            <div className="text-center p-8 bg-slate-50 rounded-2xl shadow-lg border border-slate-200">
                <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                <h2 className="text-xl font-black text-slate-900">Record Not Found</h2>
                <button onClick={() => navigate('/')} className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors">
                    Return to Dashboard
                </button>
            </div>
        </div>
    );

    const handleInputChange = (e) => setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    return (
        <div className="min-h-screen bg-white pb-20 font-sans">

            {/* Sticky Nav */}
            <nav className="bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-30 px-6 py-4 shadow-sm">
                <div className="max-w-[1600px] mx-auto flex justify-between items-center">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm transition-all group">
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to Ward
                    </button>
                    <div className="flex items-center gap-3">
                        {patient.status !== 'DISCHARGED' && (
                            <button onClick={() => confirm('Confirm patient discharge?') && dischargeMutation.mutate()}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 rounded-lg font-bold text-xs transition-all">
                                <FileOutput size={16} /> Discharge
                            </button>
                        )}
                        <button
                            onClick={() => isEditing ? updateMutation.mutate() : setIsEditing(true)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-xs transition-all ${isEditing ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                            {isEditing ? <><Save size={16} /> Save Changes</> : <><FileText size={16} /> Edit Chart</>}
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-[1600px] mx-auto p-6 lg:p-10">

                {/* Patient Header */}
                <header className="mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="flex items-center gap-8">
                        <div className="w-24 h-24 bg-slate-100 rounded-2xl shadow-md border border-slate-200 flex items-center justify-center text-blue-600 relative">
                            <User size={40} />
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center shadow-lg">
                                <ShieldCheck size={14} className="text-white" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-4 mb-3">
                                <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">
                                    {isEditing ? (
                                        <input name="name" value={editForm.name} onChange={handleInputChange}
                                            className="bg-slate-50 border-b-2 border-blue-500 outline-none text-4xl font-black rounded px-2" />
                                    ) : patient.name}
                                </h1>
                                <StatusBadge status={patient.status} />
                            </div>
                            <div className="flex items-center gap-6 text-sm font-bold flex-wrap">
                                <span className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                                    <Zap size={14} /> Bed {patient.bedNumber || 'TBA'}
                                </span>
                                <span className="text-slate-500 flex items-center gap-2 uppercase tracking-widest text-[11px]">
                                    <Clock size={16} /> Admitted: {patient.admissionDate || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Left: Monitoring */}
                    <div className="lg:col-span-7 space-y-8">

                        {/* Live Vitals Panel */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-black text-slate-900 uppercase tracking-tighter text-sm flex items-center gap-3">
                                    <Activity size={18} className="text-blue-600" /> Bedside Vital Monitoring
                                </h3>
                                {vitals && (
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-2.5 w-2.5 relative">
                                            <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative rounded-full h-2.5 w-2.5 bg-emerald-600" />
                                        </span>
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Feed</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-8">
                                {vitals ? (
                                    <VitalsPanel vitals={vitals} />
                                ) : (
                                    <div className="py-24 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
                                        <Activity className="mx-auto text-slate-300 mb-6 animate-pulse" size={64} />
                                        <p className="text-slate-600 text-lg font-bold tracking-tight">Waiting for Bedside Stream...</p>
                                        <p className="text-slate-400 text-sm mt-2">Vitals will appear here when available</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Trend Chart (only when readings are available) */}
                        {vitals && readings.length > 0 && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
                                <div className="px-8 py-6 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                                    <h3 className="font-black text-slate-900 uppercase tracking-tighter text-sm flex items-center gap-3">
                                        <TrendingUp size={18} className="text-blue-600" /> Vital Trends
                                    </h3>
                                    <div className="flex gap-1.5 flex-wrap">
                                        {CHART_TABS.map(({ key, label }) => (
                                            <button key={key} onClick={() => setActiveChart(key)}
                                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeChart === key ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-8">
                                    <VitalTrendChart readings={readings} vitalKey={activeChart} height={200} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Clinical Details */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-md">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                                <ShieldCheck size={14} className="text-blue-600" /> Clinical Details
                            </h3>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                <EditableItem label="Gender" name="gender" value={editForm.gender} isEditing={isEditing} onChange={handleInputChange} />
                                <EditableItem label="Blood Type" name="bloodGroup" value={editForm.bloodGroup} icon={Droplets} isEditing={isEditing} onChange={handleInputChange} />
                                <EditableItem label="Contact" name="phoneNumber" value={editForm.phoneNumber} icon={Phone} isEditing={isEditing} onChange={handleInputChange} />
                                <EditableItem label="FHIR ID" name="fhirPatientId" value={editForm.fhirPatientId} icon={Hash} isEditing={isEditing} onChange={handleInputChange} />
                                <div className="col-span-2">
                                    <EditableItem label="Address" name="address" value={editForm.address} icon={MapPin} isEditing={isEditing} onChange={handleInputChange} />
                                </div>
                            </div>

                            <div className="mt-10 pt-10 border-t border-slate-200 space-y-8">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Admission Reason</label>
                                    {isEditing ? (
                                        <textarea name="admissionReason" value={editForm.admissionReason} onChange={handleInputChange} rows="3"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
                                    ) : <p className="text-slate-700 text-sm leading-relaxed font-medium">{patient.admissionReason || 'Not documented.'}</p>}
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Medical History</label>
                                    {isEditing ? (
                                        <textarea name="medicalHistory" value={editForm.medicalHistory} onChange={handleInputChange} rows="3"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
                                    ) : <p className="text-slate-700 text-sm leading-relaxed font-medium">{patient.medicalHistory || 'No historical data available.'}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}