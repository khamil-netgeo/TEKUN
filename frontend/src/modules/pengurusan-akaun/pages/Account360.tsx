import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/services/api';

interface Account {
  id: string;
  account_no: string;
  borrower_name: string;
  scheme?: string;
  status: string;
  outstanding_balance: number;
  monthly_instalment: number;
  profit_rate: number;
  arrears_days: number;
  arrears_amount: number;
  total_paid?: number;
  tenure_months?: number;
  start_date?: string;
  maturity_date?: string;
  classification?: string;
  upcoming_schedule?: ScheduleItem[];
  payments?: PaymentItem[];
}

interface ScheduleItem {
  month: string;
  due_date: string;
  instalment: number;
  principal: number;
  interest: number;
  balance: number;
  status: string;
}

interface PaymentItem {
  id: string;
  receipt_no: string;
  amount: number;
  channel: string;
  paid_at: string;
  status: string;
}

interface AiPrediction {
  probability: number;
  risk_level: string;
  factors: string[];
}

export default function Account360() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [account, setAccount] = useState<Account | null>(null);
  const [aiPrediction, setAiPrediction] = useState<AiPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchAccount(id);
  }, [id]);

  async function fetchAccount(accountId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/accounts/${accountId}`);
      const data = res.data?.data ?? res.data;
      setAccount(data);

      // Fetch AI default prediction (best-effort)
      try {
        const aiRes = await api.post('/ai/default-prediction', {
          account_id: accountId,
          outstanding_balance: data.outstanding_balance,
          arrears_days: data.arrears_days,
          status: data.status,
        });
        setAiPrediction(aiRes.data?.data ?? aiRes.data);
      } catch {
        // AI prediction is optional
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuatkan data akaun.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function getHealthScore(acc: Account): number {
    if (acc.arrears_days === 0) return 95;
    if (acc.arrears_days <= 30) return 75;
    if (acc.arrears_days <= 60) return 55;
    if (acc.arrears_days <= 90) return 35;
    return 15;
  }

  function getStatusColor(status: string): string {
    const s = (status ?? '').toUpperCase();
    if (s === 'LANCAR') return 'bg-green-100 text-green-800';
    if (s.includes('TUNGGAKAN')) return 'bg-orange-100 text-orange-800';
    if (s === 'NPL' || s === 'HAPUS KIRA') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B2B5E]" />
        <span className="ml-3 text-gray-600">Memuatkan data akaun...</span>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium">Ralat: {error ?? 'Akaun tidak dijumpai.'}</p>
          <button onClick={() => navigate(-1)} className="mt-3 text-sm text-blue-600 underline">
            ← Kembali
          </button>
        </div>
      </div>
    );
  }

  const health = getHealthScore(account);
  const healthColor = health >= 70 ? '#2E7D32' : health >= 40 ? '#E65100' : '#C62828';

  const scheduleData = (account.upcoming_schedule ?? []).map((s) => ({
    name: (s.month ?? '').split(' ')[0] ?? '',
    baki: s.balance,
    ansuran: s.instalment,
  }));

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 mb-1">
            ← Senarai Akaun
          </button>
          <h1 className="text-xl font-bold text-[#1B2B5E]">
            Akaun 360° — {account.account_no}
          </h1>
          <p className="text-sm text-gray-500">{account.borrower_name}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(account.status)}`}>
          {account.status}
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Baki Tertunggak</p>
          <p className="text-xl font-bold text-[#1B2B5E] mt-1">
            RM {Number(account.outstanding_balance).toLocaleString('ms-MY', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Ansuran Bulanan</p>
          <p className="text-xl font-bold text-[#2E7D32] mt-1">
            RM {Number(account.monthly_instalment).toLocaleString('ms-MY', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Hari Tunggakan</p>
          <p className={`text-xl font-bold mt-1 ${account.arrears_days > 0 ? 'text-[#E65100]' : 'text-[#2E7D32]'}`}>
            {account.arrears_days} hari
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Kadar Keuntungan</p>
          <p className="text-xl font-bold text-[#1B2B5E] mt-1">{account.profit_rate}%</p>
        </div>
      </div>

      {/* Health Gauge + AI Prediction */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Indikator Kesihatan Akaun</h2>
          <div className="flex items-center justify-center">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#E5E7EB" strokeWidth="12" />
                <circle cx="60" cy="60" r="50" fill="none" stroke={healthColor} strokeWidth="12"
                  strokeDasharray={`${health * 3.14} 314`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold" style={{ color: healthColor }}>{health}</span>
                <span className="text-xs text-gray-500">/ 100</span>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">
            {health >= 70 ? '✅ Akaun Sihat' : health >= 40 ? '⚠️ Perlu Perhatian' : '🔴 Risiko Tinggi'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-purple-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">AI</span>
            <h2 className="text-sm font-semibold text-gray-700">Ramalan Kemungkiran (3 Bulan)</h2>
          </div>
          {aiPrediction ? (
            <>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-4xl font-bold text-purple-700">{aiPrediction.probability}%</span>
                <span className="text-sm font-semibold text-purple-600">{aiPrediction.risk_level}</span>
              </div>
              <ul className="space-y-1">
                {(aiPrediction.factors ?? []).slice(0, 3).map((f, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                    <span className="text-purple-400 mt-0.5">•</span> {f}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-gray-400 italic">Analisis AI tidak tersedia.</p>
          )}
        </div>
      </div>

      {/* Schedule Chart */}
      {scheduleData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Graf Baki Pembiayaan (6 Bulan)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={scheduleData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => `RM ${Number(v).toLocaleString('ms-MY', { minimumFractionDigits: 2 })}`} />
              <Line type="monotone" dataKey="baki" stroke="#1B2B5E" strokeWidth={2} name="Baki" dot={false} />
              <Line type="monotone" dataKey="ansuran" stroke="#2E7D32" strokeWidth={2} name="Ansuran" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Upcoming Schedule Table */}
      {(account.upcoming_schedule ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Jadual Ansuran Akan Datang</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Bulan', 'Tarikh Bayar', 'Ansuran (RM)', 'Prinsipal (RM)', 'Keuntungan (RM)', 'Baki (RM)', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {account.upcoming_schedule!.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{row.month}</td>
                    <td className="px-4 py-3 text-gray-600">{row.due_date}</td>
                    <td className="px-4 py-3 text-gray-800">{Number(row.instalment).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-800">{Number(row.principal).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-800">{Number(row.interest).toFixed(2)}</td>
                    <td className="px-4 py-3 font-medium text-[#1B2B5E]">{Number(row.balance).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Payments */}
      {(account.payments ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Transaksi Terkini</h2>
            <button onClick={() => navigate(`/akaun/${id}/pembayaran`)} className="text-xs text-blue-600 hover:underline">
              Lihat Semua →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['No. Resit', 'Amaun (RM)', 'Saluran', 'Tarikh', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {account.payments!.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{p.receipt_no}</td>
                    <td className="px-4 py-3 font-medium text-[#2E7D32]">{Number(p.amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-600 uppercase">{p.channel}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.paid_at ? new Date(p.paid_at).toLocaleDateString('ms-MY') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full">
                        {p.status ?? 'completed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => navigate(`/akaun/${id}/bayar`)}
          className="bg-[#2E7D32] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          💳 Rekod Pembayaran
        </button>
        <button
          onClick={() => navigate(`/akaun/${id}/tawidh`)}
          className="bg-[#E65100] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
        >
          📐 Kira Ta&apos;widh
        </button>
        <button
          onClick={() => navigate(`/akaun/${id}/moratorium`)}
          className="bg-[#1B2B5E] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors"
        >
          📋 Permohonan Moratorium
        </button>
      </div>
    </div>
  );
}
