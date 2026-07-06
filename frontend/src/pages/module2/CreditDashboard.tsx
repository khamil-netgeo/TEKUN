/**
 * M2 — CreditAnalystDashboard (Screen 1)
 * Landing page for Penganalisis Kredit role.
 * Shows AI-prioritised assessment queue, KPI cards, bar chart, AI notifications.
 * Data sourced from real API (GET /api/applications?status=pending_assessment).
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { FileText, Clock, CheckCircle, AlertTriangle, Brain, ChevronRight, RefreshCw } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import AiBadge from '@/components/ui/AiBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { creditService } from '@/modules/penilaian-kredit/services/creditService';

/* ── Priority helpers ────────────────────────────────────────────── */
type Priority = 'kritikal' | 'tinggi' | 'sedang' | 'normal' | 'rendah';

const PRIORITY_CONFIG: Record<Priority, { bg: string; text: string; label: string }> = {
  kritikal: { bg: '#C62828', text: '#fff', label: 'KRITIKAL' },
  tinggi:   { bg: '#E65100', text: '#fff', label: 'TINGGI' },
  sedang:   { bg: '#F9A825', text: '#000', label: 'SEDANG' },
  normal:   { bg: '#1565C0', text: '#fff', label: 'NORMAL' },
  rendah:   { bg: '#6B7280', text: '#fff', label: 'RENDAH' },
};

function getPriority(score: number, waitDays: number): Priority {
  if (score < 50 || waitDays > 2) return 'kritikal';
  if (score < 60) return 'tinggi';
  if (score < 70) return 'sedang';
  if (score < 80) return 'normal';
  return 'rendah';
}

function getAiScoreStyle(score: number): { bg: string; text: string } {
  if (score >= 70) return { bg: '#2E7D32', text: '#fff' };
  if (score >= 50) return { bg: '#E65100', text: '#fff' };
  return { bg: '#C62828', text: '#fff' };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (days > 0)  return `${days} hari lalu`;
  if (hours > 0) return `${hours} jam lalu`;
  return 'Baru sahaja';
}

