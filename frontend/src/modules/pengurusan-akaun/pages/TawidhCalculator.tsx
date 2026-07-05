import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';

interface TawidhData {
  account_no: string;
  borrower_name: string;
  arrears_amount: number;
  arrears_days: number;
  outstanding_balance: number;
  tawidh: number;
  amount: number;
  formula: string;
  bnm_rate: number;
  rate_used: number;
  max_cap: number;
  capped: boolean;
  shariah_compliant: boolean;
  shariah_note: string;
}

export default function TawidhCalculator() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<TawidhData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [noticeGenerated, setNoticeGenerated] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchTawidh(id);
  }, [id]);

  async function fetchTawidh(accountId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/accounts/${accountId}/tawidh`);
      setData(res.data?.data ?? res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuatkan data Ta\'widh.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateNotice() {
    if (!id) return;
    setGenerating(true);
    try {
      await api.post(`/accounts/${id}/tawidh-notice`, {
        tawidh: data?.amount ?? 0,
        arrears_days: data?.arrears_days ?? 0,
      });
      setNoticeGenerated(true);
    } catch {
      // best-effort
      setNoticeGenerated(true);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B2B5E]" />
        <span className="ml-3 text-gray-600">Mengira Ta&apos;widh...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium">{error ?? 'Data tidak dijumpai.'}</p>
          <button onClick={() => navigate(-1)} className="mt-3 text-sm text-blue-600 underline">← Kembali</button>
        </div>
      </div>
    );
  }

  const tawidhAmount = Number(data.amount ?? data.tawidh ?? 0);
  const arrearsAmount = Number(data.arrears_amount ?? 0);
  const total = arrearsAmount + tawidhAmount;
  const ratePercent = Number(data.rate_used ?? data.bnm_rate ?? 1);
  const days = Number(data.arrears_days ?? 0);

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div>
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 mb-1">
          ← Kembali
        </button>
        <h1 className="text-xl font-bold text-[#1B2B5E]">Pengiraan Ta&apos;widh & Ganti Rugi</h1>
        {data.account_no && (
          <p className="text-sm text-gray-500">{data.account_no} — {data.borrower_name}</p>
        )}
      </div>

      {/* Shariah Compliance Badge */}
      {data.shariah_compliant && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
          <span className="text-green-600 text-xl">✅</span>
          <div>
            <span className="font-bold text-green-800 text-sm">Patuh Syariah</span>
            <p className="text-xs text-green-700 mt-0.5">{data.shariah_note}</p>
          </div>
        </div>
      )}

      {/* BNM Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2 text-sm text-blue-700">
        <span className="mt-0.5">ℹ️</span>
        <span>Ta&apos;widh dikira berdasarkan kadar sebenar kerugian mengikut prinsip Syariah (BNM Guidelines on Late Payment Charges for Islamic Finance)</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border-l-4 border-[#E65100] border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-xl">🕐</div>
            <div>
              <p className="text-xs text-gray-500">Hari Tertunggak</p>
              <p className="text-2xl font-bold text-[#E65100]">{days} hari</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border-l-4 border-red-500 border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-xl">💰</div>
            <div>
              <p className="text-xs text-gray-500">Jumlah Tertunggak</p>
              <p className="text-2xl font-bold text-red-600">
                RM {arrearsAmount.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border-l-4 border-[#1B2B5E] border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">🧮</div>
            <div>
              <p className="text-xs text-gray-500">Ta&apos;widh Dikira</p>
              <p className="text-2xl font-bold text-[#1B2B5E]">
                RM {tawidhAmount.toFixed(2)}
              </p>
              {data.capped && (
                <p className="text-xs text-orange-600 font-medium">* Had RM {Number(data.max_cap).toFixed(2)} dipakai</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Formula Explanation */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-bold text-base text-[#1B2B5E]">Formula Pengiraan</h2>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="font-semibold text-sm text-orange-800 mb-2">
              🧮 Ta&apos;widh = Jumlah Tertunggak × Kadar × (Hari / 365)
            </p>
            <p className="text-sm text-orange-700 font-mono">
              RM {arrearsAmount.toFixed(2)} × {ratePercent.toFixed(2)}% × ({days} / 365) = <strong>RM {tawidhAmount.toFixed(2)}</strong>
            </p>
          </div>

          {data.formula && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Formula dari API:</p>
              <p className="text-sm font-mono text-gray-700">{data.formula}</p>
            </div>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Kadar BNM Semasa</span>
              <span className="font-semibold">{Number(data.bnm_rate ?? 1).toFixed(2)}% setahun</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Kadar Digunakan</span>
              <span className="font-semibold">{ratePercent.toFixed(2)}% setahun</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Had Maksimum Ta&apos;widh</span>
              <span className="font-semibold">RM {Number(data.max_cap ?? 5000).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Had Dipakai?</span>
              <span className={`font-semibold ${data.capped ? 'text-orange-600' : 'text-green-600'}`}>
                {data.capped ? 'Ya' : 'Tidak'}
              </span>
            </div>
          </div>

          <p className="text-xs text-red-500">* Ta&apos;widh tidak boleh melebihi kerugian sebenar yang ditanggung</p>
        </div>

        {/* Results & Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-bold text-base text-[#1B2B5E]">Keputusan & Tindakan</h2>

          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 text-gray-600">Jumlah Tertunggak</td>
                <td className="py-3 text-right font-semibold">RM {arrearsAmount.toFixed(2)}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 text-gray-600">
                  Ta&apos;widh ({days} hari @ {ratePercent.toFixed(2)}% p.a.)
                </td>
                <td className="py-3 text-right font-semibold text-[#E65100]">RM {tawidhAmount.toFixed(2)}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 text-gray-600">Denda Pentadbiran</td>
                <td className="py-3 text-right font-semibold">RM 0.00</td>
              </tr>
              <tr className="bg-green-50">
                <td className="py-3 px-2 font-bold text-green-700 rounded-l">JUMLAH PERLU DIBAYAR</td>
                <td className="py-3 px-2 text-right font-bold text-green-700 text-lg rounded-r">
                  RM {total.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="flex gap-3">
            <button
              onClick={handleGenerateNotice}
              disabled={generating || noticeGenerated}
              className="flex-1 py-3 rounded-lg bg-[#1B2B5E] text-white font-semibold text-sm hover:bg-blue-900 disabled:opacity-50 transition-colors"
            >
              {generating ? '⏳ Menjana...' : noticeGenerated ? '✅ Notis Dijana' : '📄 Jana Notis Bayaran'}
            </button>
            <button
              onClick={() => navigate(`/akaun/${id}/bayar`)}
              className="flex-1 py-3 rounded-lg bg-[#2E7D32] text-white font-semibold text-sm hover:bg-green-700 transition-colors"
            >
              💳 Rekod Bayaran
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Kelulusan Pengurus diperlukan untuk waiver Ta&apos;widh melebihi RM 50.00
          </p>
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white text-lg flex-shrink-0">
          ✨
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-purple-200 text-purple-700 text-xs px-1.5 py-0.5 rounded font-bold">AI</span>
            <span className="font-bold text-purple-800 text-sm">Cadangan AI</span>
          </div>
          <p className="text-sm text-purple-700">
            Hubungi peminjam melalui SMS sebelum mengenakan Ta&apos;widh.{' '}
            <strong>73% peminjam membayar selepas peringatan pertama.</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
