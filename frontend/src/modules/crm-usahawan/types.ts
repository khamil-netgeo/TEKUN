/**
 * Module 7 — CRM & Pemantauan Usahawan
 * TypeScript type definitions
 */

export interface Entrepreneur {
  id: number;
  ref_no: string;
  name: string;
  ic_no: string;
  phone: string;
  email?: string;
  skim?: string;
  sector?: string;
  state?: string;
  district?: string;
  financing_status: 'Lancar' | 'Perhatian Khusus' | 'Tidak Lancar';
  health_score: number;
  health_badge: 'Sihat' | 'Sederhana' | 'Lemah' | 'Kritikal';
  distress_level: 'Rendah' | 'Sederhana' | 'Tinggi' | 'Kritikal';
  outstanding_balance: number;
  total_financing: number;
  branch?: { id: number; name: string; code?: string };
  assigned_officer?: { id: number; name: string };
  status: 'aktif' | 'tidak_aktif' | 'blacklist';
  updated_at?: string;
}

export interface Entrepreneur360 extends Entrepreneur {
  business_name?: string;
  business_reg_no?: string;
  business_type?: string;
  business_start_date?: string;
  business_age_years?: number;
  business_address?: string;
  sub_sector?: string;
  business_sector?: string;
  race?: string;
  gender?: string;
  dob?: string;
  address?: string;
  monthly_revenue?: number;
  monthly_expenses?: number;
  monthly_sales?: number;
  employee_count: number;
  kpi_updated_at?: string;
  kpi_trend?: Record<string, number>[];
  default_probability?: number;
  ai_factors: string[];
  ai_score_updated_at?: string;
  notes?: string;
}

export interface KpiSnapshot {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  employee_count: number;
  sales_volume: number;
}

export interface FieldVisit {
  id: number;
  ref_no: string;
  entrepreneur_id: number;
  officer?: { id: number; name: string };
  scheduled_date: string;
  scheduled_time?: string;
  actual_date?: string;
  purpose: string;
  status: 'Dijadualkan' | 'Dalam Perjalanan' | 'Selesai' | 'Dibatalkan' | 'Tidak Hadir';
  business_condition?: 'Baik' | 'Sederhana' | 'Lemah' | 'Kritikal';
  visit_notes?: string;
  has_ai_report: boolean;
  ai_report?: string;
  ai_report_generated_at?: string;
  reported_revenue?: number;
  reported_employees?: number;
  checklist_items: string[];
  location?: string;
  created_at?: string;
}

export interface AiHealthResult {
  entrepreneur_id: number;
  ref_no: string;
  score: number;
  distress_level: string;
  default_probability: number;
  factors: string[] | { impact: string; description: string; factor: string }[];
  health_badge: string;
  badge?: string;
  recommendation?: string;
  computed_at?: string;
  updated_at?: string;
}

export interface EntrepreneurListResponse {
  data: Entrepreneur[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  ai_search?: boolean;
}

export interface VisitListResponse {
  data: FieldVisit[];
  total: number;
}
