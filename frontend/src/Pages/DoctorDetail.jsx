import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import {
  ArrowLeft,
  Mail,
  Phone,
  Stethoscope,
  Users,
  Loader2,
  Award,
  ShieldCheck,
  ChevronRight,
  Hash
} from 'lucide-react';
import { formatRelativeTime } from '../lib/formatters';
import { StatusBadge } from '../components/StatusBadge';

export default function DoctorDetail() {
  const { id } = useParams();

  // 1. Fetch Doctor Profile
  const { data: doctor, isLoading: isLoadingDoc } = useQuery({
    queryKey: ['doctor', id],
    queryFn: async () => {
      const res = await api.get(`/doctors/${id}`);
      return res.data;
    }
  });

  // 2. Fetch Doctor's Assigned Patients
  const { data: patients, isLoading: isLoadingPat } = useQuery({
    queryKey: ['doctor', id, 'patients'],
    queryFn: async () => {
      const res = await api.get(`/doctors/${id}/patients`);
      return res.data;
    }
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
    <div className="min-h-screen bg-white p-6 lg:p-10 font-sans max-w-[1600px] mx-auto">

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-100">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <ShieldCheck size={16} strokeWidth={3} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Verified Medical Personnel</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Dr. {doctor.name}</h1>
            <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest mt-1">{doctor.specialization}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">

        {/* LEFT COLUMN: STAFF PROFILE CARD */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden sticky top-10">
            <div className="p-8 flex flex-col items-center border-b border-slate-50 bg-slate-50/30">
              <div className="w-24 h-24 rounded-[2rem] bg-white shadow-inner flex items-center justify-center text-3xl font-black text-blue-600 border border-slate-100 mb-6">
                {doctor.name.charAt(0)}
              </div>
              <h2 className="text-2xl font-black text-slate-900 text-center leading-tight">Dr. {doctor.name}</h2>
              <div className="mt-6 grid grid-cols-2 gap-3 w-full">
                <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center shadow-sm">
                  <p className="text-2xl font-black text-slate-900 leading-none mb-1">
                    {patients?.filter(p => p.status !== 'DISCHARGED').length || 0}
                  </p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center shadow-sm">
                  <p className="text-2xl font-black text-slate-900 leading-none mb-1">{patients?.length || 0}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Credentials & Contact</p>
                <div className="space-y-5">
                  <ProfileInfo icon={<Mail size={16} />} value={doctor.email} label="Institutional Email" />
                  <ProfileInfo icon={<Phone size={16} />} value={doctor.phoneNumber || 'N/A'} label="Direct Extension" />
                  <ProfileInfo icon={<Hash size={16} />} value={`STAFF-${doctor.id}`} label="Internal ID" />
                  <ProfileInfo icon={<Award size={16} />} value={doctor.specialization} label="Primary Discipline" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ASSIGNED PATIENTS TABLE */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs flex items-center gap-2">
                <Stethoscope size={16} className="text-blue-600" /> Currently Under Care
              </h3>
              <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                {patients?.length || 0} Patients Found
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <th className="px-10 py-5">Bed No.</th>
                    <th className="px-10 py-5">Patient Name</th>
                    <th className="px-10 py-5 text-center">Status</th>
                    <th className="px-10 py-5">Last Observation</th>
                    <th className="px-10 py-5 text-right">Records</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoadingPat ? (
                    <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></td></tr>
                  ) : !patients || patients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-24 text-center">
                        <div className="flex flex-col items-center">
                          <Users className="text-slate-100 mb-4" size={64} />
                          <p className="text-slate-900 font-bold text-lg leading-none">Ward is currently empty</p>
                          <p className="text-slate-400 font-medium text-sm mt-2">There are no patients currently assigned to this clinician.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    patients.map(patient => (
                      <tr key={patient.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-10 py-6">
                          <span className="bg-slate-900 text-white text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-widest">
                            {patient.bedNumber}
                          </span>
                        </td>
                        <td className="px-10 py-6">
                          <p className="font-black text-slate-900 text-base">{patient.name}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Ref ID: {patient.fhirPatientId || 'TBA'}</p>
                        </td>
                        <td className="px-10 py-6 text-center">
                          <StatusBadge status={patient.status} />
                        </td>
                        <td className="px-10 py-6 text-xs text-slate-500 font-bold uppercase tracking-tight">
                          <div className="flex items-center gap-2">
                            {patient.admissionDate ? formatRelativeTime(patient.admissionDate) : '--'}
                          </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <Link
                            to={`/patients/${patient.id}`}
                            className="inline-flex items-center gap-1 text-xs font-black text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white"
                          >
                            Access Chart <ChevronRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// UI HELPER: PROFILE INFO ROW
function ProfileInfo({ icon, value, label }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{value}</p>
      </div>
    </div>
  );
}