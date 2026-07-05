import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AiBadge } from '@/components/ui/AiBadge';
import toast from 'react-hot-toast';
import {
  Shield, AlertTriangle, Activity, Users, Download,
  Filter, Search, Eye, ChevronLeft, ChevronRight,
  Clock, Globe, Zap, TrendingUp, X
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuditLog {
  id: number;
  user_id: number;
  user_name: string | null;
  user_email: string | null;
  action: string;
  module: string | null;
  auditable_type: string;
  auditable_id: number;
  ip_address: string | null;
  severity: 'info' | 'high' | 'critical';
  is_anomaly: boolean;
  anomaly_reason: string | null;
  created_at: string;
}

interface AuditStats {
  total: number;
  today: number;
  critical: number;
  unique_users: number;
  today_anomalies: number;
  top_anomaly_type: string | null;
  by_action: { action: string; count: number }[];
  by_module: { module: string; count: number }[];
  daily_trend: { date: string; count: number }[];
}

interface Anomaly {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium';
  description: string;
  user_name: string | null;
  module: string;
  action: string;
  ip_address: string | null;
  detected_at: string;
  log_id: number;
}

interface PaginatedLogs {
  data: AuditLog[];
  total: number;
  current_page: number;
  per_page: number;
  last_page: number;
  anomaly_count: number;
}

// ─── API helpers ─────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

async function apiFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

// ─── Severity badge ───────────────────────────────────────────────────────────

const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const map: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 border border-red-200',
    high:     'bg-orange-100 text-orange-700 border border-orange-200',
    info:     'bg-blue-100 text-blue-700 border border-blue-200',
  };
  const labels: Record<string, string> = {
    critical: 'Kritikal',
    high:     'Tinggi',
    info:     'Maklumat',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[severity] ?? map.info}`}>
      {labels[severity] ?? severity}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AuditTrail: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const navigate = useNavigate();

  // ── State ──
  const [logs, setLogs]             = useState<AuditLog[]>([]);
  const [stats, setStats]           = useState<AuditStats | null>(null);
  const [anomalies, setAnomalies]   = useState<Anomaly[]>([]);
  const [loadingLogs, setLoadingLogs]     = useState(true);
  const [loadingStats, setLoadingStats]   = useState(true);
  const [loadingAnomalies, setLoadingAnomalies] = useState(true);
  const [exporting, setExporting]   = useState(false);
  const [showAnomalyPanel, setShowAnomalyPanel] = useState(false);

  // Pagination
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs]   = useState(0);
  const [anomalyCount, setAnomalyCount] = useState(0);

  // Filters
  const [filterModule, setFilterModule] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterFrom, setFilterFrom]     = useState('');
  const [filterTo, setFilterTo]         = useState('');
  const [filterUser, setFilterUser]     = useState('');

  // ── Fetch logs ──
  const fetchLogs = useCallback(async (p: number = 1) => {
    if (!token) return;
    setLoadingLogs(true);
    try {
      const params = new URLSearchParams({ page: String(p), per_page: '20' });
      if (filterModule) params.append('module', filterModule);
      if (filterAction) params.append('action', filterAction);
      if (filterFrom)   params.append('from', filterFrom);
      if (filterTo)     params.append('to', filterTo);
      if (filterUser)   params.append('user_id', filterUser);

      const data = await apiFetch<PaginatedLogs>(`/api/audit-logs?${params}`, token);
      setLogs(data.data);
      setTotalPages(data.last_page);
      setTotalLogs(data.total);
      setAnomalyCount(data.anomaly_count);
      setPage(data.current_page);
    } catch {
      toast.error('Gagal memuatkan log audit.');
    } finally {
      setLoadingLogs(false);
    }
  }, [token, filterModule, filterAction, filterFrom, filterTo, filterUser]);

  // ── Fetch stats ──
  const fetchStats = useCallback(async () => {
    if (!token) return;
    setLoadingStats(true);
    try {
      const data = await apiFetch<AuditStats>('/api/audit-logs/stats', token);
      setStats(data);
    } catch {
      // Stats only available to privileged users — silently skip
    } finally {
      setLoadingStats(false);
    }
  }, [token]);

  // ── Fetch anomalies ──
  const fetchAnomalies = useCallback(async () => {
    if (!token) return;
    setLoadingAnomalies(true);
    try {
      const data = await apiFetch<{ anomalies: Anomaly[]; total: number }>(
        '/api/audit-logs/anomalies', token
      );
      setAnomalies(data.anomalies);
    } catch {
      // Anomalies only available to privileged users — silently skip
    } finally {
      setLoadingAnomalies(false);
    }
  }, [token]);

  useEffect(() => {
    fetchLogs(1);
    fetchStats();
    fetchAnomalies();
  }, [fetchLogs, fetchStats, fetchAnomalies]);

  // ── Export ──
  const handleExport = async () => {
    if (!token) return;
    setExporting(true);
    try {
      const body = {
        from:   filterFrom || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
        to:     filterTo   || new Date().toISOString().slice(0, 10),
        format: 'pdf',
      };
      const data = await apiFetch<{ pdf_url: string; report_id: string }>(
        '/api/audit-logs/export', token,
        { method: 'POST', body: JSON.stringify(body) }
      );
      toast.success(`Laporan ${data.report_id} berjaya dijana.`);
      window.open(data.pdf_url, '_blank');
    } catch {
      toast.error('Gagal mengeksport laporan. Semak kebenaran anda.');
    } finally {
      setExporting(false);
    }
  };

  // ── Apply filters ──
  const applyFilters = () => fetchLogs(1);
  const clearFilters = () => {
    setFilterModule('');
    setFilterAction('');
    setFilterFrom('');
    setFilterTo('');
    setFilterUser('');
    setTimeout(() => fetchLogs(1), 50);
  };

  // ── Render ──
  return (
    <div className="flex-1 bg-gray-50 min-h-screen">
      <PageHeader
        title="Audit & Kawalan Dalaman"
        subtitle="Jejak audit tidak boleh diubah — siapa, apa, bila, di mana"
        actions={
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-[#1B2B5E] text-white rounded-lg hover:bg-[#162347] transition-colors text-sm font-medium disabled:opacity-60"
          >
            <Download size={16} />
            {exporting ? 'Menjana...' : 'Eksport Laporan BNM'}
          </button>
        }
      />

      <div className="p-6 space-y-6">

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loadingStats ? (
            <div className="col-span-4 flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <StatCard
                title="Jumlah Log"
                value={stats?.total ?? totalLogs}
                icon={<Shield size={20} className="text-[#1B2B5E]" />}
                color="navy"
              />
              <StatCard
                title="Log Hari Ini"
                value={stats?.today ?? 0}
                icon={<Activity size={20} className="text-[#2E7D32]" />}
                color="green"
              />
              <StatCard
                title="Tindakan Kritikal"
                value={stats?.critical ?? 0}
                icon={<AlertTriangle size={20} className="text-[#C62828]" />}
                color="red"
              />
              <StatCard
                title="Pengguna Unik"
                value={stats?.unique_users ?? 0}
                icon={<Users size={20} className="text-[#673AB7]" />}
                color="purple"
              />
            </>
          )}
        </div>

        {/* ── AI Anomaly Summary Panel ── */}
        {!loadingAnomalies && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#673AB7] flex items-center justify-center flex-shrink-0">
                  <Zap size={18} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#673AB7] text-sm">Enjin AI SPPT — Pengesanan Anomali</span>
                    <AiBadge label="AI" />
                  </div>
                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                    <span className="text-sm text-gray-700">
                      <span className="font-bold text-[#C62828]">{stats?.today_anomalies ?? anomalyCount}</span> anomali dikesan hari ini
                    </span>
                    {stats?.top_anomaly_type && (
                      <span className="text-sm text-gray-600">
                        Paling kerap: <span className="font-medium text-[#673AB7]">{stats.top_anomaly_type}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowAnomalyPanel(!showAnomalyPanel)}
                className="flex items-center gap-2 px-4 py-2 bg-[#673AB7] text-white rounded-lg hover:bg-purple-800 transition-colors text-sm font-medium"
              >
                <Eye size={14} />
                {showAnomalyPanel ? 'Sembunyikan' : 'Lihat Semua Anomali'}
              </button>
            </div>

            {/* Anomaly list (expandable) */}
            {showAnomalyPanel && (
              <div className="mt-4 space-y-2 max-h-72 overflow-y-auto">
                {anomalies.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Tiada anomali dikesan.</p>
                ) : (
                  anomalies.map((a) => (
                    <div
                      key={a.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        a.severity === 'critical'
                          ? 'bg-red-50 border-red-200'
                          : a.severity === 'high'
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      <AlertTriangle
                        size={16}
                        className={
                          a.severity === 'critical' ? 'text-red-600 mt-0.5 flex-shrink-0'
                          : a.severity === 'high'   ? 'text-orange-600 mt-0.5 flex-shrink-0'
                          : 'text-yellow-600 mt-0.5 flex-shrink-0'
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{a.description}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1"><Globe size={10} />{a.ip_address ?? 'N/A'}</span>
                          <span className="flex items-center gap-1"><Clock size={10} />{new Date(a.detected_at).toLocaleString('ms-MY')}</span>
                          <span className="flex items-center gap-1"><Shield size={10} />{a.module}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/audit-kawalan/${a.log_id}`)}
                        className="text-xs text-[#673AB7] hover:underline flex-shrink-0"
                      >
                        Lihat Log
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Filters ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Penapis Log Audit</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <input
              type="text"
              placeholder="Modul (cth: auth)"
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]"
            />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E] bg-white"
            >
              <option value="">Semua Tindakan</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="create">Cipta</option>
              <option value="update">Kemaskini</option>
              <option value="delete">Padam</option>
              <option value="export">Eksport</option>
              <option value="role_change">Tukar Peranan</option>
              <option value="admin_access">Akses Pentadbir</option>
            </select>
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]"
            />
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]"
            />
            <div className="flex gap-2">
              <button
                onClick={applyFilters}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#1B2B5E] text-white rounded-lg hover:bg-[#162347] transition-colors text-sm"
              >
                <Search size={14} />
                Cari
              </button>
              <button
                onClick={clearFilters}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600"
                title="Kosongkan penapis"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Audit Log Table ── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-[#1B2B5E]" />
              <span className="text-sm font-semibold text-gray-800">
                Log Audit ({totalLogs.toLocaleString('ms-MY')} rekod)
              </span>
              {anomalyCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  <Zap size={10} />
                  {anomalyCount} anomali
                </span>
              )}
            </div>
          </div>

          {loadingLogs ? (
            <div className="flex justify-center items-center py-16">
              <LoadingSpinner />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Shield size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Tiada log audit dijumpai.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Masa</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pengguna</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tindakan</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Modul</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Alamat IP</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tahap</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status AI</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                        log.is_anomaly ? 'bg-purple-50 hover:bg-purple-100' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('ms-MY', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{log.user_name ?? `#${log.user_id}`}</div>
                        {log.user_email && (
                          <div className="text-xs text-gray-400">{log.user_email}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{log.module ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.ip_address ?? '—'}</td>
                      <td className="px-4 py-3">
                        <SeverityBadge severity={log.severity} />
                      </td>
                      <td className="px-4 py-3">
                        {log.is_anomaly ? (
                          <div className="relative group">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 border border-red-200 rounded text-xs font-medium cursor-help">
                              <AlertTriangle size={10} />
                              ⚠ Anomali Dikesan
                            </span>
                            {log.anomaly_reason && (
                              <div className="absolute bottom-full left-0 mb-1 w-64 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                <p className="font-semibold mb-1 text-purple-300">Enjin AI SPPT</p>
                                <p>{log.anomaly_reason}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/audit-kawalan/${log.id}`)}
                          className="text-[#1B2B5E] hover:text-[#162347] transition-colors"
                          title="Lihat butiran"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loadingLogs && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                Halaman {page} daripada {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchLogs(page - 1)}
                  disabled={page <= 1}
                  className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => fetchLogs(page + 1)}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AuditTrail;
