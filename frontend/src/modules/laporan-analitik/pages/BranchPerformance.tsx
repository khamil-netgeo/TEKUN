import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, MapPin, Award } from 'lucide-react';
import { dashboardService } from '@/services/dashboardService';
import type { BranchData, StateHeatmap } from '@/services/dashboardService';
import toast from 'react-hot-toast';

const NAVY   = '#1B2B5E';
const GREEN  = '#2E7D32';
const ORANGE = '#E65100';

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up')   return <TrendingUp   size={14} className="text-green-500" />;
  if (trend === 'down') return <TrendingDown size={14} className="text-red-500" />;
  return <Minus size={14} className="text-gray-400" />;
}

function HeatBadge({ level }: { level: 'green' | 'yellow' | 'red' }) {
  const cfg = {
    green:  { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Baik' },
    yellow: { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Sederhana' },
    red:    { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Kritikal' },
  }[level];
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

export default function BranchPerformance() {
  const [branches, setBranches]       = useState<BranchData[]>([]);
  const [heatmap, setHeatmap]         = useState<StateHeatmap[]>([]);
  const [summary, setSummary]         = useState<{ top_performer: string; bottom_performer: string; avg_collection: number; avg_npl: number } | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [sortBy, setSortBy]           = useState<'collection_rate' | 'npl_ratio' | 'total_accounts'>('collection_rate');
  const [sortDir, setSortDir]         = useState<'asc' | 'desc'>('desc');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getBranchPerformance();
      setBranches(data.branches || []);
      setHeatmap(data.state_heatmap || []);
      setSummary(data.summary || null);
    } catch (err) {
      setError('Gagal memuatkan data prestasi cawangan.');
      toast.error('Gagal memuatkan data prestasi cawangan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const sorted = [...branches].sort((a, b) => {
    const diff = a[sortBy] - b[sortBy];
    return sortDir === 'desc' ? -diff : diff;
  });

  const chartData = branches.slice(0, 10).map(b => ({
    name: b.name.replace('Cawangan ', ''),
    rate: b.collection_rate,
    npl:  b.npl_ratio,
  }));

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: NAVY }}>Prestasi Cawangan</h1>
          <p className="text-xs text-gray-500 mt-0.5">Perbandingan prestasi kutipan dan NPL merentas semua cawangan</p>
        </div>
        <button onClick={loadData} disabled={loading} className="flex items-center gap-1 text-xs px-4 py-2 rounded font-bold text-white disabled:opacity-50" style={{ background: NAVY }}>
          {loading ? '⏳ Memuatkan...' : '🔄 Kemaskini'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm text-center">
          {error}
        </div>
      )}

      {!error && !loading && branches.length === 0 && (
        <div className="p-8 bg-gray-50 text-gray-500 rounded-xl border border-gray-100 text-sm text-center">
          Tiada data prestasi cawangan dijumpai.
        </div>
      )}

      {!error && branches.length > 0 && (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Cawangan Terbaik', value: summary.top_performer.replace('Cawangan ', ''), icon: <Award size={16} className="text-yellow-500" />, bg: 'bg-yellow-50 border-yellow-200' },
                { label: 'Perlu Perhatian', value: summary.bottom_performer.replace('Cawangan ', ''), icon: <MapPin size={16} className="text-red-500" />, bg: 'bg-red-50 border-red-200' },
                { label: 'Purata Kutipan', value: `${summary.avg_collection}%`, icon: <TrendingUp size={16} className="text-green-500" />, bg: 'bg-green-50 border-green-200' },
                { label: 'Purata NPL', value: `${summary.avg_npl}%`, icon: <TrendingDown size={16} className="text-orange-500" />, bg: 'bg-orange-50 border-orange-200' },
              ].map(c => (
                <div key={c.label} className={`rounded-xl p-3 border ${c.bg}`}>
                  <div className="flex items-center gap-2 mb-1">{c.icon}<span className="text-xs font-semibold text-gray-600">{c.label}</span></div>
                  <p className="text-sm font-bold text-gray-800 truncate">{c.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Bar Chart — Collection Rate */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="text-sm font-bold mb-3" style={{ color: NAVY }}>📊 Kadar Kutipan Mengikut Cawangan (%)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" domain={[60, 100]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Kadar Kutipan']} />
                <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.rate >= 90 ? GREEN : entry.rate >= 80 ? '#F9A825' : ORANGE} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* State Heatmap */}
          {heatmap.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h2 className="text-sm font-bold mb-3" style={{ color: NAVY }}>🗺️ Peta Haba Prestasi Mengikut Negeri</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {heatmap.map(s => (
                  <div key={s.state} className={`rounded-lg p-3 border ${
                    s.heat_level === 'green' ? 'bg-green-50 border-green-200' :
                    s.heat_level === 'yellow' ? 'bg-amber-50 border-amber-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-700 truncate">{s.state}</span>
                      <HeatBadge level={s.heat_level} />
                    </div>
                    <div className="text-xs text-gray-500 space-y-0.5">
                      <div>Kutipan: <span className="font-semibold text-gray-700">{s.collection_rate}%</span></div>
                      <div>NPL: <span className="font-semibold text-gray-700">{s.npl_ratio}%</span></div>
                      <div>Cawangan: <span className="font-semibold text-gray-700">{s.branch_count}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ranking Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="text-sm font-bold" style={{ color: NAVY }}>📋 Jadual Ranking Cawangan</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Isih mengikut:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as typeof sortBy)}
                  className="text-xs border rounded px-2 py-1 border-gray-200"
                >
                  <option value="collection_rate">Kadar Kutipan</option>
                  <option value="npl_ratio">Nisbah NPL</option>
                  <option value="total_accounts">Jumlah Akaun</option>
                </select>
                <button
                  onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                  className="text-xs border rounded px-2 py-1 border-gray-200 hover:bg-gray-50"
                >
                  {sortDir === 'desc' ? '↓ Tertinggi' : '↑ Terendah'}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left" style={{ background: NAVY }}>
                    {['#', 'Cawangan', 'Negeri', 'Kadar Kutipan', 'Nisbah NPL', 'Akaun', 'Agihan', 'Trend'].map(h => (
                      <th key={h} className="p-2 text-white font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((b, i) => (
                    <tr key={b.name} className={`border-b hover:bg-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="p-2 font-bold text-gray-500">{i + 1}</td>
                      <td className="p-2 font-semibold text-gray-800 whitespace-nowrap">{b.name}</td>
                      <td className="p-2 text-gray-600 whitespace-nowrap">{b.state}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${b.collection_rate}%`, background: b.collection_rate >= 90 ? GREEN : b.collection_rate >= 80 ? '#F9A825' : ORANGE }} />
                          </div>
                          <span className="font-semibold" style={{ color: b.collection_rate >= 90 ? GREEN : b.collection_rate >= 80 ? '#F9A825' : ORANGE }}>
                            {b.collection_rate}%
                          </span>
                        </div>
                      </td>
                      <td className="p-2">
                        <span className={`font-semibold ${b.npl_ratio <= 1.5 ? 'text-green-600' : b.npl_ratio <= 2.5 ? 'text-amber-600' : 'text-red-600'}`}>
                          {b.npl_ratio}%
                        </span>
                      </td>
                      <td className="p-2 text-gray-700">{b.total_accounts}</td>
                      <td className="p-2 text-gray-700">RM {(b.disbursement / 1_000_000).toFixed(1)}J</td>
                      <td className="p-2"><TrendIcon trend={b.trend} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}