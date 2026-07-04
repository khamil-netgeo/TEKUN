/**
 * TEKUN SPPT — Module 8: Pengurusan Cawangan
 * Sub-module 8.3: Prestasi Cawangan (Branch Performance Dashboard)
 *
 * Features:
 * - Ranked performance table with monthly targets vs actual
 * - Bar chart comparing all branches
 * - Period selector
 * - RBAC: Branch Manager sees own branch only
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Trophy, TrendingUp, TrendingDown, RefreshCw, Building2
} from 'lucide-react';
import {
  getBranchPerformance,
  type Branch,
  type BranchPerformanceResponse
} from '../services/branchService';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

function achievementColor(pct: number) {
  if (pct >= 100) return '#2E7D32';
  if (pct >= 85)  return '#E65100';
  return '#C62828';
}

function rankIcon(rank: number) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

export default function BranchPerformance() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [data, setData] = useState<BranchPerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('');

  // Generate last 6 months options
  const periodOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  });

  useEffect(() => {
    setLoading(true);
    getBranchPerformance(period || undefined)
      .then(res => setData(res))
      .catch(() => toast.error('Gagal memuatkan data prestasi.'))
      .finally(() => setLoading(false));
  }, [period]);

  const chartData = (data?.branches ?? []).slice(0, 10).map(b => ({
    name: b.code,
    target: b.monthly_target / 1000,
    actual: b.monthly_actual / 1000,
    collection: b.collection_rate,
    npl: b.npl_ratio,
  }));

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1B2B5E' }}>
              {t('module8.rankingTitle')}
            </h1>
            <p className="text-sm text-gray-500">{t('module8.rankingSubtitle')}</p>
          </div>
        </div>
        <select
          value={period}
          onChange={e => setPeriod(e.target.value)}
          className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Bulan Semasa</option>
          {periodOptions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* ── Summary KPIs ──────────────────────────────────────────────────── */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Jumlah Cawangan', value: data.total_branches, color: '#1B2B5E' },
            { label: 'Cawangan Terbaik', value: data.top_branch?.code ?? '—', color: '#2E7D32' },
            { label: 'Kadar Kutipan Purata', value: `${data.avg_collection}%`, color: '#E65100' },
            { label: 'NPL Purata', value: `${data.avg_npl}%`, color: '#C62828' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{kpi.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Bar Chart ─────────────────────────────────────────────────────── */}
      {!loading && chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-sm mb-4" style={{ color: '#1B2B5E' }}>
            Sasaran vs Pencapaian (Top 10 Cawangan) — RM'000
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`RM ${(Number(v ?? 0) * 1000).toLocaleString()}`, ''] as [string, string]} />
              <Legend />
              <Bar dataKey="target" fill="#94A3B8" name="Sasaran" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" fill="#1B2B5E" name="Pencapaian" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Ranking Table ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-sm" style={{ color: '#1B2B5E' }}>
            Kedudukan Prestasi — {data?.period ?? ''}
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Memuatkan...
          </div>
        ) : !data || data.branches.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Tiada data prestasi.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Kedudukan', 'Cawangan', 'Negeri', 'Sasaran', 'Pencapaian', 'Peratus', 'Kadar Kutipan', 'NPL', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.branches.map((b: Branch) => {
                  const pct = b.monthly_target > 0 ? (b.monthly_actual / b.monthly_target) * 100 : 0;
                  return (
                    <tr key={b.id} className={`hover:bg-gray-50 transition-colors ${b.performance_rank === 1 ? 'bg-yellow-50' : ''}`}>
                      <td className="px-4 py-3 text-center font-bold text-lg">
                        {b.performance_rank ? rankIcon(b.performance_rank) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-gray-900">{b.name}</p>
                          <p className="text-xs text-blue-600 font-mono">{b.code}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{b.state}</td>
                      <td className="px-4 py-3 text-gray-600">RM {b.monthly_target.toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: '#1B2B5E' }}>
                        RM {b.monthly_actual.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full"
                              style={{ width: `${Math.min(100, pct)}%`, background: achievementColor(pct) }}
                            />
                          </div>
                          <span className="text-xs font-semibold" style={{ color: achievementColor(pct) }}>
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${b.collection_rate >= 90 ? 'bg-green-100 text-green-800' : b.collection_rate >= 85 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {b.collection_rate}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${b.npl_ratio <= 1.5 ? 'bg-green-100 text-green-800' : b.npl_ratio <= 3.0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {b.npl_ratio}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {b.performance_status && (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                            b.performance_status === 'Cemerlang' ? 'bg-green-100 text-green-800' :
                            b.performance_status === 'Baik' ? 'bg-blue-100 text-blue-800' :
                            b.performance_status === 'Sederhana' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {b.performance_status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
