import { Link } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { VitalMetrics } from './VitalMetrics';
import { cn } from '../lib/utils';
import { Clock, Activity, AlertTriangle } from 'lucide-react';

export function BedCard({ patient, vitals }) {
  const isCritical = patient.status === 'CRITICAL' || vitals?.sepsisLabel === 1;

  // CHECK STALENESS: Is this cached data or live?
  // If data is older than 30s, it's considered "Cached/Stale" while we wait for WS
  const isStale = vitals ? (Date.now() - new Date(vitals.timestamp).getTime()) > 30000 : false;

  const cardStyle = isCritical
    ? "border-red-500 shadow-2xl shadow-red-100 bg-red-50/10 ring-2 ring-red-500/20"
    : "border-slate-100 bg-white hover:border-blue-200 shadow-sm";

  return (
    <Link
      to={`/mypatient/${patient.id}`}
      className={cn(
        "group flex flex-col rounded-[2rem] border overflow-hidden transition-all duration-300 hover:-translate-y-1",
        cardStyle,
        isStale && !isCritical && "opacity-90"
      )}
    >
      {/* HEADER */}
      <div className={cn(
        "px-6 py-4 flex justify-between items-start border-b",
        isCritical ? "border-red-100 bg-red-50/50" : "border-slate-50 bg-slate-50/30"
      )}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded tracking-widest">
              BED {patient.bedNumber || 'TBA'}
            </span>
            {vitals && !isStale && (
              <span className="flex h-2 w-2 relative">
                <span className={cn("animate-ping absolute h-full w-full rounded-full opacity-75", isCritical ? "bg-red-400" : "bg-blue-400")}></span>
                <span className={cn("relative rounded-full h-2 w-2", isCritical ? "bg-red-600" : "bg-blue-600")}></span>
              </span>
            )}
          </div>
          <h3 className="font-black text-slate-900 text-base tracking-tight leading-tight">
            {patient.name}
          </h3>
        </div>
        <StatusBadge status={patient.status} />
      </div>

      {/* VITALS AREA */}
      <div className="px-6 py-6 flex-1 relative">
        {isStale && vitals && (
          <div className="absolute top-2 right-6 flex items-center gap-1">
            <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
              Last Known (Syncing...)
            </span>
          </div>
        )}

        {vitals ? (
          <VitalMetrics vitals={vitals} />
        ) : (
          <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-[1.5rem] border border-dashed border-slate-200">
            <Activity className="text-slate-200 mb-2" size={32} />
            <span className="text-[10px] font-black text-slate-400 uppercase">Awaiting Feed...</span>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className={cn(
        "px-6 py-3 border-t flex items-center justify-between mt-auto",
        isCritical ? "bg-red-600 border-red-500 text-white" : "bg-white border-slate-50 text-slate-400"
      )}>
        <span className="text-[10px] font-black uppercase tracking-widest truncate">
          {patient.doctorName ? `Dr. ${patient.doctorName}` : 'Unassigned'}
        </span>

        {vitals && (
          <div className="flex items-center gap-1.5 text-[10px] font-black font-mono">
            <Clock size={12} />
            {new Date(vitals.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </div>
        )}
      </div>

      {isCritical && (
        <div className="bg-red-600 py-1 flex items-center justify-center gap-2">
          <AlertTriangle size={12} className="text-white animate-bounce" />
          <span className="text-[9px] font-black text-white uppercase tracking-widest">Sepsis Alert</span>
        </div>
      )}
    </Link>
  );
}