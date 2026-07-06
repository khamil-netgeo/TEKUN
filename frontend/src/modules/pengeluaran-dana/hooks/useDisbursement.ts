/**
 * Module 3 — Pengeluaran Dana API Hooks
 * Custom React hooks for all disbursement API calls.
 */
import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Disbursement {
  id: number;
  ref_no: string;
  application_id: number;
  applicant_name: string;
  scheme: string;
  amount: number;
  bank_name: string;
  bank_account_no: string;
  bank_account_name: string;
  bank_verified: boolean;
  status: string;
  status_label: string;
  approval_level: string;
  authority_level: string;
  authority_label: string;
  esign_status: string;
  esign_label: string;
  ai_anomaly_flag: boolean;
  ai_anomaly_reason: string | null;
  ai_anomaly_score: number | null;
  aging_days: number;
  sla_status: string;
  sla_color: string;
  sla_label: string;
  is_escalated: boolean;
  twofa_confirmed: boolean;
  notify_sent: boolean;
  approved_at: string | null;
  disbursed_at: string | null;
  created_at: string | null;
}

export interface DisbursementMeta {
  total: number;
  ready: number;
  pending_esign: number;
  processed_today: number;
  total_amount: number;
  anomaly_count: number;
  sla_breach: number;
  current_page: number;
  last_page: number;
  per_page: number;
  total_records: number;
}

export interface AuthorityLevel {
  level: string;
  label: string;
  level_code: string;
  min: number;
  max: number;
  description: string;
  applicable: boolean;
}

export interface AgingRecord {
  id: number;
  ref_no: string;
  name: string;
  amount: number;
  officer: string;
  elapsed_days: number;
  elapsed_hours: number;
  sla_category: string;
  sla_status: string;
  sla_color: string;
  sla_action: string;
  is_escalated: boolean;
  escalated_at: string | null;
  status: string;
  created_at: string | null;
}

export interface EsignRecord {
  id: number;
  ref_no: string;
  name: string;
  amount: number;
  sent_at: string | null;
  deadline: string | null;
  esign_status: string;
  esign_label: string;
  days_left: number | null;
  reminder_sent: boolean;
  ai_anomaly: boolean;
  ai_anomaly_reason: string | null;
}

// ─── useDisbursements ─────────────────────────────────────────────────────────

export function useDisbursements(filters: Record<string, string | boolean> = {}) {
  const [data, setData] = useState<Disbursement[]>([]);
  const [meta, setMeta] = useState<DisbursementMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== '' && v !== undefined) params.append(k, String(v));
      });
      const res = await api.get(`/disbursements?${params.toString()}`);
      setData(res.data.data ?? []);
      setMeta(res.data.meta ?? null);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Gagal memuatkan data pengeluaran.');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, meta, loading, error, refetch: fetch };
}

// ─── useAuthorityMatrix ───────────────────────────────────────────────────────

export function useAuthorityMatrix(amount?: number) {
  const [data, setData] = useState<AuthorityLevel[]>([]);
  const [applicable, setApplicable] = useState<AuthorityLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = amount ? `/disbursements/authority-matrix?amount=${amount}` : '/disbursements/authority-matrix';
      const res = await api.get(url);
      setData(res.data.data ?? []);
      setApplicable(res.data.applicable ?? null);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Gagal memuatkan matriks had kuasa.');
    } finally {
      setLoading(false);
    }
  }, [amount]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, applicable, loading, error, refetch: fetch };
}

// ─── useAgingReport ───────────────────────────────────────────────────────────

export function useAgingReport() {
  const [data, setData] = useState<AgingRecord[]>([]);
  const [summary, setSummary] = useState<{ critical: number; warning: number; normal: number; total: number; auto_escalated: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/disbursements/aging-report');
      setData(res.data.data ?? []);
      setSummary(res.data.summary ?? null);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Gagal memuatkan laporan aging.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, summary, loading, error, refetch: fetch };
}

// ─── useEsignQueue ────────────────────────────────────────────────────────────

export function useEsignQueue() {
  const [data, setData] = useState<EsignRecord[]>([]);
  const [stats, setStats] = useState<{ signed: number; pending: number; expired: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/disbursements/esign-queue');
      setData(res.data.data ?? []);
      setStats(res.data.stats ?? null);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Gagal memuatkan antrian e-sign.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, stats, loading, error, refetch: fetch };
}

// ─── Mutation helpers ─────────────────────────────────────────────────────────

export const disbursementApi = {
  sendEsign: (id: number, action = 'send') =>
    api.post(`/disbursements/${id}/send-esign`, { action }),

  confirmEsign: (id: number, status: 'signed' | 'rejected') =>
    api.post(`/disbursements/${id}/send-esign`, { action: 'update', status }),

  confirmPayment: (id: number, bankRef: string) =>
    api.post(`/disbursements/${id}/approve`, { bank_ref: bankRef }),

  escalate: (id: number, reason: string) =>
    api.post(`/disbursements/${id}/escalate`, { reason }),

  sendReminder: (id: number) =>
    api.post(`/disbursements/${id}/send-esign`),

  batchDisbursement: (ids: number[], format = 'iso20022') =>
    api.post('/disbursements/batch', { ids, format }),

  twofaConfirm: (id: number, otp: string) =>
    api.post(`/disbursements/${id}/verify-otp-approve`, { otp_code: otp }),
};