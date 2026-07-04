/**
 * Core Foundation — Toast
 * Success/error/warning notification system using react-hot-toast.
 * 
 * Usage:
 *   1. Add <ToastContainer /> once in AppLayout.tsx (already done in layout)
 *   2. In any component: import { toast } from '@/components/ui/Toast'
 *      toast.success('Berjaya disimpan!');
 *      toast.error('Ralat berlaku. Cuba lagi.');
 *      toast.warning('Sila semak maklumat anda.');
 *      toast.info('Permohonan sedang diproses.');
 */
import React from 'react';
import { Toaster, toast as hotToast } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ── ToastContainer ────────────────────────────────────────────────────────────
// Place this once in AppLayout.tsx

export function ToastContainer() {
  return (
    <Toaster
      position="top-right"
      gutter={8}
      containerStyle={{ top: 70 }}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'white',
          color: '#1F2937',
          borderRadius: '12px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          padding: '12px 16px',
          fontSize: '14px',
          maxWidth: '380px',
          border: '1px solid #F3F4F6',
        },
      }}
    />
  );
}

// ── Custom toast helpers ──────────────────────────────────────────────────────

function makeIcon(icon: React.ReactNode, colour: string) {
  return (
    <span style={{ color: colour }} className="flex-shrink-0">
      {icon}
    </span>
  );
}

export const toast = {
  success: (message: string, options?: Parameters<typeof hotToast>[1]) =>
    hotToast(message, {
      icon: makeIcon(<CheckCircle size={18} />, '#2E7D32'),
      style: { borderLeft: '4px solid #2E7D32' },
      ...options,
    }),

  error: (message: string, options?: Parameters<typeof hotToast>[1]) =>
    hotToast(message, {
      icon: makeIcon(<XCircle size={18} />, '#C62828'),
      style: { borderLeft: '4px solid #C62828' },
      duration: 6000,
      ...options,
    }),

  warning: (message: string, options?: Parameters<typeof hotToast>[1]) =>
    hotToast(message, {
      icon: makeIcon(<AlertTriangle size={18} />, '#E65100'),
      style: { borderLeft: '4px solid #E65100' },
      ...options,
    }),

  info: (message: string, options?: Parameters<typeof hotToast>[1]) =>
    hotToast(message, {
      icon: makeIcon(<Info size={18} />, '#1B2B5E'),
      style: { borderLeft: '4px solid #1B2B5E' },
      ...options,
    }),

  loading: (message: string) =>
    hotToast.loading(message, {
      style: { borderLeft: '4px solid #7C3AED' },
    }),

  dismiss: hotToast.dismiss,

  promise: hotToast.promise,
};

export default toast;
