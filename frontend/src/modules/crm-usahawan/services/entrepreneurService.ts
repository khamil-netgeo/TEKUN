/**
 * Module 7 — CRM & Pemantauan Usahawan
 * API service functions
 */
import api from '@/services/api';
import type {
  EntrepreneurListResponse,
  Entrepreneur360,
  VisitListResponse,
  FieldVisit,
  AiHealthResult,
  KpiSnapshot,
} from '../types';

export interface EntrepreneurFilters {
  search?: string;
  ai_search?: boolean;
  financing_status?: string;
  distress_level?: string;
  sector?: string;
  state?: string;
  skim?: string;
  per_page?: number;
  page?: number;
}

export interface ScheduleVisitPayload {
  scheduled_date: string;
  scheduled_time?: string;
  purpose: string;
  officer_id?: number;
}

export interface GenerateReportPayload {
  visit_notes?: string;
  business_condition?: string;
  reported_revenue?: number;
  reported_expenses?: number;
  reported_employees?: number;
  actual_date?: string;
  force?: boolean;
}

// ── Entrepreneur endpoints ────────────────────────────────────────────────────

export const getEntrepreneurs = (filters: EntrepreneurFilters = {}): Promise<EntrepreneurListResponse> =>
  api.get('/entrepreneurs', { params: filters }).then(r => r.data);

export const getEntrepreneur = (id: string | number): Promise<{
  entrepreneur: Entrepreneur360;
  kpi_trend: KpiSnapshot[];
  recent_visits: FieldVisit[];
}> => api.get(`/entrepreneurs/${id}`).then(r => r.data);

export const updateEntrepreneur = (id: string | number, data: Partial<Entrepreneur360>): Promise<{
  message: string;
  entrepreneur: Entrepreneur360;
}> => api.put(`/entrepreneurs/${id}`, data).then(r => r.data);

// ── Field visit endpoints ─────────────────────────────────────────────────────

export const getVisits = (entrepreneurId: string | number): Promise<VisitListResponse> =>
  api.get(`/entrepreneurs/${entrepreneurId}/visits`).then(r => r.data);

export const scheduleVisit = (entrepreneurId: string | number, payload: ScheduleVisitPayload): Promise<{
  message: string;
  visit: FieldVisit;
}> => api.post(`/entrepreneurs/${entrepreneurId}/visits`, payload).then(r => r.data);

export const generateVisitReport = (visitId: number, payload: GenerateReportPayload = {}): Promise<{
  report: string;
  generated_at: string;
  ai_model: string;
  visit_id: number;
  visit_ref: string;
}> => api.post(`/entrepreneurs/visits/${visitId}/report`, payload).then(r => r.data);

// ── AI health endpoint ────────────────────────────────────────────────────────

export const getAiHealth = (id: string | number): Promise<AiHealthResult> =>
  api.get(`/ai/entrepreneur-health/${id}`).then(r => r.data);
