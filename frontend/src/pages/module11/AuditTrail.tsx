import { useState } from 'react';

const LOGS = [
  { id: 1, user: 'Hafiz Bin Ramli', role: 'Pegawai Kredit', action: 'APPROVE', module: 'Permohonan', record: 'APP-2026-00234', before: 'Dalam Semakan', after: 'Lulus', ip: '192.168.1.45', timestamp: '2026-07-04 09:45:32' },
  { id: 2, user: 'Aminah Bt Yusof', role: 'Pentadbir Sistem', action: 'UPDATE', module: 'Pengguna', record: 'USR-00089', before: 'Aktif', after: 'Tidak Aktif', ip: '192.168.1.12', timestamp: '2026-07-04 09:32:15' },
  { id: 3, user: 'Ahmad Faizal', role: 'Pegawai Kewangan', action: 'DISBURSE', module: 'Pengeluaran', record: 'DIS-2026-00567', before: 'Menunggu', after: 'Dibayar', ip: '192.168.1.78', timestamp: '2026-07-04 09:18:44' },
  { id: 4, user: 'Noraini Bt Hassan', role: 'Pengurus Cawangan', action: 'VIEW', module: 'Laporan', record: 'RPT-20260704', before: '-', after: '-', ip: '192.168.1.23', timestamp: '2026-07-04 09:05:11' },
  { id: 5, user: 'Zulkifli Bin Omar', role: 'Pegawai Kredit', action: 'REJECT', module: 'Permohonan', record: 'APP-2026-00235', before: 'Dalam Semakan', after: 'Tolak', ip: '192.168.1.56', timestamp: '2026-07-04 08:55:22' },
];

const ACTION_COLORS: Record<string, string> = {
  'APPROVE': 'bg-green-100 text-green-700',
  'REJECT': 'bg-red-100 text-red-700',
  'UPDATE': 'bg-blue-100 text-blue-700',
  'DISBURSE': 'bg-purple-100 text-purple-700',
  'VIEW': 'bg-gray-100 text-gray-600',
  'DELETE': 'bg-red-200 text-red-800',
};

export default function AuditTrail() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('Semua');

  const filtered = LOGS.filter(l =>
    (actionFilter === 'Semua' || l.action === actionFilter) &&
    (l.user.toLowerCase().includes(search.toLowerCase()) || l.record.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="sppt-card">
        <h1 className="text-xl font-bold" style={{ color: '#1B2B5E' }}>Jejak Audit — Kawalan Dalaman</h1>
        <p className="text-sm text-gray-500 mt-1">Log tidak boleh diubah: siapa, apa, bila, di mana, sebelum dan selepas</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Log Hari Ini', value: '247', color: '#1B2B5E' },
          { label: 'Tindakan Kritikal', value: '12', color: '#DC2626' },
          { label: 'Pengguna Aktif', value: '38', color: '#16A34A' },
          { label: 'Anomali Dikesan AI', value: '3', color: '#7C3AED' },
        ].map(kpi => (
          <div key={kpi.label} className="sppt-card text-center">
            <div className="text-xs text-gray-500 mb-1">{kpi.label}</div>
            <div className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="sppt-card">
        <div className="flex items-center gap-3 mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Cari pengguna atau rekod..."
            className="flex-1 p-2 border border-gray-300 rounded text-sm" />
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded text-sm">
            {['Semua', 'APPROVE', 'REJECT', 'UPDATE', 'DISBURSE', 'VIEW', 'DELETE'].map(a => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <button className="px-3 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: '#1B2B5E' }}>
            📥 Eksport Log
          </button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800 text-white">
              {['#', 'Pengguna', 'Peranan', 'Tindakan', 'Modul', 'Rekod', 'Sebelum', 'Selepas', 'IP', 'Masa'].map(h => (
                <th key={h} className="p-2 text-left text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(log => (
              <tr key={log.id} className="border-b hover:bg-gray-50">
                <td className="p-2 text-gray-400 text-xs">{log.id}</td>
                <td className="p-2 font-semibold text-xs">{log.user}</td>
                <td className="p-2 text-xs text-gray-500">{log.role}</td>
                <td className="p-2">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${ACTION_COLORS[log.action]}`}>{log.action}</span>
                </td>
                <td className="p-2 text-xs">{log.module}</td>
                <td className="p-2 text-xs font-mono text-blue-600">{log.record}</td>
                <td className="p-2 text-xs text-gray-500">{log.before}</td>
                <td className="p-2 text-xs font-semibold">{log.after}</td>
                <td className="p-2 text-xs font-mono text-gray-400">{log.ip}</td>
                <td className="p-2 text-xs text-gray-400">{log.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sppt-card bg-purple-50 border border-purple-200">
        <div className="flex items-start gap-3">
          <span className="text-purple-600 text-xl">🤖</span>
          <div>
            <div className="font-bold text-purple-800 text-sm flex items-center gap-2">
              Pengesanan Anomali AI
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">✨ AI</span>
            </div>
            <p className="text-xs text-purple-700 mt-1">
              3 corak akses luar biasa dikesan: (1) Log masuk dari IP baru pada 3:24 AM, (2) 47 rekod dilihat dalam 5 minit oleh satu pengguna, (3) Percubaan akses ke modul pentadbiran oleh peranan yang tidak dibenarkan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
