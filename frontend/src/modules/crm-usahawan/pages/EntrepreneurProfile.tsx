/**
 * Module 7 — CRM & Pemantauan Usahawan
 * EntrepreneurProfile — Profil Usahawan 360° dengan 4-tab layout
 * Tab 1: Profil | Tab 2: KPI & Trend | Tab 3: Sejarah Lawatan | Tab 4: AI Analisis
 * Komponen wajib: PageHeader, AiBadge, AiInsightCard, AiScoreRing, LoadingSpinner, Toast
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, Building2, Phone, Mail, MapPin, TrendingUp, TrendingDown,
  Calendar, RefreshCw, AlertTriangle, CheckCircle, Users, DollarSign,
  ChevronLeft, Sparkles, FileText, Clock, XCircle,
} from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { PageHeader, LoadingSpinner, toast, ToastContainer } from '@/components/ui';
import { AiBadge, AiScoreRing, AiInsightCard } from '@/components/ai';
import {
  getEntrepreneur, getVisits, generateVisitReport, getAiHealth,
} from '../services/entrepreneurService';
import type { Entrepreneur360, FieldVisit, KpiSnapshot, AiHealthResult } from '../types';

type Tab = 'profil' | 'kpi' | 'lawatan' | 'ai';
const TABS: { id: Tab; label: string }[] = [
  { id: 'profil',  label: 'Profil' },
  { id: 'kpi',     label: 'KPI & Trend' },
  { id: 'lawatan', label: 'Sejarah Lawatan' },
  { id: 'ai',      label: 'AI Analisis' },
];

const VISIT_STATUS_CLASS: Record<string, string> = {
  Selesai:           'bg-green-100 text-green-800',
  Dijadualkan:       'bg-blue-100 text-blue-800',
  'Dalam Perjalanan':'bg-orange-100 text-orange-800',
  Dibatalkan:        'bg-red-100 text-red-800',
  'Tidak Hadir':     'bg-yellow-100 text-yellow-800',
};

const DISTRESS_COLOUR: Record<string, string> = {
  Rendah: '#2E7D32', Sederhana: '#E65100', Tinggi: '#C62828', Kritikal: '#C62828',
};

const FACTOR_LABEL: Record<string, string> = {
  status_pembiayaan_perhatian_khusus: 'Status Perhatian Khusus',
  status_pembiayaan_tidak_lancar:     'Status Tidak Lancar',
  baki_tinggi:                        'Baki Tertunggak Tinggi (>90%)',
  margin_negatif:                     'Margin Keuntungan Negatif',
  margin_rendah:                      'Margin Keuntungan Rendah (<10%)',
  tiada_data_pendapatan:              'Tiada Data Pendapatan',
  perniagaan_baru:                    'Perniagaan Baru (<1 tahun)',
  tiada_lawatan_lapangan:             'Tiada Lawatan Lapangan',
  lawatan_lama:                       'Lawatan Terakhir >6 Bulan',
};

export default function EntrepreneurProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab]         = useState<Tab>('profil');
  const [entrepreneur, setEntrepreneur]   = useState<Entrepreneur360 | null>(null);
  const [kpiTrend, setKpiTrend]           = useState<KpiSnapshot[]>([]);
  const [visits, setVisits]               = useState<FieldVisit[]>([]);
  const [aiHealth, setAiHealth]           = useState<AiHealthResult | null>(null);
  const [loading, setLoading]             = useState(true);
  const [aiLoading, setAiLoading]         = useState(false);
  const [reportLoading, setReportLoading] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [profileRes, visitsRes] = await Promise.all([
        getEntrepreneur(id),
        getVisits(id),
      ]);
      setEntrepreneur(profileRes.entrepreneur);
      setKpiTrend(profileRes.kpi_trend ?? []);
      setVisits(visitsRes.data ?? []);
    } catch {
      toast.error('Gagal memuatkan profil usahawan dari pangkalan data.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadAiHealth = useCallback(async () => {
    if (!id) return;
    setAiLoading(true);
    try {
      const result = await getAiHealth(id);
      setAiHealth(result);
    } catch {
      toast.error('Gagal memuatkan analisis SPPT AI.');
    } finally {
      setAiLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (activeTab === 'ai') loadAiHealth(); }, [activeTab, loadAiHealth]);

  const handleGenerateReport = async (visit: FieldVisit) => {
    setReportLoading(visit.id);
    try {
      const res = await generateVisitReport(visit.id, {
        business_condition: visit.business_condition,
        reported_revenue:   visit.reported_revenue,
        reported_employees: visit.reported_employees,
        visit_notes:        visit.visit_notes,
        actual_date:        visit.actual_date,
      });
      setVisits(prev => prev.map(v =>
        v.id === visit.id
          ? { ...v, ai_report: res.report, has_ai_report: true, ai_report_generated_at: res.generated_at }
          : v,
      ));
      toast.success('Laporan SPPT AI berjaya dijana.');
    } catch {
      toast.error('Gagal menjana laporan SPPT AI.');
    } finally {
      setReportLoading(null);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!entrepreneur) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertTriangle size={32} className="text-gray-300" />
        <p className="text-gray-500">Usahawan tidak dijumpai.</p>
        <button onClick={() => navigate('/crm')} className="text-sm text-[#1B2B5E] underline">Kembali</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ToastContainer />

      <PageHeader
        title={entrepreneur.name}
        subtitle={`${entrepreneur.ref_no} · ${entrepreneur.business_name ?? 'Tiada nama perniagaan'}`}
        breadcrumbs={[{ label: 'Utama' }, { label: 'CRM', href: '/crm' }, { label: entrepreneur.name }]}
        icon={<User size={20} className="text-white" />}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/crm')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              <ChevronLeft size={14} /> Kembali
            </button>
            <AiBadge label="SPPT AI" size="md" />
          </div>
        }
      />

      {/* Summary card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-wrap items-center gap-5">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
            style={{ background: '#1B2B5E' }}
          >
            {entrepreneur.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900">{entrepreneur.name}</h2>
            <p className="text-sm text-gray-500">{entrepreneur.business_name} · {entrepreneur.skim}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                entrepreneur.financing_status === 'Lancar' ? 'bg-green-100 text-green-800' :
                entrepreneur.financing_status === 'Perhatian Khusus' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>{entrepreneur.financing_status}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {entrepreneur.sector ?? 'Sektor tidak dinyatakan'}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <AiScoreRing score={entrepreneur.health_score ?? 0} label="Skor Kesihatan" size={72} />
            <AiBadge label="SPPT AI" size="sm" />
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500">Pembiayaan</div>
              <div className="text-sm font-bold" style={{ color: '#1B2B5E' }}>
                RM {(entrepreneur.total_financing ?? 0).toLocaleString('ms-MY')}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500">Baki Tertunggak</div>
              <div className="text-sm font-bold" style={{ color: '#E65100' }}>
                RM {(entrepreneur.outstanding_balance ?? 0).toLocaleString('ms-MY')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 text-[#1B2B5E]'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              style={activeTab === tab.id ? { borderBottomColor: '#1B2B5E' } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: PROFIL ─────────────────────────────────────────────────── */}
        {activeTab === 'profil' && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: '#1B2B5E' }}>
                <User size={14} /> Maklumat Peribadi
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Nombor IC',  value: entrepreneur.ic_no },
                  { label: 'No. Telefon', value: entrepreneur.phone },
                  { label: 'E-mel',       value: entrepreneur.email ?? '—' },
                  { label: 'Jantina',     value: entrepreneur.gender ?? '—' },
                  { label: 'Bangsa',      value: entrepreneur.race ?? '—' },
                  { label: 'Alamat',      value: entrepreneur.address ?? '—' },
                  { label: 'Negeri',      value: entrepreneur.state ?? '—' },
                  { label: 'Daerah',      value: entrepreneur.district ?? '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-3">
                    <span className="text-xs text-gray-500 w-28 flex-shrink-0 pt-0.5">{label}</span>
                    <span className="text-xs font-medium text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: '#1B2B5E' }}>
                <Building2 size={14} /> Maklumat Perniagaan
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Nama Perniagaan',   value: entrepreneur.business_name ?? '—' },
                  { label: 'No. Pendaftaran',   value: entrepreneur.business_reg_no ?? '—' },
                  { label: 'Jenis Perniagaan',  value: entrepreneur.business_type ?? '—' },
                  { label: 'Sektor',            value: entrepreneur.sector ?? '—' },
                  { label: 'Skim',              value: entrepreneur.skim ?? '—' },
                  { label: 'Tarikh Mula',       value: entrepreneur.business_start_date ?? '—' },
                  { label: 'Umur Perniagaan',   value: entrepreneur.business_age_years ? `${entrepreneur.business_age_years} tahun` : '—' },
                  { label: 'Bilangan Pekerja',  value: String(entrepreneur.employee_count ?? 0) },
                  { label: 'Pendapatan/Bulan',  value: entrepreneur.monthly_revenue ? `RM ${entrepreneur.monthly_revenue.toLocaleString('ms-MY')}` : '—' },
                  { label: 'Perbelanjaan/Bulan',value: entrepreneur.monthly_expenses ? `RM ${entrepreneur.monthly_expenses.toLocaleString('ms-MY')}` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-3">
                    <span className="text-xs text-gray-500 w-36 flex-shrink-0 pt-0.5">{label}</span>
                    <span className="text-xs font-medium text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: KPI & TREND ───────────────────────────────────────────── */}
        {activeTab === 'kpi' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Pendapatan Bulanan',  value: entrepreneur.monthly_revenue ? `RM ${entrepreneur.monthly_revenue.toLocaleString('ms-MY')}` : '—', colour: '#2E7D32', icon: <DollarSign size={16} /> },
                { label: 'Perbelanjaan Bulanan',value: entrepreneur.monthly_expenses ? `RM ${entrepreneur.monthly_expenses.toLocaleString('ms-MY')}` : '—', colour: '#E65100', icon: <TrendingDown size={16} /> },
                { label: 'Bilangan Pekerja',    value: String(entrepreneur.employee_count ?? 0), colour: '#1B2B5E', icon: <Users size={16} /> },
                { label: 'Skor Kesihatan AI',   value: `${entrepreneur.health_score ?? 0}/100`, colour: '#673AB7', icon: <Sparkles size={16} /> },
              ].map(({ label, value, colour, icon }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span style={{ color: colour }}>{icon}</span>
                  </div>
                  <div className="text-lg font-bold" style={{ color: colour }}>{value}</div>
                </div>
              ))}
            </div>

            {kpiTrend.length > 0 ? (
              <>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm" style={{ color: '#1B2B5E' }}>Trend Pendapatan & Perbelanjaan</h3>
                    <AiBadge label="Data Sebenar DB" size="sm" />
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={kpiTrend} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                      <defs>
                        <linearGradient id="revGradP" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#2E7D32" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="expGradP" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#E65100" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#E65100" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                      <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `RM${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => `RM ${v.toLocaleString('ms-MY')}`} />
                      <Legend />
                      <Area type="monotone" dataKey="revenue"  stroke="#2E7D32" fill="url(#revGradP)" strokeWidth={2} name="Pendapatan" />
                      <Area type="monotone" dataKey="expenses" stroke="#E65100" fill="url(#expGradP)" strokeWidth={2} name="Perbelanjaan" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm" style={{ color: '#1B2B5E' }}>Trend Keuntungan</h3>
                    <AiBadge label="SPPT AI" size="sm" />
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={kpiTrend} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                      <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `RM${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => `RM ${v.toLocaleString('ms-MY')}`} />
                      <Line type="monotone" dataKey="profit" stroke="#673AB7" strokeWidth={2} dot={{ fill: '#673AB7', r: 3 }} name="Keuntungan" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400">
                <TrendingUp size={32} className="opacity-30" />
                <p className="text-sm">Tiada data KPI tersedia untuk usahawan ini.</p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: SEJARAH LAWATAN ───────────────────────────────────────── */}
        {activeTab === 'lawatan' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-sm" style={{ color: '#1B2B5E' }}>
                Sejarah Lawatan Tapak ({visits.length} lawatan)
              </h3>
              <button
                onClick={() => navigate('/crm/lawatan')}
                className="text-xs px-3 py-1.5 rounded-lg text-white"
                style={{ background: '#1B2B5E' }}
              >
                + Jadual Lawatan Baru
              </button>
            </div>
            {visits.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
                <Calendar size={32} className="opacity-30" />
                <p className="text-sm">Tiada lawatan tapak direkodkan.</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-6">
                  {visits.map((visit) => (
                    <div key={visit.id} className="relative pl-14">
                      <div
                        className="absolute left-3.5 top-1 w-3 h-3 rounded-full border-2 border-white"
                        style={{ background: visit.status === 'Selesai' ? '#2E7D32' : visit.status === 'Dibatalkan' ? '#C62828' : '#E65100' }}
                      />
                      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-gray-500">{visit.ref_no}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${VISIT_STATUS_CLASS[visit.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                {visit.status}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-800 mt-1">{visit.purpose}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">{visit.actual_date ?? visit.scheduled_date}</div>
                            {visit.officer && <div className="text-xs text-gray-400">{visit.officer.name}</div>}
                          </div>
                        </div>
                        {visit.business_condition && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-gray-500">Keadaan Perniagaan:</span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              visit.business_condition === 'Baik' ? 'bg-green-100 text-green-700' :
                              visit.business_condition === 'Kritikal' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>{visit.business_condition}</span>
                          </div>
                        )}
                        {visit.visit_notes && (
                          <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2 mb-3">{visit.visit_notes}</p>
                        )}
                        {/* AI Report */}
                        {visit.has_ai_report && visit.ai_report ? (
                          <div className="rounded-xl p-4 mt-2" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
                            <div className="flex items-center gap-2 mb-2">
                              <AiBadge label="Dijana oleh SPPT AI" size="sm" />
                              {visit.ai_report_generated_at && (
                                <span className="text-[10px] text-gray-400">
                                  {new Date(visit.ai_report_generated_at).toLocaleDateString('ms-MY')}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">{visit.ai_report}</p>
                          </div>
                        ) : visit.status === 'Selesai' ? (
                          <button
                            onClick={() => handleGenerateReport(visit)}
                            disabled={reportLoading === visit.id}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-white mt-2 disabled:opacity-60"
                            style={{ background: '#673AB7' }}
                          >
                            {reportLoading === visit.id ? <RefreshCw size={11} className="animate-spin" /> : <Sparkles size={11} />}
                            Jana Laporan SPPT AI
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: AI ANALISIS ───────────────────────────────────────────── */}
        {activeTab === 'ai' && (
          <div className="p-6 space-y-5">
            <div className="rounded-xl p-5 flex flex-wrap items-center gap-4" style={{ background: 'linear-gradient(135deg, #673AB7 0%, #4527A0 100%)' }}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={16} className="text-white opacity-80" />
                  <span className="text-white text-sm font-semibold">Analisis Kesihatan SPPT AI</span>
                </div>
                <p className="text-purple-200 text-xs">
                  Skor dikira berdasarkan status pembiayaan, margin keuntungan, umur perniagaan, dan sejarah lawatan.
                </p>
              </div>
              <button
                onClick={loadAiHealth}
                disabled={aiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs"
              >
                <RefreshCw size={12} className={aiLoading ? 'animate-spin' : ''} />
                Kemas Kini
              </button>
            </div>

            {aiLoading ? (
              <LoadingSpinner />
            ) : aiHealth ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl p-5 flex flex-col items-center gap-3" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
                    <AiScoreRing score={aiHealth.score} label="Skor Kesihatan" size={90} />
                    <AiBadge label="SPPT AI" size="md" />
                  </div>
                  <div className="rounded-xl p-5" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
                    <div className="text-xs text-gray-500 mb-1">Tahap Tekanan</div>
                    <div className="text-2xl font-bold mb-2" style={{ color: DISTRESS_COLOUR[aiHealth.distress_level] ?? '#1B2B5E' }}>
                      {aiHealth.distress_level}
                    </div>
                    <div className="text-xs text-gray-500 mb-1">Kebarangkalian Lalai</div>
                    <div className="text-lg font-bold" style={{ color: '#C62828' }}>
                      {(aiHealth.default_probability * 100).toFixed(1)}%
                    </div>
                    <div className="mt-3"><AiBadge label={aiHealth.health_badge} size="sm" /></div>
                  </div>
                  <div className="rounded-xl p-5" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
                    <div className="text-xs font-semibold text-purple-800 mb-3">Faktor Risiko Dikesan</div>
                    {aiHealth.factors.length > 0 ? (
                      <ul className="space-y-2">
                        {aiHealth.factors.map((f) => (
                          <li key={f} className="flex items-start gap-2">
                            <AlertTriangle size={11} className="text-orange-500 flex-shrink-0 mt-0.5" />
                            <span className="text-xs text-gray-700">{FACTOR_LABEL[f] ?? f.replace(/_/g, ' ')}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle size={14} />
                        <span className="text-xs">Tiada faktor risiko dikesan</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <AiInsightCard
                    type="recommendation"
                    title="Cadangan Tindakan SPPT AI"
                    content={
                      aiHealth.score >= 70
                        ? 'Usahawan menunjukkan prestasi yang memuaskan. Teruskan pemantauan berkala setiap 3 bulan dan galakkan pengembangan perniagaan.'
                        : aiHealth.score >= 50
                          ? 'Prestasi usahawan berada pada tahap sederhana. Disyorkan lawatan tapak dalam masa 30 hari dan semakan semula rancangan perniagaan.'
                          : 'Usahawan berisiko tinggi. Tindakan segera diperlukan — jadualkan lawatan tapak dalam 7 hari, semak kemampuan bayar balik, dan pertimbangkan program pemulihan.'
                    }
                    confidence={aiHealth.score}
                    model="Enjin AI SPPT"
                  />
                  {(aiHealth.distress_level === 'Kritikal' || aiHealth.distress_level === 'Tinggi') ? (
                    <AiInsightCard
                      type="warning"
                      title="Amaran Risiko SPPT AI"
                      content={`Usahawan ini dikesan dalam tahap ${aiHealth.distress_level}. Kebarangkalian lalai pembayaran adalah ${(aiHealth.default_probability * 100).toFixed(1)}%. Sila ambil tindakan segera.`}
                      confidence={Math.round(aiHealth.default_probability * 100)}
                      model="Enjin AI SPPT"
                    />
                  ) : (
                    <AiInsightCard
                      type="info"
                      title="Ringkasan Analisis SPPT AI"
                      content={`Analisis menyeluruh telah dijalankan ke atas ${aiHealth.factors.length} faktor utama. Skor kesihatan semasa adalah ${aiHealth.score}/100 dengan tahap tekanan ${aiHealth.distress_level}.`}
                      confidence={aiHealth.score}
                      model="Enjin AI SPPT"
                    />
                  )}
                </div>

                <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <FileText size={12} className="text-purple-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-purple-600 leading-relaxed">
                    Analisis ini dijana secara automatik oleh Enjin AI SPPT berdasarkan data dalam sistem.
                    Keputusan ini adalah untuk rujukan sahaja dan tidak menggantikan penilaian profesional pegawai kredit.
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-gray-400">
                <Sparkles size={32} className="opacity-30" />
                <p className="text-sm">Klik "Kemas Kini" untuk memuatkan analisis SPPT AI.</p>
                <button onClick={loadAiHealth} className="text-xs px-4 py-2 rounded-lg text-white" style={{ background: '#673AB7' }}>
                  Muatkan Analisis AI
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
