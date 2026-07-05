// Module 10 — Integrasi API Luaran — API Service

import api from '@/services/api';
import type {
  AlertConfig,
  HealthLog,
  HealthResponse,
  ServiceMetrics,
  TestResult,
} from './types';

export const integrasiApiService = {
  /** GET /api/integrations/health */
  getHealth: (): Promise<HealthResponse> =>
    api.get('/integrations/health').then((r) => r.data),

  /** GET /api/integrations/{service}/metrics */
  getMetrics: (serviceKey: string): Promise<{ success: boolean; data: ServiceMetrics }> =>
    api.get(`/integrations/${serviceKey}/metrics`).then((r) => r.data),

  /** POST /api/integrations/{service}/test */
  testService: (serviceKey: string): Promise<{ success: boolean; result: TestResult }> =>
    api.post(`/integrations/${serviceKey}/test`).then((r) => r.data),

  /** POST /api/integrations/{service}/circuit-breaker/reset */
  resetCircuitBreaker: (serviceKey: string): Promise<{ success: boolean; result: unknown }> =>
    api.post(`/integrations/${serviceKey}/circuit-breaker/reset`).then((r) => r.data),

  /** GET /api/integrations/alerts */
  getAlerts: (): Promise<{ success: boolean; data: AlertConfig[] }> =>
    api.get('/integrations/alerts').then((r) => r.data),

  /** PUT /api/integrations/alerts */
  updateAlerts: (configs: Partial<AlertConfig>[]): Promise<{ success: boolean; message: string }> =>
    api.put('/integrations/alerts', { configs }).then((r) => r.data),

  /** GET /api/integrations/logs */
  getLogs: (service?: string, limit = 50): Promise<{ success: boolean; data: HealthLog[] }> =>
    api
      .get('/integrations/logs', { params: { service, limit } })
      .then((r) => r.data),
};
