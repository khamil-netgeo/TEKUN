/**
 * Core Foundation — StatCard
 * Metric card with icon, value, label, and trend indicator.
 * Used across all 12 modules for KPI display.
 */
import React, { type ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title:       string;
  value:       string | number;
  subtitle?:   string;
  trend?:      number;        // percentage change; positive = up, negative = down
  trendLabel?: string;
  icon?:       ReactNode;
  colour?:     'navy' | 'green' | 'orange' | 'purple';
  loading?:    boolean;
  onClick?:    () => void;
}

const COLOUR_MAP = {
  navy:   { bg: '#1B2B5E', light: '#EEF1FA' },
  green:  { bg: '#2E7D32', light: '#E8F5E9' },
  orange: { bg: '#E65100', light: '#FFF3E0' },
  purple: { bg: '#7C3AED', light: '#F3E8FF' },
};

export default function StatCard({
  title, value, subtitle, trend, trendLabel,
  icon, colour = 'navy', loading = false, onClick,
}: StatCardProps) {
  const c = COLOUR_MAP[colour];

  const TrendIcon =
    trend === undefined ? null
    : trend > 0 ? TrendingUp
    : trend < 0 ? TrendingDown
    : Minus;

  const trendColour =
    trend === undefined ? ''
    : trend > 0 ? '#2E7D32'
    : trend < 0 ? '#C62828'
    : '#757575';

  return (
    <div
      className={`bg-white rounded-xl p-5 shadow-sm border border-gray-100 transition-shadow ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
      onClick={onClick}
    >
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-200 rounded w-3/4" />
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
              {title}
            </p>
            <p className="text-2xl font-bold mt-1 truncate" style={{ color: c.bg }}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>
            )}
            {trend !== undefined && TrendIcon && (
              <div className="flex items-center gap-1 mt-2">
                <TrendIcon size={13} style={{ color: trendColour }} />
                <span className="text-xs font-medium" style={{ color: trendColour }}>
                  {Math.abs(trend)}%{trendLabel ? ` ${trendLabel}` : ''}
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: c.light }}
            >
              <span style={{ color: c.bg }}>{icon}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
