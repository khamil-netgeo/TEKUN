/**
 * Module 5 — Pengurusan NPL & Kutipan Hutang
 * Custom hooks for all NPL API calls.
 */
import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface NplDashboardData {
  total_npl: number;
  npl_rate: number;
  total_outstanding: number;
  collected_mtd: number;
  collection_rate: number;
  categories: { label: string; count: number; amount: number }[];
}

export interface AiAutomationData {
  sms_sent: number;
  whatsapp_sent: number;
  email_sent: number;
  total_sent: number;
  response_rate: number;
  pending_tasks: number;
  ai_next_action: string;
  top_recommendation: string | null;
}

export interface DunningRecord {
  id: number;
  account_no: string;
  borrower_name: string;
  days_overdue: number;
  dunning_stage: string;
  outstanding: string | number;
  classification: string;
  ai_risk_level: string;
}

export interface CollectionTask {
  id: number;
  account_id: number;
  account_no: string;
  borrower_name: string;
  arrears_days: number;
  arrears_amount: string | number;
  outstanding_balance: string | number;
  classification: string;
  status: string;
  priority_score: number;
  priority_label: string;
  ai_suggested_channel: string | null;
  ai_best_contact_time: string | null;
  ai_recommendation: string | null;
  last_outcome: string | null;
  outcome_notes: string | null;
  attempt_count: number;
  follow_up_at: string | null;
  last_contacted_at: string | null;
}

export interface DunningResult {
  notis_sent: number;
  channel: string;
  account_id: number;
  sent_at: string;
  ai_notice?: string;
  ai_generated?: boolean;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useNplDashboard() {
  const [data, setData]       = useState<NplDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/npl/dashboard');
      setData(res.data);
    } catch {
      setError('Gagal memuatkan data dashboard NPL.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}

export function useAiAutomation() {
  const [data, setData]       = useState<AiAutomationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/npl/ai-automation');
      setData(res.data);
    } catch {
      setError('Gagal memuatkan data automasi AI.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}

export function useDunningList(stage?: string) {
  const [data, setData]       = useState<DunningRecord[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (stage) params.dunning_stage = stage;
      const res = await api.get('/npl/dunning', { params });
      setData(res.data.data ?? []);
      setTotal(res.data.total ?? 0);
    } catch {
      setError('Gagal memuatkan senarai dunning.');
    } finally {
      setLoading(false);
    }
  }, [stage]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, total, loading, error, refetch: fetch };
}

export function useSendDunning() {
  const send = async (accountId: number, channel: string): Promise<DunningResult | null> => {
    try {
      const res = await api.post(`/collections/dunning/${accountId}`, { channel });
      return res.data as DunningResult;
    } catch {
      return null;
    }
  };
  return { send };
}

export function useCollectionTasks() {
  const [tasks, setTasks]     = useState<CollectionTask[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/collections/tasks');
      setTasks(res.data.data ?? []);
      setTotal(res.data.total ?? 0);
    } catch {
      setError('Gagal memuatkan tugasan kutipan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { tasks, total, loading, error, refetch: fetch };
}

export function useLogOutcome() {
  const log = async (taskId: number, outcome: string, notes: string, followUpDays = 7) => {
    try {
      const res = await api.post(`/collections/tasks/${taskId}/outcome`, { outcome, notes, follow_up_days: followUpDays });
      return res.data;
    } catch {
      return null;
    }
  };
  return { log };
}
