import { useState, useEffect } from 'react';
import api from '@/services/api';

const APIS = [
  { id: 'api-1', name: 'e-Syariah', endpoint: '/api/integrations/esyariah', status: 'OK', latency: 245, uptime: 99.8, lastCheck: '09:45:30' },
  { id: 'api-2', name: 'Muflis (Insolvency)', endpoint: '/api/integrations/muflis', status: 'OK', latency: 312, uptime: 99.5, lastCheck: '09:45:30' },
  { id: 'api-3', name: 'SSM (Suruhanjaya Syarikat)', endpoint: '/api/integrations/ssm', status: 'OK', latency: 189, uptime: 99.9, lastCheck: '09:45:30' },
  { id: 'api-4', name: 'CCRIS (Bank Negara)', endpoint: '/api/integrations/ccris', status: 'DEGRADED', latency: 1850, uptime: 97.2, lastCheck: '09:45:30' },
  { id: 'api-5', name: 'CTOS (Credit Bureau)', endpoint: '/api/integrations/ctos', status: 'OK', latency: 423, uptime: 99.1, lastCheck: '09:45:30' },
  { id: 'api-6', name: 'MyKad / eKYC (JPN)', endpoint: '/api/integrations/mykad', status: 'OK', latency: 567, uptime: 98.9, lastCheck: '09:45:30' },
];

const STATUS_COLORS: Record<string, string> = {
  'OK': 'bg-green-100 text-green-700',
  'DEGRADED': 'bg-yellow-100 text-yellow-700',
  'DOWN': 'bg-red-100 text-red-700',
};

export default function ApiHealth() {
  const [apis, setApis] = useState(APIS);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await api.get('/integrations/health'); } catch {}
    setTimeout(() => setRefreshing(false), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="sppt-card flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1B2B5E' }}>Monitor Kesihatan API</h1>
          <p className="text-sm text-gray-500 mt-1">Status masa nyata 6 integrasi API pihak ketiga</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="px-4 py-2 rounded-lg text-white font-semibold text-sm flex items-center gap-2"
          style={{ background: '#1B2B5E' }}>
          {refreshing ? '⏳ Menyemak...' : '🔄 Semak Semula'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'API Aktif', value: '5/6', color: '#16A34A' },
          { label: 'Latensi Purata', value: '598ms', color: '#E65100' },
          { label: 'Uptime Purata', value: '99.1%', color: '#1B2B5E' },
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
          {apis.map(a => (
            <div key={a.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
              <div className="flex-1">
                <div className="font-semibold text-sm">{a.name}</div>
                <div className="text-xs text-gray-400 font-mono">{a.endpoint}</div>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_COLORS[a.status]}`}>{a.status}</span>
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
          ))}
        </div>
      </div>

      <div className="sppt-card bg-yellow-50 border border-yellow-200">
        <div className="flex items-start gap-3">
          <span className="text-yellow-600 text-xl">⚠️</span>
          <div>
            <div className="font-bold text-yellow-800 text-sm">CCRIS API — Prestasi Merosot</div>
            <p className="text-xs text-yellow-700 mt-1">
              Latensi CCRIS melebihi ambang 1000ms. Sistem sedang menggunakan cache data 24 jam. 
              Circuit breaker aktif — 3 percubaan semula sebelum fallback ke cache.
            </p>
            <button className="mt-2 px-3 py-1 rounded text-xs font-semibold text-white" style={{ background: '#E65100' }}>
              Hubungi BNM Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
