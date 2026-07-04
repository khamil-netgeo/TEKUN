/**
 * TEKUN SPPT — Application Domain Types
 * Shared TypeScript interfaces for Module 1 (Permohonan & Kelayakan)
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'disbursed';

export type ApplicationScheme =
  | 'tekun_micro'
  | 'tekun_usahawan'
  | 'tekun_wanita'
  | 'tekun_belia';

export type DocumentType =
  | 'ic_front'
  | 'ic_back'
  | 'bank_statement'
  | 'ssm_cert'
  | 'business_photo'
  | 'others';

export type DocumentStatus = 'pending' | 'verified' | 'rejected';

// ─── Core Interfaces ──────────────────────────────────────────────────────────

export interface Application {
  id: number;
  ref_no: string;
  applicant_id: number;
  branch_id: number | null;
  scheme: ApplicationScheme;
  scheme_label: string;
  amount_requested: number;
  status: ApplicationStatus;
  status_label: string;
  ic_no: string;
  full_name: string;
  phone: string;
  email: string;
  business_name: string;
  business_type: string;
  business_address: string;
  business_age_months: number;
  monthly_income: number;
  monthly_expense: number;
  monthly_surplus: number;
  loan_purpose: string;
  eligibility_checks: EligibilityChecks | null;
  is_auto_rejected: boolean;
  auto_reject_reason: string | null;
  auto_reject_narrative: string | null;
  submitted_at: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  applicant?: { id: number; name: string; email: string };
  branch?: { id: number; name: string; code: string };
  documents?: ApplicationDocument[];
  credit_assessment?: CreditAssessment;
  disbursement?: Disbursement;
}

export interface ApplicationDocument {
  id: number;
  application_id: number;
  type: DocumentType;
  type_label: string;
  original_name: string;
  storage_path: string;
  mime_type: string;
  file_size_bytes: number;
  file_size_kb: string;
  status: DocumentStatus;
  ai_confidence: number;
  ai_issues: string[];
  is_ai_approved: boolean;
  uploaded_by: number;
  verified_by: number | null;
  verified_at: string | null;
  created_at: string;
}

export interface EligibilityChecks {
  e_syariah?: { status: string; checked_at: string };
  muflis?: { status: string; checked_at: string };
  ssm?: { status: string; reg_no?: string; checked_at: string };
  ccris?: { status: string; npl_count: number; active_facilities: number; checked_at: string };
  ctos?: { status: string; score: number; grade: string; checked_at: string };
  jpn?: { status: string; checked_at: string };
}

export interface CreditAssessment {
  id: number;
  application_id: number;
  total_score: number;
  risk_grade: 'A' | 'B' | 'C' | 'D' | 'E';
  risk_grade_label: string;
  dsr: number;
  amount_approved: number;
  tenure_approved: number;
  profit_rate: number;
  monthly_instalment: number;
  decision: 'pending' | 'approved' | 'rejected' | 'query';
  decision_reason: string;
  ai_narrative: string | null;
  offer_sent_at: string | null;
  offer_accepted_at: string | null;
  decided_at: string | null;
}

export interface Disbursement {
  id: number;
  application_id: number;
  ref_no: string;
  amount: number;
  bank_name: string;
  bank_account_no: string;
  bank_account_name: string;
  bank_verified: boolean;
  esign_status: 'pending' | 'signed' | 'rejected';
  payment_status: 'pending' | 'processed' | 'failed';
  disbursed_at: string | null;
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export interface TimelineStep {
  step: number;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending' | 'rejected';
  completed_at: string | null;
  reject_reason?: string | null;
  checks?: EligibilityChecks;
}

export interface TimelineResponse {
  ref_no: string;
  status: ApplicationStatus;
  steps: TimelineStep[];
  eta: {
    estimated_date: string;
    estimated_days: number;
    confidence: 'low' | 'medium' | 'high';
    based_on_records: number;
  } | null;
}

// ─── API Payloads ─────────────────────────────────────────────────────────────

export interface StoreApplicationPayload {
  scheme: ApplicationScheme;
  amount_requested: number;
  ic_no: string;
  full_name: string;
  phone: string;
  email: string;
  business_name: string;
  business_type: string;
  business_address: string;
  business_age_months: number;
  monthly_income: number;
  monthly_expense: number;
  loan_purpose: string;
  branch_id?: number;
}

export interface ApplicationListParams {
  page?: number;
  per_page?: number;
  status?: ApplicationStatus | 'all';
  scheme?: ApplicationScheme;
  search?: string;
  branch_id?: number;
  date_from?: string;
  date_to?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

// ─── Status Config ────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<ApplicationStatus, { label: string; bg: string; text: string }> = {
  draft:        { label: 'Draf',             bg: '#F3F4F6', text: '#6B7280' },
  submitted:    { label: 'Dihantar',         bg: '#EFF6FF', text: '#1D4ED8' },
  under_review: { label: 'Dalam Semakan',    bg: '#FFF7ED', text: '#C2410C' },
  approved:     { label: 'Diluluskan',       bg: '#F0FDF4', text: '#15803D' },
  rejected:     { label: 'Ditolak',          bg: '#FEF2F2', text: '#DC2626' },
  disbursed:    { label: 'Dana Dikeluarkan', bg: '#F0FDF4', text: '#166534' },
};

export const SCHEME_CONFIG: Record<ApplicationScheme, { label: string; maxAmount: number; color: string }> = {
  tekun_micro:    { label: 'TEKUN Micro',    maxAmount: 10000, color: '#1B2B5E' },
  tekun_usahawan: { label: 'TEKUN Usahawan', maxAmount: 50000, color: '#2E7D32' },
  tekun_wanita:   { label: 'TEKUN Wanita',   maxAmount: 30000, color: '#C2185B' },
  tekun_belia:    { label: 'TEKUN Belia',    maxAmount: 20000, color: '#E65100' },
};

export const REQUIRED_DOCUMENTS: { type: DocumentType; label: string; required: boolean }[] = [
  { type: 'ic_front',       label: 'MyKad (Hadapan)',                    required: true },
  { type: 'ic_back',        label: 'MyKad (Belakang)',                   required: false },
  { type: 'bank_statement', label: 'Penyata Bank (3 Bulan)',             required: true },
  { type: 'ssm_cert',       label: 'Sijil Pendaftaran Perniagaan (SSM)', required: false },
  { type: 'business_photo', label: 'Gambar Premis Perniagaan',           required: false },
  { type: 'others',         label: 'Dokumen Lain',                       required: false },
];
