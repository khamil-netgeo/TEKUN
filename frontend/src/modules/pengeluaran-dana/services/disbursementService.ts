/**
 * Module 3 — Pengeluaran Dana
 * API service layer for all disbursement endpoints.
 * Updated: added OfferLetterData, sendApprovalOtp, verifyOtpAndApprove
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
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'disbursed' | 'completed' | 'failed';
  esign_status: 'pending' | 'signed' | 'rejected' | 'expired' | null;
  approval_level: string;
  approved_by_l1: number | null;
  approved_at: string | null;
  is_escalated: boolean;
  is_batch: boolean;
  batch_ref: string | null;
  ai_anomaly_flag: boolean;
  ai_anomaly_reason: string | null;
  ai_anomaly_score: number | null;
  twofa_required: boolean;
  twofa_confirmed: boolean;
  sla_breach: boolean;
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

export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  profit: number;
  balance: number;
}

export interface OfferLetterData {
  ref_no: string;
  applicant_name: string;
  ic_no: string;
  address?: string;
  scheme?: string;
  amount: number;
  tenure: number;
  rate: number;
  monthly: number;
  total_profit: number;
  total_payable: number;
  schedule: AmortizationRow[];
  issued_at: string;
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
   * GET /api/disbursements/{id} — single disbursement
   */
  async getOne(id: number) {
    const response = await api.get(`/disbursements/${id}`);
    return response.data as { success: boolean; data: Disbursement };
  },

  /**
   * POST /api/disbursements — create new disbursement
   */
  async create(payload: Partial<Disbursement>) {
    const response = await api.post('/disbursements', payload);
    return response.data;
  },

  /**
   * PUT /api/disbursements/{id} — update disbursement
   */
  async update(id: number, payload: Partial<Disbursement>) {
    const response = await api.put(`/disbursements/${id}`, payload);
    return response.data;
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
  async escalate(id: number, reason?: string) {
    const response = await api.post(`/disbursements/${id}/escalate`, { reason });
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

  /**
   * GET /api/disbursements/{id}/offer-letter — offer letter data for Surat Tawaran
   */
  async getOfferLetterData(id: number) {
    const response = await api.get(`/disbursements/${id}/offer-letter`);
    return response.data as { success: boolean; data: OfferLetterData };
  },

  /**
   * POST /api/disbursements/{id}/send-otp — send OTP before approval
   */
  async sendApprovalOtp(id: number) {
    const response = await api.post(`/disbursements/${id}/send-otp`);
    return response.data as { success: boolean; message: string };
  },

  /**
   * POST /api/disbursements/{id}/verify-otp-approve — verify OTP and approve
   */
  async verifyOtpAndApprove(id: number, otp: string) {
    const response = await api.post(`/disbursements/${id}/verify-otp-approve`, { otp });
    return response.data as { success: boolean; message: string };
  },
};

export default disbursementService;
