const BRANCHES = [
  { id: 'CW-001', name: 'Cawangan KL Sentral', state: 'WP Kuala Lumpur', staff: 12, applications: 145, collection: 94, npl: 1.2 },
  { id: 'CW-002', name: 'Cawangan Shah Alam', state: 'Selangor', staff: 9, applications: 98, collection: 88, npl: 2.1 },
  { id: 'CW-003', name: 'Cawangan Johor Bahru', state: 'Johor', staff: 11, applications: 112, collection: 92, npl: 1.8 },
  { id: 'CW-004', name: 'Cawangan Pulau Pinang', state: 'Pulau Pinang', staff: 8, applications: 87, collection: 90, npl: 1.5 },
];

export default function BranchManagement() {
  return (
    <div className="space-y-4">
      <div className="sppt-card flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1B2B5E' }}>Pengurusan Cawangan</h1>
          <p className="text-sm text-gray-500 mt-1">Direktori cawangan, kakitangan dan prestasi</p>
        </div>
        <button className="px-4 py-2 rounded-lg text-white font-semibold text-sm" style={{ background: '#1B2B5E' }}>
          + Tambah Cawangan
        </button>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Jumlah Cawangan', value: '48', color: '#1B2B5E' },
          { label: 'Jumlah Kakitangan', value: '312', color: '#16A34A' },
          { label: 'Kadar Kutipan Purata', value: '89.4%', color: '#E65100' },
          { label: 'Nisbah NPL Purata', value: '1.8%', color: '#DC2626' },
        ].map(kpi => (
          <div key={kpi.label} className="sppt-card text-center">
            <div className="text-xs text-gray-500 mb-1">{kpi.label}</div>
            <div className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>
      <div className="sppt-card">
        <h2 className="font-bold text-sm mb-3" style={{ color: '#1B2B5E' }}>Senarai Cawangan</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800 text-white">
              {['ID', 'Nama Cawangan', 'Negeri', 'Kakitangan', 'Permohonan Bulan Ini', 'Kadar Kutipan', 'Nisbah NPL', 'Tindakan'].map(h => (
                <th key={h} className="p-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BRANCHES.map(b => (
              <tr key={b.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-mono text-xs text-blue-600">{b.id}</td>
                <td className="p-3 font-semibold">{b.name}</td>
                <td className="p-3 text-xs text-gray-500">{b.state}</td>
                <td className="p-3">{b.staff} orang</td>
                <td className="p-3">{b.applications}</td>
                <td className="p-3">
                  <span className={`font-bold ${b.collection >= 90 ? 'text-green-600' : b.collection >= 85 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {b.collection}%
                  </span>
                </td>
                <td className="p-3">
                  <span className={`font-bold ${b.npl <= 1.5 ? 'text-green-600' : b.npl <= 2.0 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {b.npl}%
                  </span>
                </td>
                <td className="p-3">
                  <button className="px-2 py-1 rounded border border-gray-300 text-xs hover:bg-gray-50">Lihat</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
