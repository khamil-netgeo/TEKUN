import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api from '@/services/api';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import AiBadge from '@/components/ui/AiBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast, ToastContainer } from '@/components/ui/Toast';
import { useTranslation } from 'react-i18next';
import {
  CreditCard, TrendingDown, AlertTriangle, CheckCircle,
  Calendar, DollarSign, User, Phone, ArrowLeft
} from 'lucide-react';

interface Account {
  id: number;
  account_no: string;
  applicant_name: string;
  phone?: string;
  scheme?: string;
  financing_amount: number;
  outstanding_balance: number;
  monthly_installment: number;
  next_due_date?: string;
  arrears_days: number;
  arrears_amount: number;
  classification: string;
  disbursement_date?: string;
  maturity_date?: string;
  health_score?: number;
  npl_risk?: { probability: number; risk_level: string; factors: string[] };
  moratoriums?: { id: number; status: string; start_date: string; end_date: string; type: string }[];
}

interface BalancePoint { month: string; balance: number; }

// ── Animated SVG Health Score Ring ──────────────────────────────────────────
function HealthScoreRing({ score }: { score: number }) {
  const { t } = useTranslation();
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const offset = circumference - (clampedScore / 100) * circumference;

  const colour =
    clampedScore > 70 ? '#2E7D32' :
    clampedScore >= 40 ? '#E65100' :
    '#C62828';

  const ringRef = useRef<SVGCircleElement>(null);
  useEffect(() => {
    if (ringRef.current) {
      ringRef.current.style.transition = 'stroke-dashoffset 1.2s ease-in-out';
      ringRef.current.style.strokeDashoffset = String(offset);
    }
  }, [offset]);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="140" viewBox="0 0 140 140">
        {/* Track */}
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="12" />
        {/* Progress */}
        <circle
          ref={ringRef}
          cx="70" cy="70" r={radius}
          fill="none"
          stroke={colour}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          transform="rotate(-90 70 70)"
        />
        {/* Score text */}
        <text x="70" y="65" textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: 28, fontWeight: 700, fill: colour }}>
          {clampedScore}
        </text>
        <text x="70" y="88" textAnchor="middle"
          style={{ fontSize: 11, fill: '#6B7280' }}>
          / 100
        </text>
      </svg>
      <p className="text-sm font-semibold text-gray-700">
        {t('account.health_score', 'Skor Kesihatan Akaun')}
      </p>
      <span
        className="text-xs font-medium px-3 py-1 rounded-full"
        style={{
          background: colour + '20',
          color: colour,
        }}
      >
        {clampedScore > 70
          ? t('account.health_good', 'Baik')
          : clampedScore >= 40
          ? t('account.health_moderate', 'Sederhana')
          : t('account.health_poor', 'Lemah')}
      </span>
    </div>
  );
}

