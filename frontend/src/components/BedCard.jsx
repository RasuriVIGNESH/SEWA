import { Link } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { VitalMetrics } from './VitalMetrics';
import { cn } from '../lib/utils';
import { Clock, Activity, AlertTriangle, UserPlus, ArrowRight } from 'lucide-react';
import { formatRelativeTime } from '../lib/formatters';

export function BedCard({ patient, vitals, isWaitlist }) {
  const isCritical = patient.status === 'CRITICAL' || vitals?.sepsisLabel === 1;
  const isStale = vitals ? new Date().getTime() - new Date(vitals.timestamp).getTime() > 15000 : false;

  // Visual classes based on clinical state
  const cardStyle = isCritical
    ? "border-red-500 shadow-2xl shadow-red-100 bg-red-50/10 ring-2 ring-red-500/20"
    : isWaitlist
      ? "border-slate-100 bg-white/50 opacity-90 hover:opacity-100 grayscale-[0.3] hover:grayscale-0"
      : "border-slate-100 bg-white hover:border-blue-200 shadow-sm";

  return (
    <Link
      to={`/patients/${patient.id}`}
      className={cn(
        "group flex flex-col rounded-[2rem] border overflow-hidden transition-all duration-300 hover:-translate-y-1",
        cardStyle
      )}
    >
      {/* HEADER: BED & STATUS */}
      <div className={cn(
        "px-6 py-4 flex justify-between items-start border-b transition-colors",
        isCritical ? "border-red-100 bg-red-50/50" : "border-slate-50 bg-slate-50/30"
      )}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-slate-900 text-white text-[11px] font-black px-2.5 py-1 rounded-md tracking-widest shadow-sm">
              BED {patient.bedNumber}
            </span>
            {vitals && !isStale && (
              <span className="flex h-2 w-2">
                <span className={cn("animate-ping absolute h-2 w-2 rounded-full", isCritical ? "bg-red-500" : "bg-blue-500")}></span>
                <span className={cn("relative h-2 w-2 rounded-full", isCritical ? "bg-red-600" : "bg-blue-600")}></span>
              </span>
            )}
          </div>
          <h3 className="font-black text-slate-900 text-base tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
            {patient.name}
          </h3>
        </div>
        <StatusBadge status={patient.status} />
      </div>

      {/* BODY: LIVE VITALS */}
      <div className="px-6 py-6 flex-1">
        {patient.status === 'DISCHARGED' ? (
          <div className="flex flex-col items-center justify-center py-6 text-slate-300 font-bold italic text-sm">
            Records Archived
          </div>
        ) : vitals ? (
          <VitalMetrics vitals={vitals} />
        ) : (
          <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-[1.5rem] border border-dashed border-slate-200">
            <Activity className="text-slate-200 mb-2" size={32} />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Active Stream</span>
          </div>
        )}
      </div>

      {/* FOOTER: CLINICIAN & SYNC */}
      <div className={cn(
        "px-6 py-3 border-t flex items-center justify-between mt-auto transition-colors",
        isCritical ? "bg-red-600 border-red-500" : "bg-white border-slate-50"
      )}>
        <div className="flex items-center gap-2 truncate">
          {isWaitlist ? (
            <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest">
              <UserPlus size={12} /> Awaiting Doc
            </div>
          ) : (
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest truncate",
              isCritical ? "text-white" : "text-slate-400"
            )}>
              Dr. {patient.assignedDoctorName || 'Not Assigned'}
            </span>
          )}
        </div>

        {vitals ? (
          <div className={cn(
            "flex items-center gap-1.5 text-[10px] font-black font-mono",
            isCritical ? "text-red-100" : "text-slate-400"
          )}>
            <Clock size={12} />
            {new Date(vitals.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
          </div>
        ) : (
          <div className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">
            OFFLINE
          </div>
        )}
      </div>

      {/* CRITICAL OVERLAY LABEL */}
      {isCritical && (
        <div className="bg-red-600 py-1 flex items-center justify-center gap-2">
          <AlertTriangle size={12} className="text-white animate-bounce" />
          <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Critical Sepsis Alert</span>
        </div>
      )}
    </Link>
  );
}