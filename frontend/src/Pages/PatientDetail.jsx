import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { VitalMetrics } from '../components/VitalMetrics';
import VitalTrendChart from '../components/vitalTrendChart';
import { useVitalsWS } from '../hooks/useVitalsWS';
import { useVitalsHistoryStore } from '../store';
import {
  Activity,
  Loader2,
  X,
  UserPlus,
  Stethoscope,
  ClipboardList,
  ChevronRight,
  ChevronLeft,
  User,
  Heart,
  LogOut,
  TrendingUp,
  History
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    name: '', phoneNumber: '', gender: 'MALE', bedNumber: '',
    status: 'STABLE', admissionDate: '', bloodGroup: '',
    admissionReason: '', medicalHistory: '', fhirPatientId: ''
  });

  // 1. Fetch Patient Data
  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => (await api.get(`/patients/${id}`)).data
  });

  // Sync Form (Fixed uncontrolled input warning with || '')
  useEffect(() => {
    if (patient) {
      setForm({
        name: patient.name || '',
        phoneNumber: patient.phoneNumber || '',
        bedNumber: patient.bedNumber || '',
        fhirPatientId: patient.fhirPatientId || '',
        status: patient.status || 'STABLE',
        gender: patient.gender || 'MALE',
        bloodGroup: patient.bloodGroup || '',
        admissionDate: patient.admissionDate || '',
        admissionReason: patient.admissionReason || '',
        medicalHistory: patient.medicalHistory || ''
      });
    }
  }, [patient]);

  // 2. WebSocket & History
  const vitalsMap = useVitalsWS(patient ? [patient] : []);
  const vitals = patient?.fhirPatientId ? vitalsMap[patient.fhirPatientId] : null;

  console.log("DEBUG VITALS DATA:", vitals);

  const vitalsHistory = useVitalsHistoryStore(state =>
    state.vitalsHistory[patient?.fhirPatientId] || []
  );

  // 3. Mutations
  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => (await api.get('/doctors')).data,
    enabled: showAssignModal && step === 4
  });

  const assignMutation = useMutation({
    mutationFn: async (doctorId) => {
      // Step A: Assign doctor to get permissions
      await api.post('/patients/assign', { patientId: parseInt(id), doctorId });
      // Step B: Update the clinical chart
      await api.patch(`/patients/${id}`, form);
    },
    onSuccess: () => {
      toast.success('Patient Intake & Assignment Complete');
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
      setShowAssignModal(false);
      setStep(1);
    }
  });

  const dischargeMutation = useMutation({
    mutationFn: async () => await api.post(`/patients/${id}/discharge`),
    onSuccess: () => {
      toast.success('Patient Discharged');
      navigate('/patients');
    }
  });

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
    </div>
  );

  const handleInputChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Input styling
  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all";
  const labelClass = "text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1";

  return (
    <div className="min-h-screen bg-white p-6 lg:p-10 font-sans">
      {/* 1. Header Navigation */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-8 border-b border-slate-100">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-3 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-colors">
            <ChevronLeft size={20} className="text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">{patient.name}</h1>
              <StatusBadge status={patient.status} />
            </div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
              Ward Bed: {patient.bedNumber || 'TBA'} • ID: {patient.fhirPatientId || 'Pending'}
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          {!patient.doctorName && patient.status !== 'DISCHARGED' && (
            <button onClick={() => setShowAssignModal(true)} className="px-8 py-4 bg-blue-600 text-white rounded-xl font-black text-sm flex items-center gap-3 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
              <UserPlus size={20} /> Complete Intake
            </button>
          )}
          {patient.status !== 'DISCHARGED' && (
            <button
              onClick={() => confirm('Discharge patient?') && dischargeMutation.mutate()}
              className="px-6 py-4 border border-slate-200 text-slate-600 rounded-xl font-black text-sm flex items-center gap-3 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
            >
              <LogOut size={20} /> Discharge
            </button>
          )}
        </div>
      </div>

      {/* 2. Monitor Grid */}
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-10">
          <div className="flex items-center justify-between mb-10">
            <h3 className="font-black text-slate-900 uppercase tracking-tighter text-sm flex items-center gap-3">
              <Activity size={18} className="text-blue-600" /> Bedside Monitoring Feed
            </h3>
            {vitals && (
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                <span className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Sync</span>
              </div>
            )}
          </div>

          {vitals ? (
            <VitalMetrics vitals={vitals} size="lg" />
          ) : (
            <div className="py-24 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
              <History size={48} className="text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Awaiting Clinical Data Stream...</p>
            </div>
          )}
        </div>

        {/* 3. Vital Trends Section */}
        {vitalsHistory && vitalsHistory.length > 0 ? (
          <div className="space-y-6 pt-10 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <TrendingUp size={20} className="text-blue-600" />
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Physiological Trends</h2>
              <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-lg">{vitalsHistory.length} Readings Captured</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <VitalTrendChart readings={vitalsHistory} vitalKey="heartRate" label="Heart Rate (bpm)" color="#6366f1" />
              <VitalTrendChart readings={vitalsHistory} vitalKey="spo2" label="SpO2 (%)" color="#10b981" />
              <VitalTrendChart readings={vitalsHistory} vitalKey="respiratoryRate" label="Resp. Rate (/min)" color="#f59e0b" />
              <VitalTrendChart readings={vitalsHistory} vitalKey="meanArterialPressure" label="MAP (mmHg)" color="#ec4899" />
            </div>
          </div>
        ) : (
          <div className="p-20 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
            <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Collecting history for trend visualization...</p>
          </div>
        )}
      </div>

      {/* 4. Intake Wizard Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">

            <div className="px-10 pt-10 pb-6 border-b border-slate-50">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-900">Patient Intake Wizard</h3>
                <button onClick={() => setShowAssignModal(false)}><X size={24} /></button>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-blue-600' : 'bg-slate-100'}`} />
                ))}
              </div>
            </div>

            <div className="p-10 min-h-[400px]">
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h4 className="text-lg font-black text-slate-800 flex items-center gap-2"><User className="text-blue-600" /> 1. Personal Details</h4>
                  <div className="space-y-4">
                    <label className={labelClass}>Patient Full Name</label>
                    <input name="name" value={form.name} onChange={handleInputChange} className={inputClass} />
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={labelClass}>Phone</label><input name="phoneNumber" value={form.phoneNumber} onChange={handleInputChange} className={inputClass} /></div>
                      <div>
                        <label className={labelClass}>Gender</label>
                        <select name="gender" value={form.gender} onChange={handleInputChange} className={inputClass}>
                          <option value="MALE">Male</option><option value="FEMALE">Female</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h4 className="text-lg font-black text-slate-800 flex items-center gap-2"><ClipboardList className="text-blue-600" /> 2. Ward Assignment</h4>
                  <div className="space-y-4">
                    <label className={labelClass}>Assign Bed</label>
                    <input name="bedNumber" value={form.bedNumber} onChange={handleInputChange} className={inputClass} placeholder="e.g. ICU-01" />
                    <label className={labelClass}>Admission Status</label>
                    <select name="status" value={form.status} onChange={handleInputChange} className={inputClass}>
                      <option value="STABLE">STABLE</option>
                      <option value="WARNING">WARNING</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h4 className="text-lg font-black text-slate-800 flex items-center gap-2"><Heart className="text-blue-600" /> 3. Clinical Context</h4>
                  <div className="space-y-4">
                    <label className={labelClass}>Primary Admission Reason</label>
                    <input name="admissionReason" value={form.admissionReason} onChange={handleInputChange} className={inputClass} />
                    <label className={labelClass}>Medical History</label>
                    <textarea name="medicalHistory" value={form.medicalHistory} onChange={handleInputChange} rows="3" className={`${inputClass} resize-none`} />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h4 className="text-lg font-black text-slate-800 flex items-center gap-2"><Stethoscope className="text-blue-600" /> 4. Assign Physician</h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {doctors?.map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => assignMutation.mutate(doc.id)}
                        disabled={assignMutation.isPending}
                        className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-2xl border border-slate-100 transition-all group"
                      >
                        <div className="text-left font-black">Dr. {doc.name}</div>
                        {assignMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <ChevronRight size={18} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-10 py-8 bg-slate-50 flex justify-between">
              {step > 1 ? <button onClick={() => setStep(step - 1)} className="text-slate-400 font-black text-xs uppercase tracking-widest"><ChevronLeft size={16} /> Back</button> : <div />}
              {step < 4 && (
                <button onClick={() => setStep(step + 1)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Continue</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}