// ── Balance Reduction Area Chart ─────────────────────────────────────────────
function BalanceChart({ account }: { account: Account }) {
  const { t } = useTranslation();
  const [points, setPoints] = useState<BalancePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/accounts/${account.id}/payment-schedule`)
      .then(r => {
        const schedule = r.data?.data ?? r.data;
        if (Array.isArray(schedule)) {
          const mapped = schedule.map((item: any) => {
            const d = new Date(item.due_date || item.date);
            return {
              month: d.toLocaleDateString('ms-MY', { month: 'short', year: '2-digit' }),
              balance: Math.round(item.balance || item.remaining_balance || 0),
            };
          });
          setPoints(mapped);
        }
      })
      .catch(err => console.error('Failed to fetch payment schedule', err))
      .finally(() => setLoading(false));
  }, [account.id]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-center h-[270px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (points.length < 2) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        {t('account.balance_chart', 'Carta Pengurangan Baki Pinjaman')}
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={points} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#1B2B5E" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#1B2B5E" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
          <YAxis
            tick={{ fontSize: 10 }}
            tickFormatter={(v: number) => `RM ${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(v: unknown) => [`RM ${Number(v).toLocaleString('ms-MY')}`, 'Baki']}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#1B2B5E"
            fill="url(#balanceGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Account360() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [account, setAccount]   = useState<Account | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/accounts/${id}`)
      .then(r => setAccount(r.data?.data ?? r.data))
      .catch(() => setError(t('account.load_error', 'Gagal memuatkan akaun')))
      .finally(() => setLoading(false));
  }, [id, t]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner />
    </div>
  );

  if (error || !account) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <AlertTriangle className="w-12 h-12 text-red-500" />
      <p className="text-gray-600">{error ?? t('account.not_found', 'Akaun tidak dijumpai')}</p>
      <button onClick={() => navigate(-1)} className="text-[#1B2B5E] underline text-sm">
        {t('common.back', 'Kembali')}
      </button>
    </div>
  );

  const healthScore = account.health_score ?? Math.max(0, Math.min(100,
    100
    - (account.arrears_days > 0 ? 30 : 0)
    - (account.arrears_days > 90 ? 20 : 0)
    - Math.round((account.outstanding_balance / account.financing_amount) * 10)
  ));

  const classColour =
    account.classification === 'lancar'   ? '#2E7D32' :
    account.classification === 'mampan'   ? '#E65100' :
    '#C62828';

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />
      <PageHeader
        title={t('account.title', 'Akaun 360°')}
        subtitle={account.account_no}
        breadcrumbs={[
          { label: t('nav.accounts', 'Akaun'), href: '/accounts' },
          { label: account.account_no },
        ]}
        action={
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1B2B5E]"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back', 'Kembali')}
          </button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Top Row: Health Ring + KPI Cards ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Health Score Ring */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center">
            <HealthScoreRing score={healthScore} />
          </div>

          {/* KPI Cards */}
          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              title={t('account.financing_amount', 'Jumlah Pembiayaan')}
              value={`RM ${account.financing_amount.toLocaleString('ms-MY')}`}
              icon={<DollarSign className="w-5 h-5" />}
              colour="navy"
            />
            <StatCard
              title={t('account.outstanding', 'Baki Tertunggak')}
              value={`RM ${account.outstanding_balance.toLocaleString('ms-MY')}`}
              icon={<CreditCard className="w-5 h-5" />}
              colour="orange"
            />
            <StatCard
              title={t('account.monthly_installment', 'Ansuran Bulanan')}
              value={`RM ${account.monthly_installment.toLocaleString('ms-MY')}`}
              icon={<Calendar className="w-5 h-5" />}
              colour="green"
            />
            <StatCard
              title={t('account.arrears_days', 'Hari Tunggakan')}
              value={String(account.arrears_days)}
              icon={<TrendingDown className="w-5 h-5" />}
              colour={account.arrears_days > 0 ? 'orange' : 'green'}
            />
          </div>
        </div>

        {/* ── Balance Reduction Chart ── */}
        <BalanceChart account={account} />

        {/* ── Account Details + AI Risk Panel ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Account Details */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              {t('account.details', 'Maklumat Akaun')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: t('account.account_no', 'No. Akaun'),   value: account.account_no },
                { label: t('account.applicant',  'Nama Peminjam'), value: account.applicant_name },
                { label: t('account.phone',      'No. Telefon'),  value: account.phone ?? '-' },
                { label: t('account.scheme',     'Skim'),         value: account.scheme ?? '-' },
                { label: t('account.disbursement_date', 'Tarikh Disburs.'), value: account.disbursement_date ?? '-' },
                { label: t('account.maturity_date',     'Tarikh Matang'),   value: account.maturity_date ?? '-' },
                { label: t('account.next_due',   'Tarikh Bayaran Seterusnya'), value: account.next_due_date ?? '-' },
                {
                  label: t('account.classification', 'Klasifikasi'),
                  value: (
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                      style={{ background: classColour }}
                    >
                      {account.classification.toUpperCase()}
                    </span>
                  ),
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className="text-sm font-medium text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SPPT AI Risk Panel */}
          <div className="bg-white rounded-xl border border-[#673AB7] p-6">
            <div className="flex items-center gap-2 mb-4">
              <AiBadge label="SPPT AI" variant="filled" />
              <span className="text-sm font-semibold text-[#673AB7]">
                {t('account.ai_risk', 'Analisis Risiko SPPT AI')}
              </span>
            </div>

            {account.npl_risk ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {t('account.npl_probability', 'Kebarangkalian NPL')}
                  </span>
                  <span
                    className="text-lg font-bold"
                    style={{
                      color: account.npl_risk.probability > 0.6 ? '#C62828' :
                             account.npl_risk.probability > 0.3 ? '#E65100' : '#2E7D32',
                    }}
                  >
                    {Math.round(account.npl_risk.probability * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.round(account.npl_risk.probability * 100)}%`,
                      background: account.npl_risk.probability > 0.6 ? '#C62828' :
                                  account.npl_risk.probability > 0.3 ? '#E65100' : '#2E7D32',
                    }}
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">
                    {t('account.ai_factors', 'Faktor Utama')}
                  </p>
                  <ul className="space-y-1">
                    {(account.npl_risk.factors ?? []).map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#673AB7] mt-1.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">
                {t('account.ai_no_data', 'Data risiko AI tidak tersedia')}
              </p>
            )}
          </div>
        </div>

        {/* ── Moratorium History ── */}
        {account.moratoriums && account.moratoriums.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              {t('account.moratorium_history', 'Sejarah Moratorium')}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('account.moratorium_status', 'Status')}
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('account.moratorium_type', 'Jenis')}
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('account.moratorium_start', 'Tarikh Mula')}
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('account.moratorium_end', 'Tarikh Tamat')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {account.moratoriums.map((m) => (
                    <tr key={m.id} className="border-b border-gray-100">
                      <td className="py-2 px-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          m.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {m.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-700">{m.type}</td>
                      <td className="py-2 px-3 text-gray-700">{m.start_date}</td>
                      <td className="py-2 px-3 text-gray-700">{m.end_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}