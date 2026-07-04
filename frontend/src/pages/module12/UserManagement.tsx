import { useState } from 'react';

const USERS = [
  { id: 'USR-001', name: 'Hafiz Bin Ramli', email: 'kredit@tekun.gov.my', role: 'Pegawai Kredit', branch: 'KL Sentral', status: 'Aktif', lastLogin: '2026-07-04 09:45' },
  { id: 'USR-002', name: 'Aminah Bt Yusof', email: 'eksekutif@tekun.gov.my', role: 'Eksekutif', branch: 'HQ', status: 'Aktif', lastLogin: '2026-07-04 08:30' },
  { id: 'USR-003', name: 'Ahmad Faizal', email: 'kewangan@tekun.gov.my', role: 'Pegawai Kewangan', branch: 'Shah Alam', status: 'Aktif', lastLogin: '2026-07-03 17:22' },
  { id: 'USR-004', name: 'Noraini Bt Hassan', email: 'pengurus@tekun.gov.my', role: 'Pengurus Cawangan', branch: 'Johor Bahru', status: 'Aktif', lastLogin: '2026-07-04 07:55' },
  { id: 'USR-005', name: 'Zulkifli Bin Omar', email: 'zulkifli@tekun.gov.my', role: 'Pegawai Kredit', branch: 'Pulau Pinang', status: 'Tidak Aktif', lastLogin: '2026-06-28 14:10' },
];

const ROLES = ['Pegawai Kredit', 'Pegawai Kewangan', 'Pengurus Cawangan', 'Eksekutif', 'Pentadbir Sistem', 'Pemohon'];

const STATUS_COLORS: Record<string, string> = {
  'Aktif': 'bg-green-100 text-green-700',
  'Tidak Aktif': 'bg-gray-100 text-gray-500',
  'Digantung': 'bg-red-100 text-red-700',
};

export default function UserManagement() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('Semua');
  const [showForm, setShowForm] = useState(false);

  const filtered = USERS.filter(u =>
    (roleFilter === 'Semua' || u.role === roleFilter) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="sppt-card flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1B2B5E' }}>Pengurusan Pengguna</h1>
          <p className="text-sm text-gray-500 mt-1">Cipta, edit dan urus akaun pengguna dan peranan RBAC</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg text-white font-semibold text-sm"
          style={{ background: '#1B2B5E' }}>
          + Tambah Pengguna
        </button>
      </div>

      {showForm && (
        <div className="sppt-card">
          <h2 className="font-bold text-sm mb-3" style={{ color: '#1B2B5E' }}>Tambah Pengguna Baharu</h2>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs text-gray-500 block mb-1">Nama Penuh</label>
              <input type="text" className="w-full p-2 border border-gray-300 rounded text-sm" placeholder="Nama penuh..." /></div>
            <div><label className="text-xs text-gray-500 block mb-1">E-mel</label>
              <input type="email" className="w-full p-2 border border-gray-300 rounded text-sm" placeholder="nama@tekun.gov.my" /></div>
            <div><label className="text-xs text-gray-500 block mb-1">Peranan</label>
              <select className="w-full p-2 border border-gray-300 rounded text-sm">
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select></div>
            <div><label className="text-xs text-gray-500 block mb-1">Cawangan</label>
              <select className="w-full p-2 border border-gray-300 rounded text-sm">
                <option>KL Sentral</option><option>Shah Alam</option><option>Johor Bahru</option><option>HQ</option>
              </select></div>
            <div><label className="text-xs text-gray-500 block mb-1">Kata Laluan Sementara</label>
              <input type="password" className="w-full p-2 border border-gray-300 rounded text-sm" placeholder="Min. 8 aksara" /></div>
            <div className="flex items-end">
              <button className="w-full py-2 rounded-lg text-white font-semibold text-sm" style={{ background: '#16A34A' }}>
                Simpan Pengguna
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Jumlah Pengguna', value: '312', color: '#1B2B5E' },
          { label: 'Pengguna Aktif', value: '298', color: '#16A34A' },
          { label: 'Pengguna Tidak Aktif', value: '14', color: '#9CA3AF' },
          { label: 'Peranan', value: '6', color: '#7C3AED' },
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
            placeholder="🔍 Cari nama atau e-mel..."
            className="flex-1 p-2 border border-gray-300 rounded text-sm" />
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded text-sm">
            <option>Semua</option>
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800 text-white">
              {['ID', 'Nama', 'E-mel', 'Peranan', 'Cawangan', 'Status', 'Log Masuk Terakhir', 'Tindakan'].map(h => (
                <th key={h} className="p-3 text-left text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-mono text-xs text-blue-600">{u.id}</td>
                <td className="p-3 font-semibold text-sm">{u.name}</td>
                <td className="p-3 text-xs text-gray-500">{u.email}</td>
                <td className="p-3 text-xs">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">{u.role}</span>
                </td>
                <td className="p-3 text-xs">{u.branch}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_COLORS[u.status]}`}>{u.status}</span>
                </td>
                <td className="p-3 text-xs text-gray-400">{u.lastLogin}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <button className="px-2 py-1 rounded border border-gray-300 text-xs hover:bg-gray-50">Edit</button>
                    <button className="px-2 py-1 rounded border border-red-300 text-red-600 text-xs hover:bg-red-50">
                      {u.status === 'Aktif' ? 'Gantung' : 'Aktifkan'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
