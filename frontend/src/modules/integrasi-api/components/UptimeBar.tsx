// Module 10 — Uptime Bar Component

import React from 'react';

interface Props {
  uptime: number; // percentage 0-100
  showLabel?: boolean;
}

const getUptimeColor = (pct: number): string => {
  if (pct >= 99.5) return '#16A34A'; // green
  if (pct >= 95) return '#D97706';   // amber
  return '#DC2626';                   // red
};

export const UptimeBar: React.FC<Props> = ({ uptime, showLabel = true }) => {
  const color = getUptimeColor(uptime);
  const pct = Math.max(0, Math.min(100, uptime));

  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold" style={{ color }}>
          {pct.toFixed(1)}%
        </span>
      )}
    </div>
  );
};