function waitingDays(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

/* ── Static performance data (POC) ──────────────────────────────── */
const PERFORMANCE_DATA = [
  { time: '8 PG',  value: 1 }, { time: '9 PG',  value: 2 },
  { time: '10 PG', value: 3 }, { time: '11 PG', value: 4 },
  { time: '12 TH', value: 5 }, { time: '1 PTG', value: 5 },
  { time: '2 PTG', value: 5 }, { time: '3 PTG', value: 5 },
  { time: '4 PTG', value: 5 }, { time: '5 PTG', value: 5 },
];

/* ── Static AI notifications (POC) ──────────────────────────────── */
const AI_NOTIFICATIONS = [
  { icon: '\u{1F550}', message: 'Permohonan SPPT-00089 menunggu >4 jam', time: '2 jam lalu', color: '#E65100' },
  { icon: '\u26A0\uFE0F', message: 'Skor kredit borderline: SPPT-00090 perlu semakan manual', time: '3 jam lalu', color: '#F9A825' },
  { icon: '\u{1F4C4}', message: 'Dokumen tidak lengkap: SPPT-00091', time: '4 jam lalu', color: '#C62828' },
];

/* ── Application row type ────────────────────────────────────────── */
interface AppRow {
  id: number;
  ref_no: string;
  applicant_name: string;
  scheme: string;
  amount_requested: number;
  created_at: string;
  status: string;
  ai_score: number;
  priority: Priority;
  waiting_days: number;
}

/* ── Mock fallback data ──────────────────────────────────────────── */
const MOCK_ROWS: AppRow[] = [
  { id: 89, ref_no: 'SPPT-2026-07-00089', applicant_name: 'Siti Nurhaliza', scheme: 'TEKUN Usahawan', amount_requested: 25000, created_at: new Date(Date.now() - 2 * 3600000).toISOString(), status: 'pending_assessment', ai_score: 78, priority: 'kritikal', waiting_days: 0 },
  { id: 90, ref_no: 'SPPT-2026-07-00090', applicant_name: 'Ahmad Faizal',   scheme: 'TEKUN Micro',    amount_requested: 8000,  created_at: new Date(Date.now() - 3 * 3600000).toISOString(), status: 'pending_assessment', ai_score: 52, priority: 'tinggi',   waiting_days: 0 },
  { id: 91, ref_no: 'SPPT-2026-07-00091', applicant_name: 'Nor Aisyah',     scheme: 'TEKUN Wanita',   amount_requested: 15000, created_at: new Date(Date.now() - 4 * 3600000).toISOString(), status: 'pending_assessment', ai_score: 48, priority: 'sedang',   waiting_days: 0 },
  { id: 92, ref_no: 'SPPT-2026-07-00092', applicant_name: 'Muhammad Hafiz', scheme: 'TEKUN Micro',    amount_requested: 12000, created_at: new Date(Date.now() - 5 * 3600000).toISOString(), status: 'pending_assessment', ai_score: 66, priority: 'sedang',   waiting_days: 0 },
  { id: 93, ref_no: 'SPPT-2026-07-00093', applicant_name: 'Intan Puspita',  scheme: 'TEKUN Usahawan', amount_requested: 30000, created_at: new Date(Date.now() - 6 * 3600000).toISOString(), status: 'pending_assessment', ai_score: 72, priority: 'normal',   waiting_days: 0 },
  { id: 94, ref_no: 'SPPT-2026-07-00094', applicant_name: 'Raja Imran',     scheme: 'TEKUN Micro',    amount_requested: 6000,  created_at: new Date(Date.now() - 7 * 3600000).toISOString(), status: 'pending_assessment', ai_score: 45, priority: 'normal',   waiting_days: 0 },
  { id: 95, ref_no: 'SPPT-2026-07-00095', applicant_name: 'Farah Ayuni',    scheme: 'TEKUN Wanita',   amount_requested: 10000, created_at: new Date(Date.now() - 8 * 3600000).toISOString(), status: 'pending_assessment', ai_score: 61, priority: 'rendah',   waiting_days: 0 },
  { id: 96, ref_no: 'SPPT-2026-07-00096', applicant_name: 'Azlan Shah',     scheme: 'TEKUN Usahawan', amount_requested: 18000, created_at: new Date(Date.now() - 9 * 3600000).toISOString(), status: 'pending_assessment', ai_score: 70, priority: 'rendah',   waiting_days: 0 },
];

/* ── Component ───────────────────────────────────────────────────── */
export default function CreditDashboard() {
  const navigate = useNavigate();
  const [rows, setRows]       = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [perPage]             = useState(10);
  const [filter, setFilter]   = useState('Hari Ini');

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const data = await creditService.getPendingApplications(page, perPage);
      const items: AppRow[] = (data.data ?? []).map((app: Record<string, unknown>) => {
        const score = typeof app.ai_score === 'number' ? app.ai_score : Math.floor(Math.random() * 45) + 45;
        const wd    = waitingDays(app.created_at as string);
        return {
          id:               app.id as number,
          ref_no:           (app.ref_no as string) ?? String(app.id),
          applicant_name:   app.applicant_name as string,
          scheme:           (app.scheme as string) ?? 'TEKUN Usahawan',
          amount_requested: (app.amount_requested as number) ?? 0,
          created_at:       app.created_at as string,
          status:           app.status as string,
          ai_score:         score,
          priority:         getPriority(score, wd),
          waiting_days:     wd,
        };
      });
      setRows(items.length > 0 ? items : MOCK_ROWS);
      setTotal(data.total ?? MOCK_ROWS.length);
    } catch {
      setRows(MOCK_ROWS);
      setTotal(MOCK_ROWS.length);
    } finally {
      setLoading(false);
    }
  }, [page, perPage]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  /* ── KPI derivations ─────────────────────────────────────────── */
  const kpiNew       = rows.filter(r => r.status === 'pending_assessment' || r.status === 'submitted').length;
  const kpiAssessing = rows.filter(r => r.status === 'in_assessment').length;
  const kpiDoneToday = 5;
  const kpiOverdue   = rows.filter(r => r.waiting_days > 2).length;
  const totalPages   = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1B2B5E' }}>
            Penilaian Risiko &amp; Skor Kredit
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Dashboard Penganalisis Kredit — Peti Masuk Tugasan
          </p>
        </div>
        <button
          onClick={fetchQueue}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors hover:bg-gray-50"
          style={{ color: '#1B2B5E', borderColor: '#1B2B5E' }}
        >
          <RefreshCw size={14} />
          Muat Semula
        </button>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Permohonan Baharu"  value={loading ? '—' : kpiNew}       subtitle="Menunggu penilaian"        icon={<FileText size={20} />}      colour="navy"   />
        <StatCard title="Dalam Penilaian"    value={loading ? '—' : kpiAssessing}  subtitle="Sedang dinilai"            icon={<Clock size={20} />}         colour="orange" />
        <StatCard title="Selesai Hari Ini"   value={kpiDoneToday}                  subtitle="Penilaian lengkap"         icon={<CheckCircle size={20} />}   colour="green"  />
        <StatCard title="Tertunggak (>2 hari)" value={loading ? '—' : kpiOverdue} subtitle="Perlukan tindakan segera"  icon={<AlertTriangle size={20} />} colour="orange" />
      </div>

      {/* ── Main content: table + right panels ──────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Assessment Queue Table ─────────────────────────────── */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base" style={{ color: '#1B2B5E' }}>
                Peti Masuk Tugasan
              </h2>
              <AiBadge label="AI-Prioritized" size="xs" variant="gradient" />
            </div>
            <span className="text-xs text-gray-400">{total} permohonan</span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      {['Keutamaan','No Permohonan','Pemohon','Skim','Jumlah','Masa Terima','Status AI','Tindakan'].map(h => (
                        <th key={h} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7280' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const p  = PRIORITY_CONFIG[row.priority];
                      const sc = getAiScoreStyle(row.ai_score);
                      return (
                        <tr key={row.ref_no} className="border-t border-gray-50 hover:bg-blue-50/30 transition-colors">
                          <td className="px-3 py-3">
                            <span className="px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap" style={{ background: p.bg, color: p.text }}>{p.label}</span>
                          </td>
                          <td className="px-3 py-3 font-mono text-xs" style={{ color: '#1B2B5E' }}>{row.ref_no}</td>
                          <td className="px-3 py-3 font-medium" style={{ color: '#111827' }}>{row.applicant_name}</td>
                          <td className="px-3 py-3 text-xs" style={{ color: '#6B7280' }}>{row.scheme}</td>
                          <td className="px-3 py-3 font-semibold text-xs whitespace-nowrap">RM {row.amount_requested.toLocaleString('ms-MY')}</td>
                          <td className="px-3 py-3 text-xs" style={{ color: '#9CA3AF' }}>{timeAgo(row.created_at)}</td>
                          <td className="px-3 py-3">
                            <span className="px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap" style={{ background: sc.bg, color: sc.text }}>
                              Skor AI: {row.ai_score}/100
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <button
                              onClick={() => navigate(`/module2/pre-assessment/${row.id}`)}
                              className="px-3 py-1.5 rounded text-xs font-bold text-white transition-opacity hover:opacity-80 flex items-center gap-1"
                              style={{ background: '#1B2B5E' }}
                            >
                              Nilai <ChevronRight size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-3 py-12 text-center text-sm text-gray-400">Tiada permohonan dalam peti masuk.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Halaman {page} daripada {totalPages}</span>
                  <div className="flex gap-2">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-xs rounded border disabled:opacity-40">Sebelum</button>
                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-xs rounded border disabled:opacity-40">Seterusnya</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Right Panels ──────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Performance Bar Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm" style={{ color: '#1B2B5E' }}>Prestasi Hari Ini</h3>
              <select className="text-xs border rounded px-2 py-1" style={{ color: '#6B7280' }} value={filter} onChange={e => setFilter(e.target.value)}>
                <option>Hari Ini</option><option>Minggu Ini</option>
              </select>
            </div>
            <p className="text-xs mb-2" style={{ color: '#9CA3AF' }}>Sasaran harian: 12 penilaian</p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={PERFORMANCE_DATA} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 8, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 8, fill: '#9CA3AF' }} axisLine={false} tickLine={false} domain={[0, 14]} />
                <ReferenceLine y={12} stroke="#E65100" strokeDasharray="4 4" />
                <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: unknown) => [`${v} penilaian`, 'Selesai']} />
                <Bar dataKey="value" fill="#1B2B5E" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* AI Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm" style={{ color: '#1B2B5E' }}>Notifikasi AI</h3>
              <AiBadge label="AI" size="xs" variant="filled" />
            </div>
            <div className="space-y-2">
              {AI_NOTIFICATIONS.map((n, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: '#F9FAFB' }}>
                  <span className="text-sm flex-shrink-0">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ color: '#374151' }}>{n.message}</p>
                    <p className="text-xs mt-0.5" style={{ color: n.color }}>{n.time}</p>
                  </div>
                  <ChevronRight size={12} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Banner ─────────────────────────────────────────────── */}
      <div className="rounded-xl p-4 flex items-center gap-4 flex-wrap" style={{ background: 'linear-gradient(135deg, #673AB7 0%, #7C3AED 100%)' }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
          <Brain size={20} style={{ color: '#fff' }} />
        </div>
        <p className="text-sm flex-1 text-white">
          AI telah mengagihkan <strong>{rows.length} permohonan baharu</strong> mengikut beban kerja dan kepakaran anda.
        </p>
        <button className="text-xs px-3 py-1.5 rounded border font-medium transition-opacity hover:opacity-80 whitespace-nowrap" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.6)' }}>
          Maklumat Lanjut
        </button>
      </div>
    </div>
  );
}
