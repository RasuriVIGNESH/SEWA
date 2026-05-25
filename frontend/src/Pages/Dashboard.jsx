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

  const vitalsMap = useVitalsWS(patients || []);

  const filteredPatients = useMemo(() => {
    return patients?.filter(p =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.bedNumber?.toLowerCase().includes(search.toLowerCase())
    ) || [];
  }, [patients, search]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Loading Ward...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Sticky Navigation Bar */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-8 py-4 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
          </div>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto p-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <StatCard
            label="Assigned Patients"
            value={patients?.length || 0}
            icon={Users}
            color="text-blue-600"
            bg="bg-blue-50"
          />
          <StatCard
            label="Active Alerts"
            value={unreadCount}
            icon={Bell}
            color="text-amber-600"
            bg="bg-amber-50"
            highlight={unreadCount > 0}
          />
          <StatCard
            label="System Status"
            value="Live"
            icon={Activity}
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
          <StatCard
            label="Current Time"
            value={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            icon={Clock}
            color="text-slate-600"
            bg="bg-slate-50"
          />
        </div>

        {/* Mobile Search Bar (visible on small screens) */}
        <div className="lg:hidden mb-6 flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none text-sm font-bold focus:outline-none w-full text-slate-900 placeholder-slate-400"
          />
        </div>

        {/* Patient Cards Grid */}
        <main>
          {filteredPatients.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-1 gap-6">
              {filteredPatients.map((patient) => (
                <BedCard
                  key={patient.id}
                  patient={patient}
                  vitals={vitalsMap[patient.fhirPatientId]}
                />
              ))}
            </div>
          ) : (
            <div className="py-32 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <ClipboardList className="mx-auto text-slate-300 mb-4" size={48} />
              <h2 className="text-lg font-bold text-slate-500">No Patients Found</h2>
              <p className="text-sm text-slate-400 mt-2">Try adjusting your search or check back later</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, highlight = false }) {
  return (
    <div className={`bg-white p-5 rounded-xl border transition-all ${highlight
      ? 'border-amber-200 shadow-md shadow-amber-100/50'
      : 'border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
      }`}>
      <div className="flex items-center gap-4">
        <div className={`${bg} ${color} p-3 rounded-lg`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="text-lg font-black text-slate-900 mt-1">{value}</p>
        </div>
      </div>
    </div>
  );
}
