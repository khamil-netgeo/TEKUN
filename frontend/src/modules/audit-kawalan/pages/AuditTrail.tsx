import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [anomalies, setAnomalies] = useState<any[] | string>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('Semua');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [logsRes, statsRes, anomaliesRes] = await Promise.all([
          api.get('/api/audit-logs'),
          api.get('/api/audit-logs/stats'),
          api.get('/api/audit-logs/anomalies')
        ]);

        setLogs(logsRes.data?.data || logsRes.data || []);
        setStats(statsRes.data?.data || statsRes.data || null);
        setAnomalies(anomaliesRes.data?.data || anomaliesRes.data || []);
      } catch (err) {
        console.error('Error fetching audit data:', err);
        setError('Failed to load audit data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleExport = async () => {
    try {
      const response = await api.post('/api/audit-logs/export', {
        search,
        actionFilter
      }, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'audit_logs.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  const filtered = logs.filter(l =>
    (actionFilter === 'Semua' || l.action === actionFilter) &&
    (l.user.toLowerCase().includes(search.toLowerCase()) || l.record.toLowerCase().includes(search.toLowerCase()))
  );

  const kpis = [
    { label: t('audit.today_logs'), value: stats?.todayLogs ?? '0', color: '#1B2B5E' },
    { label: t('audit.critical_actions'), value: stats?.criticalActions ?? '0', color: '#DC2626' },
    { label: t('audit.active_users'), value: stats?.activeUsers ?? '0', color: '#16A34A' },
    { label: t('audit.ai_anomalies'), value: stats?.aiAnomalies ?? '0', color: '#7C3AED' },
  ];

  return (
    <div className="space-y-4">
      <div className="sppt-card">
        <h1 className="text-xl font-bold" style={{ color: '#1B2B5E' }}>{t('audit.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('audit.subtitle')}</p>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-800 rounded-lg bg-red-50 border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {kpis.map(kpi => (
          <div key={kpi.label} className="sppt-card text-center">
            <div className="text-xs text-gray-500 mb-1">{kpi.label}</div>
            <div className="text-2xl font-bold flex justify-center items-center min-h-[32px]" style={{ color: kpi.color }}>
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
              ) : (
                kpi.value
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="sppt-card">
        <div className="flex items-center gap-3 mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('audit.search_placeholder')}
            className="flex-1 p-2 border border-gray-300 rounded text-sm" />
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded text-sm">
            <option value="Semua">{t('audit.all')}</option>
            {['APPROVE', 'REJECT', 'UPDATE', 'DISBURSE', 'VIEW', 'DELETE'].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button onClick={handleExport} className="px-3 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: '#1B2B5E' }}>
            {t('audit.export_logs')}
          </button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800 text-white">
              {[
                { key: 'id', label: '#' },
                { key: 'user', label: t('audit.table.user') },
                { key: 'role', label: t('audit.table.role') },
                { key: 'action', label: t('audit.table.action') },
                { key: 'module', label: t('audit.table.module') },
                { key: 'record', label: t('audit.table.record') },
                { key: 'before', label: t('audit.table.before') },
                { key: 'after', label: t('audit.table.after') },
                { key: 'ip', label: t('audit.table.ip') },
                { key: 'time', label: t('audit.table.time') }
              ].map(h => (
                <th key={h.key} className="p-2 text-left text-xs">{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="p-8 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B2B5E]"></div>
                    <span className="mt-2 text-gray-500">{t('audit.loading_data')}</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-red-500">
                  {error}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-4 text-center text-gray-500">{t('audit.no_records')}</td>
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
              {t('audit.ai_anomaly_detection')}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">✨ AI</span>
            </div>
            <div className="text-xs text-purple-700 mt-1">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-700"></div>
                  <span>{t('audit.loading_anomalies')}</span>
                </div>
              ) : error ? (
                <span className="text-red-500">{error}</span>
              ) : typeof anomalies === 'string' ? (
                <p>{anomalies}</p>
              ) : Array.isArray(anomalies) && anomalies.length > 0 ? (
                <ul className="space-y-2 mt-2">
                  {anomalies.map((anomaly, index) => (
                    <li key={anomaly.id || index} className="flex items-center gap-2">
                      {anomaly.severity && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          anomaly.severity.toLowerCase() === 'high' || anomaly.severity.toLowerCase() === 'critical' ? 'bg-red-100 text-red-700' :
                          anomaly.severity.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {anomaly.severity}
                        </span>
                      )}
                      <span>{anomaly.description || anomaly.message || anomaly}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                t('audit.no_anomalies')
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}