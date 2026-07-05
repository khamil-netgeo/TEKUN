import api from '@/services/api';

export interface CreditAssessment {
  application_id: number;
  score: number;
  grade: string;
  grade_label: string;
  recommendation: string;
  factors: Array<{
    name: string;
    score: number;
    weight: number;
    description?: string;
    impact?: number;
  }>;
  risk_factors?: Array<{
    factor: string;
    value?: string;
    impact?: number;
    description?: string;
  }>;
  positive_factors?: Array<{
    factor: string;
    value?: string;
    impact?: number;
    description?: string;
  }>;
  narrative: string;
  is_borderline: boolean;
  generated_at: string;
}

export interface DashboardStats {
  total_applications: number;
  pending_assessment: number;
  approved_today: number;
  rejected_today: number;
  avg_score: number;
  borderline_cases: number;
  grade_distribution: Record<string, number>;
}

export interface AmortizationSchedule {
  application_id: number;
  amount: number;
  tenure: number;
  rate: number;
  type: 'flat' | 'reducing';
  monthly_payment: number;
  total_payment: number;
  total_profit: number;
  schedule: Array<{
    month: number;
    payment: number;
    principal: number;
    profit: number;
    balance: number;
  }>;
}

export const creditService = {
  // Dashboard KPI stats from DB
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/credit/dashboard');
    return response.data;
  },

  // Get pending applications for credit officer dashboard
  getPendingApplications: async (page = 1, perPage = 10) => {
    const response = await api.get(`/applications?status=pending_assessment&page=${page}&per_page=${perPage}`);
    return response.data;
  },

  // Generate or get credit score
  getCreditScore: async (applicationId: number | string): Promise<CreditAssessment> => {
    const response = await api.get(`/applications/${applicationId}/credit-score`);
    return response.data;
  },

  // Calculate amortization schedule
  getAmortization: async (applicationId: number | string, amount: number, tenure: number, rate: number, type: 'flat' | 'reducing'): Promise<AmortizationSchedule> => {
    const response = await api.get(`/applications/${applicationId}/amortization`, {
      params: { amount, tenure, rate, type }
    });
    return response.data;
  },

  // Approve application
  approveApplication: async (applicationId: number | string, comments: string) => {
    const response = await api.post(`/applications/${applicationId}/approve`, { comments });
    return response.data;
  },

  // Reject application
  rejectApplication: async (applicationId: number | string, reason: string) => {
    const response = await api.post(`/applications/${applicationId}/reject`, { reason });
    return response.data;
  },

  // Return for clarification (Kuari)
  kuariApplication: async (applicationId: number | string, flagged_fields: string[], notes: string, deadline?: string) => {
    const response = await api.post(`/applications/${applicationId}/kuari`, { flagged_fields, notes, deadline });
    return response.data;
  },

  // Generate offer letter
  generateOfferLetter: async (applicationId: number | string) => {
    const response = await api.get(`/applications/${applicationId}/offer-letter`);
    return response.data;
  },

  // Generate AI narrative
  generateNarrative: async (applicationId: number | string) => {
    const response = await api.post('/credit/narrative', { application_id: applicationId });
    return response.data;
  },
};
