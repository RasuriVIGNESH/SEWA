import React, { useMemo } from 'react';
import { cn } from '../lib/utils';

/**
 * VitalSparkline Component
 * Renders a mini line graph for a single vital metric
 * Shows trend over time with color-coded status
 */
export function VitalSparkline({
  data = [],
  label,
  unit,
  currentValue,
  minValue = 0,
  maxValue = 100,
  normalMin,
  normalMax,
  warningMin,
  warningMax,
  criticalMin,
  criticalMax,
  color = 'blue',
  height = 40,
  width = 120
}) {
  // Determine status based on current value
  const getStatus = () => {
    if (criticalMin !== undefined && currentValue < criticalMin) return 'critical';
    if (criticalMax !== undefined && currentValue > criticalMax) return 'critical';
    if (warningMin !== undefined && currentValue < warningMin) return 'warning';
    if (warningMax !== undefined && currentValue > warningMax) return 'warning';
    return 'stable';
  };

  const status = getStatus();

  // Generate SVG path from data points
  const svgPath = useMemo(() => {
    if (!data || data.length < 2) return '';

    const padding = 2;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    const validData = data.filter(v => v !== null && v !== undefined);
    if (validData.length < 2) return '';

    const minVal = Math.min(...validData);
    const maxVal = Math.max(...validData);
    const range = maxVal - minVal || 1;

    const points = validData.map((value, i) => {
      const x = padding + (i / (validData.length - 1)) * graphWidth;
      const y = padding + graphHeight - ((value - minVal) / range) * graphHeight;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  }, [data, width, height]);

  const statusColors = {
    stable: 'text-emerald-600',
    warning: 'text-amber-600',
    critical: 'text-red-600'
  };

  const statusBg = {
    stable: 'bg-emerald-50',
    warning: 'bg-amber-50',
    critical: 'bg-red-50'
  };

  const strokeColors = {
    stable: '#059669',
    warning: '#D97706',
    critical: '#DC2626'
  };

  return (
    <div className={cn(
      'flex flex-col gap-2 p-3 rounded-xl border',
      statusBg[status],
      status === 'stable' && 'border-emerald-100',
      status === 'warning' && 'border-amber-100',
      status === 'critical' && 'border-red-100'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className={cn('text-[10px] font-black uppercase tracking-widest', statusColors[status])}>
          {label}
        </span>
        <span className={cn('text-xs font-black', statusColors[status])}>
          {currentValue !== undefined ? `${currentValue}${unit}` : '--'}
        </span>
      </div>

      {/* Sparkline Graph */}
      {data.length > 1 ? (
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
        >
          {/* Grid background */}
          <rect
            width={width}
            height={height}
            fill="transparent"
          />

          {/* Trend line */}
          <path
            d={svgPath}
            stroke={strokeColors[status]}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="sparkline-animated"
          />

          {/* Fill under curve for visual effect */}
          <path
            d={`${svgPath} L ${width - 2},${height - 2} L 2,${height - 2} Z`}
            fill={strokeColors[status]}
            opacity="0.1"
          />
        </svg>
      ) : (
        <div className="w-full h-10 flex items-center justify-center text-[10px] text-slate-400">
          Awaiting data...
        </div>
      )}
    </div>
  );
}
