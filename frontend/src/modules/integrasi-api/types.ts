// Module 10 — Integrasi API Luaran — TypeScript Types

export type ApiStatus = 'OK' | 'DEGRADED' | 'DOWN' | 'UNKNOWN';
export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface ApiIntegration {
  id: number;
  service_key: string;
  service_name: string;
  description: string;
  status: ApiStatus;
  latency_ms: number | null;
  uptime_30d: number;
  circuit_breaker_state: CircuitBreakerState;
  circuit_breaker_failures: number;
  circuit_breaker_threshold: number;
  circuit_breaker_opened_at: string | null;
  last_checked_at: string | null;
  last_success_at: string | null;
  last_failure_at: string | null;
  is_active: boolean;
}

export interface HealthSummary {
  total: number;
  ok: number;
  degraded: number;
  down: number;
  avg_latency_ms: number | null;
  avg_uptime_30d: number | null;
  checked_at: string;
}

export interface HealthResponse {
  success: boolean;
  summary: HealthSummary;
  integrations: ApiIntegration[];
}

export interface LatencyPoint {
  hour: string;
  latency_ms: number | null;
  timestamp: string;
}

export interface UptimePoint {
  date: string;
  uptime_pct: number | null;
  timestamp: string;
}

export interface ServiceStats {
  avg_latency_ms: number | null;
  min_latency_ms: number | null;
  max_latency_ms: number | null;
  uptime_30d_pct: number;
  total_checks: number;
  failed_checks: number;
}

export interface ServiceMetrics {
  service: ApiIntegration;
  latency_24h: LatencyPoint[];
  uptime_30d: UptimePoint[];
  stats: ServiceStats;
}

export interface TestResult {
  service_key: string;
  success: boolean;
  latency_ms: number | null;
  http_status_code: number | null;
  error_message: string | null;
  status: ApiStatus;
  circuit_breaker_state: CircuitBreakerState;
  message?: string;
  tested_at: string;
}

export interface AlertConfig {
  id?: number;
  service_key: string;
  service_name: string;
  alert_type: 'latency' | 'downtime' | 'circuit_breaker' | 'error_rate';
  latency_threshold_ms: number;
  downtime_threshold_minutes: number;
  error_rate_threshold: number;
  notify_email: boolean;
  notify_sms: boolean;
  notify_email_addresses: string | null;
  is_active: boolean;
}

export interface HealthLog {
  id: number;
  service_key: string;
  service_name: string;
  latency_ms: number | null;
  status: ApiStatus;
  http_status: number | null;
  is_success: boolean;
  error: string | null;
  checked_at: string;
}
