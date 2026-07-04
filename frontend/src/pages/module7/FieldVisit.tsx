import { useState } from 'react';
import api from '@/services/api';

const VISITS = [
  { id: 'LW-001', entrepreneur: 'Ahmad Bin Mohd Ali', date: '2026-07-10', time: '10:00 AM', officer: 'Hafiz Bin Ramli', status: 'Dijadualkan', purpose: 'Pemantauan Perniagaan', address: 'No. 12, Jalan Mawar, KL' },
  { id: 'LW-002', entrepreneur: 'Siti Noraini Binti Hassan', date: '2026-07-08', time: '2:30 PM', officer: 'Aminah Bt Yusof', status: 'Selesai', purpose: 'Tindakan Susulan NPL', address: 'No. 5, Jalan Melati, Shah Alam' },
  { id: 'LW-003', entrepreneur: 'Tan Wei Ming', date: '2026-07-12', time: '11:00 AM', officer: 'Hafiz Bin Ramli', status: 'Dijadualkan', purpose: 'Penilaian Semula', address: 'No. 88, Jalan Kenanga, JB' },
];

const STATUS_COLORS: Record<string, string> = {
  'Dijadualkan': 'bg-blue-100 text-blue-700',
  'Selesai': 'bg-green-100 text-green-700',
  'Dibatalkan': 'bg-red-100 text-red-700',
};

export default function FieldVisit() {
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);

  const handleGenerateReport = async (id: string) => {
    setGenerating(id);
    try { await api.post(`/entrepreneurs/visits/${id}/report`, {}); } catch {}
    setTimeout(() => setGenerating(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="sppt-card flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1B2B5E' }}>Lawatan Lapangan</h1>
          <p className="text-sm text-gray-500 mt-1">Jadualkan dan rekod lawatan lapangan pegawai ke premis usahawan</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg text-white font-semibold text-sm"
          style={{ background: '#1B2B5E' }}>
          + Jadual Lawatan Baru
        </button>
      </div>

      {showForm && (
        <div className="sppt-card">
          <h2 className="font-bold text-sm mb-3" style={{ color: '#1B2B5E' }}>Borang Jadual Lawatan Baru</h2>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs text-gray-500 block mb-1">Usahawan</label>
              <select className="w-full p-2 border border-gray-300 rounded text-sm">
                {VISITS.map(v => <option key={v.id}>{v.entrepreneur}</option>)}
              </select></div>
            <div><label className="text-xs text-gray-500 block mb-1">Tarikh</label>
              <input type="date" className="w-full p-2 border border-gray-300 rounded text-sm" /></div>
            <div><label className="text-xs text-gray-500 block mb-1">Masa</label>
              <input type="time" className="w-full p-2 border border-gray-300 rounded text-sm" /></div>
            <div><label className="text-xs text-gray-500 block mb-1">Pegawai</label>
              <select className="w-full p-2 border border-gray-300 rounded text-sm">
                <option>Hafiz Bin Ramli</option><option>Aminah Bt Yusof</option>
              </select></div>
            <div><label className="text-xs text-gray-500 block mb-1">Tujuan</label>
              <select className="w-full p-2 border border-gray-300 rounded text-sm">
                <option>Pemantauan Perniagaan</option><option>Tindakan Susulan NPL</option><option>Penilaian Semula</option>
              </select></div>
            <div className="flex items-end">
              <button className="w-full py-2 rounded-lg text-white font-semibold text-sm" style={{ background: '#16A34A' }}>
                Simpan Lawatan
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sppt-card">
        <h2 className="font-bold text-sm mb-3" style={{ color: '#1B2B5E' }}>Senarai Lawatan</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Usahawan</th>
              <th className="p-3 text-left">Tarikh & Masa</th>
              <th className="p-3 text-left">Pegawai</th>
              <th className="p-3 text-left">Tujuan</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-center">Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {VISITS.map(v => (
              <tr key={v.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-mono text-xs text-blue-600">{v.id}</td>
                <td className="p-3">{v.entrepreneur}</td>
                <td className="p-3 text-xs">{v.date} • {v.time}</td>
                <td className="p-3 text-xs">{v.officer}</td>
                <td className="p-3 text-xs">{v.purpose}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_COLORS[v.status]}`}>{v.status}</span>
                </td>
                <td className="p-3 text-center">
                  {v.status === 'Selesai' ? (
                    <button onClick={() => handleGenerateReport(v.id)}
                      disabled={generating === v.id}
                      className="px-3 py-1 rounded text-xs font-semibold text-white flex items-center gap-1 mx-auto"
                      style={{ background: '#7C3AED' }}>
                      {generating === v.id ? '⏳' : '✨'} Jana Laporan AI
                    </button>
                  ) : (
                    <button className="px-3 py-1 rounded text-xs font-semibold border border-gray-300 hover:bg-gray-50">
                      Lihat
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
