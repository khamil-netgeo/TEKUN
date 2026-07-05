import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';

interface AccountInfo {
  id: string;
  account_no: string;
  borrower_name: string;
  monthly_instalment: number;
  outstanding_balance: number;
  status: string;
}

interface PaymentResult {
  receipt_no: string;
  amount: number;
  channel: string;
  paid_at: string;
  new_balance: number;
}

const CHANNELS = [
  {
    id: 'fpx',
    name: 'FPX (Financial Process Exchange)',
    desc: 'Bayaran terus dari akaun bank anda',
    icon: '🏦',
    badge: 'POPULAR',
    processing: 'Segera',
    fee: 'Tiada caj',
    banks: ['Maybank', 'CIMB', 'RHB', 'Public Bank', 'HongLeong Bank', 'AmBank', 'dan 30+ bank lain'],
  },
  {
    id: 'jompay',
    name: 'JomPAY',
    desc: 'Bayaran melalui portal JomPAY',
    icon: '💻',
    badge: null,
    processing: 'Segera',
    fee: 'Tiada caj',
    banks: [],
  },
  {
    id: 'duitnow',
    name: 'DuitNow QR',
    desc: 'Imbas kod QR menggunakan aplikasi perbankan',
    icon: '📱',
    badge: null,
    processing: 'Segera',
    fee: 'Tiada caj',
    banks: [],
  },
  {
    id: 'kaunter',
    name: 'Bayaran di Kaunter TEKUN',
    desc: '198 cawangan seluruh Malaysia',
    icon: '🏛️',
    badge: null,
    processing: '1-2 hari bekerja',
    fee: 'Tiada caj',
    banks: [],
  },
  {
    id: 'auto_debit',
    name: 'Auto-Debit Bulanan',
    desc: 'Bayaran automatik setiap bulan',
    icon: '📅',
    badge: 'DISYORKAN',
    processing: 'Automatik',
    fee: 'Tiada caj',
    banks: [],
  },
];

export default function PaymentChannels() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [paying, setPaying] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get(`/accounts/${id}`)
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setAccount(data);
        setAmount(String(data.monthly_instalment ?? ''));
      })
      .catch(() => setError('Gagal memuatkan maklumat akaun.'))
      .finally(() => setLoadingAccount(false));
  }, [id]);

  async function handlePay(channelId: string) {
    if (!id || !amount) return;
    setPaying(true);
    setError(null);
    try {
      const res = await api.post(`/accounts/${id}/payment`, {
        amount: parseFloat(amount),
        channel: channelId,
      });
      setResult(res.data?.data ?? res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal merekod pembayaran.';
      setError(msg);
    } finally {
      setPaying(false);
    }
  }

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
          <h2 className="text-2xl font-bold text-green-700 mb-2">Bayaran Berjaya!</h2>
          <p className="text-gray-600 mb-1">
            RM {Number(result.amount).toFixed(2)} telah direkodkan.
          </p>
          <p className="text-sm text-gray-500 mb-1">No. Resit: <span className="font-mono font-semibold">{result.receipt_no}</span></p>
          <p className="text-sm text-gray-500 mb-1">Baki Baru: <span className="font-bold text-[#1B2B5E]">RM {Number(result.new_balance).toFixed(2)}</span></p>
          <p className="text-sm text-gray-500 mb-4">Saluran: <span className="uppercase font-medium">{result.channel}</span></p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setResult(null)}
              className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
            >
              Bayaran Lain
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
        <h1 className="text-xl font-bold text-[#1B2B5E]">Rekod Pembayaran</h1>
        {account && (
          <p className="text-sm text-gray-500">{account.account_no} — {account.borrower_name}</p>
        )}
      </div>

      {/* Account Summary */}
      {account && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Ansuran Bulanan</p>
              <p className="text-xl font-bold text-[#1B2B5E]">
                RM {Number(account.monthly_instalment).toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Baki Tertunggak</p>
              <p className="text-xl font-bold text-[#E65100]">
                RM {Number(account.outstanding_balance).toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Status Akaun</p>
              <p className="text-xl font-bold text-[#2E7D32]">{account.status}</p>
            </div>
          </div>
        </div>
      )}

      {/* Amount Input */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Amaun Bayaran (RM)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0.01"
          step="0.01"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-lg font-bold text-[#1B2B5E] focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0.00"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Channel Cards */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-bold text-base mb-4 text-[#1B2B5E]">💳 Pilih Saluran Pembayaran</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CHANNELS.map((ch) => (
            <div
              key={ch.id}
              onClick={() => setSelected(ch.id)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selected === ch.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-2xl">
                    {ch.icon}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{ch.name}</div>
                    <div className="text-xs text-gray-500">{ch.desc}</div>
                  </div>
                </div>
                {ch.badge && (
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded font-bold">
                    {ch.badge}
                  </span>
                )}
              </div>
              {ch.banks.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {ch.banks.map((b) => (
                    <span key={b} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{b}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>⚡ <strong className="text-green-600">{ch.processing}</strong></span>
                  <span>🏷️ <strong className="text-green-600">{ch.fee}</strong></span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected(ch.id);
                    handlePay(ch.id);
                  }}
                  disabled={paying || !amount}
                  className="px-4 py-2 rounded-lg bg-[#1B2B5E] text-white text-sm font-semibold hover:bg-blue-900 disabled:opacity-50 transition-colors"
                >
                  {paying && selected === ch.id ? '⏳ Memproses...' : 'Bayar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white text-lg flex-shrink-0">
          ✨
        </div>
        <div>
          <div className="font-bold text-purple-800 text-sm flex items-center gap-1">
            <span className="bg-purple-200 text-purple-700 text-xs px-1.5 py-0.5 rounded font-bold">AI</span>
            Cadangan AI
          </div>
          <div className="text-sm text-purple-700 mt-1">
            Daftar <strong>Auto-Debit</strong> untuk memastikan bayaran tepat masa dan elakkan penalti Ta&apos;widh.
            87% pelanggan TEKUN menggunakan Auto-Debit.
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-2 text-sm text-gray-600">
        <span>🔒</span>
        <span>Semua transaksi dilindungi dengan enkripsi AES-256 dan TLS 1.3.</span>
      </div>
    </div>
  );
}
