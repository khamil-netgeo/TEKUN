/**
 * Core Foundation — AiBadge
 * Badge showing "Dikuasakan oleh AI" with purple gradient.
 * Used to label AI-generated content across all 12 modules.
 */
import React from 'react';
import { Sparkles } from 'lucide-react';

interface AiBadgeProps {
  label?:   string;
  size?:    'xs' | 'sm' | 'md';
  variant?: 'filled' | 'outline' | 'gradient';
}

export default function AiBadge({
  label = 'Dikuasakan oleh AI',
  size = 'sm',
  variant = 'filled',
}: AiBadgeProps) {
  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.5 gap-0.5',
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1',
  };
  const iconSizes = { xs: 8, sm: 10, md: 12 };

  const baseClass = `inline-flex items-center font-semibold rounded-full ${sizeClasses[size]}`;

  if (variant === 'gradient') {
    return (
      <span
        className={baseClass}
        style={{
          background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
          color: 'white',
        }}
      >
        <Sparkles size={iconSizes[size]} />
        {label}
      </span>
    );
  }

  if (variant === 'outline') {
    return (
      <span
        className={`${baseClass} border`}
        style={{ color: '#7C3AED', borderColor: '#7C3AED', background: 'transparent' }}
      >
        <Sparkles size={iconSizes[size]} />
        {label}
      </span>
    );
  }

  // Default: filled
  return (
    <span
      className={baseClass}
      style={{ background: '#F3E8FF', color: '#7C3AED' }}
    >
      <Sparkles size={iconSizes[size]} />
      {label}
    </span>
  );
}
