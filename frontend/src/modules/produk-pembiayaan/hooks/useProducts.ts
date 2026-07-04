// Module 9 — Produk Pembiayaan
// React hooks for financing product data management.

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import type { FinancingProduct, ProductUpdatePayload, EligibilityCheckParams, EligibilityCheckResult } from '../types';
import {
  getProducts,
  getProduct,
  updateProduct,
  activateProduct,
  checkEligibility,
  checkEligibilityAll,
} from '../services/productService';

// ── useProductList ────────────────────────────────────────────────────────────

export function useProductList() {
  const [products, setProducts] = useState<FinancingProduct[]>([]);
  const [meta, setMeta] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getProducts();
      setProducts(result.data);
      setMeta(result.meta);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal memuatkan senarai produk.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, meta, loading, error, refetch: fetchProducts };
}

// ── useProduct ────────────────────────────────────────────────────────────────

export function useProduct(id: number | null) {
  const [product, setProduct] = useState<FinancingProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async (productId: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getProduct(productId);
      setProduct(result);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal memuatkan maklumat produk.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id !== null) {
      fetchProduct(id);
    }
  }, [id, fetchProduct]);

  return { product, loading, error, refetch: () => id !== null && fetchProduct(id) };
}

// ── useProductActions ─────────────────────────────────────────────────────────

export function useProductActions(onSuccess?: () => void) {
  const [saving, setSaving] = useState(false);

  const handleUpdate = useCallback(async (id: number, payload: ProductUpdatePayload) => {
    setSaving(true);
    try {
      await updateProduct(id, payload);
      toast.success('Konfigurasi produk berjaya dikemaskini.');
      onSuccess?.();
      return true;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal mengemaskini produk.';
      toast.error(msg);
      return false;
    } finally {
      setSaving(false);
    }
  }, [onSuccess]);

  const handleToggleActivation = useCallback(async (
    id: number,
    action: 'activate' | 'deactivate',
    notes?: string,
  ) => {
    setSaving(true);
    try {
      const result = await activateProduct(id, action, notes);
      toast.success(result.message);
      onSuccess?.();
      return true;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal mengubah status produk.';
      toast.error(msg);
      return false;
    } finally {
      setSaving(false);
    }
  }, [onSuccess]);

  return { saving, handleUpdate, handleToggleActivation };
}

// ── useEligibilityChecker ─────────────────────────────────────────────────────

export function useEligibilityChecker() {
  const [results, setResults] = useState<EligibilityCheckResult[]>([]);
  const [singleResult, setSingleResult] = useState<EligibilityCheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSingle = useCallback(async (productId: number, params: EligibilityCheckParams) => {
    setChecking(true);
    setError(null);
    setSingleResult(null);
    try {
      const result = await checkEligibility(productId, params);
      setSingleResult(result);
      return result;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal menyemak kelayakan.';
      setError(msg);
      return null;
    } finally {
      setChecking(false);
    }
  }, []);

  const checkAll = useCallback(async (params: EligibilityCheckParams) => {
    setChecking(true);
    setError(null);
    setResults([]);
    try {
      const response = await checkEligibilityAll(params);
      setResults(response.data);
      return response;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal menyemak kelayakan.';
      setError(msg);
      return null;
    } finally {
      setChecking(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResults([]);
    setSingleResult(null);
    setError(null);
  }, []);

  return { results, singleResult, checking, error, checkSingle, checkAll, reset };
}
