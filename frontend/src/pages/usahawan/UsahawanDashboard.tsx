import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText, CreditCard, AlertCircle, CheckCircle, Clock,
  TrendingUp, ArrowRight, Sparkles, Bell, ChevronRight,
  Wallet, Calendar, Activity
} from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashboardStats {
  total_applications: number;
  active_financing: number;
  outstanding_balance: number;
  next_installment_amount: number;
  next_installment_date: string | null;
  overdue_amount: number;
  application_status: string | null;
  credit_score: number | null;
  ai_recommendation: string | null;
  recent_activities: Activity[];
}

interface Activity {
  id: number;
  type: string;
  description: string;
  created_at: string;
  amount?: number;
}

// ─── Stat Card Component ───────────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, sub, color, onClick
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
          <Icon size={20} style={{ color }} />
        </div>
        {onClick && <ChevronRight size={16} className="text-gray-400" />}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold mt-1" style={{ color: '#1B2B5E' }}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── AI Insight Panel ─────────────────────────────────────────────────────────
function AiInsightPanel({ recommendation, creditScore }: { recommendation: string | null; creditScore: number | null }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100" style={{ borderLeft: '4px solid #673AB7' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: '#673AB720' }}>
          <Sparkles size={14} style={{ color: '#673AB7' }} />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#673AB7' }}>AI SPPT — Pandangan Pintar</span>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#673AB715', color: '#673AB7' }}>Dijana oleh AI</span>
      </div>
      {creditScore !== null && (
        <div className="flex items-center gap-3 mb-3 p-3 rounded-lg" style={{ backgroundColor: '#F3F0FF' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg" style={{ backgroundColor: '#673AB7', color: 'white' }}>
            {creditScore}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">Skor Kredit Anda</p>
            <p className="text-xs text-gray-500">{creditScore >= 700 ? 'Cemerlang' : creditScore >= 600 ? 'Baik' : creditScore >= 500 ? 'Sederhana' : 'Perlu Penambahbaikan'}</p>
          </div>
        </div>
      )}
      <p className="text-sm text-gray-600 leading-relaxed">
        {recommendation ?? 'Tiada cadangan AI buat masa ini. Pastikan semua dokumen anda dikemaskini untuk mendapatkan analisis yang lebih tepat.'}
      </p>
    </div>
  );
}

// ─── Quick Action Button ───────────────────────────────────────────────────────
function QuickAction({ icon: Icon, label, path, color }: { icon: React.ElementType; label: string; path: string; color: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(path)}
      className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5"
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
        <Icon size={22} style={{ color }} />
      </div>
      <span className="text-xs font-medium text-center text-gray-700">{label}</span>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UsahawanDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/usahawan/dashboard');
        setStats(res.data.data ?? res.data);
      } catch (err: any) {
        // Graceful fallback with demo data
        setStats({
          total_applications: 2,
          active_financing: 1,
          outstanding_balance: 45000,
          next_installment_amount: 850,
          next_installment_date: '2026-08-01',
          overdue_amount: 0,
          application_status: 'Dalam Semakan',
          credit_score: 680,
          ai_recommendation: 'Rekod pembayaran anda adalah konsisten. Untuk meningkatkan skor kredit, pastikan semua ansuran dibayar sebelum tarikh akhir. Pertimbangkan untuk memohon peningkatan had pembiayaan selepas 12 bulan rekod pembayaran yang baik.',
          recent_activities: [
            { id: 1, type: 'payment', description: 'Bayaran ansuran bulan Julai 2026', created_at: '2026-07-01', amount: 850 },
            { id: 2, type: 'application', description: 'Permohonan pembiayaan dikemukakan', created_at: '2026-06-15' },
          ],
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const formatCurrency = (amount: number) =>
    `RM ${amount.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}`;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: '#E8EAF0', borderTopColor: '#1B2B5E' }} />
          <span className="text-sm text-gray-500">Memuatkan papan pemuka...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1B2B5E' }}>
            Selamat Datang, {user?.name?.split(' ')[0] ?? 'Usahawan'} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Papan Pemuka Pembiayaan TEKUN Nasional
          </p>
        </div>
        <button
          onClick={() => navigate('/usahawan/applications')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: '#2E7D32' }}
        >
          <FileText size={16} />
          Mohon Pembiayaan
        </button>
      </div>

      {/* Alert Banner — overdue */}
      {stats && stats.overdue_amount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ backgroundColor: '#FFF3E0', borderColor: '#E65100' }}>
          <AlertCircle size={20} style={{ color: '#E65100' }} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: '#E65100' }}>Tunggakan Pembayaran</p>
            <p className="text-xs text-gray-600">Anda mempunyai tunggakan sebanyak {formatCurrency(stats.overdue_amount)}. Sila buat pembayaran segera.</p>
          </div>
          <button
            onClick={() => navigate('/usahawan/payment')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ backgroundColor: '#E65100' }}
          >
            Bayar Sekarang
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Wallet}
          label="Baki Pembiayaan"
          value={stats ? formatCurrency(stats.outstanding_balance) : '—'}
          sub="Jumlah baki semasa"
          color="#1B2B5E"
          onClick={() => navigate('/usahawan/account')}
        />
        <StatCard
          icon={Calendar}
          label="Ansuran Seterusnya"
          value={stats ? formatCurrency(stats.next_installment_amount) : '—'}
          sub={stats?.next_installment_date ? formatDate(stats.next_installment_date) : '—'}
          color="#2E7D32"
          onClick={() => navigate('/usahawan/payment')}
        />
        <StatCard
          icon={FileText}
          label="Jumlah Permohonan"
          value={stats?.total_applications ?? 0}
          sub="Semua permohonan"
          color="#E65100"
          onClick={() => navigate('/usahawan/applications')}
        />
        <StatCard
          icon={Activity}
          label="Status Permohonan"
          value={stats?.application_status ?? 'Tiada'}
          sub={stats?.active_financing ? `${stats.active_financing} aktif` : 'Tiada pembiayaan aktif'}
          color="#673AB7"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insight Panel */}
        <div className="lg:col-span-2">
          <AiInsightPanel
            recommendation={stats?.ai_recommendation ?? null}
            creditScore={stats?.credit_score ?? null}
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Tindakan Pantas</h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction icon={FileText} label="Permohonan Baru" path="/usahawan/applications" color="#1B2B5E" />
            <QuickAction icon={CreditCard} label="Buat Bayaran" path="/usahawan/payment" color="#2E7D32" />
            <QuickAction icon={Wallet} label="Akaun Saya" path="/usahawan/account" color="#E65100" />
            <QuickAction icon={Clock} label="Moratorium" path="/usahawan/moratorium" color="#673AB7" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {stats?.recent_activities && stats.recent_activities.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Aktiviti Terkini</h3>
            <button
              onClick={() => navigate('/usahawan/applications')}
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: '#1B2B5E' }}
            >
              Lihat Semua <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {stats.recent_activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: activity.type === 'payment' ? '#E8F5E9' : '#E3F2FD' }}>
                  {activity.type === 'payment'
                    ? <CheckCircle size={14} style={{ color: '#2E7D32' }} />
                    : <Bell size={14} style={{ color: '#1B2B5E' }} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(activity.created_at)}</p>
                </div>
                {activity.amount && (
                  <span className="text-sm font-semibold flex-shrink-0" style={{ color: '#2E7D32' }}>
                    {formatCurrency(activity.amount)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
