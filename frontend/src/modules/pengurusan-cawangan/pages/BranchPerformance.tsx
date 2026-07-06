import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, Trophy, RefreshCw, ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from '@/components/ui/Toast';
import AiBadge from '@/components/ui/AiBadge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import branchService from '../services/branchService';
import type { BranchPerformanceItem } from '../services/branchService';

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

const BranchPerformance: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<BranchPerformanceItem[]>([]);
  const [period, setPeriod] = useState('');
  const [summary, setSummary] = useState({ avg_collection: 0, avg_npl: 0, total: 0 });

  const fetchPerformance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await branchService.getPerformance() as any;
      setBranches(res.branches ?? []);
      setPeriod(res.period ?? '');
      setSummary({ avg_collection: res.avg_collection_rate ?? 0, avg_npl: res.avg_npl_ratio ?? 0, total: res.total_branches ?? 0 });
    } catch { toast.error('Ralat memuatkan data prestasi.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPerformance(); }, [fetchPerformance]);

  const getBarColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    if (rank <= 5) return '#2E7D32';
    if (rank <= 10) return '#1B2B5E';
    return '#9E9E9E';
  };

  const getTrendIcon = (trend: string | undefined) => {
    if (!trend) return <Minus size={14} className="text-gray-400" />;
    if (trend.startsWith('+')) return <TrendingUp size={14} className="text-[#2E7D32]" />;
    if (trend.startsWith('-')) return <TrendingDown size={14} className="text-[#C62828]" />;
    return <Minus size={14} className="text-gray-400" />;
  };

  const getTrendColor = (trend: string | undefined) => {
    if (!trend) return 'text-gray-500';
    if (trend.startsWith('+')) return 'text-[#2E7D32]';
    if (trend.startsWith('-')) return 'text-[#C62828]';
    return 'text-gray-500';
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Leaderboard Prestasi Cawangan"
        subtitle={period ? `Tempoh: ${period}` : 'Ranking prestasi semua cawangan'}
        action={
          <div className="flex gap-2">
            <button onClick={() => navigate('/pengurusan-cawangan')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors">
              <ArrowLeft size={16} /> Kembali
            </button>
            <button onClick={fetchPerformance} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors" title="Muat Semula">
              <RefreshCw size={16} className="text-gray-500" />
            </button>
          </div>
        }
      />
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-xs text-gray-500 mb-1">Jumlah Cawangan</div>
          <div className="text-2xl font-bold text-[#1B2B5E]">{summary.total}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-xs text-gray-500 mb-1">Purata Kadar Kutipan</div>
          <div className="text-2xl font-bold text-[#2E7D32]">{Number(summary.avg_collection).toFixed(1)}%</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-xs text-gray-500 mb-1">Purata Nisbah NPL</div>
          <div className="text-2xl font-bold" style={{ color: Number(summary.avg_npl) > 5 ? '#C62828' : '#E65100' }}>
            {Number(summary.avg_npl).toFixed(1)}%
          </div>
        </div>
      </div>
      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Trophy size={18} className="text-yellow-500" />
              <h2 className="font-bold text-[#1B2B5E]">Ranking Cawangan</h2>
              <AiBadge label="SPPT AI" size="sm" />
            </div>
            <div className="overflow-y-auto max-h-[520px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 w-12">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Cawangan</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Skor</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((b, idx) => {
                    const rank = b.leaderboard_rank ?? (idx + 1);
                    const isTop3 = rank <= 3;
                    return (
                      <tr key={b.id} className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${isTop3 ? 'bg-yellow-50/40' : ''}`} onClick={() => navigate(`/pengurusan-cawangan/${b.id}`)}>
                        <td className="px-4 py-3">
                          {MEDAL[rank] !== undefined ? <span className="text-lg">{MEDAL[rank]}</span> : <span className="text-sm text-gray-500 font-bold">{rank}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-[#1B2B5E]">{b.name}</div>
                          <div className="text-xs text-gray-400">{b.state}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-bold text-[#1B2B5E]">{Number(b.collection_rate ?? 0).toFixed(1)}%</div>
                          <div className="text-xs text-gray-400">NPL: {Number(b.npl_ratio ?? 0).toFixed(1)}%</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className={`flex items-center justify-end gap-1 font-semibold text-xs ${getTrendColor(b.trend_label)}`}>
                            {getTrendIcon(b.trend_label)}
                            {b.trend_label ?? '—'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-bold text-[#1B2B5E] mb-4">Perbandingan Kadar Kutipan (%)</h2>
            <ResponsiveContainer width="100%" height={480}>
              <BarChart
                data={branches.slice(0, 16).map((b, idx) => ({ name: b.name.replace('Cawangan ', '').substring(0, 15), value: Number(b.collection_rate ?? 0), rank: b.leaderboard_rank ?? (idx + 1) }))}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: unknown) => [`${Number(v).toFixed(1)}%`, 'Kadar Kutipan']} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {branches.slice(0, 16).map((_b, idx) => (
                    <Cell key={idx} fill={getBarColor(_b.leaderboard_rank ?? (idx + 1))} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-400 inline-block" /> Tempat 1</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-400 inline-block" /> Tempat 2</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-600 inline-block" /> Tempat 3</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#2E7D32] inline-block" /> Tempat 4–5</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#1B2B5E] inline-block" /> Tempat 6–10</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchPerformance;