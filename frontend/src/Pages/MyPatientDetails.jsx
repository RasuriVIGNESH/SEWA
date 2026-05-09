import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { VitalMetrics } from '../components/VitalMetrics';
import { useVitalsWS } from '../hooks/useVitalsWS';

import {
    Loader2,
    Clock,
    User,
    Save,
    ChevronLeft,
    AlertCircle,
    FileText,
    ShieldCheck,
    MapPin,
    Hash,
    Droplets,
    Phone,
    FileOutput,
    Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyPatientDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);

    const [editForm, setEditForm] = useState({
        name: '',
        phoneNumber: '',
        bedNumber: '',
        fhirPatientId: '',
        status: '',
        gender: '',
        bloodGroup: '',
        admissionDate: '',
        address: '',
        admissionReason: '',
        medicalHistory: ''
    });

    // 1. Fetch Patient Data
    const { data: patient, isLoading, isError } = useQuery({
        queryKey: ['patient', id],
        queryFn: async () => (await api.get(`/patients/${id}`)).data
    });

    // 2. Sync Form State
    useEffect(() => {
        if (patient) {
            setEditForm({
                name: patient.name || '',
                phoneNumber: patient.phoneNumber || '',
                bedNumber: patient.bedNumber || '',
                fhirPatientId: patient.fhirPatientId || '',
                status: patient.status || 'STABLE',
                gender: patient.gender || '',
                bloodGroup: patient.bloodGroup || '',
                admissionDate: patient.admissionDate || '',
                address: patient.address || '',
                admissionReason: patient.admissionReason || '',
                medicalHistory: patient.medicalHistory || ''
            });
        }
    }, [patient]);

    // 3. Vitals WebSocket Logic
    // Passing full patient object in array to enable rich alerts in the hook
    const patientList = useMemo(() => patient ? [patient] : [], [patient]);
    const vitalsMap = useVitalsWS(patientList);
    const vitals = patient?.fhirPatientId ? vitalsMap[patient.fhirPatientId] : null;

    // 4. Mutations
    const updateMutation = useMutation({
        mutationFn: async () => {
            await api.patch(`/patients/${id}`, editForm);
        },
        onSuccess: () => {
            toast.success('Record Updated');
            queryClient.invalidateQueries({ queryKey: ['patient', id] });
            setIsEditing(false);
        },
        onError: () => toast.error('Failed to update record')
    });

    const dischargeMutation = useMutation({
        mutationFn: async () => await api.post(`/patients/${id}/discharge`),
        onSuccess: () => {
            toast.success('Patient Discharged');
            navigate('/');
        },
        onError: () => toast.error('Discharge failed')
    });

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Establishing Clinical Link...</p>
                </div>
            </div>
        );
    }

    if (isError || !patient) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
                <div className="text-center p-8 bg-white rounded-[2rem] shadow-xl border border-slate-100">
                    <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                    <h2 className="text-xl font-black text-slate-900">Record Not Found</h2>
                    <button onClick={() => navigate('/')} className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const handleInputChange = (e) => setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
            <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-6 py-4">
                <div className="max-w-[1600px] mx-auto flex justify-between items-center">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm transition-all group">
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Ward
                    </button>

                    <div className="flex items-center gap-3">
                        {patient.status !== 'DISCHARGED' && (
                            <button onClick={() => confirm('Confirm patient discharge?') && dischargeMutation.mutate()} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 hover:text-red-600 rounded-xl font-bold text-xs transition-all shadow-sm">
                                <FileOutput size={16} /> Discharge
                            </button>
                        )}
                        <button
                            onClick={() => isEditing ? updateMutation.mutate() : setIsEditing(true)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md ${isEditing ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}`}
                        >
                            {isEditing ? <><Save size={16} /> Commit Changes</> : <><FileText size={16} /> Update Chart</>}
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-[1600px] mx-auto p-6 lg:p-10">
                <header className="mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="flex items-center gap-8">
                        <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl border border-slate-100 flex items-center justify-center text-blue-600 relative">
                            <User size={40} />
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center shadow-lg"><ShieldCheck size={14} className="text-white" /></div>
                        </div>
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">
                                    {isEditing ? (
                                        <input name="name" value={editForm.name} onChange={handleInputChange} className="bg-white border-b-2 border-blue-500 outline-none text-4xl font-black" />
                                    ) : patient.name}
                                </h1>
                                <StatusBadge status={patient.status} />
                            </div>
                            <div className="flex items-center gap-6 text-sm font-bold">
                                <span className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">Bed {patient.bedNumber || 'TBA'}</span>
                                <span className="text-slate-400 flex items-center gap-2 uppercase tracking-widest text-[11px]"><Clock size={16} /> Admitted: {patient.admissionDate || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-7 space-y-10">
                        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden">
                            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
                                <h3 className="font-black text-slate-900 uppercase tracking-tighter text-sm flex items-center gap-3">
                                    <Activity size={18} className="text-blue-600" /> Bedside Monitoring
                                </h3>
                                {vitals && <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded">LIVE FEED</span>}
                            </div>
                            <div className="p-10">
                                {vitals ? <VitalMetrics vitals={vitals} size="lg" /> : (
                                    <div className="py-24 text-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                                        <Activity className="mx-auto text-slate-200 mb-6 animate-pulse" size={64} />
                                        <p className="text-slate-900 text-xl font-bold tracking-tight">Waiting for Bedside Stream...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-5 space-y-8">
                        <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Clinical Details</h3>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                <EditableItem label="Gender" name="gender" value={editForm.gender} isEditing={isEditing} onChange={handleInputChange} />
                                <EditableItem label="Blood Type" name="bloodGroup" value={editForm.bloodGroup} icon={Droplets} isEditing={isEditing} onChange={handleInputChange} />
                                <EditableItem label="Contact" name="phoneNumber" value={editForm.phoneNumber} icon={Phone} isEditing={isEditing} onChange={handleInputChange} />
                                <EditableItem label="FHIR Patient ID" name="fhirPatientId" value={editForm.fhirPatientId} icon={Hash} isEditing={isEditing} onChange={handleInputChange} />
                                <div className="col-span-2">
                                    <EditableItem label="Address" name="address" value={editForm.address} icon={MapPin} isEditing={isEditing} onChange={handleInputChange} />
                                </div>
                            </div>

                            <div className="mt-10 pt-10 border-t border-slate-100 space-y-8">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Admission Reason</label>
                                    {isEditing ? (
                                        <textarea name="admissionReason" value={editForm.admissionReason} onChange={handleInputChange} rows="3" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm outline-none" />
                                    ) : <p className="text-slate-700 text-sm leading-relaxed font-medium">{patient.admissionReason || 'Not documented.'}</p>}
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Medical History</label>
                                    {isEditing ? (
                                        <textarea name="medicalHistory" value={editForm.medicalHistory} onChange={handleInputChange} rows="3" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm outline-none" />
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

function EditableItem({ label, name, value, isEditing, onChange, icon: Icon }) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                {Icon && <Icon size={12} className="text-blue-500" />} {label}
            </span>
            {isEditing ? (
                <input name={name} value={value} onChange={onChange} className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20" />
            ) : (
                <p className="text-sm font-bold text-slate-800">{value || '--'}</p>
            )}
        </div>
    );
}