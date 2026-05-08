import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { VitalMetrics } from '../components/VitalMetrics';
import { useVitalsWS } from '../hooks/useVitalsWS';
import {
  FileOutput,
  Activity,
  Loader2,
  Clock,
  X,
  UserPlus,
  Stethoscope,
  ClipboardList,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  User,
  Heart
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRelativeTime } from '../lib/formatters';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Wizard State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [step, setStep] = useState(1); // 1: Personal, 2: Logistics, 3: Clinical, 4: Doctor

  const [form, setForm] = useState({
    name: '',
    phoneNumber: '',
    gender: 'MALE',
    bedNumber: '',
    status: 'STABLE',
    admissionDate: new Date().toISOString().split('T')[0],
    bloodGroup: '',
    admissionReason: '',
    medicalHistory: '',
    fhirPatientId: ''
  });

  // Fetch Patient
  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const res = await api.get(`/patients/${id}`);
      return res.data;
    }
  });

  // Sync Form when patient loads
  useEffect(() => {
    if (patient) {
      setForm(prev => ({
        ...prev,
        name: patient.name || '',
        phoneNumber: patient.phoneNumber || '',
        bedNumber: patient.bedNumber || '',
        fhirPatientId: patient.fhirPatientId || '',
        status: patient.status || 'STABLE',
        gender: patient.gender || 'MALE',
        bloodGroup: patient.bloodGroup || '',
        admissionReason: patient.admissionReason || '',
        medicalHistory: patient.medicalHistory || ''
      }));
    }
  }, [patient]);

  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => (await api.get('/doctors')).data,
    enabled: showAssignModal && step === 4
  });

  // Mutation
  const assignMutation = useMutation({
    mutationFn: async (doctorId) => {
      await api.patch(`/patients/${id}`, form);
      await api.post('/patients/assign', { patientId: parseInt(id), doctorId });
    },
    onSuccess: () => {
      toast.success('Patient Intake & Assignment Complete');
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
      setShowAssignModal(false);
      setStep(1);
    }
  });

  // Vitals
  const fhirIds = patient?.fhirPatientId ? [patient.fhirPatientId] : [];
  const vitalsMap = useVitalsWS(fhirIds);
  const vitals = patient?.fhirPatientId ? vitalsMap[patient.fhirPatientId] : null;

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  // Validation
  const isStep1Valid = form.name && form.phoneNumber;
  const isStep2Valid = form.bedNumber && form.status;
  const isStep3Valid = form.admissionReason;

  // UI Helpers
  // Change your variables to this:
  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all";

  const labelClass = "text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1";
  return (
    <div className="min-h-screen bg-[#FDFDFD] p-6 lg:p-10 font-sans">

      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-8 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{patient.name}</h1>
            <StatusBadge status={patient.status} />
          </div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">
            Patient ID: {patient.fhirPatientId || 'Pending Handshake'}
          </p>
        </div>

        {!patient.DoctorName && patient.status !== 'DISCHARGED' && (
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95"
          >
            <UserPlus size={20} /> Complete Intake
          </button>
        )}
      </div>

      {/* MONITORING AREA */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40 p-10">
            <div className="flex items-center justify-between mb-10">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs flex items-center gap-2">
                <Activity size={18} className="text-blue-600" /> Bedside Vitals
              </h3>
              {vitals && <span className="text-[10px] font-black text-slate-300">SYNCED: {new Date(vitals.timestamp).toLocaleTimeString()}</span>}
            </div>
            {vitals ? <VitalMetrics vitals={vitals} size="lg" /> : (
              <div className="py-20 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 text-slate-400 font-bold">
                Device not streaming. Awaiting clinical connection.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-6">Assigned Care</h3>
            {patient.DoctorName ? (
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 text-xl font-black border border-blue-100">
                  {patient.DoctorName.charAt(0)}
                </div>
                <div>
                  <p className="text-lg font-black text-slate-900 leading-none">Dr. {patient.doctorName}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Attending Physician</p>
                </div>
              </div>
            ) : (
              <p className="text-amber-600 font-bold text-sm bg-amber-50 p-4 rounded-2xl border border-amber-100">
                ⚠️ No clinician assigned to this patient.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* WIZARD MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col transition-all">

            {/* Modal Header & Progress */}
            <div className="px-10 pt-10 pb-6 border-b border-slate-50">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-900">Patient Intake Wizard</h3>
                <button onClick={() => setShowAssignModal(false)} className="text-slate-300 hover:text-slate-900 transition-colors"><X size={24} /></button>
              </div>

              {/* Progress Indicators */}
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-blue-600' : 'bg-slate-100'}`} />
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="p-10 min-h-[350px]">
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h4 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><User size={20} className="text-blue-600" /> 1. Personal Information</h4>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className={labelClass}>Patient Full Name</label>
                      <input name="name" value={form.name} onChange={handleInputChange} className={inputClass} placeholder="Enter full name" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Contact Phone</label>
                        <input name="phoneNumber" value={form.phoneNumber} onChange={handleInputChange} className={inputClass} placeholder="+1..." />
                      </div>
                      <div>
                        <label className={labelClass}>Gender</label>
                        <select name="gender" value={form.gender} onChange={handleInputChange} className={inputClass}>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h4 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><ClipboardList size={20} className="text-blue-600" /> 2. Ward Logistics</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <label className={labelClass}>Bed Number</label>
                      <input name="bedNumber" value={form.bedNumber} onChange={handleInputChange} className={inputClass} placeholder="e.g. ICU-04" />
                    </div>
                    <div>
                      <label className={labelClass}>Initial Status</label>
                      <select name="status" value={form.status} onChange={handleInputChange} className={inputClass}>
                        <option value="STABLE">STABLE</option>
                        <option value="UNDER_OBSERVATION">OBSERVATION</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Admission Date</label>
                      <input type="date" name="admissionDate" value={form.admissionDate} onChange={handleInputChange} className={inputClass} />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h4 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><Heart size={20} className="text-blue-600" /> 3. Clinical Context</h4>
                  <div className="space-y-6">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-1 text-center">
                        <label className={labelClass}>Blood Type</label>
                        <input name="bloodGroup" value={form.bloodGroup} onChange={handleInputChange} className={inputClass} placeholder="O+" />
                      </div>
                      <div className="col-span-3">
                        <label className={labelClass}>Reason for Admission</label>
                        <input name="admissionReason" value={form.admissionReason} onChange={handleInputChange} className={inputClass} placeholder="Acute respiratory distress, etc." />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Medical History (Optional)</label>
                      <textarea name="medicalHistory" value={form.medicalHistory} onChange={handleInputChange} rows="3" className={`${inputClass} resize-none`} placeholder="Past surgeries, chronic conditions..." />
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h4 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><Stethoscope size={20} className="text-blue-600" /> 4. Assign Primary Doctor</h4>
                  <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2">
                    {doctors?.map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => assignMutation.mutate(doc.id)}
                        disabled={assignMutation.isPending}
                        className="flex items-center justify-between p-5 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-2xl border border-slate-100 transition-all group"
                      >
                        <div className="text-left">
                          <p className="font-black group-hover:text-white leading-none">Dr. {doc.name}</p>
                          <p className="text-[10px] font-black text-slate-400 group-hover:text-blue-100 uppercase tracking-widest mt-1">{doc.specialization}</p>
                        </div>
                        {assignMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <ChevronRight size={18} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-10 py-8 bg-slate-50 flex justify-between">
              {step > 1 && step < 4 ? (
                <button onClick={prevStep} className="flex items-center gap-2 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-900 transition-colors">
                  <ChevronLeft size={18} /> Back
                </button>
              ) : <div></div>}

              {step < 4 && (
                <button
                  onClick={nextStep}
                  disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid) || (step === 3 && !isStep3Valid)}
                  className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 disabled:opacity-20 transition-all flex items-center gap-2 shadow-xl shadow-slate-200"
                >
                  Continue <ChevronRight size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}