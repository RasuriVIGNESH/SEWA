/*
 * SEWA design reminder: evidence should be visible beside action. Charts stay calm,
 * use high-contrast labels, and reserve coral for clinical risk.
 */
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatTime, type Patient } from "@/lib/clinicalData";

type Metric = "heartRate" | "oxygenSaturation" | "respiratoryRate" | "meanArterialPressure" | "lactate";

const metricConfig: Record<Metric, { label: string; unit: string; color: string; domain?: [number, number] }> = {
  heartRate: { label: "Heart rate", unit: "bpm", color: "#0B8F87", domain: [40, 150] },
  oxygenSaturation: { label: "SpO₂", unit: "%", color: "#3975B9", domain: [85, 100] },
  respiratoryRate: { label: "Respiratory rate", unit: "/min", color: "#C98225", domain: [8, 42] },
  meanArterialPressure: { label: "MAP", unit: "mmHg", color: "#865E9F", domain: [45, 125] },
  lactate: { label: "Lactate", unit: "mmol/L", color: "#D85B52", domain: [0, 6] },
};

function tooltipFormatter(value: number, name: string) {
  const config = metricConfig[name as Metric];
  return [`${value} ${config?.unit ?? ""}`, config?.label ?? name];
}

export function ClinicalTrendChart({ patient, metric, compact = false }: { patient: Patient; metric: Metric; compact?: boolean }) {
  const config = metricConfig[metric];
  const data = useMemo(
    () => patient.history.map((reading) => ({ ...reading, timeLabel: formatTime(reading.timestamp) })),
    [patient.history],
  );
  const latest = patient.latest[metric];

  return (
    <div className={compact ? "h-16 w-full" : "h-64 w-full"} aria-label={`${config.label} trend for ${patient.name}`}>
      {!compact && (
        <div className="mb-3 flex items-end justify-between px-1">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{config.label}</p>
            <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">
              {typeof latest === "number" ? latest : "—"}<span className="ml-1 text-xs font-medium text-slate-400">{config.unit}</span>
            </p>
          </div>
          <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500">Last 90 min</span>
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        {compact ? (
          <LineChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 3 }}>
            <Line type="monotone" dataKey={metric} stroke={config.color} strokeWidth={2.4} dot={false} isAnimationActive={false} />
          </LineChart>
        ) : (
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id={`fill-${metric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={config.color} stopOpacity={0.18} />
                <stop offset="100%" stopColor={config.color} stopOpacity={0.015} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#E3EBF2" strokeDasharray="2 6" />
            <XAxis dataKey="timeLabel" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#8B9BAD" }} minTickGap={28} />
            <YAxis domain={config.domain ?? ["auto", "auto"]} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#8B9BAD" }} width={30} />
            <Tooltip
              cursor={{ stroke: "#B7C8D8", strokeDasharray: "3 3" }}
              contentStyle={{ borderRadius: 12, border: "1px solid #DFE8EF", boxShadow: "0 14px 36px rgba(11,31,51,0.12)", fontSize: 12 }}
              formatter={tooltipFormatter as any}
              labelFormatter={(label) => `Recorded ${label}`}
            />
            <Area type="monotone" dataKey={metric} stroke={config.color} strokeWidth={2.25} fill={`url(#fill-${metric})`} dot={false} isAnimationActive={false} />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export type { Metric };
