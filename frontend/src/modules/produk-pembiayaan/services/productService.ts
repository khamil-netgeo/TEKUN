// Module 9 — Produk Pembiayaan
// API service functions for financing product management.

import api from '@/services/api';
import type {
  FinancingProduct,
  ProductListMeta,
  ProductUpdatePayload,
  EligibilityCheckParams,
  EligibilityCheckResult,
  ProductAuditLog,
} from '../types';

interface ProductListResponse {
  data: FinancingProduct[];
  meta: ProductListMeta;
}

interface ProductDetailResponse {
  data: FinancingProduct;
}

interface ActivationResponse {
  message: string;
  data: {
    id: number;
    is_active: boolean;
    activated_at: string | null;
    deactivated_at: string | null;
  };
}

interface EligibilityCheckResponse {
  data: EligibilityCheckResult;
}

interface EligibilityCheckAllResponse {
  data: EligibilityCheckResult[];
  meta: {
    eligible_count: number;
    ineligible_count: number;
  };
}

// ── Product catalog ──────────────────────────────────────────────────────────

export const getProducts = async (activeOnly = false): Promise<ProductListResponse> => {
  const params = activeOnly ? { active_only: 1 } : {};
  const { data } = await api.get<ProductListResponse>('/products', { params });
  return data;
};

export const getProduct = async (id: number): Promise<FinancingProduct> => {
  const { data } = await api.get<ProductDetailResponse>(`/products/${id}`);
  return data.data;
};

// ── Product configuration ────────────────────────────────────────────────────

export const updateProduct = async (
  id: number,
  payload: ProductUpdatePayload,
): Promise<FinancingProduct> => {
  const { data } = await api.put<ProductDetailResponse>(`/products/${id}`, payload);
  return data.data;
};

// ── Activation / deactivation ────────────────────────────────────────────────

export const activateProduct = async (
  id: number,
  action: 'activate' | 'deactivate',
  notes?: string,
): Promise<ActivationResponse> => {
  const { data } = await api.post<ActivationResponse>(`/products/${id}/activate`, {
    action,
    notes,
  });
  return data;
};

// ── Eligibility rule engine ──────────────────────────────────────────────────

export const checkEligibility = async (
  productId: number,
  params: EligibilityCheckParams,
): Promise<EligibilityCheckResult> => {
  const { data } = await api.get<EligibilityCheckResponse>(
    `/products/${productId}/eligibility-check`,
    { params: params as Record<string, unknown> },
  );
  return data.data;
};

export const checkEligibilityAll = async (
  params: EligibilityCheckParams,
): Promise<EligibilityCheckAllResponse> => {
  const { data } = await api.get<EligibilityCheckAllResponse>(
    '/products/eligibility-check-all',
    { params: params as Record<string, unknown> },
  );
  return data;
};

// ── Audit log ────────────────────────────────────────────────────────────────

export const getProductAuditLogs = async (
  productId: number,
  page = 1,
  perPage = 20,
): Promise<{ data: ProductAuditLog[]; total: number; per_page: number; current_page: number }> => {
  const { data } = await api.get(`/products/${productId}/audit-logs`, {
    params: { page, per_page: perPage },
  });
  return data;
};
