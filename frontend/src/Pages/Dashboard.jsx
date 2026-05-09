import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { BedCard } from '../components/BedCard';
import { useVitalsWS } from '../hooks/useVitalsWS';
import { useAuthStore, useAlertStore } from '../store';

import {
  Loader2,
  Stethoscope,
  Activity,
  Clock,
  Users,
  Search,
  Bell,
  ClipboardList
} from 'lucide-react';

export default function Dashboard() {
  const { doctorId, doctorName } = useAuthStore();
  const unreadCount = useAlertStore(state => state.unreadCount);
  const [search, setSearch] = useState('');

  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients', 'assigned', doctorId],
    queryFn: async () => (await api.get(`/doctors/${doctorId}/patients`)).data,
    refetchInterval: 5000
  });

  // This now returns cached vitals immediately
  const vitalsMap = useVitalsWS(patients || []);

  const filteredPatients = useMemo(() => {
    return patients?.filter(p =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.bedNumber?.toLowerCase().includes(search.toLowerCase())
    ) || [];
  }, [patients, search]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-200">
              <Stethoscope className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">MedSync Clinical</h1>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search ward..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none text-sm font-bold focus:outline-none w-48"
              />
            </div>
            <div className="flex items-center gap-4 border-l border-slate-200 pl-8">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase leading-none">Dr. {doctorName}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                {doctorName?.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <StatCard label="Patients" value={patients?.length || 0} icon={Users} color="text-blue-600" bg="bg-blue-50" />
          <StatCard label="Alerts" value={unreadCount} icon={Bell} color="text-amber-600" bg="bg-amber-50" />
          <StatCard label="Status" value="Live" icon={Activity} color="text-emerald-600" bg="bg-emerald-50" />
          <StatCard label="Time" value={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} icon={Clock} color="text-slate-600" bg="bg-slate-50" />
        </div>

        <main>
          {filteredPatients.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
              {filteredPatients.map((patient) => (
                <BedCard
                  key={patient.id}
                  patient={patient}
                  vitals={vitalsMap[patient.fhirPatientId]}
                />
              ))}
            </div>
          ) : (
            <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
              <ClipboardList className="mx-auto text-slate-200 mb-4" size={48} />
              <h2 className="text-xl font-bold text-slate-400">No Patients in View</h2>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200 flex items-center gap-4 shadow-sm">
      <div className={`${bg} ${color} p-3 rounded-2xl`}><Icon size={20} /></div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-lg font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}