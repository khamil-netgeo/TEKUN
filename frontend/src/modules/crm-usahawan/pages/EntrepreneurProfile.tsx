import { useState } from 'react';
import api from '@/services/api';

const ENTREPRENEURS = [
  { id: 'USH-001', name: 'Ahmad Bin Mohd Ali', ic: '850101-14-1234', skim: 'TEKUN Usahawan', amount: 50000, status: 'Lancar', score: 82, sector: 'Makanan & Minuman', branch: 'KL Sentral' },
  { id: 'USH-002', name: 'Siti Noraini Binti Hassan', ic: '870512-03-5678', skim: 'TEKUN Wanita', amount: 30000, status: 'Perhatian Khusus', score: 61, sector: 'Fesyen', branch: 'Shah Alam' },
  { id: 'USH-003', name: 'Tan Wei Ming', ic: '900305-14-5678', skim: 'TEKUN Usahawan', amount: 75000, status: 'Tidak Lancar', score: 38, sector: 'Teknologi', branch: 'Johor Bahru' },
];

const STATUS_COLORS: Record<string, string> = {
  'Lancar': 'bg-green-100 text-green-700',
  'Perhatian Khusus': 'bg-yellow-100 text-yellow-700',
  'Tidak Lancar': 'bg-red-100 text-red-700',
};

export default function EntrepreneurProfile() {
  const [selected, setSelected] = useState(ENTREPRENEURS[0]);
  const [search, setSearch] = useState('');

  const filtered = ENTREPRENEURS.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.id.toLowerCase().includes(search.toLowerCase())
  );

  const scoreColor = selected.score >= 70 ? '#16A34A' : selected.score >= 50 ? '#F59E0B' : '#DC2626';

  return (
    <div className="space-y-4">
      <div className="sppt-card">
        <h1 className="text-xl font-bold" style={{ color: '#1B2B5E' }}>Profil Usahawan — CRM 360°</h1>
        <p className="text-sm text-gray-500 mt-1">Paparan holistik profil usahawan, rekod pembiayaan dan KPI perniagaan</p>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Left: List */}
        <div className="col-span-4 sppt-card">
          <div className="mb-3">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Cari usahawan..."
              className="w-full p-2 border border-gray-300 rounded text-sm" />
          </div>
          <div className="space-y-2">
            {filtered.map(e => (
              <div key={e.id} onClick={() => setSelected(e)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${selected.id === e.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm">{e.name}</div>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_COLORS[e.status]}`}>{e.status}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{e.id} • {e.skim}</div>
                <div className="text-xs text-gray-500">{e.sector} • {e.branch}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Profile Detail */}
        <div className="col-span-8 space-y-4">
          {/* Header */}
          <div className="sppt-card">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
                style={{ background: '#1B2B5E' }}>
                {selected.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold" style={{ color: '#1B2B5E' }}>{selected.name}</h2>
                <div className="text-sm text-gray-500">{selected.ic} • {selected.skim} • {selected.branch}</div>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
                  <span className="text-xs text-gray-500">Sektor: {selected.sector}</span>
                  <span className="text-xs text-gray-500">Jumlah: RM {selected.amount.toLocaleString()}</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">Skor Kesihatan AI</div>
                <div className="text-3xl font-bold" style={{ color: scoreColor }}>{selected.score}</div>
                <div className="text-xs" style={{ color: scoreColor }}>{selected.score >= 70 ? 'Baik' : selected.score >= 50 ? 'Sederhana' : 'Kritikal'}</div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold mt-1">
                  ✨ AI
                </span>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Jumlah Pembiayaan', value: `RM ${selected.amount.toLocaleString()}`, color: '#1B2B5E' },
              { label: 'Baki Semasa', value: `RM ${Math.round(selected.amount * 0.6).toLocaleString()}`, color: '#E65100' },
              { label: 'Ansuran Bulanan', value: `RM ${Math.round(selected.amount / 60).toLocaleString()}`, color: '#16A34A' },
              { label: 'Hari Tertunggak', value: selected.status === 'Lancar' ? '0 hari' : selected.status === 'Perhatian Khusus' ? '25 hari' : '65 hari', color: selected.status === 'Lancar' ? '#16A34A' : '#DC2626' },
            ].map(kpi => (
              <div key={kpi.label} className="sppt-card text-center">
                <div className="text-xs text-gray-500 mb-1">{kpi.label}</div>
                <div className="text-lg font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Business KPIs */}
          <div className="sppt-card">
            <h3 className="font-bold text-sm mb-3" style={{ color: '#1B2B5E' }}>KPI Perniagaan</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Pendapatan Bulanan', value: 'RM 12,500', trend: '+8%', up: true },
                { label: 'Pekerja', value: '4 orang', trend: '+1', up: true },
                { label: 'Jualan Bulanan', value: 'RM 28,000', trend: '-3%', up: false },
              ].map(kpi => (
                <div key={kpi.label} className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500">{kpi.label}</div>
                  <div className="text-base font-bold mt-1">{kpi.value}</div>
                  <div className={`text-xs font-semibold ${kpi.up ? 'text-green-600' : 'text-red-600'}`}>
                    {kpi.up ? '↑' : '↓'} {kpi.trend} vs bulan lalu
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insight */}
          <div className="sppt-card bg-purple-50 border border-purple-200">
            <div className="flex items-start gap-3">
              <span className="text-purple-600 text-2xl">🤖</span>
              <div>
                <div className="font-bold text-purple-800 text-sm flex items-center gap-2">
                  AI Insight
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">✨ AI</span>
                </div>
                <p className="text-sm text-purple-700 mt-1">
                  {selected.score >= 70
                    ? 'Usahawan ini menunjukkan prestasi kewangan yang baik. Risiko NPL dalam 90 hari: 12%. Cadangan: Tawarkan pembiayaan tambahan.'
                    : selected.score >= 50
                    ? 'Terdapat tanda-tanda tekanan kewangan. Risiko NPL dalam 90 hari: 38%. Cadangan: Jadualkan lawatan lapangan dalam 7 hari.'
                    : 'Usahawan berisiko tinggi. Risiko NPL dalam 90 hari: 78%. Cadangan: Mulakan proses kutipan segera dan pertimbangkan restrukturisasi.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
