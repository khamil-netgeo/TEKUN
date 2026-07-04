import api from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KpiData {
  total_portfolio: number;
  approval_rate: number;
  npl_ratio: number;
  disbursement_volume: number;
  collection_rate: number;
  total_applications: number;
  active_accounts: number;
  as_of: string;
}

export interface TrendPoint {
  month: string;
  amount?: number;
  rate?: number;
  npl?: number;
  total?: number;
  approved?: number;
}

export interface TrendsData {
  period: string;
  disbursement: TrendPoint[];
  collection: TrendPoint[];
  npl_trend: TrendPoint[];
  applications: TrendPoint[];
}

export interface BranchData {
  rank: number;
  name: string;
  state: string;
  collection_rate: number;
  npl_ratio: number;
  total_accounts: number;
  disbursement: number;
  trend: 'up' | 'down' | 'stable';
}

export interface StateHeatmap {
  state: string;
  collection_rate: number;
  npl_ratio: number;
  branch_count: number;
  total_accounts: number;
  heat_level: 'green' | 'yellow' | 'red';
}

export interface BranchPerformanceData {
  branches: BranchData[];
  state_heatmap: StateHeatmap[];
  summary: {
    top_performer: string;
    bottom_performer: string;
    avg_collection: number;
    avg_npl: number;
  };
}

export interface ForecastPoint {
  month: string;
  disbursement: number;
  npl_forecast: number;
  collection_forecast: number;
  confidence: number;
}

export interface RiskAlert {
  region: string;
  risk_level: 'high' | 'medium' | 'low';
  npl_trend: string;
  current_npl: number;
  action: string;
  ai_score: number;
}

export interface PredictiveData {
  forecast_period: string;
  forecast: ForecastPoint[];
  risk_alerts: RiskAlert[];
  predicted_npl_q3: number;
  predicted_collection_q3: number;
  predicted_disbursement_q3: number;
  ai_confidence: number;
  model: string;
  generated_at: string;
}

export interface PortfolioItem {
  name: string;
  value: number;
  color: string;
  accounts: number;
}

export interface AiInsight {
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  action: string | null;
  ai_confidence: number;
}

export interface ReportBuilderResult {
  data: Record<string, unknown>[];
  total_records: number;
  columns_used: string[];
  date_from: string | null;
  date_to: string | null;
}

export interface ExportResult {
  report_ref: string;
  report_name: string;
  total_records: number;
  pdf_url: string;
  excel_url: string;
  status: string;
  generated_at: string;
}

// ─── Service Functions ────────────────────────────────────────────────────────

export const dashboardService = {
  async getKpi(): Promise<KpiData> {
    const res = await api.get('/dashboard/kpi');
    return res.data.data;
  },

  async getTrends(period = 'monthly'): Promise<TrendsData> {
    const res = await api.get(`/dashboard/trends?period=${period}`);
    return res.data.data;
  },

  async getBranchPerformance(): Promise<BranchPerformanceData> {
    const res = await api.get('/dashboard/branch-performance');
    return res.data.data;
  },

  async getPredictive(): Promise<PredictiveData> {
    const res = await api.get('/dashboard/predictive');
    return res.data.data;
  },

  async getPortfolioComposition(): Promise<PortfolioItem[]> {
    const res = await api.get('/dashboard/portfolio-composition');
    return res.data.data;
  },

  async getAiInsights(): Promise<{ insights: AiInsight[]; model: string; generated_at: string }> {
    const res = await api.get('/dashboard/ai-insights');
    return res.data.data;
  },

  async buildReport(params: {
    columns?: string[];
    from?: string;
    to?: string;
  }): Promise<ReportBuilderResult> {
    const query = new URLSearchParams();
    if (params.columns) params.columns.forEach(c => query.append('columns[]', c));
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);
    const res = await api.get(`/reports/builder?${query.toString()}`);
    return res.data.data;
  },

  async exportReport(payload: {
    columns?: string[];
    from?: string;
    to?: string;
    report_name?: string;
  }): Promise<ExportResult> {
    const res = await api.post('/reports/export', payload);
    return res.data.data;
  },

  async getReportHistory() {
    const res = await api.get('/reports/history');
    return res.data.data;
  },
};
