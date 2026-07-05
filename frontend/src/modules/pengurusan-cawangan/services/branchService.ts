import api from '@/services/api';

export interface Branch {
  id: number;
  code: string;
  name: string;
  state: string;
  district: string;
  address: string;
  phone: string;
  email: string;
  npl_ratio: number;
  collection_rate: number;
  staff_count: number;
  performance_rank: number | null;
  target_collection_rate: number;
  monthly_target: number;
  monthly_actual: number;
  is_active: boolean;
  created_at: string;
}

export interface BranchPerformance {
  id: number;
  branch_id: number;
  period: string;
  collection_rate: number;
  npl_ratio: number;
  disbursement_amount: number;
  applications_received: number;
  applications_approved: number;
  applications_rejected: number;
  target_collection_rate: number;
  target_disbursement: number;
  performance_rank: number | null;
}

export interface BranchListResponse {
  data: Branch[];
  meta: { total: number; per_page: number; current_page: number; last_page: number };
  summary: { total_branches: number; total_staff: number; avg_collection_rate: number; avg_npl_ratio: number };
}

export interface BranchDetailResponse {
  branch: Branch;
  performance: BranchPerformance[];
}

export interface BranchStaffResponse {
  branch: Branch;
  staff: Array<{ id: number; name: string; email: string; role: string; role_label: string; branch_code: string; created_at: string }>;
  total: number;
}

export interface PerformanceRankingResponse {
  period: string;
  branches: Array<{ id: number; code: string; name: string; state: string; rank: number; collection_rate: number; npl_ratio: number; target: number; disbursement: number; staff_count: number }>;
  avg_collection: number;
  avg_npl: number;
  total_branches: number;
}

const branchService = {
  list: (params?: Record<string, string | number>) =>
    api.get<BranchListResponse>('/branches', { params }),

  detail: (id: number) =>
    api.get<BranchDetailResponse>(`/branches/${id}`),

  staff: (id: number) =>
    api.get<BranchStaffResponse>(`/branches/${id}/staff`),

  performance: (period?: string) =>
    api.get<PerformanceRankingResponse>('/branches/performance', { params: period ? { period } : {} }),

  update: (id: number, data: Partial<Branch>) =>
    api.put<{ message: string; branch: Branch }>(`/branches/${id}`, data),
};

export default branchService;
