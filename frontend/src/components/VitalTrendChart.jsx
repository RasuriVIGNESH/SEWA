import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';

/**
 * Vital Trend Chart Component
 * Displays 2D line charts for individual vital metrics
 * Integrated with professional light theme
 */
const vitalConfigs = {
    heart_rate: {
        label: 'Heart Rate',
        unit: 'bpm',
        color: '#DC2626',
        thresholds: { low: 60, high: 100 },
        domain: [40, 160],
        dataKey: 'heart_rate'
    },
    heartRate: {
        label: 'Heart Rate',
        unit: 'bpm',
        color: '#DC2626',
        thresholds: { low: 60, high: 100 },
        domain: [40, 160],
        dataKey: 'heartRate'
    },
    map: {
        label: 'Mean Arterial Pressure',
        unit: 'mmHg',
        color: '#6366F1',
        thresholds: { low: 65, high: 100 },
        domain: [40, 120],
        dataKey: 'map'
    },
    meanArterialPressure: {
        label: 'Mean Arterial Pressure',
        unit: 'mmHg',
        color: '#6366F1',
        thresholds: { low: 65, high: 100 },
        domain: [40, 120],
        dataKey: 'meanArterialPressure'
    },
    lactate: {
        label: 'Lactate',
        unit: 'mmol/L',
        color: '#F59E0B',
        thresholds: { high: 2 },
        domain: [0, 6],
        dataKey: 'lactate'
    },
    respiratory_rate: {
        label: 'Respiratory Rate',
        unit: '/min',
        color: '#10B981',
        thresholds: { high: 22 },
        domain: [8, 40],
        dataKey: 'respiratory_rate'
    },
    respiratoryRate: {
        label: 'Respiratory Rate',
        unit: '/min',
        color: '#10B981',
        thresholds: { high: 22 },
        domain: [8, 40],
        dataKey: 'respiratoryRate'
    },
    spo2: {
        label: 'Oxygen Saturation',
        unit: '%',
        color: '#3B82F6',
        thresholds: { low: 94 },
        domain: [85, 100],
        dataKey: 'spo2'
    },
    temperature: {
        label: 'Temperature',
        unit: '°C',
        color: '#8B5CF6',
        thresholds: { high: 38.3, low: 36 },
        domain: [35, 41],
        dataKey: 'temperature'
    }
};

export default function VitalTrendChart({ readings, vitalKey, height = 280 }) {
    const config = vitalConfigs[vitalKey];

    if (!config || !readings || readings.length === 0) {
        return (
            <div className="flex items-center justify-center h-40 bg-slate-50 rounded-xl text-slate-400 text-sm border border-slate-200">
                No data available
            </div>
        );
    }

    // Transform readings to chart format
    const chartData = readings
        .map(r => {
            const timestamp = typeof r.timestamp === 'string' ? new Date(r.timestamp) : r.timestamp;
            const value = r[config.dataKey];

            return {
                time: format(timestamp, 'HH:mm'),
                value: value,
                timestamp: r.timestamp,
                fullTime: format(timestamp, 'HH:mm:ss')
            };
        })
        .filter(d => d.value != null);

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-40 bg-slate-50 rounded-xl text-slate-400 text-sm border border-slate-200">
                No {config.label} data
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-slate-200">
                    <p className="text-xs text-slate-500 font-semibold">{label}</p>
                    <p className="text-sm font-black" style={{ color: config.color }}>
                        {payload[0].value} {config.unit}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{config.label}</h3>
                <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-lg">{config.unit}</span>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={height}>
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    {/* Grid */}
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#E5E7EB"
                        vertical={false}
                    />

                    {/* Axes */}
                    <XAxis
                        dataKey="time"
                        tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 500 }}
                        tickLine={false}
                        axisLine={{ stroke: '#E5E7EB' }}
                        height={30}
                    />
                    <YAxis
                        domain={config.domain}
                        tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 500 }}
                        tickLine={false}
                        axisLine={{ stroke: '#E5E7EB' }}
                        width={40}
                    />

                    {/* Tooltip */}
                    <Tooltip content={<CustomTooltip />} />

                    {/* Threshold Reference Lines */}
                    {config.thresholds.low && (
                        <ReferenceLine
                            y={config.thresholds.low}
                            stroke="#EF4444"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            label={{
                                value: `Low: ${config.thresholds.low}`,
                                position: 'right',
                                fill: '#EF4444',
                                fontSize: 10,
                                fontWeight: 'bold'
                            }}
                        />
                    )}
                    {config.thresholds.high && (
                        <ReferenceLine
                            y={config.thresholds.high}
                            stroke="#EF4444"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            label={{
                                value: `High: ${config.thresholds.high}`,
                                position: 'right',
                                fill: '#EF4444',
                                fontSize: 10,
                                fontWeight: 'bold'
                            }}
                        />
                    )}

                    {/* Trend Line */}
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke={config.color}
                        strokeWidth={2.5}
                        dot={{ fill: config.color, r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: config.color, strokeWidth: 0 }}
                        isAnimationActive={true}
                        animationDuration={300}
                    />
                </LineChart>
            </ResponsiveContainer>

            {/* Footer Info */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">
                    {chartData.length} readings
                </span>
                <span className="text-slate-400">
                    Latest: {chartData[chartData.length - 1]?.fullTime}
                </span>
            </div>
        </div>
    );
}