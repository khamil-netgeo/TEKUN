/**
 * Module 5 — Pengurusan NPL & Kutipan Hutang
 * Custom hooks for all NPL API calls.
 */
import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NplDashboard {
  total_accounts: number;
  total_outstanding: number;
  total_npl: number;
  npl_amount: number;
  ratio: number;
  npl_rate: number;
  bnm_threshold: number;
  status: 'above_threshold' | 'within_threshold';
  collected_mtd: number;
  collection_rate: number;
  classification_breakdown: Record<string, { count: number; amount: number }>;
  monthly_trend: Array<{ month: string; npl_ratio: number; bnm_threshold: number; collection_rate: number }>;
  by_branch: Array<{ branch: string; npl_count: number; npl_ratio: number; risk: string }>;
  by_sector: Array<{ sector: string; npl_count: number; npl_ratio: number }>;
}

export interface Account {
  id: number;
  account_no: string;
  borrower_name: string;
  ic_no: string;
  outstanding_balance: number;
  arrears_amount: number;
  arrears_days: number;
  classification: string;
  monthly_instalment: number;
  profit_rate: number;
  start_date: string;
  maturity_date: string;
}

export interface CollectionTask {
  id: number;
  account_id: number;
  account_no: string;
  borrower_name: string;
  arrears_days: number;
  arrears_amount: number;
  outstanding_balance: number;
  classification: string;
  status: string;
  priority_score: number;
  priority_label: string;
  ai_suggested_channel: string;
  ai_best_contact_time: string;
  ai_recommendation: string;
  last_outcome: string | null;
  attempt_count: number;
  follow_up_at: string | null;
  last_contacted_at: string | null;
}

export interface DunningResult {
  success: boolean;
  message?: string;
  account_id?: number;
  account_no?: string;
  stage?: number;
  stage_label?: string;
  channel?: string;
  notis_sent?: boolean;
  sent_at?: string;
}

// ── useNplDashboard ───────────────────────────────────────────────────────────

export function useNplDashboard() {
  const [data, setData] = useState<NplDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/npl/dashboard');
      setData(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? 'Gagal memuatkan data dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ── useNplAccounts ────────────────────────────────────────────────────────────

export function useNplAccounts(classification?: string) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (pg = 1, cls = classification) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page: pg, per_page: 20 };
      if (cls && cls !== 'all') params.classification = cls;
      const res = await api.get('/accounts', { params });
      // Handle both response formats: {data, total} or {success, data, meta}
      if (res.data.success !== undefined) {
        setAccounts(res.data.data ?? []);
        setTotal(res.data.meta?.total ?? res.data.data?.length ?? 0);
      } else {
        setAccounts(res.data.data ?? []);
        setTotal(res.data.total ?? 0);
      }
      setPage(pg);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? 'Gagal memuatkan senarai akaun.');
    } finally {
      setLoading(false);
    }
  }, [classification]);

  useEffect(() => { fetch(1); }, [fetch]);

  return { accounts, total, page, loading, error, setPage: (pg: number) => fetch(pg) };
}

// ── useCollectionTasks ────────────────────────────────────────────────────────

export function useCollectionTasks() {
  const [tasks, setTasks] = useState<CollectionTask[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/collections/tasks');
      setTasks(res.data.data ?? []);
      setTotal(res.data.total ?? 0);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? 'Gagal memuatkan tugasan kutipan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { tasks, total, loading, error, refetch: fetch };
}

// ── useSendDunning ────────────────────────────────────────────────────────────

export function useSendDunning() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (accountId: number): Promise<DunningResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/collections/dunning/${accountId}`);
      return res.data;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? 'Gagal menghantar notis dunning.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { send, loading, error };
}

// ── useLogOutcome ─────────────────────────────────────────────────────────────

export function useLogOutcome() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const log = useCallback(async (
    taskId: number,
    outcome: string,
    notes: string,
    followUpDays?: number,
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await api.post(`/collections/tasks/${taskId}/outcome`, {
        outcome,
        notes,
        follow_up_days: followUpDays,
      });
      return true;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? 'Gagal merekod hasil panggilan.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { log, loading, error };
}
