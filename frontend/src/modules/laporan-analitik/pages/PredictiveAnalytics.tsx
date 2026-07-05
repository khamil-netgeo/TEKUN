import { useEffect, useState, useCallback } from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import { Brain, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { dashboardService } from '@/services/dashboardService';
import type { PredictiveData, ForecastPoint, RiskAlert } from '@/services/dashboardService';

const NAVY   = '#1B2B5E';
const GREEN  = '#2E7D32';
const ORANGE = '#E65100';

const SEED: PredictiveData = {
  forecast_period: '3 bulan (Ogos–Oktober 2026)',
  forecast: [
    { month: 'Ogos 2026',      disbursement: 445, npl_forecast: 1.75, collection_forecast: 90.1, confidence: 88.2 },
    { month: 'September 2026', disbursement: 468, npl_forecast: 1.71, collection_forecast: 90.8, confidence: 85.6 },
    { month: 'Oktober 2026',   disbursement: 490, npl_forecast: 1.68, collection_forecast: 91.3, confidence: 82.1 },
  ],
  risk_alerts: [
    { region: 'Kelantan', risk_level: 'high',   npl_trend: '+0.8%', current_npl: 2.1, action: 'Tingkatkan aktiviti kutipan segera', ai_score: 82 },
    { region: 'Sabah',    risk_level: 'medium', npl_trend: '+0.3%', current_npl: 3.5, action: 'Pantau bulanan dan hantar notis',    ai_score: 65 },
    { region: 'Pahang',   risk_level: 'medium', npl_trend: '+0.2%', current_npl: 3.2, action: 'Semak semula profil peminjam berisiko', ai_score: 61 },
  ],
  predicted_npl_q3: 1.71,
  predicted_collection_q3: 90.8,
  predicted_disbursement_q3: 1_403_000_000,
  ai_confidence: 85.3,
  model: 'SPPT Predictive Analytics v1.0',
  generated_at: new Date().toISOString(),
};

// Historical + forecast combined for chart
const HISTORICAL = [
  { month: 'Jan', disbursement: 280, npl_forecast: 2.8, collection_forecast: 74.0, type: 'actual' },
  { month: 'Feb', disbursement: 320, npl_forecast: 2.6, collection_forecast: 75.6, type: 'actual' },
  { month: 'Mac', disbursement: 310, npl_forecast: 2.4, collection_forecast: 77.2, type: 'actual' },
  { month: 'Apr', disbursement: 350, npl_forecast: 2.2, collection_forecast: 79.3, type: 'actual' },
  { month: 'Mei', disbursement: 370, npl_forecast: 2.0, collection_forecast: 81.2, type: 'actual' },
  { month: 'Jun', disbursement: 390, npl_forecast: 1.9, collection_forecast: 87.3, type: 'actual' },
  { month: 'Jul', disbursement: 420, npl_forecast: 1.8, collection_forecast: 89.4, type: 'actual' },
];

function RiskCard({ alert }: { alert: RiskAlert }) {
  const cfg = {
    high:   { bg: 'bg-red-50 border-red-300',    badge: 'bg-red-100 text-red-700',    icon: <AlertTriangle size={16} className="text-red-600" /> },
    medium: { bg: 'bg-amber-50 border-amber-300', badge: 'bg-amber-100 text-amber-700', icon: <AlertTriangle size={16} className="text-amber-600" /> },
    low:    { bg: 'bg-green-50 border-green-300', badge: 'bg-green-100 text-green-700', icon: <TrendingUp    size={16} className="text-green-600" /> },
  }[alert.risk_level];

  return (
    <div className={`rounded-lg p-3 border ${cfg.bg}`}>
      <div className="flex items-start gap-2">
        {cfg.icon}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-gray-800">{alert.region}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.badge}`}>
              {alert.risk_level === 'high' ? 'Kritikal' : alert.risk_level === 'medium' ? 'Sederhana' : 'Rendah'}
            </span>
          </div>
          <div className="text-xs text-gray-600 space-y-0.5">
            <div>Trend NPL: <span className="font-semibold text-red-600">{alert.npl_trend}</span> | NPL Semasa: <span className="font-semibold">{alert.current_npl}%</span></div>
            <div>Tindakan: <span className="font-medium text-gray-700">{alert.action}</span></div>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <div className="flex-1 h-1.5 rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-purple-500" style={{ width: `${alert.ai_score}%` }} />
            </div>
            <span className="text-xs text-gray-500">AI: {alert.ai_score}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PredictiveAnalytics() {
  const [data, setData]   = useState<PredictiveData>(SEED);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await dashboardService.getPredictive();
      setData(result);
    } catch {
      // keep seed
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Combine historical + forecast for chart
  const chartData = [
    ...HISTORICAL,
    ...data.forecast.map((f: ForecastPoint) => ({
      month: f.month.replace(' 2026', ''),
      disbursement: f.disbursement,
      npl_forecast: f.npl_forecast,
      collection_forecast: f.collection_forecast,
      type: 'forecast',
      confidence: f.confidence,
    })),
  ];

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Brain size={20} style={{ color: '#7C3AED' }} />
            <h1 className="text-xl font-bold" style={{ color: NAVY }}>Analitik Ramalan AI</h1>
            <span className="text-xs px-2 py-0.5 rounded-full text-white font-bold" style={{ background: '#7C3AED' }}>SPPT-AI</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Ramalan 3 bulan: {data.forecast_period} | Keyakinan Model: {data.ai_confidence}%</p>
        </div>
        <button onClick={loadData} disabled={loading} className="flex items-center gap-1 text-xs px-4 py-2 rounded font-bold text-white disabled:opacity-50" style={{ background: '#7C3AED' }}>
          {loading ? '⏳ Memuatkan...' : '🔮 Jana Semula'}
        </button>
      </div>

      {/* Forecast Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Ramalan NPL Q3 2026', value: `${data.predicted_npl_q3}%`, icon: <TrendingDown size={18} className="text-green-500" />, note: 'Menurun dari 1.8%', bg: 'bg-green-50 border-green-200' },
          { label: 'Ramalan Kutipan Q3', value: `${data.predicted_collection_q3}%`, icon: <TrendingUp size={18} className="text-blue-500" />, note: 'Meningkat dari 89.4%', bg: 'bg-blue-50 border-blue-200' },
          { label: 'Ramalan Agihan Q3', value: `RM ${(data.predicted_disbursement_q3 / 1_000_000_000).toFixed(2)} B`, icon: <TrendingUp size={18} className="text-purple-500" />, note: '+8.5% dari Q2', bg: 'bg-purple-50 border-purple-200' },
        ].map(c => (
          <div key={c.label} className={`rounded-xl p-4 border ${c.bg}`}>
            <div className="flex items-center gap-2 mb-2">{c.icon}<span className="text-xs font-semibold text-gray-600">{c.label}</span></div>
            <p className="text-2xl font-bold text-gray-800">{c.value}</p>
            <p className="text-xs text-gray-500 mt-1">{c.note}</p>
          </div>
        ))}
      </div>

      {/* Forecast Chart — Disbursement */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="text-sm font-bold mb-1" style={{ color: NAVY }}>📊 Ramalan Agihan Dana (RM Juta) — Sejarah + Unjuran</h2>
        <p className="text-xs text-gray-500 mb-3">Bar biru = sejarah sebenar | Bar ungu = ramalan AI</p>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={((v: number, name: string) => [`RM ${v}`, name === 'disbursement' ? 'Agihan' : name]) as any} />
            <ReferenceLine x="Jul" stroke="#9CA3AF" strokeDasharray="4 4" label={{ value: 'Sekarang', position: 'top', fontSize: 10, fill: '#9CA3AF' }} />
            <Bar dataKey="disbursement" name="Agihan" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <rect key={i} fill={entry.type === 'forecast' ? '#7C3AED' : NAVY} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* NPL + Collection Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-sm font-bold mb-3" style={{ color: NAVY }}>🛡️ Ramalan Nisbah NPL (%)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 4]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={((v: number) => [`${v}%`, 'NPL']) as any} />
              <ReferenceLine x="Jul" stroke="#9CA3AF" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="npl_forecast" stroke={ORANGE} strokeWidth={2} dot={{ r: 3 }} strokeDasharray="0" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-sm font-bold mb-3" style={{ color: NAVY }}>📈 Ramalan Kadar Kutipan (%)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={((v: number) => [`${v}%`, 'Kutipan']) as any} />
              <ReferenceLine x="Jul" stroke="#9CA3AF" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="collection_forecast" stroke={GREEN} strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Alerts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={16} className="text-amber-500" />
          <h2 className="text-sm font-bold" style={{ color: NAVY }}>Amaran Risiko AI</h2>
          <span className="ml-auto text-xs text-gray-500">{data.risk_alerts.length} kawasan memerlukan perhatian</span>
        </div>
        <div className="space-y-3">
          {data.risk_alerts.map((alert, i) => (
            <RiskCard key={i} alert={alert} />
          ))}
        </div>
        <div className="mt-3 p-2 rounded-lg bg-gray-50 border border-gray-200">
          <p className="text-xs text-gray-500">
            <span className="font-semibold">Model:</span> {data.model} &nbsp;|&nbsp;
            <span className="font-semibold">Metodologi:</span> Regresi linear dengan pelarasan bermusim &nbsp;|&nbsp;
            <span className="font-semibold">Dijana:</span> {new Date(data.generated_at).toLocaleString('ms-MY')}
          </p>
        </div>
      </div>
    </div>
  );
}
