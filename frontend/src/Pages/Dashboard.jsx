import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { BedCard } from '../components/BedCard';
import { useVitalsWS } from '../hooks/useVitalsWS';
import { useAuthStore } from '../store';
import { useMemo } from 'react'

import {
  Loader2,
  Stethoscope,
  ClipboardList,
  Activity,
  Clock,
  Users,
  Search,
  Bell
} from 'lucide-react';

export default function Dashboard() {
  const { doctorId, doctorName } = useAuthStore();
  const navigate = useNavigate(); // Initialize navigation

  // Fetch Patients
  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients', 'assigned', doctorId],
    queryFn: async () => {
      const response = await api.get(`/doctors/${doctorId}/patients`);
      return response.data;
    },
    refetchInterval: 5000
  });

  // WITH
  const fhirIds = useMemo(() => patients?.map(p => p.fhirPatientId).filter(Boolean) || [], [patients]);
  const vitalsMap = useVitalsWS(fhirIds);

  // Navigation Handler
  const handleCardClick = (patientId) => {
    navigate(`/mypatient/${patientId}`); // Navigates to the details page
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <Activity className="w-5 h-5 text-blue-400 absolute inset-0 m-auto" />
          </div>
          <p className="text-slate-400 text-xs uppercase tracking-[0.2em] font-bold">Synchronizing Clinical Feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* 1. Global Clinical Header */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-200">
              <Stethoscope className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-800 leading-none">MedSync Clinical</h1>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Hospital Ward Monitor</p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <Search size={16} className="text-slate-400" />
              <input type="text" placeholder="Search patients..." className="bg-transparent border-none text-sm focus:outline-none w-48" />
            </div>
            <div className="flex items-center gap-4 border-l border-slate-200 pl-8">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-400 uppercase leading-none">Attending Physician</p>
                <p className="text-sm font-black text-slate-900">Dr. {doctorName}</p>
              </div>
              <div className="w-11 h-11 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl border-2 border-white shadow-md flex items-center justify-center text-white font-bold text-lg">
                {doctorName?.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto p-8">

        {/* 2. Clinical Stats Ribbon */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total Patients', value: patients?.length || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'System Status', value: 'Active', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Alerts', value: '0', icon: Bell, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Local Time', value: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), icon: Clock, color: 'text-slate-600', bg: 'bg-slate-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-[1.5rem] border border-slate-200 flex items-center gap-4 shadow-sm">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">{stat.label}</p>
                <p className="text-lg font-black text-slate-900 leading-none">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 3. Main Content Area */}
        <main>
          {patients && patients.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  className="group cursor-pointer transform transition-all duration-300 hover:-translate-y-2 active:scale-[0.98]"
                  onClick={() => handleCardClick(patient.id)} // Navigate on Click
                >
                  <BedCard
                    patient={patient}
                    vitals={vitalsMap[patient.fhirPatientId]}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 bg-white border border-dashed border-slate-300 rounded-[3rem]">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100 shadow-inner text-slate-300">
                <ClipboardList size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">No Patient Assignments</h2>
              <p className="text-slate-500 mt-2 max-w-xs text-center text-sm leading-relaxed">
                There are currently no patients assigned to your care. Use the patient directory to manage admissions.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}