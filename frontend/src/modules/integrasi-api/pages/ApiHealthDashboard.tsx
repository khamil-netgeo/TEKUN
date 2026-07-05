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
    toast.loading(`Menguji ${serviceKey}...`, { id: `test-${serviceKey}` });
    try {
      await testService(serviceKey);
      toast.success(`Ujian ${serviceKey} berjaya.`, { id: `test-${serviceKey}` });
    } catch {
      toast.error(`Ujian ${serviceKey} gagal.`, { id: `test-${serviceKey}` });
    }
  };

  const handleResetCB = async (serviceKey: string, serviceName: string) => {
    if (!confirm(`Reset circuit breaker untuk ${serviceName}?`)) return;
    try {
      await resetCircuitBreaker(serviceKey);
      toast.success(`Circuit breaker ${serviceName} telah di-reset.`);
    } catch {
      toast.error('Gagal reset circuit breaker. Semak kebenaran anda.');
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
          label: 'API Aktif',
          value: `${summary.ok}/${summary.total}`,
          color: summary.ok === summary.total ? GREEN : ORANGE,
          icon: <CheckCircle size={20} />,
        },
        {
          label: 'API Degraded',
          value: summary.degraded.toString(),
          color: summary.degraded > 0 ? ORANGE : GREEN,
          icon: <AlertTriangle size={20} />,
        },
        {
          label: 'API Down',
          value: summary.down.toString(),
          color: summary.down > 0 ? '#DC2626' : GREEN,
          icon: <XCircle size={20} />,
        },
        {
          label: 'Latensi Purata',
          value: summary.avg_latency_ms ? `${Math.round(summary.avg_latency_ms)}ms` : 'N/A',
          color: (summary.avg_latency_ms ?? 0) > 1000 ? ORANGE : NAVY,
          icon: <Zap size={20} />,
        },
        {
          label: 'Uptime Purata (30H)',
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
            <h1 className="text-xl font-bold">Monitor Kesihatan API Luaran</h1>
            <p className="text-sm text-blue-200 mt-0.5">
              Status masa nyata · 6 integrasi API pihak ketiga
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-xs text-blue-200">
              Dikemas kini: {lastRefreshed.toLocaleTimeString('ms-MY')}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Menyemak...' : 'Muat Semula'}
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
          { key: 'health', label: 'Status API', icon: <Activity size={15} /> },
          { key: 'metrics', label: 'Metrik & Graf', icon: <BarChart2 size={15} /> },
          { key: 'alerts', label: 'Konfigurasi Amaran', icon: <Settings size={15} /> },
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
  if (!integrations.length) {
    return (
      <div className="sppt-card text-center py-12 text-gray-400">
        <Activity size={40} className="mx-auto mb-3 opacity-30" />
        <p>Tiada data integrasi. Sila muat semula.</p>
      </div>
    );
  }

  return (
    <div className="sppt-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 px-3 font-semibold text-gray-600">Perkhidmatan API</th>
            <th className="text-center py-3 px-3 font-semibold text-gray-600">Status</th>
            <th className="text-center py-3 px-3 font-semibold text-gray-600">Circuit Breaker</th>
            <th className="text-right py-3 px-3 font-semibold text-gray-600">Latensi</th>
            <th className="text-left py-3 px-3 font-semibold text-gray-600 min-w-[140px]">Uptime 30H</th>
            <th className="text-center py-3 px-3 font-semibold text-gray-600">Semak Terakhir</th>
            <th className="text-center py-3 px-3 font-semibold text-gray-600">Tindakan</th>
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
                      Reset CB
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
                    Gagal: {new Date(api.last_failure_at).toLocaleTimeString('ms-MY')}
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
                    {testingService === api.service_key ? '⏳' : '▶ Uji'}
                  </button>
                  <button
                    onClick={() => onViewMetrics(api.service_key)}
                    className="px-2.5 py-1 rounded text-xs font-semibold border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    📊 Graf
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
            <div className="font-semibold text-yellow-800 text-sm">Amaran Prestasi API</div>
            <p className="text-xs text-yellow-700 mt-1">
              {integrations
                .filter((a) => a.status !== 'OK')
                .map((a) => `${a.service_name} (${a.status})`)
                .join(', ')}{' '}
              — Sistem menggunakan cache data. Hubungi pasukan IT jika masalah berterusan.
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
          <span className="text-sm font-semibold text-gray-600">Pilih API:</span>
          {integrations.map((api) => (
            <button
              key={api.service_key}
              onClick={() => fetchMetrics(api.service_key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                (selectedService ?? integrations[0]?.service_key) === api.service_key
                  ? 'text-white border-[#1B2B5E]'
                  : 'text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
              style={
                (selectedService ?? integrations[0]?.service_key) === api.service_key
                  ? { background: NAVY }
                  : {}
              }
            >
              {api.service_name}
            </button>
          ))}
        </div>
      </div>

      {metricsLoading ? (
        <div className="sppt-card text-center py-12 text-gray-400">
          <RefreshCw size={32} className="mx-auto mb-3 animate-spin opacity-40" />
          <p>Memuatkan metrik...</p>
        </div>
      ) : serviceMetrics ? (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: 'Latensi Purata (24J)',
                value: serviceMetrics.stats.avg_latency_ms
                  ? `${serviceMetrics.stats.avg_latency_ms}ms`
                  : 'N/A',
                color: (serviceMetrics.stats.avg_latency_ms ?? 0) > 1000 ? ORANGE : GREEN,
              },
              {
                label: 'Latensi Min',
                value: serviceMetrics.stats.min_latency_ms
                  ? `${serviceMetrics.stats.min_latency_ms}ms`
                  : 'N/A',
                color: GREEN,
              },
              {
                label: 'Latensi Maks',
                value: serviceMetrics.stats.max_latency_ms
                  ? `${serviceMetrics.stats.max_latency_ms}ms`
                  : 'N/A',
                color: (serviceMetrics.stats.max_latency_ms ?? 0) > 2000 ? '#DC2626' : ORANGE,
              },
              {
                label: 'Uptime 30 Hari',
                value: `${serviceMetrics.stats.uptime_30d_pct.toFixed(2)}%`,
                color:
                  serviceMetrics.stats.uptime_30d_pct >= 99.5
                    ? GREEN
                    : serviceMetrics.stats.uptime_30d_pct >= 95
                    ? ORANGE
                    : '#DC2626',
              },
            ].map((stat) => (
              <div key={stat.label} className="sppt-card text-center">
                <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
                <div className="text-2xl font-bold" style={{ color: stat.color }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Latency 24H Chart */}
          <div className="sppt-card">
            <h3 className="font-bold text-sm mb-4" style={{ color: NAVY }}>
              📈 Graf Latensi — 24 Jam Terakhir ({currentIntegration?.service_name})
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={serviceMetrics.latency_24h}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 11 }}
                  interval={3}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${v}ms`}
                />
                <Tooltip
                  formatter={(v) => [`${Number(v ?? 0)}ms`, 'Latensi']}
                  labelFormatter={(l) => `Jam ${l}`}
                />
                <ReferenceLine
                  y={1000}
                  stroke={ORANGE}
                  strokeDasharray="4 4"
                  label={{ value: 'Ambang 1000ms', fontSize: 10, fill: ORANGE }}
                />
                <Line
                  type="monotone"
                  dataKey="latency_ms"
                  stroke={NAVY}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Uptime 30D Chart */}
          <div className="sppt-card">
            <h3 className="font-bold text-sm mb-4" style={{ color: NAVY }}>
              📊 Graf Uptime — 30 Hari Terakhir ({currentIntegration?.service_name})
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={serviceMetrics.uptime_30d}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  interval={4}
                />
                <YAxis
                  domain={[90, 100]}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={(v) => [`${Number(v ?? 0)}%`, 'Uptime']}
                  labelFormatter={(l) => `Tarikh ${l}`}
                />
                <ReferenceLine
                  y={99}
                  stroke={ORANGE}
                  strokeDasharray="4 4"
                  label={{ value: 'SLA 99%', fontSize: 10, fill: ORANGE }}
                />
                <Bar
                  dataKey="uptime_pct"
                  fill={GREEN}
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="sppt-card text-center py-12 text-gray-400">
          <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
          <p>Pilih API untuk melihat metrik terperinci.</p>
        </div>
      )}
    </div>
  );
}

// ─── Alerts Tab ───────────────────────────────────────────────────────────────

function AlertsTab() {
  const { alerts, fetchAlerts, updateAlerts } = useIntegrasiStore();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<typeof alerts>([]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    setForm(alerts);
  }, [alerts]);

  const handleSave = async () => {
    try {
      await updateAlerts(form);
      toast.success('Konfigurasi amaran berjaya dikemas kini.');
      setEditMode(false);
    } catch {
      toast.error('Gagal mengemas kini konfigurasi amaran.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="sppt-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm" style={{ color: NAVY }}>
              ⚙️ Konfigurasi Ambang Amaran
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Tetapkan ambang latensi, downtime, dan kadar ralat untuk amaran automatik.
            </p>
          </div>
          <div className="flex gap-2">
            {editMode ? (
              <>
                <button
                  onClick={() => { setEditMode(false); setForm(alerts); }}
                  className="px-3 py-1.5 rounded-lg text-xs border border-gray-300 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 rounded-lg text-xs text-white font-semibold"
                  style={{ background: GREEN }}
                >
                  Simpan
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="px-3 py-1.5 rounded-lg text-xs text-white font-semibold"
                style={{ background: NAVY }}
              >
                ✏️ Edit
              </button>
            )}
          </div>
        </div>

        {form.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            Tiada konfigurasi amaran. Klik Edit untuk menambah.
          </div>
        ) : (
          <div className="space-y-3">
            {form.map((cfg, idx) => (
              <div
                key={cfg.id ?? idx}
                className="p-4 rounded-lg border border-gray-100 bg-gray-50"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-semibold text-sm text-gray-800">
                      {cfg.service_name}
                    </span>
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                      {cfg.alert_type.toUpperCase()}
                    </span>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={cfg.is_active}
                      disabled={!editMode}
                      onChange={(e) => {
                        const updated = [...form];
                        updated[idx] = { ...updated[idx], is_active: e.target.checked };
                        setForm(updated);
                      }}
                      className="rounded"
                    />
                    Aktif
                  </label>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Ambang Latensi (ms)</label>
                    <input
                      type="number"
                      value={cfg.latency_threshold_ms}
                      disabled={!editMode}
                      onChange={(e) => {
                        const updated = [...form];
                        updated[idx] = { ...updated[idx], latency_threshold_ms: +e.target.value };
                        setForm(updated);
                      }}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-sm disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Downtime (minit)</label>
                    <input
                      type="number"
                      value={cfg.downtime_threshold_minutes}
                      disabled={!editMode}
                      onChange={(e) => {
                        const updated = [...form];
                        updated[idx] = {
                          ...updated[idx],
                          downtime_threshold_minutes: +e.target.value,
                        };
                        setForm(updated);
                      }}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-sm disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Kadar Ralat (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={cfg.error_rate_threshold}
                      disabled={!editMode}
                      onChange={(e) => {
                        const updated = [...form];
                        updated[idx] = {
                          ...updated[idx],
                          error_rate_threshold: +e.target.value,
                        };
                        setForm(updated);
                      }}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-sm disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Notifikasi</label>
                    <div className="flex gap-2 mt-1">
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={cfg.notify_email}
                          disabled={!editMode}
                          onChange={(e) => {
                            const updated = [...form];
                            updated[idx] = { ...updated[idx], notify_email: e.target.checked };
                            setForm(updated);
                          }}
                        />
                        Email
                      </label>
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={cfg.notify_sms}
                          disabled={!editMode}
                          onChange={(e) => {
                            const updated = [...form];
                            updated[idx] = { ...updated[idx], notify_sms: e.target.checked };
                            setForm(updated);
                          }}
                        />
                        SMS
                      </label>
                    </div>
                  </div>
                </div>

                {cfg.notify_email_addresses && (
                  <div className="mt-2">
                    <label className="text-xs text-gray-500 block mb-1">Alamat Email</label>
                    <input
                      type="text"
                      value={cfg.notify_email_addresses ?? ''}
                      disabled={!editMode}
                      onChange={(e) => {
                        const updated = [...form];
                        updated[idx] = {
                          ...updated[idx],
                          notify_email_addresses: e.target.value,
                        };
                        setForm(updated);
                      }}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-xs disabled:bg-gray-100"
                      placeholder="email1@tekun.gov.my, email2@tekun.gov.my"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alert Legend */}
      <div className="sppt-card bg-blue-50 border border-blue-100">
        <h4 className="font-semibold text-sm text-blue-800 mb-2">📋 Panduan Ambang Amaran</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-blue-700">
          <div>
            <strong>Latensi:</strong> Amaran dihantar apabila masa tindak balas API melebihi ambang
            yang ditetapkan (contoh: 1000ms).
          </div>
          <div>
            <strong>Downtime:</strong> Amaran dihantar apabila API tidak dapat dihubungi selama
            tempoh yang ditetapkan (contoh: 5 minit).
          </div>
          <div>
            <strong>Kadar Ralat:</strong> Amaran dihantar apabila peratusan kegagalan melebihi
            ambang (contoh: 10% dalam 1 jam).
          </div>
        </div>
      </div>
    </div>
  );
}
