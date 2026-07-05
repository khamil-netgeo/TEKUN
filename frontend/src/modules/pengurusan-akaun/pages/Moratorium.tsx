import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';

interface AccountInfo {
  id: string;
  account_no: string;
  borrower_name: string;
  outstanding_balance: number;
  monthly_instalment: number;
  maturity_date?: string;
  profit_rate: number;
  status: string;
}

interface MoratoriumResult {
  id: string;
  account_id: string;
  type: string;
  months_requested: number;
  reason: string;
  status: string;
  new_instalment?: number;
  new_end_date?: string;
  ai_recommendation?: string;
  ai_risk_score?: number;
}

const REASONS = [
  'Masalah Kewangan Sementara - COVID/Bencana',
  'Kehilangan Pekerjaan / Perniagaan Terjejas',
  'Perbelanjaan Perubatan Kecemasan',
  'Bencana Alam (Banjir, Kebakaran)',
  'Lain-lain (Nyatakan)',
];

export default function Moratorium() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [type, setType] = useState<'moratorium' | 'restructuring'>('moratorium');
  const [months, setMonths] = useState(3);
  const [reason, setReason] = useState(REASONS[0]);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<MoratoriumResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get(`/accounts/${id}`)
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setAccount(data);
      })
      .catch(() => setError('Gagal memuatkan maklumat akaun.'))
      .finally(() => setLoadingAccount(false));
  }, [id]);

  async function handleSubmit() {
    if (!agreed || !id) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post(`/accounts/${id}/moratorium`, {
        type,
        months_requested: months,
        reason,
      });
      setResult(res.data?.data ?? res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghantar permohonan.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // Compute projected impact from account data
  const balance = Number(account?.outstanding_balance ?? 0);
  const monthly = Number(account?.monthly_instalment ?? 0);
  const profitRate = Number(account?.profit_rate ?? 8);
  const extraInterest = balance * (profitRate / 100 / 12) * months;
  const newBalance = balance + extraInterest;

  if (loadingAccount) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B2B5E]" />
        <span className="ml-3 text-gray-600">Memuatkan maklumat akaun...</span>
      </div>
    );
  }

  if (result) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl border border-green-200 p-8 text-center max-w-md mx-auto">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-700 mb-2">Permohonan Dihantar!</h2>
          <p className="text-gray-600 mb-2">
            Permohonan {result.type === 'moratorium' ? 'moratorium' : 'penjadualan semula'} untuk{' '}
            <strong>{result.months_requested} bulan</strong> sedang diproses.
          </p>
          <p className="text-sm text-gray-500 mb-1">Status: <span className="font-semibold uppercase">{result.status}</span></p>
          {result.new_instalment && (
            <p className="text-sm text-gray-500 mb-1">
              Ansuran Baru: <span className="font-bold text-[#1B2B5E]">RM {Number(result.new_instalment).toFixed(2)}</span>
            </p>
          )}
          {result.new_end_date && (
            <p className="text-sm text-gray-500 mb-1">
              Tarikh Tamat Baru: <span className="font-bold">{result.new_end_date}</span>
            </p>
          )}
          {result.ai_recommendation && (
            <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-3 text-left">
              <p className="text-xs font-bold text-purple-700 mb-1">
                <span className="bg-purple-200 text-purple-700 px-1.5 py-0.5 rounded text-xs mr-1">AI</span>
                Cadangan AI
              </p>
              <p className="text-sm text-purple-700">{result.ai_recommendation}</p>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-3">Kelulusan dijangka dalam 2-3 hari bekerja.</p>
          <div className="flex gap-3 justify-center mt-4">
            <button
              onClick={() => setResult(null)}
              className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
            >
              Permohonan Lain
            </button>
            <button
              onClick={() => navigate(`/akaun/${id}`)}
              className="px-5 py-2 rounded-lg bg-[#1B2B5E] text-white text-sm hover:bg-blue-900"
            >
              Kembali ke Akaun 360°
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div>
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 mb-1">
          ← Kembali
        </button>
        <h1 className="text-xl font-bold text-[#1B2B5E]">Permohonan Moratorium / Penjadualan Semula</h1>
        {account && (
          <p className="text-sm text-gray-500">{account.account_no} — {account.borrower_name}</p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Account Summary */}
      {account && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Baki Tertunggak</p>
              <p className="text-xl font-bold text-[#1B2B5E]">
                RM {balance.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Ansuran Bulanan</p>
              <p className="text-xl font-bold text-[#2E7D32]">
                RM {monthly.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Status Akaun</p>
              <p className="text-xl font-bold text-[#E65100]">{account.status}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          {/* 1. Type */}
          <div>
            <p className="font-semibold text-sm text-gray-700 mb-3">1. Jenis Permohonan</p>
            <div className="grid grid-cols-1 gap-3">
              {[
                {
                  value: 'moratorium' as const,
                  label: 'Moratorium (Penangguhan Bayaran)',
                  desc: 'Tangguhkan bayaran selama 1-6 bulan. Keuntungan terus dikira.',
                },
                {
                  value: 'restructuring' as const,
                  label: 'Penjadualan Semula (Restructuring)',
                  desc: 'Ubah tempoh atau jumlah ansuran. Memerlukan penilaian semula.',
                },
              ].map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    type === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${type === opt.value ? 'border-blue-500 bg-blue-500' : 'border-gray-400'}`} />
                    <span className="font-semibold text-sm">{opt.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-6">{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Duration */}
          <div>
            <p className="font-semibold text-sm text-gray-700 mb-2">2. Tempoh (Bulan)</p>
            <select
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5, 6].map((m) => (
                <option key={m} value={m}>{m} bulan</option>
              ))}
            </select>
          </div>

          {/* 3. Reason */}
          <div>
            <p className="font-semibold text-sm text-gray-700 mb-2">3. Sebab Permohonan</p>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>

          {/* 4. Acknowledgement */}
          <div>
            <p className="font-semibold text-sm text-gray-700 mb-2">4. Pengesahan</p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 rounded"
              />
              <span className="text-sm text-gray-600">
                Saya memahami bahawa keuntungan akan terus dikira semasa tempoh moratorium dan baki tertunggak akan meningkat sebanyak{' '}
                <strong>RM {extraInterest.toFixed(2)}</strong>.
              </span>
            </label>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!agreed || submitting}
            className="w-full py-3 rounded-lg bg-[#1B2B5E] text-white font-semibold text-sm hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? '⏳ Menghantar...' : '📤 Hantar Permohonan'}
          </button>
        </div>

        {/* Right: AI Impact Analysis */}
        <div
          className="rounded-xl p-6 text-white space-y-4"
          style={{ background: 'linear-gradient(135deg, #6B21A8 0%, #4F46E5 100%)' }}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg flex items-center gap-2">✨ Analisis Impak AI</h2>
            <span className="px-2 py-1 bg-white bg-opacity-20 rounded text-xs font-bold">AI</span>
          </div>

          {/* Before/After Comparison */}
          <div>
            <p className="font-semibold text-sm text-purple-100 mb-3">Perbandingan Sebelum & Selepas</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white border-opacity-20">
                  <th className="py-2 text-left text-purple-200 font-medium">Perkara</th>
                  <th className="py-2 text-center text-purple-200 font-medium">Sebelum</th>
                  <th className="py-2 text-center text-yellow-300 font-medium">Selepas ({months} bln)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white border-opacity-10">
                  <td className="py-2 text-purple-100">Baki</td>
                  <td className="py-2 text-center">RM {balance.toLocaleString('ms-MY', { minimumFractionDigits: 0 })}</td>
                  <td className="py-2 text-center text-yellow-300 font-bold">
                    RM {newBalance.toLocaleString('ms-MY', { minimumFractionDigits: 0 })}
                  </td>
                </tr>
                <tr className="border-b border-white border-opacity-10">
                  <td className="py-2 text-purple-100">Ansuran</td>
                  <td className="py-2 text-center">RM {monthly.toFixed(2)}</td>
                  <td className="py-2 text-center text-yellow-300 font-bold">RM {monthly.toFixed(2)} (sama)</td>
                </tr>
                <tr>
                  <td className="py-2 text-purple-100">Keuntungan Tambahan</td>
                  <td className="py-2 text-center">—</td>
                  <td className="py-2 text-center text-yellow-300 font-bold">+RM {extraInterest.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Warning */}
          <div className="p-3 bg-red-500 bg-opacity-30 rounded-lg border border-red-400 border-opacity-50">
            <div className="flex items-start gap-2 text-sm">
              <span className="mt-0.5">⚠️</span>
              <span>
                <strong>Impak:</strong> Keuntungan tambahan RM {extraInterest.toFixed(2)} akan ditambah kepada baki pembiayaan.
              </span>
            </div>
          </div>

          {/* AI Recommendation */}
          <div>
            <p className="font-semibold text-sm text-purple-100 mb-2">Cadangan AI</p>
            <div className="p-3 bg-white bg-opacity-10 rounded-lg text-sm">
              <div className="flex items-start gap-2">
                <span className="mt-0.5">🧠</span>
                <p>
                  {type === 'moratorium'
                    ? 'Moratorium disyorkan jika masalah kewangan bersifat sementara (kurang 6 bulan). Pastikan peminjam mempunyai rancangan untuk meneruskan bayaran selepas tempoh moratorium.'
                    : 'Penjadualan semula sesuai untuk masalah kewangan berpanjangan. Ansuran baru akan dikira berdasarkan baki semasa dan tempoh baru.'}
                </p>
              </div>
            </div>
          </div>

          {/* Approval Info */}
          <div className="p-3 bg-white bg-opacity-10 rounded-lg text-sm flex items-center gap-2">
            <span>🕐</span>
            <span>Kelulusan Pengurus Cawangan diperlukan. Dijangka 2-3 hari bekerja.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
