/**
 * TEKUN SPPT — Module 8: Pengurusan Cawangan
 * Branch Management API Service
 */
import api from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Branch {
  id: number;
  code: string;
  name: string;
  state: string;
  district: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  manager_name: string | null;
  manager_email: string | null;
  is_active: boolean;
  collection_rate: number;
  npl_ratio: number;
  total_applications: number;
  active_accounts: number;
  disbursement_amount: number;
  monthly_target: number;
  monthly_actual: number;
  staff_count: number;
  performance_rank: number | null;
  achievement_percent?: number;
  performance_status?: string;
  npl_status?: string;
  performance_history?: BranchPerformance[];
  created_at?: string;
  updated_at?: string;
}

export interface BranchPerformance {
  id: number;
  branch_id: number;
  period: string;
  target_amount: number;
  actual_amount: number;
  collection_rate: number;
  npl_ratio: number;
  new_applications: number;
  approved_applications: number;
  rejected_applications: number;
  performance_rank: number | null;
  achievement_percent?: number;
}

export interface BranchStaff {
  id: number;
  name: string;
  email: string;
  role: string;
  role_label: string;
  branch_code: string;
  joined_at: string;
  active_applications: number;
}

export interface BranchListResponse {
  data: Branch[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
  summary: {
    total_branches: number;
    total_staff: number;
    avg_collection_rate: number;
    avg_npl_ratio: number;
  };
}

export interface BranchPerformanceResponse {
  period: string;
  branches: Branch[];
  avg_collection: number;
  avg_npl: number;
  top_branch: Branch | null;
  total_branches: number;
}

export interface BranchStaffResponse {
  branch: { id: number; code: string; name: string };
  staff: BranchStaff[];
  total: number;
}

export interface BranchListParams {
  state?: string;
  search?: string;
  is_active?: boolean;
  per_page?: number;
  page?: number;
}

export interface UpdateBranchPayload {
  name?: string;
  state?: string;
  district?: string;
  address?: string;
  phone?: string;
  email?: string;
  manager_name?: string;
  manager_email?: string;
  is_active?: boolean;
  monthly_target?: number;
}

// ─── API Calls ────────────────────────────────────────────────────────────────

export async function getBranches(params: BranchListParams = {}): Promise<BranchListResponse> {
  const { data } = await api.get('/branches', { params });
  return data;
}

export async function getBranch(id: number): Promise<{ data: Branch }> {
  const { data } = await api.get(`/branches/${id}`);
  return data;
}

export async function getBranchStaff(id: number): Promise<BranchStaffResponse> {
  const { data } = await api.get(`/branches/${id}/staff`);
  return data;
}

export async function getBranchPerformance(period?: string): Promise<BranchPerformanceResponse> {
  const { data } = await api.get('/branches/performance', { params: period ? { period } : {} });
  return data;
}

export async function updateBranch(id: number, payload: UpdateBranchPayload): Promise<{ message: string; data: Branch }> {
  const { data } = await api.put(`/branches/${id}`, payload);
  return data;
}
