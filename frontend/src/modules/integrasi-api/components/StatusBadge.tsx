// Module 10 — API Status Badge Component

import React from 'react';
import type { ApiStatus } from '../types';

interface Props {
  status: ApiStatus;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_CONFIG: Record<ApiStatus, { label: string; cls: string; dot: string }> = {
  OK: {
    label: 'OK',
    cls: 'bg-green-100 text-green-800 border-green-300',
    dot: 'bg-green-500',
  },
  DEGRADED: {
    label: 'DEGRADED',
    cls: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    dot: 'bg-yellow-500 animate-pulse',
  },
  DOWN: {
    label: 'DOWN',
    cls: 'bg-red-100 text-red-800 border-red-300',
    dot: 'bg-red-500 animate-pulse',
  },
  UNKNOWN: {
    label: 'UNKNOWN',
    cls: 'bg-gray-100 text-gray-600 border-gray-300',
    dot: 'bg-gray-400',
  },
};

export const StatusBadge: React.FC<Props> = ({ status, size = 'sm' }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.UNKNOWN;
  const textSize = size === 'lg' ? 'text-sm' : size === 'md' ? 'text-xs' : 'text-xs';
  const px = size === 'lg' ? 'px-3 py-1' : 'px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold ${textSize} ${px} ${cfg.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};
