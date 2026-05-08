import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import {
  Search,
  Plus,
  Users,
  ChevronRight,
  Clock,
  UserCheck,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { formatRelativeTime } from '../lib/formatters';

export default function Patients() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');

  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const response = await api.get('/patients');
      return response.data;
    },
    refetchInterval: 60000
  });

  const filteredPatients = patients?.filter(p => {
    // Tab filter logic
    if (activeTab === 'UNASSIGNED' && p.assignedDoctorId) return false;
    if (activeTab === 'CRITICAL' && p.status !== 'CRITICAL') return false;
    if (activeTab === 'DISCHARGED' && p.status !== 'DISCHARGED') return false;
    if (activeTab === 'ALL' && p.status === 'DISCHARGED') return false;

    // Search filter
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.bedNumber?.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto">


        {/* CONTROLS AREA: TABS & SEARCH */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 self-start">
            <TabButton active={activeTab === 'ALL'} onClick={() => setActiveTab('ALL')}>Active Ward</TabButton>
            <TabButton active={activeTab === 'UNASSIGNED'} onClick={() => setActiveTab('UNASSIGNED')}>Unassigned</TabButton>
            <TabButton active={activeTab === 'CRITICAL'} onClick={() => setActiveTab('CRITICAL')}>Critical</TabButton>
            <TabButton active={activeTab === 'DISCHARGED'} onClick={() => setActiveTab('DISCHARGED')}>Archive</TabButton>
          </div>

          <div className="relative w-full lg:w-80 group">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input
              type="text"
              placeholder="Search by name or bed..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-200 transition-all text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* TABLE SECTION */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-8 py-5">Bed</th>
                  <th className="px-8 py-5">Patient Details</th>
                  <th className="px-8 py-5 text-center">Status</th>
                  <th className="px-8 py-5">Assigned Doctor</th>
                  <th className="px-8 py-5">Admission</th>
                  <th className="px-8 py-5 text-right">Records</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin text-blue-600" />
                        <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Retrieving Records...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPatients?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <AlertCircle className="mx-auto text-slate-200 mb-2" size={32} />
                      <span className="text-slate-400 font-bold">No clinical records match your query.</span>
                    </td>
                  </tr>
                ) : (
                  filteredPatients?.map(patient => (
                    <tr key={patient.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className="inline-block bg-slate-900 text-white text-[11px] font-black px-3 py-1 rounded-md shadow-sm">
                          {patient.bedNumber || 'TBA'}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-base">{patient.name}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {patient.fhirPatientId || 'NOT_LINKED'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-center">
                        <StatusBadge status={patient.status} />
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        {patient.doctorName ? (
                          <div className="flex items-center gap-2 text-slate-600 font-semibold text-sm">
                            <UserCheck size={14} className="text-blue-500" />
                            Dr. {patient.doctorName}
                          </div>
                        ) : (
                          <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded uppercase">Unassigned</span>
                        )}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm text-slate-500 font-medium">
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          {patient.admissionDate ? formatRelativeTime(patient.admissionDate) : '--'}
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-right">
                        <Link
                          to={`/patients/${patient.id}`}
                          className="inline-flex items-center gap-1 text-xs font-black text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all"
                        >
                          View File <ChevronRight size={14} />
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
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2 text-[11px] font-black rounded-xl transition-all tracking-[0.1em] uppercase ${active
        ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
        : 'text-slate-400 hover:text-slate-600'
        }`}
    >
      {children}
    </button>
  );
}