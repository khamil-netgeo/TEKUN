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

  fetchHealth: async () => {
    set({ loading: true });
    try {
      const data = await integrasiApiService.getHealth();
      set({
        integrations: data.integrations,
        summary: data.summary,
        lastRefreshed: new Date(),
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchMetrics: async (serviceKey: string) => {
    set({ metricsLoading: true, selectedService: serviceKey });
    try {
      const res = await integrasiApiService.getMetrics(serviceKey);
      set({ serviceMetrics: res.data });
    } finally {
      set({ metricsLoading: false });
    }
  },

  testService: async (serviceKey: string) => {
    set({ testingService: serviceKey });
    try {
      await integrasiApiService.testService(serviceKey);
      // Refresh health after test
      await get().fetchHealth();
    } finally {
      set({ testingService: null });
    }
  },

  resetCircuitBreaker: async (serviceKey: string) => {
    await integrasiApiService.resetCircuitBreaker(serviceKey);
    await get().fetchHealth();
  },

  fetchAlerts: async () => {
    const res = await integrasiApiService.getAlerts();
    set({ alerts: res.data });
  },

  updateAlerts: async (configs: Partial<AlertConfig>[]) => {
    await integrasiApiService.updateAlerts(configs);
    await get().fetchAlerts();
  },

  setSelectedService: (key) => set({ selectedService: key, serviceMetrics: null }),
}));
