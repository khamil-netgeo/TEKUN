// Module 10 — Circuit Breaker Badge Component

import React from 'react';
import type { CircuitBreakerState } from '../types';

interface Props {
  state: CircuitBreakerState;
  failures?: number;
  threshold?: number;
  size?: 'sm' | 'md';
}

const STATE_CONFIG: Record<CircuitBreakerState, { label: string; bg: string; dot: string; icon: string }> = {
  CLOSED: {
    label: 'CLOSED',
    bg: 'bg-green-100 text-green-800 border-green-200',
    dot: 'bg-green-500',
    icon: '🔒',
  },
  OPEN: {
    label: 'OPEN',
    bg: 'bg-red-100 text-red-800 border-red-200',
    dot: 'bg-red-500 animate-pulse',
    icon: '🔓',
  },
  HALF_OPEN: {
    label: 'HALF-OPEN',
    bg: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    dot: 'bg-yellow-500 animate-pulse',
    icon: '⚡',
  },
};

export const CircuitBreakerBadge: React.FC<Props> = ({
  state,
  failures,
  threshold,
  size = 'sm',
}) => {
  const cfg = STATE_CONFIG[state] ?? STATE_CONFIG.CLOSED;
  const textSize = size === 'md' ? 'text-sm' : 'text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border font-semibold ${textSize} ${cfg.bg}`}
      title={`Circuit Breaker: ${state}${failures !== undefined ? ` (${failures}/${threshold} failures)` : ''}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.icon} {cfg.label}
      {failures !== undefined && threshold !== undefined && (
        <span className="opacity-60 font-normal">
          {failures}/{threshold}
        </span>
      )}
    </span>
  );
};
