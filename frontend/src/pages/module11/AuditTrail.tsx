import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AiBadge } from '@/components/ui/AiBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// ─── Types ────────────────────────────────────────────────────────────────────
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
  severity: 'critical' | 'high' | 'medium' | 'info';
  created_at: string;
}

interface AuditStats {
  total: number;
  today: number;
  critical: number;
  unique_users: number;
  by_action: { action: string; count: number }[];
  by_module: { module: string; count: number }[];
  daily_trend: { date: string; count: number }[];
}

interface Anomaly {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'info';
  description: string;
  user_name: string | null;
  module: string;
  action: string;
  ip_address: string | null;
  detected_at: string;
  ai_model: string;
}

interface AnomalyResponse {
  anomalies: Anomaly[];
  total: number;
  critical: number;
  high: number;
  medium: number;
  ai_model: string;
}

interface PaginatedLogs {
  data: AuditLog[];
  total: number;
  current_page: number;
  per_page: number;
  last_page: number;
  anomaly_count: number;
}

// ─── Severity badge ───────────────────────────────────────────────────────────
const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const map: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 border border-red-300',
    high:     'bg-orange-100 text-orange-700 border border-orange-300',
    medium:   'bg-yellow-100 text-yellow-700 border border-yellow-300',
    info:     'bg-blue-100 text-blue-600 border border-blue-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[severity] ?? map.info}`}>
      {severity.toUpperCase()}
    </span>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function AuditTrail() {
  const { token } = useAuth();

  // State
  const [logs, setLogs]             = useState<AuditLog[]>([]);
  const [stats, setStats]           = useState<AuditStats | null>(null);
  const [anomalies, setAnomalies]   = useState<Anomaly[]>([]);
  const [anomalyMeta, setAnomalyMeta] = useState<Omit<AnomalyResponse, 'anomalies'> | null>(null);
  const [loading, setLoading]       = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [anomalyLoading, setAnomalyLoading] = useState(true);
  const [error, setError]           = useState<string | null>(null);

  // Filters
  const [search, setSearch]         = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [fromDate, setFromDate]     = useState('');
  const [toDate, setToDate]         = useState('');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs]   = useState(0);
  const [anomalyCount, setAnomalyCount] = useState(0);

  // Active tab
  const [activeTab, setActiveTab]   = useState<'logs' | 'anomalies'>('logs');

  const apiBase = import.meta.env.VITE_API_URL ?? 'http://34.177.95.116:8000';
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // ── Fetch logs ──────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: '20' });
      if (actionFilter) params.set('action', actionFilter);
      if (moduleFilter) params.set('module', moduleFilter);
      if (fromDate)     params.set('from', fromDate);
      if (toDate)       params.set('to', toDate);

      const res = await fetch(`${apiBase}/api/audit-logs?${params}`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PaginatedLogs = await res.json();
      setLogs(data.data);
      setTotalPages(data.last_page);
      setTotalLogs(data.total);
      setAnomalyCount(data.anomaly_count ?? 0);
    } catch (err) {
      setError('Gagal memuatkan log audit. Sila cuba semula.');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, moduleFilter, fromDate, toDate, token]);

  // ── Fetch stats ─────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/audit-logs/stats`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AuditStats = await res.json();
      setStats(data);
    } catch {
      // Stats failure is non-critical
    } finally {
      setStatsLoading(false);
    }
  }, [token]);

  // ── Fetch anomalies ─────────────────────────────────────────────────────────
  const fetchAnomalies = useCallback(async () => {
    setAnomalyLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/audit-logs/anomalies`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AnomalyResponse = await res.json();
      setAnomalies(data.anomalies);
      setAnomalyMeta({ total: data.total, critical: data.critical, high: data.high, medium: data.medium, ai_model: data.ai_model, generated_at: (data as any).generated_at });
    } catch {
      // Anomaly fetch failure is non-critical
    } finally {
      setAnomalyLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchLogs(); },     [fetchLogs]);
  useEffect(() => { fetchStats(); },    [fetchStats]);
  useEffect(() => { fetchAnomalies(); }, [fetchAnomalies]);

  // ── Export handler ──────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const res = await fetch(`${apiBase}/api/audit-logs/export`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ from: fromDate || undefined, to: toDate || undefined, format: 'pdf' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.pdf_url) window.open(data.pdf_url, '_blank');
      alert(`Laporan dijana: ${data.report_id}`);
    } catch {
      alert('Gagal menjana laporan. Sila cuba semula.');
    }
  };

  // ── Filtered logs (client-side search) ─────────────────────────────────────
  const filteredLogs = logs.filter(l =>
    !search ||
    (l.user_name?.toLowerCase().includes(search.toLowerCase()) ||
     l.action.toLowerCase().includes(search.toLowerCase()) ||
     l.module?.toLowerCase().includes(search.toLowerCase()) ||
     l.ip_address?.includes(search))
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="sppt-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1B2B5E' }}>
              Jejak Audit — Kawalan Dalaman
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Log tidak boleh diubah: siapa, apa, bila, di mana, sebelum dan selepas
            </p>
          </div>
          <button
            onClick={handleExport}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg"
            style={{ background: '#1B2B5E' }}
          >
            Eksport Laporan BNM
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statsLoading ? (
          <div className="col-span-4 flex justify-center py-4"><LoadingSpinner /></div>
        ) : (
          <>
            <div className="sppt-card text-center">
              <div className="text-xs text-gray-500 mb-1">Log Hari Ini</div>
              <div className="text-2xl font-bold" style={{ color: '#1B2B5E' }}>
                {stats?.today ?? 0}
              </div>
            </div>
            <div className="sppt-card text-center">
              <div className="text-xs text-gray-500 mb-1">Tindakan Kritikal</div>
              <div className="text-2xl font-bold text-red-600">
                {stats?.critical ?? 0}
              </div>
            </div>
            <div className="sppt-card text-center">
              <div className="text-xs text-gray-500 mb-1">Pengguna Unik</div>
              <div className="text-2xl font-bold text-green-600">
                {stats?.unique_users ?? 0}
              </div>
            </div>
            <div className="sppt-card text-center">
              <div className="text-xs text-gray-500 mb-1">Anomali Dikesan AI</div>
              <div className="text-2xl font-bold" style={{ color: '#673AB7' }}>
                {anomalyCount}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['logs', 'anomalies'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'logs' ? 'Log Audit' : (
              <span className="flex items-center gap-1">
                Anomali AI
                {anomalies.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                    {anomalies.length}
                  </span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Audit Logs ── */}
      {activeTab === 'logs' && (
        <div className="sppt-card">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari pengguna, tindakan, modul, IP..."
              className="flex-1 min-w-[200px] p-2 border border-gray-300 rounded text-sm"
            />
            <select
              value={actionFilter}
              onChange={e => { setActionFilter(e.target.value); setPage(1); }}
              className="p-2 border border-gray-300 rounded text-sm"
            >
              <option value="">Semua Tindakan</option>
              {['login', 'logout', 'create', 'update', 'delete', 'approve', 'reject', 'export', 'view'].map(a => (
                <option key={a} value={a}>{a.toUpperCase()}</option>
              ))}
            </select>
            <input
              type="date" value={fromDate}
              onChange={e => { setFromDate(e.target.value); setPage(1); }}
              className="p-2 border border-gray-300 rounded text-sm"
            />
            <input
              type="date" value={toDate}
              onChange={e => { setToDate(e.target.value); setPage(1); }}
              className="p-2 border border-gray-300 rounded text-sm"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-200">
                      <th className="py-2 px-3 font-semibold text-gray-600">Pengguna</th>
                      <th className="py-2 px-3 font-semibold text-gray-600">Tindakan</th>
                      <th className="py-2 px-3 font-semibold text-gray-600">Modul</th>
                      <th className="py-2 px-3 font-semibold text-gray-600">Tahap</th>
                      <th className="py-2 px-3 font-semibold text-gray-600">IP</th>
                      <th className="py-2 px-3 font-semibold text-gray-600">Masa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-400">
                          Tiada log ditemui.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map(log => (
                        <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3">
                            <div className="font-medium text-gray-800">{log.user_name ?? `#${log.user_id}`}</div>
                            <div className="text-xs text-gray-400">{log.user_email}</div>
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700">
                              {log.action.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-gray-600">{log.module ?? '-'}</td>
                          <td className="py-2 px-3">
                            <SeverityBadge severity={log.severity} />
                          </td>
                          <td className="py-2 px-3 text-gray-500 font-mono text-xs">{log.ip_address ?? '-'}</td>
                          <td className="py-2 px-3 text-gray-500 text-xs">
                            {new Date(log.created_at).toLocaleString('ms-MY')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                <span>Jumlah: {totalLogs} log</span>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                  >
                    ← Sebelum
                  </button>
                  <span className="px-3 py-1">Halaman {page} / {totalPages}</span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                  >
                    Seterusnya →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Tab: AI Anomalies ── */}
      {activeTab === 'anomalies' && (
        <div className="sppt-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-800">Pengesanan Anomali AI</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Dianalisis oleh <span style={{ color: '#673AB7' }}>SPPT-AI</span> — corak luar biasa dalam log audit
              </p>
            </div>
            {anomalyMeta && (
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-red-100 text-red-700">{anomalyMeta.critical} Kritikal</span>
                <span className="px-2 py-1 rounded bg-orange-100 text-orange-700">{anomalyMeta.high} Tinggi</span>
                <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700">{anomalyMeta.medium} Sederhana</span>
              </div>
            )}
          </div>

          {anomalyLoading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : anomalies.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <div className="text-4xl mb-2">✅</div>
              <p>Tiada anomali dikesan. Sistem beroperasi secara normal.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {anomalies.map(anomaly => (
                <div
                  key={anomaly.id}
                  className="p-4 rounded-lg border"
                  style={{
                    borderColor: anomaly.severity === 'critical' ? '#FCA5A5' :
                                 anomaly.severity === 'high'     ? '#FCD34D' : '#C4B5FD',
                    background:  anomaly.severity === 'critical' ? '#FEF2F2' :
                                 anomaly.severity === 'high'     ? '#FFFBEB' : '#F5F3FF',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <SeverityBadge severity={anomaly.severity} />
                        <AiBadge label={anomaly.ai_model} />
                        <span className="text-xs text-gray-500">{anomaly.type.replace(/_/g, ' ').toUpperCase()}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800">{anomaly.description}</p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>Modul: {anomaly.module}</span>
                        <span>Tindakan: {anomaly.action}</span>
                        {anomaly.ip_address && <span>IP: {anomaly.ip_address}</span>}
                        <span>{new Date(anomaly.detected_at).toLocaleString('ms-MY')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
