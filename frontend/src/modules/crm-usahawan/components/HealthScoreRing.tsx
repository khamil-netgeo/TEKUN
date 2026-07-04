/**
 * Module 7 — CRM & Pemantauan Usahawan
 * HealthScoreRing — SVG ring chart showing AI health score 0–100
 */
import React from 'react';

interface Props {
  score: number;
  size?: number;
  distressLevel?: string;
}

const SCORE_COLORS: Record<string, string> = {
  Sihat:    '#2E7D32',
  Sederhana:'#F59E0B',
  Lemah:    '#E65100',
  Kritikal: '#DC2626',
};

function getHealthBadge(score: number): string {
  if (score >= 70) return 'Sihat';
  if (score >= 50) return 'Sederhana';
  if (score >= 30) return 'Lemah';
  return 'Kritikal';
}

export default function HealthScoreRing({ score, size = 100, distressLevel }: Props) {
  const badge   = distressLevel ?? getHealthBadge(score);
  const color   = SCORE_COLORS[badge] ?? '#9CA3AF';
  const radius  = (size - 12) / 2;
  const cx      = size / 2;
  const cy      = size / 2;
  const circum  = 2 * Math.PI * radius;
  const offset  = circum - (score / 100) * circum;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={10}
        />
        {/* Progress */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeDasharray={circum}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      {/* Score label overlaid */}
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{ width: size, height: size, marginTop: -(size) }}
      >
        <span className="text-2xl font-extrabold" style={{ color }}>{score}</span>
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">/ 100</span>
      </div>
      <span
        className="text-xs font-bold px-2 py-0.5 rounded-full"
        style={{ background: color + '20', color }}
      >
        {badge}
      </span>
    </div>
  );
}
