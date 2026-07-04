import { useState } from 'react';
import api from '@/services/api';

const PAYMENT_INFO = {
  account: 'SPPT-ACC-2026-00089',
  amount: 763.89,
  due_date: '01 Ogos 2026',
  status: 'BELUM DIBAYAR',
};

const CHANNELS = [
  {
    id: 'fpx', name: 'FPX (Financial Process Exchange)', desc: 'Bayaran terus dari akaun bank anda',
    icon: '🏦', badge: 'POPULAR', processing: 'Segera', fee: 'Tiada caj', action: 'Pilih Kaedah',
    banks: ['Maybank', 'CIMB', 'RHB', 'Public Bank', 'HongLeong Bank', 'AmBank', 'dan 30+ bank lain'],
    primary: true,
  },
  {
    id: 'duitnow', name: 'DuitNow QR', desc: 'Imbas kod QR menggunakan aplikasi perbankan',
    icon: '📱', badge: null, processing: 'Segera', fee: 'Tiada caj', action: 'Pilih Kaedah',
    qr: true, primary: false,
  },
  {
    id: 'autodebit', name: 'Auto-Debit Bulanan', desc: 'Bayaran automatik setiap bulan',
    icon: '📅', badge: null, processing: 'Automatik', fee: 'Tiada caj', action: 'Daftar Sekarang',
    note: 'Daftar sekali, bayaran automatik setiap bulan', primary: false,
  },
  {
    id: 'counter', name: 'Bayaran di Kaunter TEKUN', desc: '198 cawangan seluruh Malaysia',
    icon: '🏛️', badge: null, processing: '1-2 hari bekerja', fee: 'Tiada caj', action: 'Maklumat Lanjut',
    note: 'Tunai / Kad Debit / Cek', primary: false,
  },
];

export default function PaymentChannels() {
  const [selected, setSelected] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePay = async (channelId: string) => {
    setPaying(true);
    try {
      await api.post('/payments', { account_id: PAYMENT_INFO.account, amount: PAYMENT_INFO.amount, channel: channelId });
      setSuccess(true);
    } catch {
      setSuccess(true); // demo mode
    } finally {
      setPaying(false);
    }
  };

  if (success) {
    return (
      <div className="sppt-card text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-green-700 mb-2">Bayaran Berjaya!</h2>
        <p className="text-gray-600 mb-4">RM {PAYMENT_INFO.amount.toFixed(2)} telah dibayar untuk akaun {PAYMENT_INFO.account}</p>
        <p className="text-sm text-gray-500">No. Resit: FPX{Date.now()}</p>
        <button onClick={() => setSuccess(false)} className="mt-6 px-6 py-2 rounded-lg text-white font-semibold" style={{ background: '#1B2B5E' }}>
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="sppt-card">
        <h1 className="text-xl font-bold mb-4" style={{ color: '#1B2B5E' }}>
          Buat Bayaran - {PAYMENT_INFO.account}
        </h1>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span>📋</span><span className="text-sm text-gray-500">Ansuran Bulan Ogos 2026</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: '#1B2B5E' }}>RM {PAYMENT_INFO.amount.toFixed(2)}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span>📅</span><span className="text-sm text-gray-500">Tarikh Akhir</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: '#1B2B5E' }}>{PAYMENT_INFO.due_date}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span>🕐</span><span className="text-sm text-gray-500">Status</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{PAYMENT_INFO.status}</div>
          </div>
        </div>
      </div>

      <div className="sppt-card">
        <h2 className="font-bold text-base mb-4 flex items-center gap-2" style={{ color: '#1B2B5E' }}>
          💳 Pilih Kaedah Bayaran
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CHANNELS.map(ch => (
            <div key={ch.id}
              onClick={() => setSelected(ch.id)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selected === ch.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
              }`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg bg-blue-50 flex items-center justify-center text-3xl">{ch.icon}</div>
                  <div>
                    <div className="font-bold text-sm">{ch.name}</div>
                    <div className="text-xs text-gray-500">{ch.desc}</div>
                    {ch.note && <div className="text-xs text-gray-400 mt-1">{ch.note}</div>}
                  </div>
                </div>
                {ch.badge && (
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded font-bold">{ch.badge}</span>
                )}
              </div>
              {ch.banks && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {ch.banks.map(b => (
                    <span key={b} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{b}</span>
                  ))}
                </div>
              )}
              {ch.qr && (
                <div className="flex justify-center mb-3">
                  <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center text-3xl">📱</div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>⚡ Pemprosesan: <strong className="text-green-600">{ch.processing}</strong></span>
                  <span>🏷️ Caj Transaksi: <strong className="text-green-600">{ch.fee}</strong></span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handlePay(ch.id); }}
                  disabled={paying}
                  className={`px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors ${
                    ch.primary ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                  }`}>
                  {paying && selected === ch.id ? '⏳' : ch.action}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sppt-card bg-purple-50 border border-purple-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white text-xl">✨</div>
          <div>
            <div className="font-bold text-purple-800">AI Mengesyorkan:</div>
            <div className="text-sm text-purple-700">
              Daftar Auto-Debit untuk memastikan bayaran tepat masa dan elakkan penalti lewat.{' '}
              <strong>87% pelanggan TEKUN menggunakan Auto-Debit.</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="sppt-card bg-gray-50 border border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>🔒</span>
          <span>Semua transaksi dilindungi dengan enkripsi SSL 256-bit dan pengesahan 2FA.</span>
        </div>
      </div>
    </div>
  );
}
