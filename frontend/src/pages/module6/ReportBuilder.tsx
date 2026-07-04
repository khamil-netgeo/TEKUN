import { useState } from 'react';
import api from '@/services/api';

const FIELD_GROUPS = [
  {
    name: 'Pemohon', icon: '👤', fields: ['Nama', 'No IC', 'Jantina', 'Kaum', 'Negeri', 'Cawangan'],
  },
  {
    name: 'Pembiayaan', icon: '💰', fields: ['Jumlah', 'Skim', 'Tempoh', 'Kadar', 'Tarikh Lulus'],
  },
  {
    name: 'Bayaran', icon: '💳', fields: ['Ansuran', 'Status Bayaran', 'Hari Tunggak', 'NPL Status'],
  },
  {
    name: 'Perniagaan', icon: '🏢', fields: ['Jenis Perniagaan', 'Sektor', 'Pendapatan'],
  },
];

const PREVIEW_DATA = [
  { nama: 'Ahmad Bin Mohd Ali', no_ic: '850101-14-1234', skim: 'TEKUN Usahawan', jumlah: 50000.00, status: 'Tepat', kaum: 'Melayu' },
  { nama: 'Siti Noraini Binti Hassan', no_ic: '870512-03-5678', skim: 'TEKUN Wanita', jumlah: 30000.00, status: 'Tepat', kaum: 'Melayu' },
  { nama: 'Tan Wei Ming', no_ic: '900305-14-5678', skim: 'TEKUN Usahawan', jumlah: 75000.00, status: 'Lewat 15 hari', kaum: 'Cina' },
  { nama: 'Nur Aisyah Binti Abdullah', no_ic: '920721-11-6789', skim: 'TEKUN Wanita', jumlah: 20000.00, status: 'Tepat', kaum: 'Melayu' },
  { nama: 'Rajesh A/L Kumar', no_ic: '880915-10-4321', skim: 'TEKUN Usahawan', jumlah: 40000.00, status: 'Lewat 30 hari', kaum: 'India' },
];

const COLUMNS = ['Nama', 'No IC', 'Skim', 'Jumlah (RM)', 'Status Bayaran', 'Kaum'];

type Filter = { id: number; field: string; op: string; value: string };

