import { useState, useEffect } from 'react';
import api from '@/services/api';

interface ApiIntegration {
  id: string;
  name: string;
  endpoint: string;
  status: string;
  latency: number;
  uptime: number;
  lastCheck: string;
}

const STATUS_COLORS: Record<string, string> = {
  'OK': 'bg-green-100 text-green-700',
  'DEGRADED': 'bg-yellow-100 text-yellow-700',
  'DOWN': 'bg-red-100 text-red-700',
};

export default function ApiHealth() {
  const [apis, setApis] = useState<ApiIntegration[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = async () => {
    setRefreshing(true);
    try {
      const response = await api.get('/integrations/health');
      setApis(response.data.integrations || []);
    } catch (error) {
      console.error('Failed to fetch API health', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const totalApis = apis.length;
  const activeApis = apis.filter(a => a.status === 'OK' || a.status === 'DEGRADED').length;
  const avgLatency = totalApis > 0 ? Math.round(apis.reduce((sum, a) => sum + a.latency, 0) / totalApis) : 0;
  const avgUptime = totalApis > 0 ? (apis.reduce((sum, a) => sum + a.uptime, 0) / totalApis).toFixed(1) : 0;

  const degradedApis = apis.filter(a => a.status === 'DEGRADED' || a.status === 'DOWN');

  return (
    <div className="space-y-4">
      <div className="sppt-card flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1B2B5E' }}>Monitor Kesihatan API</h1>
          <p className="text-sm text-gray-500 mt-1">Status masa nyata {totalApis} integrasi API pihak ketiga</p>
        </div>
        <button onClick={fetchHealth} disabled={refreshing}
          className="px-4 py-2 rounded-lg text-white font-semibold text-sm flex items-center gap-2"
          style={{ background: '#1B2B5E' }}>
          {refreshing ? '⏳ Menyemak...' : '🔄 Semak Semula'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'API Aktif', value: totalApis > 0 ? `${activeApis}/${totalApis}` : '0/0', color: '#16A34A' },
          { label: 'Latensi Purata', value: `${avgLatency}ms`, color: '#E65100' },
          { label: 'Uptime Purata', value: `${avgUptime}%`, color: '#1B2B5E' },
        ].map(kpi => (
          <div key={kpi.label} className="sppt-card text-center">
            <div className="text-xs text-gray-500 mb-1">{kpi.label}</div>
            <div className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="sppt-card">
        <h2 className="font-bold text-sm mb-3" style={{ color: '#1B2B5E' }}>Status API</h2>
        <div className="space-y-3">
          {apis.length === 0 && !refreshing ? (
            <div className="text-center text-gray-500 text-sm py-4">Tiada data integrasi API.</div>
          ) : (
            apis.map(a => (
              <div key={a.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div className="flex-1">
                  <div className="font-semibold text-sm">{a.name}</div>
                  <div className="text-xs text-gray-400 font-mono">{a.endpoint}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-700'}`}>{a.status}</span>
                <div className="text-right text-xs">
                  <div className={`font-semibold ${a.latency < 500 ? 'text-green-600' : a.latency < 1000 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {a.latency}ms
                  </div>
                  <div className="text-gray-400">Latensi</div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-semibold text-gray-700">{a.uptime}%</div>
                  <div className="text-gray-400">Uptime</div>
                </div>
                <div className="text-right text-xs text-gray-400">
                  <div>Semak terakhir</div>
                  <div>{a.lastCheck}</div>
                </div>
                <button className="px-2 py-1 rounded border border-gray-300 text-xs hover:bg-gray-50">Test</button>
              </div>
            ))
          )}
        </div>
      </div>

      {degradedApis.map(api => (
        <div key={api.id} className={`sppt-card ${api.status === 'DOWN' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'} border`}>
          <div className="flex items-start gap-3">
            <span className={`${api.status === 'DOWN' ? 'text-red-600' : 'text-yellow-600'} text-xl`}>⚠️</span>
            <div>
              <div className={`font-bold ${api.status === 'DOWN' ? 'text-red-800' : 'text-yellow-800'} text-sm`}>{api.name} API — Prestasi Merosot</div>
              <p className={`text-xs ${api.status === 'DOWN' ? 'text-red-700' : 'text-yellow-700'} mt-1`}>
                Latensi {api.name} melebihi ambang 1000ms. Sistem sedang menggunakan cache data 24 jam. 
                Circuit breaker aktif — 3 percubaan semula sebelum fallback ke cache.
              </p>
              <button className="mt-2 px-3 py-1 rounded text-xs font-semibold text-white" style={{ background: '#E65100' }}>
                Hubungi Support
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}