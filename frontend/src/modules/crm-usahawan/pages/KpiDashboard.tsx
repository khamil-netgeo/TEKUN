/**
 * Module 7 — CRM & Pemantauan Usahawan
 * KpiDashboard — entrepreneur KPI tracking, revenue trends, employment count,
 * business growth indicators across all monitored entrepreneurs.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Users, DollarSign,
  BarChart3, Sparkles, Loader2, AlertTriangle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { getEntrepreneurs } from '../services/entrepreneurService';
import type { Entrepreneur } from '../types';
import toast from 'react-hot-toast';

// ── Colour palette ────────────────────────────────────────────────────────────
const PIE_COLORS = ['#2E7D32', '#F59E0B', '#E65100', '#DC2626'];
const SECTOR_COLORS: Record<string, string> = {
  'Makanan & Minuman': '#2E7D32',
  'Fesyen':            '#7C3AED',
  'Teknologi':         '#3B82F6',
  'Perkhidmatan':      '#F59E0B',
  'Pertanian':         '#16A34A',
  'Lain-lain':         '#9CA3AF',
};

export default function KpiDashboard() {
  const [entrepreneurs, setEntrepreneurs] = useState<Entrepreneur[]>([]);
  const [loading, setLoading]             = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEntrepreneurs({ per_page: 50 });
      setEntrepreneurs(res.data);
    } catch {
      toast.error('Gagal memuatkan data KPI.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Derived stats ─────────────────────────────────────────────────────────

  const totalEntrepreneurs = entrepreneurs.length;
  const totalFinancing     = entrepreneurs.reduce((s, e) => s + e.total_financing, 0);
  const totalOutstanding   = entrepreneurs.reduce((s, e) => s + e.outstanding_balance, 0);
  const avgHealthScore     = totalEntrepreneurs
    ? Math.round(entrepreneurs.reduce((s, e) => s + e.health_score, 0) / totalEntrepreneurs)
    : 0;

  const statusDist = [
    { name: 'Lancar',           value: entrepreneurs.filter(e => e.financing_status === 'Lancar').length },
    { name: 'Perhatian Khusus', value: entrepreneurs.filter(e => e.financing_status === 'Perhatian Khusus').length },
    { name: 'Tidak Lancar',     value: entrepreneurs.filter(e => e.financing_status === 'Tidak Lancar').length },
  ].filter(d => d.value > 0);

  const distressDist = [
    { name: 'Rendah',    value: entrepreneurs.filter(e => e.distress_level === 'Rendah').length },
    { name: 'Sederhana', value: entrepreneurs.filter(e => e.distress_level === 'Sederhana').length },
    { name: 'Tinggi',    value: entrepreneurs.filter(e => e.distress_level === 'Tinggi').length },
    { name: 'Kritikal',  value: entrepreneurs.filter(e => e.distress_level === 'Kritikal').length },
  ].filter(d => d.value > 0);

  // Sector breakdown
  const sectorMap: Record<string, number> = {};
  entrepreneurs.forEach(e => {
    const s = e.sector ?? 'Lain-lain';
    sectorMap[s] = (sectorMap[s] ?? 0) + 1;
  });
  const sectorData = Object.entries(sectorMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Health score distribution
  const healthBands = [
    { band: 'Kritikal (0–29)',  count: entrepreneurs.filter(e => e.health_score < 30).length,  color: '#DC2626' },
    { band: 'Lemah (30–49)',    count: entrepreneurs.filter(e => e.health_score >= 30 && e.health_score < 50).length, color: '#E65100' },
    { band: 'Sederhana (50–69)',count: entrepreneurs.filter(e => e.health_score >= 50 && e.health_score < 70).length, color: '#F59E0B' },
    { band: 'Sihat (70–100)',   count: entrepreneurs.filter(e => e.health_score >= 70).length, color: '#2E7D32' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="sppt-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1B2B5E' }}>
              Dashboard KPI Usahawan
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Analitik prestasi dan penunjuk pertumbuhan perniagaan usahawan
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 flex items-center gap-1">
            <Sparkles size={11} /> AI Analytics
          </span>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Jumlah Usahawan',
            value: totalEntrepreneurs,
            icon: <Users size={18} />,
            color: '#1B2B5E',
            trend: undefined,
          },
          {
            label: 'Jumlah Pembiayaan',
            value: `RM ${(totalFinancing / 1_000_000).toFixed(2)}M`,
            icon: <DollarSign size={18} />,
            color: '#2E7D32',
            trend: undefined,
          },
          {
            label: 'Baki Tertunggak',
            value: `RM ${(totalOutstanding / 1_000_000).toFixed(2)}M`,
            icon: <TrendingDown size={18} />,
            color: '#E65100',
            trend: undefined,
          },
          {
            label: 'Skor Kesihatan Purata',
            value: avgHealthScore,
            icon: <BarChart3 size={18} />,
            color: avgHealthScore >= 70 ? '#2E7D32' : avgHealthScore >= 50 ? '#F59E0B' : '#DC2626',
            trend: undefined,
          },
        ].map(kpi => (
          <div key={kpi.label} className="sppt-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-gray-500 font-medium">{kpi.label}</div>
                <div className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</div>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: kpi.color + '15', color: kpi.color }}
              >
                {kpi.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Distribution Pie */}
        <div className="sppt-card">
          <h3 className="font-bold text-sm mb-4" style={{ color: '#1B2B5E' }}>
            Taburan Status Pembiayaan
          </h3>
          {statusDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }: { name: string; percent?: number }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {statusDist.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Tiada data</div>
          )}
        </div>

        {/* Distress Distribution */}
        <div className="sppt-card">
          <h3 className="font-bold text-sm mb-4" style={{ color: '#1B2B5E' }}>
            Tahap Tekanan AI
          </h3>
          <div className="space-y-3">
            {distressDist.map((d, i) => {
              const color = PIE_COLORS[i] ?? '#9CA3AF';
              const pct = totalEntrepreneurs ? Math.round((d.value / totalEntrepreneurs) * 100) : 0;
              return (
                <div key={d.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">{d.name}</span>
                    <span className="text-xs font-bold" style={{ color }}>{d.value} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sector Breakdown */}
        <div className="sppt-card">
          <h3 className="font-bold text-sm mb-4" style={{ color: '#1B2B5E' }}>
            Usahawan Mengikut Sektor
          </h3>
          {sectorData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sectorData} layout="vertical" margin={{ left: 80, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {sectorData.map((entry, index) => (
                    <Cell key={index} fill={SECTOR_COLORS[entry.name] ?? '#9CA3AF'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Tiada data</div>
          )}
        </div>

        {/* Health Score Bands */}
        <div className="sppt-card">
          <h3 className="font-bold text-sm mb-4" style={{ color: '#1B2B5E' }}>
            Taburan Skor Kesihatan AI
          </h3>
          <div className="space-y-3">
            {healthBands.map(band => {
              const pct = totalEntrepreneurs ? Math.round((band.count / totalEntrepreneurs) * 100) : 0;
              return (
                <div key={band.band}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">{band.band}</span>
                    <span className="text-xs font-bold" style={{ color: band.color }}>
                      {band.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: band.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Alert for high-risk */}
          {entrepreneurs.filter(e => e.distress_level === 'Kritikal').length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertTriangle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-red-700">
                  {entrepreneurs.filter(e => e.distress_level === 'Kritikal').length} usahawan dalam tahap kritikal
                </div>
                <div className="text-[10px] text-red-500 mt-0.5">
                  Tindakan segera diperlukan. Semak profil usahawan untuk butiran lanjut.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Entrepreneur Table */}
      <div className="sppt-card p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-sm" style={{ color: '#1B2B5E' }}>Senarai Usahawan Dipantau</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#F8FAFC' }} className="border-b border-gray-200">
                <th className="p-3 text-left text-xs font-semibold text-gray-600">Usahawan</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-600">Skim</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-600">Sektor</th>
                <th className="p-3 text-right text-xs font-semibold text-gray-600">Pembiayaan</th>
                <th className="p-3 text-right text-xs font-semibold text-gray-600">Baki</th>
                <th className="p-3 text-center text-xs font-semibold text-gray-600">Status</th>
                <th className="p-3 text-center text-xs font-semibold text-gray-600">Skor AI</th>
                <th className="p-3 text-center text-xs font-semibold text-gray-600">Tekanan</th>
              </tr>
            </thead>
            <tbody>
              {entrepreneurs.map((e, idx) => {
                const scoreColor = e.health_score >= 70 ? '#2E7D32' : e.health_score >= 50 ? '#F59E0B' : '#DC2626';
                const distressColor: Record<string, string> = {
                  'Rendah': '#2E7D32', 'Sederhana': '#F59E0B', 'Tinggi': '#E65100', 'Kritikal': '#DC2626',
                };
                return (
                  <tr key={e.id} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                    <td className="p-3">
                      <div className="font-medium text-gray-800 text-xs">{e.name}</div>
                      <div className="text-[10px] text-gray-400">{e.ref_no}</div>
                    </td>
                    <td className="p-3 text-xs text-gray-600">{e.skim ?? '—'}</td>
                    <td className="p-3 text-xs text-gray-600">{e.sector ?? '—'}</td>
                    <td className="p-3 text-right text-xs font-medium text-gray-700">
                      RM {e.total_financing.toLocaleString()}
                    </td>
                    <td className="p-3 text-right text-xs font-medium" style={{ color: '#E65100' }}>
                      RM {e.outstanding_balance.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        e.financing_status === 'Lancar' ? 'bg-green-100 text-green-700' :
                        e.financing_status === 'Perhatian Khusus' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {e.financing_status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-sm font-bold" style={{ color: scoreColor }}>{e.health_score}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: (distressColor[e.distress_level] ?? '#9CA3AF') + '20',
                          color: distressColor[e.distress_level] ?? '#9CA3AF',
                        }}
                      >
                        {e.distress_level}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
