/**
 * Core Foundation — LoadingSpinner
 * Full-page and inline loading state variants.
 * Used across all 12 modules for async operations.
 */
import React from 'react';

interface LoadingSpinnerProps {
  /** If true, renders a full-page overlay with backdrop */
  fullPage?: boolean;
  /** Spinner diameter */
  size?:     'xs' | 'sm' | 'md' | 'lg';
  /** Label shown below the spinner */
  label?:    string;
  /** Colour variant */
  colour?:   'navy' | 'green' | 'orange' | 'white';
}

const SIZE_MAP = {
  xs: 'w-3 h-3 border-2',
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-[3px]',
  lg: 'w-12 h-12 border-4',
};

const COLOUR_MAP = {
  navy:   '#1B2B5E',
  green:  '#2E7D32',
  orange: '#E65100',
  white:  '#FFFFFF',
};

export default function LoadingSpinner({
  fullPage = false,
  size = 'md',
  label,
  colour = 'navy',
}: LoadingSpinnerProps) {
  const borderColour = COLOUR_MAP[colour];

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${SIZE_MAP[size]} rounded-full animate-spin`}
        style={{
          borderColor: `${borderColour}20`,
          borderTopColor: borderColour,
        }}
        role="status"
        aria-label={label ?? 'Memuatkan'}
      />
      {label && (
        <p
          className={`font-medium ${size === 'xs' || size === 'sm' ? 'text-xs' : 'text-sm'}`}
          style={{ color: colour === 'white' ? '#FFFFFF' : '#6B7280' }}
        >
          {label}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {spinner}
    </div>
  );
}

/**
 * InlineSpinner — tiny spinner for use inside buttons or inline text.
 */
export function InlineSpinner({ colour = 'white' }: { colour?: 'white' | 'navy' }) {
  return (
    <span
      className="inline-block w-4 h-4 border-2 rounded-full animate-spin"
      style={{
        borderColor: `${COLOUR_MAP[colour]}30`,
        borderTopColor: COLOUR_MAP[colour],
      }}
      aria-hidden="true"
    />
  );
}
