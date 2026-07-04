import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '@/services/api';

const MOCK_ACCOUNT = {
  id: 'SPPT-ACC-2026-00089', name: 'Siti Nurhaliza', scheme: 'TEKUN Usahawan',
  status: 'LANCAR', health: 94, balance: 23456.78, monthly_payment: 763.89,
  next_payment_date: '01 Ogos 2026', payments_made: 3, total_payments: 36,
  classification: 'LANCAR - Tiada Tunggakan', ai_forecast: 'Akaun akan kekal LANCAR sepanjang tempoh',
};

const SCHEDULE = [
  { bulan: 'Ogos 2026', tarikh: '01 Ogos 2026', ansuran: 763.89, prinsipal: 540.00, keuntungan: 223.89, status: 'AKAN DATANG' },
  { bulan: 'September 2026', tarikh: '01 Sep 2026', ansuran: 763.89, prinsipal: 541.49, keuntungan: 222.40, status: 'AKAN DATANG' },
  { bulan: 'Oktober 2026', tarikh: '01 Okt 2026', ansuran: 763.89, prinsipal: 542.98, keuntungan: 220.91, status: 'AKAN DATANG' },
  { bulan: 'November 2026', tarikh: '01 Nov 2026', ansuran: 763.89, prinsipal: 544.48, keuntungan: 219.41, status: 'AKAN DATANG' },
  { bulan: 'Disember 2026', tarikh: '01 Dis 2026', ansuran: 763.89, prinsipal: 545.98, keuntungan: 217.91, status: 'AKAN DATANG' },
  { bulan: 'Januari 2027', tarikh: '01 Jan 2027', ansuran: 763.89, prinsipal: 547.49, keuntungan: 216.40, status: 'AKAN DATANG' },
  { bulan: 'Mei 2026', tarikh: '01 Mei 2026', ansuran: 763.89, prinsipal: 536.33, keuntungan: 227.56, status: 'DIBAYAR' },
  { bulan: 'Jun 2026', tarikh: '01 Jun 2026', ansuran: 763.89, prinsipal: 537.81, keuntungan: 226.08, status: 'DIBAYAR' },
  { bulan: 'Julai 2026', tarikh: '01 Jul 2026', ansuran: 763.89, prinsipal: 539.29, keuntungan: 224.60, status: 'DIBAYAR' },
];

const TRANSACTIONS = [
  { tarikh: '01 Jul 2026', amaun: 763.89, saluran: 'FPX', resit: 'FPX260701234567' },
  { tarikh: '01 Jun 2026', amaun: 763.89, saluran: 'DuitNow', resit: 'DN260601234123' },
  { tarikh: '01 Mei 2026', amaun: 763.89, saluran: 'FPX', resit: 'FPX260501123789' },
];

const generateChartData = () => {
  const data = [];
  let balance = 100000;
  const rate = 0.08 / 12;
  const payment = 763.89;
  for (let i = 0; i <= 36; i += 6) {
    data.push({ bulan: `Bulan ${i === 0 ? 1 : i}`, baki: Math.round(balance), unjuran: Math.round(balance * 0.95) });
    for (let j = 0; j < 6; j++) {
      const interest = balance * rate;
      const principal = payment - interest;
      balance -= principal;
    }
  }
  return data;
};

const chartData = generateChartData();

