/**
 * Module 11 — Audit & Kawalan Service
 * Handles all API calls for audit log viewing, anomaly detection, and compliance reports.
 */
import api from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: number;
  user_id: number | null;
  user_name: string;
  user_email: string;
  action: string;
  module: string;
  auditable_type: string | null;
  auditable_id: number | null;
  ip_address: string | null;
  user_agent: string | null;
  description: string | null;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  created_at: string;
}

export interface AuditLogDetail extends AuditLog {
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  diff: Array<{ field: string; before: unknown; after: unknown }>;
}

export interface AuditAnomaly {
  id: number;
  type: string;
  description: string;
  user: string;
  module: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  detected_at: string;
  resolved: boolean;
  audit_id?: number | null;
}

export interface AuditStats {
  total: number;
  today: number;
  critical: number;
  unique_users: number;
  by_action: Array<{ action: string; count: number }>;
  by_module: Array<{ module: string; count: number }>;
  daily_trend: Array<{ date: string; count: number }>;
  from: string;
  to: string;
}

export interface AuditLogsResponse {
  data: AuditLog[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  anomaly_count: number;
}

export interface AnomaliesResponse {
  anomalies: AuditAnomaly[];
  total: number;
  critical: number;
  high: number;
  medium: number;
  ai_model: string;
  generated_at: string;
}

export interface ExportRequest {
  from?: string;
  to?: string;
  modules?: string[];
  format?: 'pdf' | 'csv';
}

export interface ExportResponse {
  report_id: string;
  pdf_url: string;
  from: string;
  to: string;
  total_records: number;
  format: string;
  generated_at: string;
  generated_by: string;
}

export interface AuditFilters {
  user_id?: number;
  module?: string;
  action?: string;
  from?: string;
  to?: string;
  ip_address?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

// ─── Service Functions ────────────────────────────────────────────────────────

export const auditService = {
  /**
   * GET /api/audit-logs — paginated log list with filters
   */
  async getLogs(filters: AuditFilters = {}): Promise<AuditLogsResponse> {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''),
    );
    const { data } = await api.get<AuditLogsResponse>('/audit-logs', { params });
    return data;
  },

  /**
   * GET /api/audit-logs/{id} — full log detail with before/after JSON
   */
  async getLog(id: number): Promise<AuditLogDetail> {
    const { data } = await api.get<AuditLogDetail>(`/audit-logs/${id}`);
    return data;
  },

  /**
   * GET /api/audit-logs/anomalies — AI-flagged suspicious activities
   */
  async getAnomalies(): Promise<AnomaliesResponse> {
    const { data } = await api.get<AnomaliesResponse>('/audit-logs/anomalies');
    return data;
  },

  /**
   * POST /api/audit-logs/export — generate BNM compliance report
   */
  async exportReport(payload: ExportRequest = {}): Promise<ExportResponse> {
    const { data } = await api.post<ExportResponse>('/audit-logs/export', payload);
    return data;
  },

  /**
   * GET /api/audit-logs/stats — summary counts by action/module/trend
   */
  async getStats(from?: string, to?: string): Promise<AuditStats> {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to)   params.to   = to;
    const { data } = await api.get<AuditStats>('/audit-logs/stats', { params });
    return data;
  },
};
