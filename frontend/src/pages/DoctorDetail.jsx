import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { doctorService } from '../services/doctorService';
import {
  ArrowLeft,
  Mail,
  Phone,
  Stethoscope,
  Users,
  Loader2,
  ShieldCheck,
  ChevronRight,
  Hash,
  MapPin,
  Briefcase
} from 'lucide-react';
import { formatRelativeTime } from '../lib/formatters';
import { StatusBadge } from '../components/StatusBadge';

export default function DoctorDetail() {
  const { id } = useParams();

  // 1. Fetch Doctor Profile
  const { data: doctor, isLoading: isLoadingDoc } = useQuery({
    queryKey: ['doctor', id],
    queryFn: () => doctorService.getDoctorById(id)
  });

  // 2. Fetch Doctor's Assigned Patients
  const { data: patients, isLoading: isLoadingPat } = useQuery({
    queryKey: ['doctor', id, 'patients'],
    queryFn: () => doctorService.getDoctorPatients(id)
  });

  if (isLoadingDoc) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="p-10 text-center">
        <p className="text-red-600 font-bold">Error: Clinician profile not found in directory.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Simple Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/dashboard" className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-blue-600 border border-transparent hover:border-slate-100">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Staff Profile</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Essential Details Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-2xl bg-blue-600 flex items-center justify-center text-3xl font-black text-white mb-6 shadow-lg shadow-blue-100">
                  {doctor.name.charAt(0)}
                </div>
                <h2 className="text-2xl font-black text-slate-900 leading-tight">Dr. {doctor.name}</h2>
                <p className="text-blue-600 font-bold text-xs uppercase tracking-widest mt-2 px-3 py-1 bg-blue-50 rounded-full">
                  {doctor.specialization}
                </p>
              </div>

              <div className="mt-10 space-y-5">
                <InfoRow icon={<Mail size={16} />} label="Email" value={doctor.email} />
                <InfoRow icon={<Phone size={16} />} label="Phone" value={doctor.phoneNumber || 'Not provided'} />
                <InfoRow icon={<Hash size={16} />} label="Staff ID" value={`SEWA-${doctor.id}`} />
                <InfoRow icon={<Briefcase size={16} />} label="Department" value="Intensive Care Unit" />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
                <p className="text-2xl font-black text-slate-900">{patients?.filter(p => p.status !== 'DISCHARGED').length || 0}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Active Cases</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
                <p className="text-2xl font-black text-slate-900">{patients?.length || 0}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total History</p>
              </div>
            </div>
          </div>

          {/* Patient List Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs flex items-center gap-2">
                  <Users size={16} className="text-blue-600" /> Assigned Patients
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[600px]">
                {isLoadingPat ? (
                  <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>
                ) : !patients || patients.length === 0 ? (
                  <div className="p-20 text-center">
                    <p className="text-slate-400 font-bold">No patients currently assigned.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {patients.map(patient => (
                      <Link 
                        key={patient.id} 
                        to={`/patients/${patient.id}`}
                        className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                            {patient.bedNumber}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{patient.name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">ID: {patient.fhirPatientId || 'TBA'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <StatusBadge status={patient.status} />
                          <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-0.5 text-slate-400">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-900 truncate">{value}</p>
      </div>
    </div>
  );
}
