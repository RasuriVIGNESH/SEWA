import { Activity, Wind, Droplets, Thermometer, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';

function usePulse(value) {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (value !== undefined) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 500);
      return () => clearTimeout(timer);
    }
  }, [value]);
  return pulse;
}

export function VitalMetrics({ vitals, className, size = 'sm' }) {
  const hrPulse = usePulse(vitals?.heartRate);
  const isLarge = size === 'lg';

  if (!vitals) return null;

  const primaryMetrics = [
    {
      label: 'HR',
      value: vitals.heartRate,
      unit: 'BPM',
      icon: Activity,
      isWarn: vitals.heartRate > 100 || vitals.heartRate < 50,
      isCrit: vitals.heartRate > 130 || vitals.heartRate < 40
    },
    {
      label: 'MAP',
      value: vitals.meanArterialPressure?.toFixed(0),
      unit: 'mmHg',
      icon: Zap,
      isWarn: vitals.meanArterialPressure < 65,
      isCrit: vitals.meanArterialPressure < 55
    },
    {
      label: 'RR',
      value: vitals.respiratoryRate,
      unit: '/min',
      icon: Wind,
      isWarn: vitals.respiratoryRate > 22,
      isCrit: vitals.respiratoryRate > 30
    }
  ];

  const secondaryMetrics = [
    // FIXED: spo2 instead of spO2 to match backend DTO
    { label: 'SpO₂', value: vitals.spo2, unit: '%', isWarn: vitals.spo2 < 92 },
    { label: 'TEMP', value: vitals.temperature?.toFixed(1), unit: '°C' },
    {
      label: 'BP',
      value: `${vitals.systolicBP?.toFixed(0) || '--'}/${vitals.diastolicBP?.toFixed(0) || '--'}`,
      unit: 'sys/dia'
    }
  ];

  return (
    <div className={cn("space-y-6", className)}>
      <div className={cn("grid grid-cols-3 gap-3", isLarge ? "gap-6" : "gap-3")}>
        {primaryMetrics.map((m, i) => {
          const statusClass = m.isCrit
            ? "bg-red-50 border-red-100 text-red-600"
            : m.isWarn
              ? "bg-amber-50 border-amber-100 text-amber-600"
              : "bg-slate-50 border-slate-100 text-slate-900";

          return (
            <div key={i} className={cn(
              "p-4 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden shadow-sm",
              statusClass
            )}>
              {m.label === 'HR' && hrPulse && (
                <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
              )}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{m.label}</span>
                <m.icon size={14} className={cn("opacity-40", m.isCrit && "animate-bounce")} />
              </div>
              <div className="flex items-baseline gap-1 relative z-10">
                <span className={cn(
                  "font-black tracking-tighter leading-none transition-transform duration-300",
                  isLarge ? "text-5xl" : "text-2xl",
                  m.label === 'HR' && hrPulse && "scale-110"
                )}>
                  {m.value || '--'}
                </span>
                <span className="text-[9px] font-black uppercase opacity-40">{m.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className={cn(
        "grid grid-cols-3 pt-6 border-t border-slate-100",
        isLarge ? "gap-8" : "gap-4"
      )}>
        {secondaryMetrics.map((m, i) => (
          <div key={i} className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</span>
            <div className="flex items-baseline gap-1">
              <span className={cn(
                "font-black text-slate-900",
                isLarge ? "text-2xl" : "text-sm",
                m.isWarn && "text-amber-600"
              )}>
                {m.value || '--'}
              </span>
              <span className="text-[9px] font-black text-slate-400 uppercase">{m.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}