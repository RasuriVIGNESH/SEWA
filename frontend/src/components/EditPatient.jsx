import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import {
    X, User, Phone, Bed, Activity,
    Calendar, MapPin, FileText, Save,
    Loader2, Fingerprint, Droplets, Hash
} from 'lucide-react';

export function EditPatient({ patient, isOpen, onClose }) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({ ...patient });

    const mutation = useMutation({
        mutationFn: (updatedData) => api.patch(`/patients/${patient.id}`, updatedData),
        onSuccess: () => {
            queryClient.invalidateQueries(['patients']);
            onClose();
        },
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all";
    const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />

            <div className="relative bg-white w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col">
                {/* Header */}
                <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                            <User size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Update Clinical Record</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Patient System ID: {patient.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={20} /></button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="overflow-y-auto px-10 py-8 space-y-8">

                    {/* Section 1: Administrative */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 flex items-center gap-2 text-blue-600 mb-2">
                            <Hash size={16} /> <h3 className="text-xs font-black uppercase tracking-widest">Administrative & Logistics</h3>
                        </div>
                        <div>
                            <label className={labelClass}>Patient Full Name</label>
                            <input className={inputClass} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelClass}>Bed Assignment</label>
                            <input className={inputClass} value={formData.bedNumber} onChange={e => setFormData({ ...formData, bedNumber: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelClass}>FHIR Patient ID (System Link)</label>
                            <input className={inputClass} value={formData.fhirPatientId} onChange={e => setFormData({ ...formData, fhirPatientId: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelClass}>Contact Number</label>
                            <input className={inputClass} value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}>Primary Residence Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-3.5 text-slate-300" size={16} />
                                <input className={`${inputClass} pl-11`} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Clinical Baseline */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-3 flex items-center gap-2 text-emerald-600 mb-2">
                            <Activity size={16} /> <h3 className="text-xs font-black uppercase tracking-widest">Clinical Baseline</h3>
                        </div>
                        <div>
                            <label className={labelClass}>Gender</label>
                            <select className={inputClass} value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                <option value="MALE">MALE</option>
                                <option value="FEMALE">FEMALE</option>
                                <option value="OTHER">OTHER</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Blood Group</label>
                            <input className={inputClass} value={formData.bloodGroup} onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelClass}>Admission Date</label>
                            <input type="date" className={inputClass} value={formData.admissionDate} onChange={e => setFormData({ ...formData, admissionDate: e.target.value })} />
                        </div>
                    </section>

                    {/* Section 3: Clinical Notes */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 text-purple-600 mb-2">
                            <FileText size={16} /> <h3 className="text-xs font-black uppercase tracking-widest">Medical Documentation</h3>
                        </div>
                        <div>
                            <label className={labelClass}>Reason for Admission</label>
                            <textarea rows={2} className={`${inputClass} resize-none`} value={formData.admissionReason} onChange={e => setFormData({ ...formData, admissionReason: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelClass}>Long-term Medical History</label>
                            <textarea rows={4} className={`${inputClass} resize-none bg-slate-50/50`} value={formData.medicalHistory} onChange={e => setFormData({ ...formData, medicalHistory: e.target.value })} />
                        </div>
                    </section>
                </form>

                {/* Footer */}
                <div className="px-10 py-8 border-t border-slate-100 bg-white flex justify-end gap-4">
                    <button onClick={onClose} className="text-sm font-bold text-slate-400 px-4">Discard</button>
                    <button onClick={handleSubmit} disabled={mutation.isPending} className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-xl flex items-center gap-3">
                        {mutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Commit to Record
                    </button>
                </div>
            </div>
        </div>
    );
}