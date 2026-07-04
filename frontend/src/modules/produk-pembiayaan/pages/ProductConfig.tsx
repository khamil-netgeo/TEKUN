import { useState } from 'react';

const SCHEMES = [
  { id: 'SKM-001', name: 'TEKUN Micro', max: 10000, rate: 4.0, tenure: 36, eligible: 'Warganegara Malaysia, 18-60 tahun', status: 'Aktif', color: '#1B2B5E' },
  { id: 'SKM-002', name: 'TEKUN Usahawan', max: 50000, rate: 4.0, tenure: 60, eligible: 'Warganegara Malaysia, 21-60 tahun, perniagaan berdaftar', status: 'Aktif', color: '#C62828' },
  { id: 'SKM-003', name: 'TEKUN Wanita', max: 30000, rate: 3.5, tenure: 60, eligible: 'Wanita warganegara Malaysia, 21-60 tahun', status: 'Aktif', color: '#880E4F' },
  { id: 'SKM-004', name: 'TEKUN Belia', max: 20000, rate: 3.5, tenure: 48, eligible: 'Warganegara Malaysia, 18-35 tahun', status: 'Aktif', color: '#2E7D32' },
];

export default function ProductConfig() {
  const [selected, setSelected] = useState(SCHEMES[0]);
  const [editing, setEditing] = useState(false);

  return (
    <div className="space-y-4">
      <div className="sppt-card flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1B2B5E' }}>Konfigurasi Produk Pembiayaan</h1>
          <p className="text-sm text-gray-500 mt-1">Urus skim pembiayaan, kadar keuntungan dan syarat kelayakan</p>
        </div>
        <button className="px-4 py-2 rounded-lg text-white font-semibold text-sm" style={{ background: '#1B2B5E' }}>
          + Tambah Skim Baharu
        </button>
      </div>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4 space-y-3">
          {SCHEMES.map(s => (
            <div key={s.id} onClick={() => { setSelected(s); setEditing(false); }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${selected.id === s.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white hover:bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: s.color }}>T</div>
                <div>
                  <div className="font-bold text-sm">{s.name}</div>
                  <div className="text-xs text-gray-500">Maks: RM {s.max.toLocaleString()} • {s.rate}% p.a.</div>
                </div>
                <span className="ml-auto px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700">{s.status}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="col-span-8 sppt-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base" style={{ color: '#1B2B5E' }}>{selected.name}</h2>
            <button onClick={() => setEditing(!editing)}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-blue-500 text-blue-600 hover:bg-blue-50">
              {editing ? 'Batal' : '✏️ Edit'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Had Pembiayaan Maksimum', value: `RM ${selected.max.toLocaleString()}`, key: 'max' },
              { label: 'Kadar Keuntungan (% p.a.)', value: `${selected.rate}%`, key: 'rate' },
              { label: 'Tempoh Maksimum (bulan)', value: `${selected.tenure} bulan`, key: 'tenure' },
              { label: 'Status', value: selected.status, key: 'status' },
            ].map(field => (
              <div key={field.key} className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">{field.label}</div>
                {editing ? (
                  <input defaultValue={field.value} className="w-full p-1 border border-gray-300 rounded text-sm font-semibold" />
                ) : (
                  <div className="font-semibold text-sm">{field.value}</div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Syarat Kelayakan</div>
            {editing ? (
              <textarea defaultValue={selected.eligible} className="w-full p-2 border border-gray-300 rounded text-sm" rows={2} />
            ) : (
              <div className="text-sm">{selected.eligible}</div>
            )}
          </div>
          {editing && (
            <div className="flex gap-2 mt-4">
              <button className="px-4 py-2 rounded-lg text-white font-semibold text-sm" style={{ background: '#16A34A' }}>
                Simpan Perubahan
              </button>
              <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold hover:bg-gray-50">
                Batal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
