import { useState, useEffect } from 'react';
import api from '@/services/api';

interface AuditLog {
  id: number;
  user: string;
  role: string;
  action: string;
  module: string;
  record: string;
  before: string;
  after: string;
  ip: string;
  timestamp: string;
}

interface AuditStats {
  todayLogs: number | string;
  criticalActions: number | string;
  activeUsers: number | string;
  aiAnomalies: number | string;
}

const ACTION_COLORS: Record<string, string> = {
  'APPROVE': 'bg-green-100 text-green-700',
  'REJECT': 'bg-red-100 text-red-700',
  'UPDATE': 'bg-blue-100 text-blue-700',
  'DISBURSE': 'bg-purple-100 text-purple-700',
  'VIEW': 'bg-gray-100 text-gray-600',
  'DELETE': 'bg-red-200 text-red-800',
};

export default function AuditTrail() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [anomalies, setAnomalies] = useState<any[] | string>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('Semua');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [logsRes, statsRes, anomaliesRes] = await Promise.all([
          api.get('/api/audit-logs').catch(() => ({ data: { data: [] } })),
          api.get('/api/audit-stats').catch(() => ({ data: { data: null } })),
          api.get('/api/audit-anomalies').catch(() => ({ data: { data: [] } }))
        ]);

        setLogs(logsRes.data?.data || logsRes.data || []);
        setStats(statsRes.data?.data || statsRes.data || null);
        setAnomalies(anomaliesRes.data?.data || anomaliesRes.data || []);
      } catch (error) {
        console.error('Error fetching audit data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const filtered = logs.filter(l =>
    (actionFilter === 'Semua' || l.action === actionFilter) &&
    (l.user.toLowerCase().includes(search.toLowerCase()) || l.record.toLowerCase().includes(search.toLowerCase()))
  );

  const kpis = [
    { label: 'Log Hari Ini', value: stats?.todayLogs ?? '0', color: '#1B2B5E' },
    { label: 'Tindakan Kritikal', value: stats?.criticalActions ?? '0', color: '#DC2626' },
    { label: 'Pengguna Aktif', value: stats?.activeUsers ?? '0', color: '#16A34A' },
    { label: 'Anomali Dikesan AI', value: stats?.aiAnomalies ?? '0', color: '#7C3AED' },
  ];

  return (
    <div className="space-y-4">
      <div className="sppt-card">
        <h1 className="text-xl font-bold" style={{ color: '#1B2B5E' }}>Jejak Audit — Kawalan Dalaman</h1>
        <p className="text-sm text-gray-500 mt-1">Log tidak boleh diubah: siapa, apa, bila, di mana, sebelum dan selepas</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {kpis.map(kpi => (
          <div key={kpi.label} className="sppt-card text-center">
            <div className="text-xs text-gray-500 mb-1">{kpi.label}</div>
            <div className="text-2xl font-bold" style={{ color: kpi.color }}>
              {loading ? '...' : kpi.value}
            </div>
          </div>
        ))}
      </div>

      <div className="sppt-card">
        <div className="flex items-center gap-3 mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Cari pengguna atau rekod..."
            className="flex-1 p-2 border border-gray-300 rounded text-sm" />
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded text-sm">
            {['Semua', 'APPROVE', 'REJECT', 'UPDATE', 'DISBURSE', 'VIEW', 'DELETE'].map(a => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <button className="px-3 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: '#1B2B5E' }}>
            📥 Eksport Log
          </button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800 text-white">
              {['#', 'Pengguna', 'Peranan', 'Tindakan', 'Modul', 'Rekod', 'Sebelum', 'Selepas', 'IP', 'Masa'].map(h => (
                <th key={h} className="p-2 text-left text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="p-4 text-center text-gray-500">Memuatkan data...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-4 text-center text-gray-500">Tiada rekod dijumpai</td>
              </tr>
            ) : (
              filtered.map(log => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 text-gray-400 text-xs">{log.id}</td>
                  <td className="p-2 font-semibold text-xs">{log.user}</td>
                  <td className="p-2 text-xs text-gray-500">{log.role}</td>
                  <td className="p-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>{log.action}</span>
                  </td>
                  <td className="p-2 text-xs">{log.module}</td>
                  <td className="p-2 text-xs font-mono text-blue-600">{log.record}</td>
                  <td className="p-2 text-xs text-gray-500">{log.before}</td>
                  <td className="p-2 text-xs font-semibold">{log.after}</td>
                  <td className="p-2 text-xs font-mono text-gray-400">{log.ip}</td>
                  <td className="p-2 text-xs text-gray-400">{log.timestamp}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="sppt-card bg-purple-50 border border-purple-200">
        <div className="flex items-start gap-3">
          <span className="text-purple-600 text-xl">🤖</span>
          <div>
            <div className="font-bold text-purple-800 text-sm flex items-center gap-2">
              Pengesanan Anomali AI
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">✨ AI</span>
            </div>
            <div className="text-xs text-purple-700 mt-1">
              {loading ? (
                'Memuatkan anomali...'
              ) : typeof anomalies === 'string' ? (
                <p>{anomalies}</p>
              ) : Array.isArray(anomalies) && anomalies.length > 0 ? (
                <ul className="list-disc pl-4 space-y-1">
                  {anomalies.map((anomaly, index) => (
                    <li key={anomaly.id || index}>
                      {anomaly.description || anomaly.message || anomaly}
                    </li>
                  ))}
                </ul>
              ) : (
                'Tiada anomali dikesan buat masa ini.'
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}