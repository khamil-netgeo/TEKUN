// Module 10 — Integrasi API Luaran — Zustand Store

import { create } from 'zustand';
import type { AlertConfig, ApiIntegration, HealthSummary, ServiceMetrics } from '../types';
import { integrasiApiService } from '../integrasiApiService';

interface IntegrasiState {
  integrations: ApiIntegration[];
  summary: HealthSummary | null;
  selectedService: string | null;
  serviceMetrics: ServiceMetrics | null;
  alerts: AlertConfig[];
  loading: boolean;
  metricsLoading: boolean;
  testingService: string | null;
  lastRefreshed: Date | null;
  error: string | null;

  fetchHealth: () => Promise<void>;
  fetchMetrics: (serviceKey: string) => Promise<void>;
  testService: (serviceKey: string) => Promise<void>;
  resetCircuitBreaker: (serviceKey: string) => Promise<void>;
  fetchAlerts: () => Promise<void>;
  updateAlerts: (configs: Partial<AlertConfig>[]) => Promise<void>;
  setSelectedService: (key: string | null) => void;
}

export const useIntegrasiStore = create<IntegrasiState>((set, get) => ({
  integrations: [],
  summary: null,
  selectedService: null,
  serviceMetrics: null,
  alerts: [],
  loading: false,
  metricsLoading: false,
  testingService: null,
  lastRefreshed: null,
  error: null,

  fetchHealth: async () => {
    set({ loading: true, error: null });
    try {
      const data = await integrasiApiService.getHealth();
      set({
        integrations: data.integrations,
        summary: data.summary,
        lastRefreshed: new Date(),
      });
    } catch (error) {
      console.error('Error fetching health:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch health data' });
    } finally {
      set({ loading: false });
    }
  },

  fetchMetrics: async (serviceKey: string) => {
    set({ metricsLoading: true, selectedService: serviceKey, error: null });
    try {
      const res = await integrasiApiService.getMetrics(serviceKey);
      set({ serviceMetrics: res.data });
    } catch (error) {
      console.error('Error fetching metrics:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch service metrics' });
    } finally {
      set({ metricsLoading: false });
    }
  },

  testService: async (serviceKey: string) => {
    set({ testingService: serviceKey, error: null });
    try {
      await integrasiApiService.testService(serviceKey);
      // Refresh health after test
      await get().fetchHealth();
    } catch (error) {
      console.error('Error testing service:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to test service' });
    } finally {
      set({ testingService: null });
    }
  },

  resetCircuitBreaker: async (serviceKey: string) => {
    set({ error: null });
    try {
      await integrasiApiService.resetCircuitBreaker(serviceKey);
      await get().fetchHealth();
    } catch (error) {
      console.error('Error resetting circuit breaker:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to reset circuit breaker' });
    }
  },

  fetchAlerts: async () => {
    set({ error: null });
    try {
      const res = await integrasiApiService.getAlerts();
      set({ alerts: res.data });
    } catch (error) {
      console.error('Error fetching alerts:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch alerts' });
    }
  },

  updateAlerts: async (configs: Partial<AlertConfig>[]) => {
    set({ error: null });
    try {
      await integrasiApiService.updateAlerts(configs);
      await get().fetchAlerts();
    } catch (error) {
      console.error('Error updating alerts:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update alerts' });
    }
  },

  setSelectedService: (key) => set({ selectedService: key, serviceMetrics: null, error: null }),
}));