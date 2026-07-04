// Module 10 — Latency Gauge Component

import React from 'react';

interface Props {
  latencyMs: number | null;
  showLabel?: boolean;
}

const getLatencyColor = (ms: number | null): string => {
  if (ms === null) return 'text-gray-400';
  if (ms < 500) return 'text-green-600';
  if (ms < 1000) return 'text-yellow-600';
  return 'text-red-600';
};

const getLatencyBg = (ms: number | null): string => {
  if (ms === null) return 'bg-gray-100';
  if (ms < 500) return 'bg-green-50';
  if (ms < 1000) return 'bg-yellow-50';
  return 'bg-red-50';
};

const getLatencyLabel = (ms: number | null): string => {
  if (ms === null) return 'N/A';
  if (ms < 500) return 'Baik';
  if (ms < 1000) return 'Sederhana';
  return 'Perlahan';
};

export const LatencyGauge: React.FC<Props> = ({ latencyMs, showLabel = false }) => {
  const color = getLatencyColor(latencyMs);
  const bg = getLatencyBg(latencyMs);

  return (
    <div className={`text-right rounded px-2 py-0.5 ${bg}`}>
      <div className={`font-bold text-sm ${color}`}>
        {latencyMs !== null ? `${latencyMs}ms` : 'N/A'}
      </div>
      {showLabel && (
        <div className={`text-xs ${color} opacity-80`}>{getLatencyLabel(latencyMs)}</div>
      )}
    </div>
  );
};
