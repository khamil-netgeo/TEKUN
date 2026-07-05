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
  updated_at?: string;
  performance_history?: PerformanceRecord[];
}

export interface PerformanceRecord {
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

export interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: string;
  role_label: string;
  branch_code: string;
  created_at: string;
}

export interface BranchPerformanceItem {
  id: number;
  code: string;
  name: string;
  state: string;
  collection_rate: number;
  npl_ratio: number;
  staff_count: number;
  performance_rank?: number | null;
  leaderboard_rank?: number;
  trend_label?: string;
  target_collection_rate?: number;
  disbursement_amount?: number;
}

export interface BranchListResponse {
  data: Branch[];
  meta: { total: number; per_page: number; current_page: number; last_page: number; };
  summary: { total_branches: number; total_staff: number; avg_collection_rate: number; avg_npl_ratio: number; };
}

export interface BranchDetailResponse {
  data: Branch & { performance_history: PerformanceRecord[] };
}

export interface BranchStaffResponse {
  data: StaffMember[];
  branch: Branch;
  total: number;
}

export interface BranchPerformanceResponse {
  data: BranchPerformanceItem[];
  period: string;
  avg_collection_rate: number;
  avg_npl_ratio: number;
  total_branches: number;
}

const branchService = {
  getBranches: async (params?: { search?: string; state?: string; page?: number; per_page?: number; }): Promise<BranchListResponse> => {
    const res = await api.get<BranchListResponse>('/branches', { params });
    return res.data;
  },
  getBranchById: async (id: number): Promise<BranchDetailResponse> => {
    const res = await api.get<BranchDetailResponse>(`/branches/${id}`);
    return res.data;
  },
  getBranchStaff: async (id: number): Promise<BranchStaffResponse> => {
    const res = await api.get<BranchStaffResponse>(`/branches/${id}/staff`);
    return res.data;
  },
  getPerformance: async (period?: string): Promise<BranchPerformanceResponse> => {
    const res = await api.get<BranchPerformanceResponse>('/branches/performance', { params: period ? { period } : {} });
    return res.data;
  },
  updateBranch: async (id: number, data: Partial<Branch>): Promise<{ message: string; data: Branch }> => {
    const res = await api.put<{ message: string; data: Branch }>(`/branches/${id}`, data);
    return res.data;
  },
};

export default branchService;
