/**
 * Module 3 — Pengeluaran Dana
 * API service layer for all disbursement endpoints.
 */
import api from '../../../services/api';

export interface Disbursement {
  id: number;
  application_id: number;
  ref_no: string;
  amount: number;
  bank_name: string;
  bank_account_no: string;
  bank_account_name: string;
  bank_verified: boolean;
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'disbursed';
  esign_status: 'pending' | 'signed' | 'rejected' | 'expired' | null;
  approval_level: string;
  approved_by_l1: number | null;
  approved_at: string | null;
  is_escalated: boolean;
  is_batch: boolean;
  batch_ref: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  applicant_name?: string;
  scheme?: string;
  approver_name?: string;
}

export interface AgingRecord extends Disbursement {
  elapsed_days: number;
  elapsed_hours: number;
  sla_category: string;
  sla_status: 'KRITIKAL' | 'AMARAN' | 'NORMAL';
  officer: string;
  name: string;
}

export interface AgingSummary {
  critical: number;
  warning: number;
  normal: number;
  total: number;
  auto_escalated: number;
}

export interface EsignRecord {
  id: number;
  ref_no: string;
  name: string;
  amount: number;
  esign_status: string;
  sent_at: string;
  deadline: string;
  days_left: number;
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

export interface DisbursementMeta {
  total: number;
  ready: number;
  pending_esign: number;
  processed_today: number;
  total_amount: number;
  current_page: number;
  last_page: number;
  per_page: number;
  total_records: number;
}

const disbursementService = {
  /**
   * GET /api/disbursements — paginated list with optional status filter
   */
  async getList(params: { status?: string; page?: number; per_page?: number } = {}) {
    const response = await api.get('/disbursements', { params });
    return response.data as { success: boolean; data: Disbursement[]; meta: DisbursementMeta };
  },

  /**
   * GET /api/disbursements/aging-report — SLA aging data
   */
  async getAgingReport() {
    const response = await api.get('/disbursements/aging-report');
    return response.data as { success: boolean; data: AgingRecord[]; summary: AgingSummary };
  },

  /**
   * POST /api/disbursements/{id}/escalate
   */
  async escalate(id: number) {
    const response = await api.post(`/disbursements/${id}/escalate`);
    return response.data;
  },

  /**
   * POST /api/disbursements/{id}/approve
   */
  async approve(id: number) {
    const response = await api.post(`/disbursements/${id}/approve`);
    return response.data;
  },

  /**
   * POST /api/disbursements/batch — bulk process
   */
  async batchProcess(ids: number[], format = 'fpx') {
    const response = await api.post('/disbursements/batch', { ids, format });
    return response.data;
  },

  /**
   * GET /api/disbursements/esign-queue
   */
  async getEsignQueue() {
    const response = await api.get('/disbursements/esign-queue');
    return response.data as { success: boolean; data: EsignRecord[]; stats: Record<string, number> };
  },

  /**
   * POST /api/disbursements/{id}/send-esign — send reminder
   */
  async sendReminder(id: number) {
    const response = await api.post(`/disbursements/${id}/send-esign`);
    return response.data;
  },

  /**
   * GET /api/disbursements/authority-matrix?amount=xxx
   */
  async getAuthorityMatrix(amount?: number) {
    const response = await api.get('/disbursements/authority-matrix', { params: amount ? { amount } : {} });
    return response.data as { success: boolean; data: AuthorityLevel[]; applicable: AuthorityLevel | null };
  },
};

export default disbursementService;
