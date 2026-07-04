// Module 9 — Produk Pembiayaan
// TypeScript types for the financing product domain.

export interface FinancingProduct {
  id: number;
  code: string;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  min_amount: number;
  max_amount: number;
  amount_range: string;
  profit_rate: number;
  min_tenure_months: number;
  max_tenure_months: number;
  processing_fee_type: 'fixed' | 'percentage';
  processing_fee_value: number;
  min_age: number;
  max_age: number;
  min_business_age_months: number;
  eligible_sectors: string[] | null;
  eligible_genders: string[] | null;
  eligible_races: string[] | null;
  requires_ssm_registration: boolean;
  requires_business_premises: boolean;
  blacklist_check_required: boolean;
  ccris_check_required: boolean;
  ctos_check_required: boolean;
  muflis_check_required: boolean;
  esyariah_check_required: boolean;
  required_documents: string[] | null;
  is_active: boolean;
  status_label: string;
  color_hex: string;
  display_order: number;
  rules_count: number;
  last_updated_by: string | null;
  activated_at: string | null;
  deactivated_at: string | null;
  activated_by: string | null;
  deactivated_by: string | null;
  updated_at: string;
  eligibility_rules?: EligibilityRule[];
  recent_audit_logs?: ProductAuditLog[];
}

export interface EligibilityRule {
  id: number;
  rule_code: string;
  rule_name: string;
  rule_name_en: string | null;
  rule_type: 'age' | 'gender' | 'sector' | 'blacklist' | 'business_age' | 'custom';
  operator: 'gte' | 'lte' | 'gt' | 'lt' | 'eq' | 'neq' | 'in' | 'not_in' | 'between';
  rule_value: unknown[];
  is_hard_reject: boolean;
  rejection_message: string | null;
  is_active: boolean;
  priority: number;
}

export interface ProductAuditLog {
  id: number;
  action: 'created' | 'updated' | 'activated' | 'deactivated';
  user: string | null;
  created_at: string;
  notes: string | null;
}

export interface ProductListMeta {
  total: number;
  active: number;
  inactive: number;
}

export interface EligibilityCheckResult {
  eligible: boolean;
  product_id: number;
  product: string;
  passed: EligibilityCheckItem[];
  failed: EligibilityCheckItem[];
  warnings: EligibilityCheckItem[];
  summary: string;
}

export interface EligibilityCheckItem {
  rule: string;
  message: string;
  hard?: boolean;
}

export interface EligibilityCheckParams {
  ic: string;
  gender?: 'M' | 'F';
  sector?: string;
  business_age_months?: number;
  is_blacklisted?: boolean;
  ccris_clear?: boolean;
  ctos_clear?: boolean;
  muflis_clear?: boolean;
  dob?: string;
}

export interface ProductUpdatePayload {
  name?: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  min_amount?: number;
  max_amount?: number;
  profit_rate?: number;
  min_tenure_months?: number;
  max_tenure_months?: number;
  processing_fee_type?: 'fixed' | 'percentage';
  processing_fee_value?: number;
  min_age?: number;
  max_age?: number;
  min_business_age_months?: number;
  eligible_sectors?: string[];
  eligible_genders?: string[];
  eligible_races?: string[] | null;
  requires_ssm_registration?: boolean;
  requires_business_premises?: boolean;
  blacklist_check_required?: boolean;
  ccris_check_required?: boolean;
  ctos_check_required?: boolean;
  muflis_check_required?: boolean;
  esyariah_check_required?: boolean;
  required_documents?: string[];
  color_hex?: string;
  display_order?: number;
}