export default function ReportBuilder() {
  const [filters, setFilters] = useState<Filter[]>([
    { id: 1, field: 'Negeri', op: '=', value: 'Selangor, Kuala Lumpur, Johor' },
    { id: 2, field: 'Tempoh', op: '=', value: 'Januari 2026 - Jun 2026' },
    { id: 3, field: 'Skim Pembiayaan', op: '=', value: 'TEKUN Usahawan, TEKUN Wanita' },
  ]);
  const [columns, setColumns] = useState(COLUMNS);
  const [groupBy, setGroupBy] = useState('Negeri');
  const [sortBy, setSortBy] = useState('Jumlah');
  const [sortDir, setSortDir] = useState('Tertinggi dahulu');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [scheduled, setScheduled] = useState(true);
  const [searchField, setSearchField] = useState('');

  const addFilter = () => {
    setFilters(f => [...f, { id: Date.now(), field: 'Negeri', op: '=', value: '' }]);
  };

  const removeFilter = (id: number) => {
    setFilters(f => f.filter(x => x.id !== id));
  };

  const removeColumn = (col: string) => {
    setColumns(c => c.filter(x => x !== col));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post('/reports/generate', { filters, columns, groupBy, sortBy, sortDir });
    } catch {}
    setGenerating(false);
    setGenerated(true);
    setTimeout(() => setGenerated(false), 3000);
  };

  const filteredFields = (fields: string[]) =>
    searchField ? fields.filter(f => f.toLowerCase().includes(searchField.toLowerCase())) : fields;

  return (
    <div className="space-y-4">
      <div className="sppt-card">
        <h1 className="text-xl font-bold" style={{ color: '#1B2B5E' }}>
          Penjana Laporan Ad-hoc - Bina Laporan Anda Sendiri
        </h1>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Left: Field Selector */}
        <div className="col-span-3 sppt-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm" style={{ color: '#1B2B5E' }}>Pemboleh Ubah Tersedia</h2>
            <span className="text-gray-400 cursor-pointer">ℹ️</span>
          </div>
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Cari pemboleh ubah..."
              value={searchField}
              onChange={e => setSearchField(e.target.value)}
              className="w-full p-2 pl-8 border border-gray-300 rounded text-sm"
            />
            <span className="absolute left-2 top-2.5 text-gray-400 text-sm">🔍</span>
          </div>
          <div className="space-y-3">
            {FIELD_GROUPS.map(group => (
              <div key={group.name}>
                <button className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 mb-1">
                  <span className="flex items-center gap-2">
                    <span>{group.icon}</span> {group.name}
                  </span>
                  <span>∨</span>
                </button>
                <div className="ml-4 space-y-1">
                  {filteredFields(group.fields).map(field => (
                    <div key={field}
                      draggable
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-blue-50 cursor-grab text-sm text-gray-600">
                      <span className="text-gray-300">⠿</span>
                      {field}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle: Filter + Columns + Generate */}
        <div className="col-span-5 space-y-4">
          {/* Filters */}
          <div className="sppt-card">
            <h2 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: '#1B2B5E' }}>
              🔽 Tapis (Filter)
            </h2>
            <div className="space-y-2">
              {filters.map((f, i) => (
                <div key={f.id} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <select value={f.field} onChange={e => setFilters(fs => fs.map(x => x.id === f.id ? { ...x, field: e.target.value } : x))}
                    className="flex-1 p-2 border border-gray-300 rounded text-sm">
                    <option>Negeri</option>
                    <option>Tempoh</option>
                    <option>Skim Pembiayaan</option>
                    <option>Status Bayaran</option>
                    <option>Kaum</option>
                  </select>
                  <select value={f.op} onChange={e => setFilters(fs => fs.map(x => x.id === f.id ? { ...x, op: e.target.value } : x))}
                    className="w-12 p-2 border border-gray-300 rounded text-sm">
                    <option>=</option>
                    <option>≠</option>
                    <option>&gt;</option>
                    <option>&lt;</option>
                  </select>
                  <input value={f.value} onChange={e => setFilters(fs => fs.map(x => x.id === f.id ? { ...x, value: e.target.value } : x))}
                    className="flex-[2] p-2 border border-gray-300 rounded text-sm" />
                  <button onClick={() => removeFilter(f.id)} className="text-gray-400 hover:text-red-500 text-lg">🗑</button>
                </div>
              ))}
            </div>
            <button onClick={addFilter} className="mt-3 flex items-center gap-2 text-blue-600 text-sm font-semibold hover:underline">
              ➕ Tambah Tapis
            </button>
          </div>

          {/* Columns */}
          <div className="sppt-card">
            <h2 className="font-bold text-sm mb-2" style={{ color: '#1B2B5E' }}>📋 Lajur Laporan</h2>
            <p className="text-xs text-gray-500 mb-3">Seret dan lepaskan pemboleh ubah ke sini untuk dijadikan lajur laporan.</p>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border-2 border-dashed border-gray-200 rounded-lg">
              {columns.map(col => (
                <span key={col} className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                  {col}
                  <button onClick={() => removeColumn(col)} className="hover:text-red-500">✕</button>
                </span>
              ))}
            </div>
          </div>

          {/* Group & Sort */}
          <div className="sppt-card">
            <h2 className="font-bold text-sm mb-3" style={{ color: '#1B2B5E' }}>↕️ Kumpulan & Isih</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Kumpulan mengikut</label>
                <select value={groupBy} onChange={e => setGroupBy(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm">
                  <option>Negeri</option>
                  <option>Cawangan</option>
                  <option>Skim</option>
                  <option>Kaum</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Isih mengikut</label>
                <div className="flex gap-1">
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded text-sm">
                    <option>Jumlah</option>
                    <option>Nama</option>
                    <option>Tarikh</option>
                  </select>
                  <select value={sortDir} onChange={e => setSortDir(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded text-sm">
                    <option>Tertinggi dahulu</option>
                    <option>Terendah dahulu</option>
                    <option>A-Z</option>
                    <option>Z-A</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button onClick={handleGenerate} disabled={generating}
            className="w-full py-4 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2"
            style={{ background: '#1B2B5E' }}>
            {generating ? '⏳ Menjana...' : generated ? '✅ Laporan Dijana!' : '📄 Jana Laporan'}
          </button>
        </div>

        {/* Right: Preview + Export */}
        <div className="col-span-4 space-y-4">
          <div className="sppt-card">
            <h2 className="font-bold text-sm mb-1" style={{ color: '#1B2B5E' }}>👁 Pratonton Laporan</h2>
            <p className="text-xs text-gray-500 mb-3">Memaparkan 5 rekod teratas.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    {['Nama', 'No IC', 'Skim', 'Jumlah (RM)', 'Status Bayaran', 'Kaum'].map(h => (
                      <th key={h} className="p-2 text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PREVIEW_DATA.map((row, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="p-2 whitespace-nowrap">{row.nama}</td>
                      <td className="p-2 font-mono">{row.no_ic}</td>
                      <td className="p-2">{row.skim}</td>
                      <td className="p-2 text-right">{row.jumlah.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</td>
                      <td className="p-2">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                          row.status === 'Tepat' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>{row.status}</span>
                      </td>
                      <td className="p-2">{row.kaum}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-xs text-gray-500 mt-2">Jumlah rekod: 1,248</div>
          </div>

          <div className="sppt-card">
            <h2 className="font-bold text-sm mb-3" style={{ color: '#1B2B5E' }}>📤 Eksport Laporan</h2>
            <div className="grid grid-cols-3 gap-2">
              <button className="flex items-center justify-center gap-1 p-2 rounded-lg border-2 border-green-500 text-green-700 text-xs font-semibold hover:bg-green-50">
                📊 Eksport Excel
              </button>
              <button className="flex items-center justify-center gap-1 p-2 rounded-lg border-2 border-red-500 text-red-700 text-xs font-semibold hover:bg-red-50">
                📄 Eksport PDF
              </button>
              <button className="flex items-center justify-center gap-1 p-2 rounded-lg border-2 border-blue-500 text-blue-700 text-xs font-semibold hover:bg-blue-50">
                📅 Jadualkan
              </button>
            </div>
          </div>

          <div className="sppt-card">
            <h2 className="font-bold text-sm mb-2" style={{ color: '#1B2B5E' }}>📅 Jadualkan Laporan</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={scheduled} onChange={e => setScheduled(e.target.checked)} />
              <span className="text-sm text-gray-600">Hantar ke e-mel setiap Isnin 8:00 AM</span>
            </label>
            <button className="mt-2 text-sm text-blue-600 hover:underline">Ubah Jadual</button>
          </div>

          <div className="sppt-card bg-purple-50 border border-purple-200">
            <div className="flex items-start gap-2">
              <span className="text-purple-600 text-xl">✨</span>
              <div>
                <div className="font-bold text-purple-800 text-sm">AI Mencadangkan</div>
                <div className="text-xs text-purple-700 mt-1">Tambah lajur DSR untuk analisis risiko yang lebih lengkap.</div>
                <button className="mt-2 px-3 py-1 rounded border border-purple-400 text-purple-700 text-xs font-semibold hover:bg-purple-100">
                  Tambah DSR
                </button>
                <div className="text-xs text-gray-400 mt-1">Cadangan dijana oleh AI. Sahkan sebelum digunakan. ℹ️</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
