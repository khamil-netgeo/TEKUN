/**
 * Module 7 — CRM & Pemantauan Usahawan
 * EntrepreneurProfile — 360° entrepreneur view with AI health score, KPI tracking,
 * AI distress detection, and semantic search.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, User, MapPin, Phone, Mail, Building2, TrendingUp,
  TrendingDown, Sparkles, ChevronRight, Loader2, AlertTriangle,
  RefreshCw, Eye, Calendar,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  getEntrepreneurs, getEntrepreneur, getAiHealth,
} from '../services/entrepreneurService';
import type { Entrepreneur, EntrepreneurDetail } from '../types';
import HealthScoreRing from '../components/HealthScoreRing';
import ScheduleVisitModal from '../components/ScheduleVisitModal';
import toast from 'react-hot-toast';

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  'Lancar':           'bg-green-100 text-green-700',
  'Perhatian Khusus': 'bg-yellow-100 text-yellow-700',
  'Tidak Lancar':     'bg-red-100 text-red-700',
};

const DISTRESS_COLOR: Record<string, string> = {
  'Rendah':    '#2E7D32',
  'Sederhana': '#F59E0B',
  'Tinggi':    '#E65100',
  'Kritikal':  '#DC2626',
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function EntrepreneurProfile() {
  const [entrepreneurs, setEntrepreneurs] = useState<Entrepreneur[]>([]);
  const [selected, setSelected]           = useState<EntrepreneurDetail | null>(null);
  const [search, setSearch]               = useState('');
  const [loadingList, setLoadingList]     = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [refreshingAi, setRefreshingAi]   = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [filterStatus, setFilterStatus]   = useState('');

  // ── Fetch list ──────────────────────────────────────────────────────────────

  const fetchList = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await getEntrepreneurs({
        search:           search || undefined,
        financing_status: filterStatus || undefined,
        per_page:         30,
      });
      setEntrepreneurs(res.data);
    } catch {
      toast.error('Gagal memuatkan senarai usahawan.');
    } finally {
      setLoadingList(false);
    }
  }, [search, filterStatus]);

  useEffect(() => {
    const t = setTimeout(fetchList, 300);
    return () => clearTimeout(t);
  }, [fetchList]);

  // ── Fetch detail ────────────────────────────────────────────────────────────

  const fetchDetail = useCallback(async (refNo: string) => {
    setLoadingDetail(true);
    try {
      const res = await getEntrepreneur(refNo);
      setSelected(res);
    } catch {
      toast.error('Gagal memuatkan profil usahawan.');
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  // Auto-select first on load
  useEffect(() => {
    if (entrepreneurs.length > 0 && !selected) {
      fetchDetail(entrepreneurs[0].ref_no);
    }
  }, [entrepreneurs, selected, fetchDetail]);

  // ── Refresh AI score ────────────────────────────────────────────────────────

  const refreshAiScore = async () => {
    if (!selected) return;
    setRefreshingAi(true);
    try {
      const res = await getAiHealth(selected.entrepreneur.ref_no);
      setSelected(prev => prev ? {
        ...prev,
        entrepreneur: {
          ...prev.entrepreneur,
          health_score:   res.score,
          distress_level: res.distress_level,
        },
      } : prev);
      toast.success(`Skor AI dikemaskini: ${res.score}/100`);
    } catch {
      toast.error('Gagal mengira semula skor AI.');
    } finally {
      setRefreshingAi(false);
    }
  };

  // ── KPI trend chart data ────────────────────────────────────────────────────

  const kpiChartData = selected?.kpi_trend?.map(k => ({
    period:    k.period,
    revenue:   k.revenue   ? k.revenue  / 1000 : 0,
    profit:    k.profit    ? k.profit   / 1000 : 0,
    employees: k.employee_count ?? 0,
  })) ?? [];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex gap-4" style={{ minHeight: '80vh' }}>
      {/* ── Left Panel: Entrepreneur List ──────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-3">
        {/* Search */}
        <div className="sppt-card p-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari usahawan, IC, perniagaan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="flex gap-1 mt-2 flex-wrap">
            {['', 'Lancar', 'Perhatian Khusus', 'Tidak Lancar'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors ${
                  filterStatus === s
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-200 text-gray-500 hover:border-gray-400'
                }`}
              >
                {s || 'Semua'}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="sppt-card p-0 overflow-hidden flex-1 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          {loadingList ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
          ) : entrepreneurs.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-400">Tiada usahawan ditemui.</div>
          ) : (
            entrepreneurs.map(e => {
              const isActive = selected?.entrepreneur.ref_no === e.ref_no;
              const scoreColor = e.health_score >= 70 ? '#2E7D32' : e.health_score >= 50 ? '#F59E0B' : '#DC2626';
              return (
                <button
                  key={e.id}
                  onClick={() => fetchDetail(e.ref_no)}
                  className={`w-full text-left p-3 border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                    isActive ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-gray-800 truncate">{e.name}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{e.ref_no} · {e.skim ?? '—'}</div>
                      <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${STATUS_COLOR[e.financing_status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {e.financing_status}
                      </span>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-sm font-bold" style={{ color: scoreColor }}>{e.health_score}</div>
                      <div className="text-[9px] text-gray-400">AI Skor</div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right Panel: 360° Profile ──────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4 overflow-y-auto" style={{ maxHeight: '90vh' }}>
        {loadingDetail ? (
          <div className="sppt-card flex items-center justify-center h-64">
            <Loader2 size={28} className="animate-spin text-gray-400" />
          </div>
        ) : !selected ? (
          <div className="sppt-card flex items-center justify-center h-64 text-gray-400 text-sm">
            Pilih usahawan dari senarai.
          </div>
        ) : (
          <>
            {/* Header Card */}
            <div className="sppt-card">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xl"
                    style={{ background: '#1B2B5E' }}
                  >
                    {selected.entrepreneur.name.charAt(0)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold" style={{ color: '#1B2B5E' }}>
                        {selected.entrepreneur.name}
                      </h2>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLOR[selected.entrepreneur.financing_status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {selected.entrepreneur.financing_status}
                      </span>
                      {selected.entrepreneur.distress_level === 'Kritikal' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                          <AlertTriangle size={10} /> Kritikal
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">{selected.entrepreneur.ref_no} · {selected.entrepreneur.skim ?? '—'}</div>
                    <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-gray-500">
                      {selected.entrepreneur.phone && (
                        <span className="flex items-center gap-1"><Phone size={11} /> {selected.entrepreneur.phone}</span>
                      )}
                      {selected.entrepreneur.email && (
                        <span className="flex items-center gap-1"><Mail size={11} /> {selected.entrepreneur.email}</span>
                      )}
                      {selected.entrepreneur.state && (
                        <span className="flex items-center gap-1"><MapPin size={11} /> {selected.entrepreneur.state}</span>
                      )}
                      {selected.entrepreneur.business_name && (
                        <span className="flex items-center gap-1"><Building2 size={11} /> {selected.entrepreneur.business_name}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Health Score Ring */}
                <div className="flex items-center gap-3">
                  <HealthScoreRing score={selected.entrepreneur.health_score} size={80} />
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Tahap Tekanan</div>
                    <div
                      className="text-sm font-bold mt-0.5"
                      style={{ color: DISTRESS_COLOR[selected.entrepreneur.distress_level] ?? '#9CA3AF' }}
                    >
                      {selected.entrepreneur.distress_level}
                    </div>
                    <button
                      onClick={refreshAiScore}
                      disabled={refreshingAi}
                      className="mt-1 flex items-center gap-1 text-[10px] text-purple-600 hover:text-purple-800 disabled:opacity-50"
                    >
                      {refreshingAi ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                      Kemas kini AI
                    </button>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-4 flex-wrap">
                <button
                  onClick={() => setShowVisitModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold"
                  style={{ background: '#2E7D32' }}
                >
                  <Calendar size={12} /> Jadual Lawatan
                </button>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                  <Eye size={12} /> Sejarah Pembiayaan
                </button>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-purple-200 text-xs font-semibold text-purple-700 hover:bg-purple-50">
                  <Sparkles size={12} /> Analisis AI
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: 'Jumlah Pembiayaan',
                  value: `RM ${selected.entrepreneur.total_financing.toLocaleString()}`,
                  icon: <TrendingUp size={16} />,
                  color: '#1B2B5E',
                },
                {
                  label: 'Baki Tertunggak',
                  value: `RM ${selected.entrepreneur.outstanding_balance.toLocaleString()}`,
                  icon: <TrendingDown size={16} />,
                  color: '#E65100',
                },
                {
                  label: 'Pendapatan Bulanan',
                  value: selected.entrepreneur.monthly_revenue
                    ? `RM ${selected.entrepreneur.monthly_revenue.toLocaleString()}`
                    : '—',
                  icon: <TrendingUp size={16} />,
                  color: '#2E7D32',
                },
                {
                  label: 'Bilangan Pekerja',
                  value: selected.entrepreneur.employee_count ?? '—',
                  icon: <User size={16} />,
                  color: '#7C3AED',
                },
              ].map(kpi => (
                <div key={kpi.label} className="sppt-card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] text-gray-500 font-medium">{kpi.label}</div>
                      <div className="text-lg font-bold mt-0.5" style={{ color: kpi.color }}>{kpi.value}</div>
                    </div>
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: kpi.color + '15', color: kpi.color }}
                    >
                      {kpi.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* KPI Trend Chart */}
            {kpiChartData.length > 0 && (
              <div className="sppt-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm" style={{ color: '#1B2B5E' }}>Trend Pendapatan & Keuntungan</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700 flex items-center gap-1">
                    <Sparkles size={9} /> AI Tracked
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={kpiChartData} margin={{ left: 0, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} unit="k" />
                    <Tooltip formatter={(v: number) => [`RM ${v}k`, '']} />
                    <Line
                      type="monotone" dataKey="revenue" stroke="#1B2B5E"
                      strokeWidth={2} dot={{ r: 3 }} name="Pendapatan"
                    />
                    <Line
                      type="monotone" dataKey="profit" stroke="#2E7D32"
                      strokeWidth={2} dot={{ r: 3 }} name="Keuntungan"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* AI Factors */}
            {selected.entrepreneur.ai_factors && (selected.entrepreneur.ai_factors as unknown[]).length > 0 && (
              <div className="sppt-card">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={14} className="text-purple-600" />
                  <h3 className="font-bold text-sm" style={{ color: '#1B2B5E' }}>Faktor Risiko AI</h3>
                </div>
                <div className="space-y-2">
                  {(selected.entrepreneur.ai_factors as Array<{ factor: string; impact: string; weight: number }>).map((factor, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-xs font-medium text-gray-700">{factor.factor}</div>
                        <div className="text-[10px] text-gray-500">{factor.impact}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.abs(factor.weight) * 100}%`,
                              background: factor.weight < 0 ? '#DC2626' : '#2E7D32',
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-bold" style={{ color: factor.weight < 0 ? '#DC2626' : '#2E7D32' }}>
                          {factor.weight > 0 ? '+' : ''}{(factor.weight * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Visits */}
            {selected.recent_visits && selected.recent_visits.length > 0 && (
              <div className="sppt-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm" style={{ color: '#1B2B5E' }}>Lawatan Terkini</h3>
                  <button className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    Lihat semua <ChevronRight size={12} />
                  </button>
                </div>
                <div className="space-y-2">
                  {selected.recent_visits.slice(0, 3).map(v => (
                    <div key={v.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-xs font-medium text-gray-700">{v.purpose}</div>
                        <div className="text-[10px] text-gray-400">{v.scheduled_date} · {v.officer?.name ?? '—'}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        v.status === 'Selesai'       ? 'bg-green-100 text-green-700' :
                        v.status === 'Dijadualkan'   ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {v.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Schedule Visit Modal */}
      {showVisitModal && selected && (
        <ScheduleVisitModal
          entrepreneurId={selected.entrepreneur.ref_no}
          entrepreneurName={selected.entrepreneur.name}
          onClose={() => setShowVisitModal(false)}
          onScheduled={() => {
            setShowVisitModal(false);
            fetchDetail(selected.entrepreneur.ref_no);
            toast.success('Lawatan berjaya dijadualkan!');
          }}
        />
      )}
    </div>
  );
}
