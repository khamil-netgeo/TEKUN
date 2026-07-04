import { useState } from 'react';
import api from '@/services/api';

const ACCOUNT = { id: 'SPPT-ACC-2026-00089', scheme: 'TEKUN Usahawan', name: 'Siti Nurhaliza binti Ahmad' };

export default function TawidhCalculator() {
  const [overdue, setOverdue] = useState(2290.67);
  const [days, setDays] = useState(47);
  const [useActual, setUseActual] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [waiverRequested, setWaiverRequested] = useState(false);

  const rate = 0.01; // 1% per annum BNM rate
  const tawidh = overdue * rate * (days / 365);
  const total = overdue + tawidh;

  const handleGenerateNotice = async () => {
    setGenerating(true);
    try {
      await api.post('/accounts/SPPT-ACC-2026-00089/tawidh-notice', { overdue, days, tawidh });
    } catch {}
    setGenerating(false);
    alert('Notis bayaran telah dijana dan dihantar kepada peminjam.');
  };

  const handleWaiver = () => {
    setWaiverRequested(true);
    setTimeout(() => setWaiverRequested(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="sppt-card">
        <div className="text-sm text-gray-500 mb-1">Pengurusan Akaun › Bayaran Pembiayaan › Ta'widh</div>
        <h1 className="text-2xl font-bold" style={{ color: '#1B2B5E' }}>Pengiraan Ta'widh & Ganti Rugi</h1>
        <div className="text-sm text-gray-500 mt-1">{ACCOUNT.id} | {ACCOUNT.scheme} | {ACCOUNT.name}</div>
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-sm text-blue-700">
          <span>ℹ️</span>
          <span>Ta'widh dikira berdasarkan kadar sebenar kerugian mengikut prinsip Syariah (BNM Guidelines on Late Payment Charges for Islamic Finance)</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="sppt-card border-l-4 border-orange-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-2xl">🕐</div>
            <div>
              <div className="text-xs text-gray-500">Hari Tertunggak</div>
              <div className="text-3xl font-bold text-orange-500">{days} hari</div>
              <div className="text-xs text-gray-400">Sejak 15 Mei 2026</div>
            </div>
          </div>
        </div>
        <div className="sppt-card border-l-4 border-red-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-2xl">💰</div>
            <div>
              <div className="text-xs text-gray-500">Jumlah Tertunggak</div>
              <div className="text-3xl font-bold text-red-500">RM {overdue.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</div>
              <div className="text-xs text-gray-400">3 ansuran belum dibayar</div>
            </div>
          </div>
        </div>
        <div className="sppt-card border-l-4" style={{ borderColor: '#1B2B5E' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">🧮</div>
            <div>
              <div className="text-xs text-gray-500">Ta'widh Dikira</div>
              <div className="text-3xl font-bold" style={{ color: '#1B2B5E' }}>RM {tawidh.toFixed(2)}</div>
              <div className="text-xs text-gray-400 flex items-center gap-1">Dikira automatik oleh AI 🤖</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Calculator */}
        <div className="sppt-card space-y-4">
          <h2 className="font-bold text-base" style={{ color: '#1B2B5E' }}>Parameter Pengiraan Ta'widh</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Jumlah Tertunggak (RM)</label>
              <input type="number" value={overdue} onChange={e => setOverdue(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Bilangan Hari Tertunggak</label>
              <input type="number" value={days} onChange={e => setDays(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">Kadar Ta'widh</label>
            <select className="w-full p-3 border border-gray-300 rounded-lg text-sm">
              <option>Kadar BNM Semasa: 1% setahun</option>
              <option>Kadar Sebenar Kerugian</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Kadar Sebenar Kerugian</span>
            <button onClick={() => setUseActual(!useActual)}
              className={`relative w-12 h-6 rounded-full transition-colors ${useActual ? 'bg-green-500' : 'bg-gray-300'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${useActual ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm text-gray-600">Kadar BNM</span>
          </div>

          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span>🧮</span>
              <span className="font-semibold text-sm">Formula: Ta'widh = Jumlah Tertunggak x Kadar x (Hari / 365)</span>
            </div>
            <div className="text-sm text-orange-700 font-mono">
              RM {overdue.toFixed(2)} x {(rate * 100).toFixed(0)}% x ({days} / 365) = <strong>RM {tawidh.toFixed(2)}</strong>
            </div>
          </div>

          <div className="text-xs text-red-500 flex items-center gap-1">
            <span>*</span>
            <span>Ta'widh tidak boleh melebihi kerugian sebenar yang ditanggung</span>
          </div>

          <button className="w-full py-3 rounded-lg text-white font-semibold flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700">
            🧮 Kira Semula Ta'widh
          </button>
        </div>

        {/* Right: Results & Validation */}
        <div className="sppt-card space-y-4">
          <h2 className="font-bold text-base" style={{ color: '#1B2B5E' }}>Keputusan & Pengesahan</h2>
          <table className="w-full text-sm">
            <tbody>
              {[
                { label: 'Jumlah Tertunggak', value: overdue.toFixed(2) },
                { label: `Ta'widh (${days} hari @ ${(rate * 100).toFixed(0)}% p.a.)`, value: tawidh.toFixed(2) },
                { label: 'Denda Pentadbiran', value: '0.00' },
              ].map((row, i) => (
                <tr key={i} className="border-b">
                  <td className="py-3 text-gray-600">{row.label}</td>
                  <td className="py-3 text-right font-semibold">{row.value}</td>
                </tr>
              ))}
              <tr className="bg-green-50">
                <td className="py-3 font-bold text-green-700">JUMLAH PERLU DIBAYAR</td>
                <td className="py-3 text-right font-bold text-green-700 text-lg">{total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm text-green-700">
            <span>✅</span>
            <span><strong>Patuh Syariah</strong> - Disahkan oleh Jawatankuasa Syariah TEKUN</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleGenerateNotice} disabled={generating}
              className="py-3 rounded-lg text-white font-semibold text-sm flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700">
              {generating ? '⏳' : '📄'} Jana Notis Bayaran
            </button>
            <button onClick={handleWaiver}
              className="py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 border-2 border-gray-300 hover:bg-gray-50">
              {waiverRequested ? '✅ Diminta' : '⚖️ Waiver Ta\'widh'}
            </button>
          </div>
          <div className="text-xs text-gray-500 text-center">Kelulusan Pengurus diperlukan untuk waiver melebihi RM 50.00</div>
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="sppt-card bg-purple-50 border border-purple-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white text-xl">✨</div>
          <div className="flex-1">
            <div className="font-bold text-purple-800">AI Mengesyorkan:</div>
            <div className="text-sm text-purple-700">Hubungi peminjam melalui SMS sebelum mengenakan Ta'widh. <strong>73% peminjam membayar selepas peringatan pertama.</strong></div>
          </div>
          <button className="px-4 py-2 rounded-lg border-2 border-purple-400 text-purple-700 text-sm font-semibold hover:bg-purple-100">
            💬 Hantar Peringatan SMS
          </button>
        </div>
      </div>
    </div>
  );
}
