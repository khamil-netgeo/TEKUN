import { useState } from 'react';
import api from '@/services/api';

const ACCOUNT = { id: 'SPPT-ACC-2026-00089', name: 'Siti Nurhaliza', balance: 23456.78, monthly: 763.89, end_date: 'Ogos 2029' };

const REASONS = [
  'Masalah Kewangan Sementara - COVID/Bencana',
  'Kehilangan Pekerjaan / Perniagaan Terjejas',
  'Perbelanjaan Perubatan Kecemasan',
  'Bencana Alam (Banjir, Kebakaran)',
  'Lain-lain (Nyatakan)',
];

export default function Moratorium() {
  const [type, setType] = useState<'moratorium' | 'restructuring'>('moratorium');
  const [months, setMonths] = useState(3);
  const [reason, setReason] = useState(REASONS[0]);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const extraInterest = (ACCOUNT.balance * 0.08 / 12) * months;
  const newBalance = ACCOUNT.balance + extraInterest;
  const newEndDate = new Date(2029, 7 + months, 1).toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' });

  const handleSubmit = async () => {
    if (!agreed) return;
    setSubmitting(true);
    try {
      await api.post('/accounts/SPPT-ACC-2026-00089/moratorium', { type, months, reason });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="sppt-card text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-green-700 mb-2">Permohonan Dihantar!</h2>
        <p className="text-gray-600">Permohonan moratorium anda sedang diproses. Kelulusan dijangka dalam 2-3 hari bekerja.</p>
        <button onClick={() => setSubmitted(false)} className="mt-6 px-6 py-2 rounded-lg text-white font-semibold" style={{ background: '#1B2B5E' }}>
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="sppt-card">
        <h1 className="text-xl font-bold mb-1" style={{ color: '#1B2B5E' }}>Permohonan Moratorium / Penjadualan Semula</h1>
        <div className="flex items-center gap-6 mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">👤</span>
            <div><div className="text-xs text-gray-500">Pemohon</div><div className="font-semibold">{ACCOUNT.name}</div></div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">📁</span>
            <div><div className="text-xs text-gray-500">Akaun SPPT</div><div className="font-semibold">{ACCOUNT.id}</div></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Form */}
        <div className="sppt-card space-y-5">
          <div>
            <div className="font-semibold mb-3">1. Jenis Permohonan</div>
            <div className="grid grid-cols-2 gap-3">
              <div onClick={() => setType('moratorium')}
                className={`p-4 rounded-lg border-2 cursor-pointer ${type === 'moratorium' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-4 h-4 rounded-full border-2 ${type === 'moratorium' ? 'border-blue-500 bg-blue-500' : 'border-gray-400'}`} />
                  <div className="font-semibold text-sm">Moratorium (Penangguhan Bayaran)</div>
                </div>
                <div className="text-xs text-gray-500 ml-6">Tangguhkan bayaran selama 1-6 bulan. Keuntungan terus dikira.</div>
              </div>
              <div onClick={() => setType('restructuring')}
                className={`p-4 rounded-lg border-2 cursor-pointer ${type === 'restructuring' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-4 h-4 rounded-full border-2 ${type === 'restructuring' ? 'border-blue-500 bg-blue-500' : 'border-gray-400'}`} />
                  <div className="font-semibold text-sm">Penjadualan Semula (Restructuring)</div>
                </div>
                <div className="text-xs text-gray-500 ml-6">Ubah tempoh atau jumlah ansuran. Memerlukan penilaian semula.</div>
              </div>
            </div>
          </div>

          <div>
            <div className="font-semibold mb-2">2. Tempoh Moratorium</div>
            <select value={months} onChange={e => setMonths(Number(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm">
              {[1,2,3,4,5,6].map(m => (
                <option key={m} value={m}>{m} bulan (Julai - {new Date(2026, 6 + m, 1).toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' })})</option>
              ))}
            </select>
          </div>

          <div>
            <div className="font-semibold mb-2">3. Sebab Permohonan</div>
            <select value={reason} onChange={e => setReason(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm">
              {REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <div className="font-semibold mb-2">4. Surat Sokongan / Bukti</div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50">
              <div className="text-4xl mb-2">☁️</div>
              <div className="font-semibold text-blue-600">Klik untuk muat naik</div>
              <div className="text-xs text-gray-500">PDF, JPG, PNG (Maksimum 10MB)</div>
            </div>
          </div>

          <div>
            <div className="font-semibold mb-2">5. Pengesahan</div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1" />
              <span className="text-sm text-gray-600">
                Saya memahami bahawa keuntungan akan terus dikira semasa tempoh moratorium dan baki tertunggak akan meningkat.
              </span>
            </label>
          </div>

          <button onClick={handleSubmit} disabled={!agreed || submitting}
            className={`w-full py-3 rounded-lg text-white font-semibold flex items-center justify-center gap-2 ${agreed ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}>
            {submitting ? '⏳ Menghantar...' : '📤 Hantar Permohonan'}
          </button>
        </div>

        {/* Right: AI Impact Analysis */}
        <div className="sppt-card" style={{ background: 'linear-gradient(135deg, #6B21A8 0%, #4F46E5 100%)', color: 'white' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2">✨ Analisis Impak AI</h2>
            <span className="px-2 py-1 bg-white bg-opacity-20 rounded text-xs font-bold">AI</span>
          </div>

          <div className="mb-4">
            <div className="font-semibold mb-3 text-purple-100">Perbandingan Sebelum & Selepas</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white border-opacity-20">
                  <th className="p-2 text-left text-purple-200">Perkara</th>
                  <th className="p-2 text-center text-purple-200">SEBELUM</th>
                  <th className="p-2 text-center text-yellow-300">SELEPAS ({months}-BULAN MORATORIUM)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white border-opacity-10">
                  <td className="p-2">Baki Semasa</td>
                  <td className="p-2 text-center">RM {ACCOUNT.balance.toLocaleString()}</td>
                  <td className="p-2 text-center text-yellow-300 font-bold">RM {newBalance.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr className="border-b border-white border-opacity-10">
                  <td className="p-2">Ansuran</td>
                  <td className="p-2 text-center">RM {ACCOUNT.monthly.toFixed(2)}</td>
                  <td className="p-2 text-center text-yellow-300 font-bold">RM {ACCOUNT.monthly.toFixed(2)} (sama)</td>
                </tr>
                <tr>
                  <td className="p-2">Tarikh Tamat</td>
                  <td className="p-2 text-center">{ACCOUNT.end_date}</td>
                  <td className="p-2 text-center text-yellow-300 font-bold">{newEndDate} ({months} bulan lanjut)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-red-500 bg-opacity-30 rounded-lg mb-4 border border-red-400 border-opacity-50">
            <div className="flex items-center gap-2 text-sm">
              <span>⚠️</span>
              <span><strong>Impak:</strong> Jumlah keuntungan tambahan RM {extraInterest.toFixed(2)} akibat moratorium</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="font-semibold mb-2 text-purple-100">Cadangan AI</div>
            <div className="p-3 bg-white bg-opacity-10 rounded-lg text-sm">
              <div className="flex items-start gap-2">
                <span>🧠</span>
                <div>
                  Moratorium disyorkan jika masalah kewangan bersifat sementara.
                  Pertimbangkan penjadualan semula jika masalah berpanjangan.
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="font-semibold mb-2 text-purple-100">Maklumat Kelulusan</div>
            <div className="p-3 bg-white bg-opacity-10 rounded-lg text-sm flex items-center gap-2">
              <span>🕐</span>
              <span>Kelulusan dijangka dalam 2-3 hari bekerja.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
