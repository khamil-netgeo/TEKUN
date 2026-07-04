/**
 * Core Foundation: AI Shared Components
 *
 * Components for displaying AI-generated content, confidence scores,
 * and AI processing states across all 12 modules.
 *
 * Components exported:
 *   AiBadge        — "AI" label badge for AI-generated content
 *   AiScoreRing    — Circular score indicator (credit score, risk score, etc.)
 *   AiInsightCard  — Card for displaying AI-generated insights/recommendations
 *   AiProcessing   — Loading state for AI operations
 */

import React, { type ReactNode } from 'react';
import { Sparkles, Brain, AlertCircle, CheckCircle, Info, Loader2 } from 'lucide-react';

const AI_PURPLE = '#7C3AED';
const AI_LIGHT  = '#F3E8FF';

// ─────────────────────────────────────────────────────────────────────────────
// AiBadge
// ─────────────────────────────────────────────────────────────────────────────

interface AiBadgeProps {
  label?:   string;
  size?:    'sm' | 'md';
  variant?: 'default' | 'outline';
}

export function AiBadge({ label = 'AI', size = 'md', variant = 'default' }: AiBadgeProps) {
  const sizeClass = size === 'sm' ? 'text-[9px] px-1.5 py-0.5 gap-0.5' : 'text-[10px] px-2 py-0.5 gap-1';
  const iconSize  = size === 'sm' ? 8 : 10;

  if (variant === 'outline') {
    return (
      <span className={`inline-flex items-center font-bold rounded-full border ${sizeClass}`}
        style={{ color: AI_PURPLE, borderColor: AI_PURPLE }}>
        <Sparkles size={iconSize} />
        {label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center font-bold rounded-full ${sizeClass}`}
      style={{ background: AI_LIGHT, color: AI_PURPLE }}>
      <Sparkles size={iconSize} />
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AiScoreRing
// ─────────────────────────────────────────────────────────────────────────────

interface AiScoreRingProps {
  score:     number;    // 0–100
  maxScore?: number;
  label?:    string;
  size?:     number;    // diameter in px
  showLabel?: boolean;
}

export function AiScoreRing({ score, maxScore = 100, label, size = 80, showLabel = true }: AiScoreRingProps) {
  const pct        = Math.min(100, Math.max(0, (score / maxScore) * 100));
  const radius     = (size / 2) - 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (pct / 100) * circumference;

  const colour = pct >= 70 ? '#2E7D32' : pct >= 40 ? '#E65100' : '#C62828';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={6} />
          <circle
            cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={colour} strokeWidth={6}
            strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold text-sm" style={{ color: colour }}>{score}</span>
          {maxScore !== 100 && <span className="text-[9px] text-gray-400">/{maxScore}</span>}
        </div>
      </div>
      {showLabel && label && <p className="text-xs text-gray-500 text-center">{label}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AiInsightCard
// ─────────────────────────────────────────────────────────────────────────────

type InsightType = 'recommendation' | 'warning' | 'info' | 'success';

interface AiInsightCardProps {
  type?:       InsightType;
  title:       string;
  content:     string | ReactNode;
  confidence?: number;   // 0–100
  model?:      string;   // e.g. "Enjin Analitik SPPT"
  timestamp?:  string;
}

export function AiInsightCard({
  type = 'info', title, content, confidence, model, timestamp,
}: AiInsightCardProps) {
  const typeMap: Record<InsightType, { icon: ReactNode; border: string; bg: string; iconColour: string }> = {
    recommendation: {
      icon: <Brain size={16} />,
      border: 'border-purple-200', bg: 'bg-purple-50', iconColour: AI_PURPLE,
    },
    warning: {
      icon: <AlertCircle size={16} />,
      border: 'border-orange-200', bg: 'bg-orange-50', iconColour: '#E65100',
    },
    success: {
      icon: <CheckCircle size={16} />,
      border: 'border-green-200', bg: 'bg-green-50', iconColour: '#2E7D32',
    },
    info: {
      icon: <Info size={16} />,
      border: 'border-blue-200', bg: 'bg-blue-50', iconColour: '#1565C0',
    },
  };
  const t = typeMap[type];

  return (
    <div className={`rounded-xl border p-4 ${t.border} ${t.bg}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0" style={{ color: t.iconColour }}>{t.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-800">{title}</span>
            <AiBadge size="sm" />
          </div>
          <div className="text-sm text-gray-600">{content}</div>
          {(confidence !== undefined || model || timestamp) && (
            <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
              {confidence !== undefined && (
                <span>Keyakinan: <strong>{confidence}%</strong></span>
              )}
              {model && <span>Model: {model}</span>}
              {timestamp && <span>{timestamp}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AiProcessing
// ─────────────────────────────────────────────────────────────────────────────

interface AiProcessingProps {
  label?: string;
  size?:  'sm' | 'md';
}

export function AiProcessing({ label = 'AI sedang memproses...', size = 'md' }: AiProcessingProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: AI_LIGHT }}>
      <Loader2 size={size === 'sm' ? 12 : 16} className="animate-spin" style={{ color: AI_PURPLE }} />
      <span className={`font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'}`} style={{ color: AI_PURPLE }}>
        {label}
      </span>
    </div>
  );
}
