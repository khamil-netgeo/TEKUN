import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, Building2, Phone, Mail, MapPin, TrendingUp, TrendingDown,
  Calendar, Plus, RefreshCw, AlertTriangle, CheckCircle, Activity,
  ChevronLeft, Briefcase, Users,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import { entrepreneurService } from '../services/entrepreneurService';
import { HealthScoreRing } from '../components/HealthScoreRing';
import { ScheduleVisitModal } from '../components/ScheduleVisitModal';
import type { Entrepreneur, AiHealthResult, FieldVisit } from '../types';

const DISTRESS_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const STATUS_COLORS: Record<string, string> = {
  Lancar: 'bg-green-100 text-green-800',
  'Perhatian Khusus': 'bg-yellow-100 text-yellow-800',
  'Tidak Lancar': 'bg-orange-100 text-orange-800',
  NPL: 'bg-red-100 text-red-800',
};

const DISTRESS_COLOR: Record<string, string> = {
  'Rendah':    '#2E7D32',
  'Sederhana': '#F59E0B',
  'Tinggi':    '#E65100',
  'Kritikal':  '#DC2626',
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function EntrepreneurProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entrepreneur, setEntrepreneur] = useState<Entrepreneur | null>(null);
  const [aiHealth, setAiHealth] = useState<AiHealthResult | null>(null);
  const [visits, setVisits] = useState<FieldVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'kpi' | 'visits' | 'ai'>('overview');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [profile, health, visitData] = await Promise.all([
        entrepreneurService.get(id),
        entrepreneurService.getAiHealth(id),
        entrepreneurService.getVisits(id),
      ]);
      setEntrepreneur(profile);
      setAiHealth(health);
      setVisits(visitData.data);
    } catch (err) {
      console.error('Failed to load entrepreneur profile', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-[#1B2B5E]" size={32} />
      </div>
    );
  }

  if (!entrepreneur) {
    return (
      <div className="p-8 text-center text-gray-500">
        Profil usahawan tidak dijumpai.
      </div>
    );
  }

  const kpiData = (entrepreneur.kpi_trend ?? []).map(k => ({
    month: new Date(k.snapshot_date).toLocaleDateString('ms-MY', { month: 'short', year: '2-digit' }),
    revenue: k.monthly_revenue,
    expenses: k.monthly_expenses,
    health: k.health_score,
    employees: k.employee_count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B5E]">{entrepreneur.name}</h1>
          <p className="text-sm text-gray-500">{entrepreneur.ref_no} · {entrepreneur.skim}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[entrepreneur.status] ?? 'bg-gray-100 text-gray-700'}`}>
            {entrepreneur.status}
          </span>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1B2B5E] text-white rounded-lg text-sm hover:bg-blue-900"
          >
            <Plus size={16} />
            Jadual Lawatan
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={16} className="text-[#1B2B5E]" />
            <span className="text-xs text-gray-500">Skor Kesihatan</span>
          </div>
          <p className="text-2xl font-bold text-[#1B2B5E]">{entrepreneur.health_score}</p>
          <p className="text-xs text-gray-400">/ 100</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-green-600" />
            <span className="text-xs text-gray-500">Pendapatan Bulanan</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            RM {(entrepreneur.monthly_revenue ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} className="text-blue-600" />
            <span className="text-xs text-gray-500">Pekerja</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{entrepreneur.employee_count ?? 0}</p>
          <p className="text-xs text-gray-400">orang</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase size={16} className="text-orange-600" />
            <span className="text-xs text-gray-500">Baki Pembiayaan</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            RM {(entrepreneur.outstanding_balance ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-100">
          {(['overview', 'kpi', 'visits', 'ai'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-[#1B2B5E] text-[#1B2B5E]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'overview' ? 'Profil' : tab === 'kpi' ? 'KPI & Trend' : tab === 'visits' ? 'Lawatan' : 'AI Analisis'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <User size={16} /> Maklumat Peribadi
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-gray-600">
                    <User size={14} className="text-gray-400 shrink-0" />
                    <span>{entrepreneur.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Phone size={14} className="text-gray-400 shrink-0" />
                    <span>{entrepreneur.phone}</span>
                  </div>
                  {entrepreneur.email && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <Mail size={14} className="text-gray-400 shrink-0" />
                      <span>{entrepreneur.email}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 size={16} /> Maklumat Perniagaan
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Building2 size={14} className="text-gray-400 shrink-0" />
                    <span>{entrepreneur.business_name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Briefcase size={14} className="text-gray-400 shrink-0" />
                    <span>{entrepreneur.business_sector}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <MapPin size={14} className="text-gray-400 shrink-0" />
                    <span>{entrepreneur.business_address}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KPI Tab */}
          {activeTab === 'kpi' && (
            <div className="space-y-6">
              {kpiData.length > 0 ? (
                <>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Trend Pendapatan (12 Bulan)</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={kpiData}>
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1B2B5E" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#1B2B5E" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `RM${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: number) => [`RM ${v.toLocaleString()}`, 'Pendapatan']} />
                        <Area type="monotone" dataKey="revenue" stroke="#1B2B5E" fill="url(#revGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Trend Skor Kesihatan</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={kpiData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="health" stroke="#2E7D32" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <TrendingDown size={40} className="mx-auto mb-3 opacity-40" />
                  <p>Tiada data KPI tersedia.</p>
                </div>
              )}
            </div>
          )}

          {/* Visits Tab */}
          {activeTab === 'visits' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Sejarah Lawatan</h3>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#1B2B5E] text-white rounded-lg text-sm hover:bg-blue-900"
                >
                  <Plus size={14} />
                  Jadual Baru
                </button>
              </div>
              {visits.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Calendar size={40} className="mx-auto mb-3 opacity-40" />
                  <p>Tiada lawatan dijadualkan.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visits.map(visit => (
                    <div key={visit.id} className="flex items-start gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                        <Calendar size={18} className="text-[#1B2B5E]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-900">{visit.purpose}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            visit.status === 'Selesai' ? 'bg-green-100 text-green-700' :
                            visit.status === 'Dijadualkan' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {visit.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(visit.scheduled_date).toLocaleDateString('ms-MY')} · {visit.scheduled_time} · {visit.location}
                        </p>
                        {visit.ai_report && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{visit.ai_report}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI Tab */}
          {activeTab === 'ai' && aiHealth && (
            <div className="space-y-6">
              <div className="flex items-start gap-8">
                <div className="shrink-0">
                  <HealthScoreRing score={aiHealth.score} size={140} />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${DISTRESS_COLORS[aiHealth.distress_level] ?? 'bg-gray-100 text-gray-700'}`}>
                      {aiHealth.badge}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{aiHealth.recommendation}</p>
                  <p className="text-xs text-gray-400">
                    Dikira pada: {new Date(aiHealth.computed_at).toLocaleString('ms-MY')}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Faktor Penilaian AI</h3>
                <div className="space-y-2">
                  {aiHealth.factors.map((f, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                      {f.impact === 'positive' ? (
                        <CheckCircle size={16} className="text-green-600 mt-0.5 shrink-0" />
                      ) : f.impact === 'negative' ? (
                        <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                      ) : (
                        <Activity size={16} className="text-gray-400 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{f.factor}</p>
                        <p className="text-xs text-gray-500">{f.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Visit Modal */}
      {showScheduleModal && entrepreneur && (
        <ScheduleVisitModal
          entrepreneurId={entrepreneur.ref_no}
          entrepreneurName={entrepreneur.name}
          onClose={() => setShowScheduleModal(false)}
          onSuccess={() => {
            setShowScheduleModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}
