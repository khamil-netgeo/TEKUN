/**
 * TEKUN SPPT — Application Service
 * All API calls for Module 1 (Permohonan & Kelayakan Awalan).
 * Connects to the real Laravel backend at /api/applications.
 */

import api from './api';
import type {
  Application,
  ApplicationDocument,
  StoreApplicationPayload,
  ApplicationListParams,
  PaginatedResponse,
  TimelineResponse,
  EligibilityChecks,
} from '@/types/application';

// ─── List Applications (RBAC-scoped) ─────────────────────────────────────────

export async function getApplications(
  params: ApplicationListParams = {}
): Promise<PaginatedResponse<Application>> {
  const { data } = await api.get('/applications', { params });
  return data;
}

// ─── Get Single Application ───────────────────────────────────────────────────

export async function getApplication(id: number | string): Promise<Application> {
  const { data } = await api.get(`/applications/${id}`);
  return data.data;
}

// ─── Create Application (Draft) ───────────────────────────────────────────────

export async function createApplication(
  payload: StoreApplicationPayload
): Promise<{ message: string; application: Application }> {
  const { data } = await api.post('/applications', payload);
  return data;
}

// ─── Update Application (Draft only) ─────────────────────────────────────────

export async function updateApplication(
  id: number | string,
  payload: Partial<StoreApplicationPayload>
): Promise<{ message: string; application: Application }> {
  const { data } = await api.put(`/applications/${id}`, payload);
  return data;
}

// ─── Delete Application (Draft only) ─────────────────────────────────────────

export async function deleteApplication(id: number | string): Promise<{ message: string }> {
  const { data } = await api.delete(`/applications/${id}`);
  return data;
}

// ─── Submit Application ───────────────────────────────────────────────────────

export async function submitApplication(id: number | string): Promise<{
  message: string;
  application: Application;
  auto_rejected: boolean;
  narrative: string | null;
}> {
  const { data } = await api.post(`/applications/${id}/submit`);
  return data;
}

// ─── Upload Document ──────────────────────────────────────────────────────────

export async function uploadDocument(
  applicationId: number | string,
  type: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ message: string; document: ApplicationDocument }> {
  const formData = new FormData();
  formData.append('type', type);
  formData.append('file', file);

  const { data } = await api.post(`/applications/${applicationId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    },
  });
  return data;
}

// ─── Get Timeline ─────────────────────────────────────────────────────────────

export async function getApplicationTimeline(id: number | string): Promise<TimelineResponse> {
  const { data } = await api.get(`/applications/${id}/timeline`);
  return data;
}

// ─── Check Eligibility (preview, without submitting) ─────────────────────────

export async function checkEligibility(id: number | string): Promise<{
  eligible: boolean;
  checks: EligibilityChecks;
  reject_reason: string | null;
}> {
  const { data } = await api.get(`/applications/${id}/check-eligibility`);
  return data;
}

// ─── Helper: Format amount ────────────────────────────────────────────────────

export function formatAmount(amount: number): string {
  return `RM ${amount.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Helper: Format date ──────────────────────────────────────────────────────

export function formatDate(dateString: string | null): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
