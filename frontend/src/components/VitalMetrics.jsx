import React from 'react';
import { Activity, Wind, Zap, Thermometer, Droplets, TestTube, Clipboard, Activity as Pulse } from 'lucide-react';
import { cn } from '../lib/utils';

export function VitalMetrics({ vitals }) {
  if (!vitals) return null;

  // Mapping keys safely to handle both short (hr, rr) and long (heartRate) keys from backend
  const metrics = [
    {
      label: 'Heart Rate',
      value: vitals.hr || vitals.heartRate,
      unit: 'bpm',
      icon: Pulse,
      color: 'text-slate-400'
    },
    {
      label: 'Resp. Rate',
      value: vitals.rr || vitals.respiratoryRate,
      unit: '/min',
      icon: Wind,
      color: 'text-slate-400'
    },
    {
      label: 'MAP',
      value: vitals.map || vitals.meanArterialPressure,
      unit: 'mmHg',
      icon: Zap,
      color: 'text-slate-400'
    },
    {
      label: 'SpO₂',
      value: vitals.spo2,
      unit: '%',
      icon: Activity,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100'
    },
    {
      label: 'Temp',
      value: vitals.temp || vitals.temperature,
      unit: '°C',
      icon: Thermometer,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100'
    },
    {
      label: 'Lactate',
      value: vitals.lactate,
      unit: 'mmol/L',
      icon: Droplets,
      color: 'text-slate-400'
    },
    {
      label: 'WBC',
      value: vitals.wbc,
      unit: '×10³/µL',
      icon: TestTube,
      color: 'text-slate-400'
    },
    {
      label: 'Creatinine',
      value: vitals.creatinine,
      unit: 'mg/dL',
      icon: Clipboard,
      color: 'text-slate-400'
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((m, i) => (
        <div
          key={i}
          className={cn(
            "p-4 rounded-xl border flex items-center gap-4 transition-all",
            m.bg ? m.bg : "bg-white",
            m.border ? m.border : "border-slate-100"
          )}
        >
          <div className={cn("p-2 rounded-lg bg-white shadow-sm border border-slate-50", m.color)}>
            <m.icon size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-none mb-1">{m.label}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-slate-900 leading-none">
                {/* Formats numbers to 1 decimal place if they exist, otherwise shows -- */}
                {m.value !== undefined && m.value !== null ? Number(m.value).toFixed(m.label === 'MAP' || m.label === 'Heart Rate' ? 0 : 1) : '--'}
              </span>
              <span className="text-[10px] font-bold text-slate-400">{m.unit}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}