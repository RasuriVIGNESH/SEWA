import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { Search, Users, ChevronRight, Clock, UserCheck, AlertCircle, Loader2 } from 'lucide-react';
import { formatRelativeTime } from '../lib/formatters';

export default function Patients() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');

  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => (await api.get('/patients')).data,
    refetchInterval: 15000 // FIXED: Lowered from 60s to 15s
  });

  const filteredPatients = patients?.filter(p => {
    // FIXED: Using p.doctorId (backend) instead of assignedDoctorId
    if (activeTab === 'UNASSIGNED' && p.doctorId) return false;
    if (activeTab === 'CRITICAL' && p.status !== 'CRITICAL') return false;
    if (activeTab === 'DISCHARGED' && p.status !== 'DISCHARGED') return false;
    if (activeTab === 'ALL' && p.status === 'DISCHARGED') return false;

    return (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.bedNumber?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-white p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <TabButton active={activeTab === 'ALL'} onClick={() => setActiveTab('ALL')}>Active Ward</TabButton>
            <TabButton active={activeTab === 'UNASSIGNED'} onClick={() => setActiveTab('UNASSIGNED')}>Unassigned</TabButton>
            <TabButton active={activeTab === 'CRITICAL'} onClick={() => setActiveTab('CRITICAL')}>Critical</TabButton>
            <TabButton active={activeTab === 'DISCHARGED'} onClick={() => setActiveTab('DISCHARGED')}>Archive</TabButton>
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search patients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold outline-none focus:bg-white focus:border-blue-200 transition-all"
            />
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-5">Bed</th>
                <th className="px-8 py-5">Patient</th>
                <th className="px-8 py-5 text-center">Status</th>
                <th className="px-8 py-5">Doctor</th>
                <th className="px-8 py-5">Admission</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={6} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></td></tr>
              ) : filteredPatients?.length === 0 ? (
                <tr><td colSpan={6} className="py-20 text-center text-slate-400 font-bold">No records found.</td></tr>
              ) : (
                filteredPatients.map(patient => (
                  <tr key={patient.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-8 py-6 font-black text-slate-900">{patient.bedNumber || 'TBA'}</td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{patient.name}</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase">ID: {patient.fhirPatientId || 'LINK_NEEDED'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center"><StatusBadge status={patient.status} /></td>
                    <td className="px-8 py-6 text-sm font-bold text-slate-600">
                      {patient.doctorName ? `Dr. ${patient.doctorName}` : <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-[10px]">UNASSIGNED</span>}
                    </td>
                    <td className="px-8 py-6 text-xs text-slate-500">{formatRelativeTime(patient.admissionDate)}</td>
                    <td className="px-8 py-6 text-right">
                      <Link to={`/patients/${patient.id}`} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase hover:bg-blue-600 hover:text-white transition-all">
                        View
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
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`px-6 py-2 text-[11px] font-black rounded-xl transition-all uppercase ${active ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>
      {children}
    </button>
  );
}