// Module 10 — API Health Dashboard
// Real-time monitoring of 6 external APIs with circuit breaker visualization

import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, RefreshCw, AlertTriangle, CheckCircle, XCircle, Zap, BarChart2, Settings } from 'lucide-react';
import { useIntegrasiStore } from '../store/integrasiStore';
import { CircuitBreakerBadge } from '../components/CircuitBreakerBadge';
import { StatusBadge } from '../components/StatusBadge';
import { LatencyGauge } from '../components/LatencyGauge';
import { UptimeBar } from '../components/UptimeBar';
import type { ApiIntegration } from '../types';
import toast from 'react-hot-toast';

const NAVY = '#1B2B5E';
const GREEN = '#2E7D32';
const ORANGE = '#E65100';

// Auto-refresh interval in ms
const REFRESH_INTERVAL = 30_000;

export default function ApiHealthDashboard() {
  const { t } = useTranslation();
  const {
    integrations,
    summary,
    loading,
    testingService,
    lastRefreshed,
    fetchHealth,
    testService,
    resetCircuitBreaker,
    setSelectedService,
  } = useIntegrasiStore();

  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'health' | 'metrics' | 'alerts'>('health');

  const refresh = useCallback(async () => {
    await fetchHealth();
  }, [fetchHealth]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleTest = async (serviceKey: string) => {
    toast.loading(t('api_health.testing', { service: serviceKey }), { id: `test-${serviceKey}` });
    try {
      await testService(serviceKey);
      toast.success(t('api_health.test_success', { service: serviceKey }), { id: `test-${serviceKey}` });
    } catch {
      toast.error(t('api_health.test_failed', { service: serviceKey }), { id: `test-${serviceKey}` });
    }
  };

  const handleResetCB = async (serviceKey: string, serviceName: string) => {
    if (!confirm(t('api_health.reset_cb_confirm', { service: serviceName }))) return;
    try {
      await resetCircuitBreaker(serviceKey);
      toast.success(t('api_health.reset_cb_success', { service: serviceName }));
    } catch {
      toast.error(t('api_health.reset_cb_failed'));
    }
  };

  const handleViewMetrics = (serviceKey: string) => {
    setSelectedService(serviceKey);
    setSelectedRow(serviceKey);
    setActiveTab('metrics');
  };

  // Summary KPI cards
  const kpis = summary
    ? [
        {
          label: t('api_health.active_api'),
          value: `${summary.ok}/${summary.total}`,
          color: summary.ok === summary.total ? GREEN : ORANGE,
          icon: <CheckCircle size={20} />,
        },
        {
          label: t('api_health.degraded_api'),
          value: summary.degraded.toString(),
          color: summary.degraded > 0 ? ORANGE : GREEN,
          icon: <AlertTriangle size={20} />,
        },
        {
          label: t('api_health.down_api'),
          value: summary.down.toString(),
          color: summary.down > 0 ? '#DC2626' : GREEN,
          icon: <XCircle size={20} />,
        },
        {
          label: t('api_health.avg_latency'),
          value: summary.avg_latency_ms ? `${Math.round(summary.avg_latency_ms)}ms` : 'N/A',
          color: (summary.avg_latency_ms ?? 0) > 1000 ? ORANGE : NAVY,
          icon: <Zap size={20} />,
        },
        {
          label: t('api_health.avg_uptime'),
          value: summary.avg_uptime_30d ? `${summary.avg_uptime_30d.toFixed(1)}%` : 'N/A',
          color: (summary.avg_uptime_30d ?? 100) < 99 ? ORANGE : GREEN,
          icon: <Activity size={20} />,
        },
      ]
    : [];

  return (
    <div className="space-y-5 pb-8">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div
        className="rounded-xl p-5 text-white flex items-center justify-between"
        style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #2a3f7e 100%)` }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t('api_health.title')}</h1>
            <p className="text-sm text-blue-200 mt-0.5">
              {t('api_health.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-xs text-blue-200">
              {t('api_health.updated_at')}: {lastRefreshed.toLocaleTimeString('ms-MY')}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? t('common.checking') : t('common.refresh')}
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ────────────────────────────────────────────── */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="sppt-card flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-50" style={{ color: kpi.color }}>
                {kpi.icon}
              </div>
              <div>
                <div className="text-xs text-gray-500">{kpi.label}</div>
                <div className="text-xl font-bold" style={{ color: kpi.color }}>
                  {kpi.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab Navigation ───────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { key: 'health', label: t('api_health.tab_status'), icon: <Activity size={15} /> },
          { key: 'metrics', label: t('api_health.tab_metrics'), icon: <BarChart2 size={15} /> },
          { key: 'alerts', label: t('api_health.tab_alerts'), icon: <Settings size={15} /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-[#1B2B5E] text-[#1B2B5E]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Status API ──────────────────────────────────────────────── */}
      {activeTab === 'health' && (
        <ApiStatusTable
          integrations={integrations}
          testingService={testingService}
          onTest={handleTest}
          onResetCB={handleResetCB}
          onViewMetrics={handleViewMetrics}
          selectedRow={selectedRow}
        />
      )}

      {/* ── Tab: Metrik & Graf ───────────────────────────────────────────── */}
      {activeTab === 'metrics' && (
        <MetricsTab integrations={integrations} />
      )}

      {/* ── Tab: Konfigurasi Amaran ──────────────────────────────────────── */}
      {activeTab === 'alerts' && (
        <AlertsTab />
      )}
    </div>
  );
}

// ─── API Status Table ─────────────────────────────────────────────────────────

interface TableProps {
  integrations: ApiIntegration[];
  testingService: string | null;
  selectedRow: string | null;
  onTest: (key: string) => void;
  onResetCB: (key: string, name: string) => void;
  onViewMetrics: (key: string) => void;
}

function ApiStatusTable({
  integrations,
  testingService,
  selectedRow,
  onTest,
  onResetCB,
  onViewMetrics,
}: TableProps) {
  const { t } = useTranslation();

  if (!integrations.length) {
    return (
      <div className="sppt-card text-center py-12 text-gray-400">
        <Activity size={40} className="mx-auto mb-3 opacity-30" />
        <p>{t('api_health.no_data')}</p>
      </div>
    );
  }

  return (
    <div className="sppt-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 px-3 font-semibold text-gray-600">{t('api_health.api_service')}</th>
            <th className="text-center py-3 px-3 font-semibold text-gray-600">{t('common.status')}</th>
            <th className="text-center py-3 px-3 font-semibold text-gray-600">{t('api_health.circuit_breaker')}</th>
            <th className="text-right py-3 px-3 font-semibold text-gray-600">{t('api_health.latency')}</th>
            <th className="text-left py-3 px-3 font-semibold text-gray-600 min-w-[140px]">{t('api_health.uptime')}</th>
            <th className="text-center py-3 px-3 font-semibold text-gray-600">{t('api_health.last_checked')}</th>
            <th className="text-center py-3 px-3 font-semibold text-gray-600">{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {integrations.map((api) => (
            <tr
              key={api.service_key}
              className={`border-b border-gray-50 hover:bg-blue-50/30 transition-colors ${
                selectedRow === api.service_key ? 'bg-blue-50/50' : ''
              }`}
            >
              {/* Service Name */}
              <td className="py-3 px-3">
                <div className="font-semibold text-gray-800">{api.service_name}</div>
                <div className="text-xs text-gray-400 font-mono">{api.service_key}</div>
                {api.description && (
                  <div className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate">
                    {api.description}
                  </div>
                )}
              </td>

              {/* Status */}
              <td className="py-3 px-3 text-center">
                <StatusBadge status={api.status} />
              </td>

              {/* Circuit Breaker */}
              <td className="py-3 px-3 text-center">
                <div className="flex flex-col items-center gap-1">
                  <CircuitBreakerBadge
                    state={api.circuit_breaker_state}
                    failures={api.circuit_breaker_failures}
                    threshold={api.circuit_breaker_threshold}
                  />
                  {api.circuit_breaker_state !== 'CLOSED' && (
                    <button
                      onClick={() => onResetCB(api.service_key, api.service_name)}
                      className="text-xs text-orange-600 hover:text-orange-800 underline"
                    >
                      {t('api_health.reset_cb')}
                    </button>
                  )}
                </div>
              </td>

              {/* Latency */}
              <td className="py-3 px-3">
                <LatencyGauge latencyMs={api.latency_ms} showLabel />
              </td>

              {/* Uptime */}
              <td className="py-3 px-3">
                <UptimeBar uptime={api.uptime_30d} />
              </td>

              {/* Last Checked */}
              <td className="py-3 px-3 text-center">
                <div className="text-xs text-gray-500">
                  {api.last_checked_at
                    ? new Date(api.last_checked_at).toLocaleTimeString('ms-MY')
                    : '—'}
                </div>
                {api.last_failure_at && api.status !== 'OK' && (
                  <div className="text-xs text-red-400 mt-0.5">
                    {t('api_health.failed_at')}: {new Date(api.last_failure_at).toLocaleTimeString('ms-MY')}
                  </div>
                )}
              </td>

              {/* Actions */}
              <td className="py-3 px-3">
                <div className="flex items-center gap-1.5 justify-center">
                  <button
                    onClick={() => onTest(api.service_key)}
                    disabled={testingService === api.service_key}
                    className="px-2.5 py-1 rounded text-xs font-semibold text-white disabled:opacity-50 transition-opacity"
                    style={{ background: NAVY }}
                  >
                    {testingService === api.service_key ? '⏳' : `▶ ${t('api_health.test_btn')}`}
                  </button>
                  <button
                    onClick={() => onViewMetrics(api.service_key)}
                    className="px-2.5 py-1 rounded text-xs font-semibold border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    📊 {t('api_health.graph_btn')}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Degraded API Alert Banner */}
      {integrations.some((a) => a.status === 'DEGRADED' || a.status === 'DOWN') && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertTriangle size={18} className="text-yellow-600 mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold text-yellow-800 text-sm">{t('api_health.alert_title')}</div>
            <p className="text-xs text-yellow-700 mt-1">
              {integrations
                .filter((a) => a.status !== 'OK')
                .map((a) => `${a.service_name} (${a.status})`)
                .join(', ')}{' '}
              — {t('api_health.alert_desc')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Metrics Tab ──────────────────────────────────────────────────────────────

import { useIntegrasiStore as useStore } from '../store/integrasiStore';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

function MetricsTab({ integrations }: { integrations: ApiIntegration[] }) {
  const { t } = useTranslation();
  const { selectedService, serviceMetrics, metricsLoading, fetchMetrics } = useStore();

  useEffect(() => {
    if (selectedService) {
      fetchMetrics(selectedService);
    } else if (integrations.length > 0) {
      fetchMetrics(integrations[0].service_key);
    }
  }, [selectedService, integrations, fetchMetrics]);

  const currentIntegration = integrations.find(
    (i) => i.service_key === (selectedService ?? integrations[0]?.service_key)
  );

  return (
    <div className="space-y-4">
      {/* Service Selector */}
      <div className="sppt-card">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-gray-600">{t('api_health.select_api')}</span>
          {integrations.map((api) => (
            <button
              key={api.service_key}
              onClick={() => fetchMetrics(api.service_key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                (selectedService ?? integrations[0]?.service_key) === api.service_key
                  ? 'text-white border-[#1B2B5E] bg-[#1B2B5E]'
                  : 'text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {api.service_name}
            </button>
          ))}
        </div>
      </div>

      <div className="sppt-card p-4 h-[400px]">
        {metricsLoading ? (
          <div className="flex h-full items-center justify-center text-gray-400">
            <Activity className="animate-spin mr-2" /> {t('common.loading')}
          </div>
        ) : serviceMetrics && serviceMetrics.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={serviceMetrics}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line type="monotone" dataKey="latency" stroke="#1B2B5E" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            {t('api_health.no_metrics')}
          </div>
        )}
      </div>
    </div>
  );
}

function AlertsTab() {
  const { t } = useTranslation();
  return (
    <div className="sppt-card p-8 text-center text-gray-500">
      <Settings size={48} className="mx-auto mb-4 opacity-20" />
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('api_health.alerts_title')}</h3>
      <p>{t('api_health.alerts_desc')}</p>
    </div>
  );
}