export default function Account360() {
  const [account] = useState(MOCK_ACCOUNT);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const statusColor = account.status === 'LANCAR' ? '#16A34A' : '#DC2626';
  const healthColor = account.health >= 80 ? '#16A34A' : account.health >= 60 ? '#F59E0B' : '#DC2626';

  return (
    <div className="space-y-4">
      <div className="sppt-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-xl font-bold" style={{ color: '#1B2B5E' }}>Akaun Pembiayaan - {account.id}</h1>
          <nav className="text-sm text-gray-500">🏠 › Akaun Pembiayaan › 360° Paparan Akaun</nav>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {[
            { icon: '👤', label: 'Nama', value: account.name },
            { icon: '💳', label: 'No Akaun', value: account.id },
            { icon: '📋', label: 'Skim', value: account.scheme },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">{item.icon}</div>
              <div><div className="text-xs text-gray-500">{item.label}</div><div className="font-semibold text-sm">{item.value}</div></div>
            </div>
          ))}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mr-2">Status</div>
            <span className="px-3 py-1 rounded font-bold text-white text-sm" style={{ background: statusColor }}>{account.status}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="sppt-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base" style={{ color: '#1B2B5E' }}>Kesihatan Akaun</h2>
            <span className="text-xl">❤️</span>
          </div>
          <div className="flex justify-center mb-4">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#E5E7EB" strokeWidth="12" />
                <circle cx="60" cy="60" r="50" fill="none" stroke={healthColor} strokeWidth="12"
                  strokeDasharray={`${account.health * 3.14} 314`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-xs text-gray-500">Kesihatan Akaun:</div>
                <div className="text-3xl font-bold" style={{ color: healthColor }}>{account.health}%</div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 bg-blue-50 rounded">
              <span>📄</span>
              <div><div className="text-xs text-gray-500">Baki Tertunggak</div>
                <div className="font-bold text-blue-700">RM {account.balance.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</div></div>
            </div>
            <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
              <span>📅</span>
              <div><div className="text-xs text-gray-500">Bayaran Bulan Ini</div><div className="font-bold">RM {account.monthly_payment.toFixed(2)}</div></div>
            </div>
            <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
              <span>🗓️</span>
              <div><div className="text-xs text-gray-500">Tarikh Bayaran</div><div className="font-bold">{account.next_payment_date}</div></div>
            </div>
            <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
              <span>✅</span>
              <div><div className="text-xs text-gray-500">Bayaran Dibuat</div>
                <div className="font-bold text-green-600">{account.payments_made}/{account.total_payments} bulan</div></div>
            </div>
            <div className="p-2 bg-green-50 rounded border border-green-200">
              <div className="text-xs text-gray-500">Klasifikasi Akaun</div>
              <div className="font-bold text-green-700">✅ {account.classification}</div>
            </div>
            <div className="p-2 bg-purple-50 rounded border border-purple-200 flex items-start gap-2">
              <span className="text-purple-600 text-lg">🧠</span>
              <div><div className="text-xs text-gray-500">Unjuran AI</div>
                <div className="text-sm font-medium text-purple-700">{account.ai_forecast}</div></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="sppt-card">
            <h2 className="font-bold text-base mb-3" style={{ color: '#1B2B5E' }}>
              Jadual Bayaran <span className="text-sm font-normal text-gray-500">(6 bulan akan datang & 3 bulan lepas)</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    {['Bulan','Tarikh','Ansuran','Prinsipal','Keuntungan','Status'].map(h => (
                      <th key={h} className="p-2 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SCHEDULE.map((row, i) => (
                    <tr key={i} className={`border-b ${row.status === 'DIBAYAR' ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                      <td className="p-2">{row.bulan}</td>
                      <td className="p-2">{row.tarikh}</td>
                      <td className="p-2 text-right">RM {row.ansuran.toFixed(2)}</td>
                      <td className="p-2 text-right">RM {row.prinsipal.toFixed(2)}</td>
                      <td className="p-2 text-right">RM {row.keuntungan.toFixed(2)}</td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${row.status === 'DIBAYAR' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="sppt-card">
            <h2 className="font-bold text-base mb-3" style={{ color: '#1B2B5E' }}>
              Graf Pengurangan Baki <span className="text-sm font-normal text-gray-500">(36 bulan)</span>
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => `RM ${Number(v).toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="baki" name="Baki Pembiayaan (RM)" stroke="#1B2B5E" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="unjuran" name="Unjuran" stroke="#9CA3AF" strokeWidth={1} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="sppt-card">
          <h2 className="font-bold text-base mb-3" style={{ color: '#1B2B5E' }}>Tindakan Pantas</h2>
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-3 rounded-lg text-white font-semibold text-sm" style={{ background: '#16A34A' }}>
              <span>💳 Buat Bayaran Sekarang</span><span>›</span>
            </button>
            {['⬇️ Muat Turun Penyata','⏸️ Mohon Moratorium','📅 Mohon Penjadualan Semula'].map(a => (
              <button key={a} className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 text-gray-700 text-sm hover:bg-gray-50">
                <span>{a}</span><span>›</span>
              </button>
            ))}
          </div>
        </div>

        <div className="sppt-card">
          <h2 className="font-bold text-base mb-3" style={{ color: '#1B2B5E' }}>
            Transaksi Terkini <span className="text-sm font-normal text-gray-500">(3 bayaran terakhir)</span>
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800 text-white">
                {['Tarikh','Amaun','Saluran','No. Resit'].map(h => <th key={h} className="p-2 text-left">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {TRANSACTIONS.map((t, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="p-2">{t.tarikh}</td>
                  <td className="p-2">RM {t.amaun.toFixed(2)}</td>
                  <td className="p-2">{t.saluran}</td>
                  <td className="p-2 text-xs text-gray-500">{t.resit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3">
          <div className="sppt-card bg-yellow-50 border border-yellow-200">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔔</span>
              <div>
                <div className="font-bold text-yellow-800 text-sm">Peringatan AI</div>
                <div className="text-sm text-yellow-700 mt-1">
                  Bayaran bulan hadapan <strong>RM 763.89</strong> perlu dibuat sebelum <strong>01 Ogos 2026</strong> (28 hari lagi).
                </div>
              </div>
            </div>
          </div>
          <div className="sppt-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>🔔</span>
                <div>
                  <div className="font-semibold text-sm">Peringatan Bayaran</div>
                  <div className="text-xs text-gray-500">Terima peringatan sebelum tarikh bayaran anda.</div>
                </div>
              </div>
              <button onClick={() => setReminderEnabled(!reminderEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${reminderEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${reminderEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
