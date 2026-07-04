import { CheckCircle, Clock, MinusCircle, AlertTriangle, Send } from 'lucide-react';

const application = {
  id: 'SPPT-2026-07-00092',
  name: 'Zulkifli Omar',
  amount: 45000,
  scheme: 'TEKUN Usahawan',
};

const matrix = [
  { level: 1, role: 'Pegawai Kewangan', min: 'RM 0', max: 'RM 10,000', status: 'LULUS', detail: 'Ahmad Zulhilmi, 03/07 09:00', active: false },
  { level: 2, role: 'Pengurus Cawangan', min: 'RM 10,001', max: 'RM 30,000', status: 'LULUS', detail: 'Puan Rohani, 03/07 10:30', active: false },
  { level: 3, role: 'Jawatankuasa Kredit', min: 'RM 30,001', max: 'RM 100,000', status: 'MENUNGGU', detail: 'Dihantar 03/07 11:00', active: true },
  { level: 4, role: 'Lembaga Pengarah', min: 'RM 100,001', max: 'Tiada Had', status: 'TIDAK BERKAITAN', detail: '', active: false },
];

const escalationSteps = [
  { step: 1, label: 'Pegawai Kewangan mengesahkan', time: '03/07 09:00', done: true, active: false },
  { step: 2, label: 'Pengurus Cawangan meluluskan', time: '03/07 10:30', done: true, active: false },
  { step: 3, label: 'Jawatankuasa Kredit', time: 'Dijangka: 04/07 sebelum 5PM', done: false, active: true },
  { step: 4, label: 'Pengeluaran Dana - Menunggu', time: '', done: false, active: false },
];

const committee = [
  { name: 'Encik Hafiz', role: 'Pengerusi', approved: true },
  { name: 'Puan Salmah', role: 'Ahli', approved: false },
  { name: 'Encik Rauf', role: 'Ahli', approved: false },
];

const statusCell = (status: string, detail: string) => {
  if (status === 'LULUS') return (
    <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
      <div><p className="text-sm font-bold text-green-700">LULUS</p><p className="text-xs text-green-600">({detail})</p></div>
    </div>
  );
  if (status === 'MENUNGGU') return (
    <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-300 rounded-lg">
      <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
      <div><p className="text-sm font-bold text-blue-700">MENUNGGU KELULUSAN</p><p className="text-xs text-blue-600">- {detail}</p></div>
    </div>
  );
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
      <MinusCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
      <p className="text-sm font-semibold text-gray-400">TIDAK BERKAITAN</p>
    </div>
  );
};

export default function AuthorityMatrix() {
  const approvedCount = committee.filter(c => c.approved).length;
  const pct = Math.round((approvedCount / committee.length) * 100);

  return (
    <div className="p-6 bg-gray-50 min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="bg-orange-500 text-white rounded-xl px-5 py-3 mb-6 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-semibold"><strong>PERHATIAN:</strong> Jumlah RM {application.amount.toLocaleString()} melebihi had kuasa Pengurus Cawangan (RM 30,000). Pengesahan Jawatankuasa Kredit diperlukan.</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <h2 className="text-base font-bold text-gray-800 mb-4">Maklumat Permohonan</h2>
        <div className="grid grid-cols-4 gap-6">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-lg">📄</div><div><p className="text-xs text-gray-500">No. Permohonan</p><p className="font-bold text-gray-900 text-sm">{application.id}</p></div></div>
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-lg">👤</div><div><p className="text-xs text-gray-500">Pemohon</p><p className="font-bold text-gray-900 text-sm">{application.name}</p></div></div>
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600 text-lg">$</div><div><p className="text-xs text-gray-500">Jumlah Permohonan</p><p className="font-bold text-red-600 text-base">RM {application.amount.toLocaleString()}</p></div></div>
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-lg">💼</div><div><p className="text-xs text-gray-500">Skim / Produk</p><p className="font-bold text-gray-900 text-sm">{application.scheme}</p></div></div>
        </div>
      </div>
      <div className="flex gap-6">
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 text-sm">🛡</div>
              <h2 className="text-base font-bold text-blue-700">Matriks Had Kuasa Pengeluaran Dana</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Peringkat Kelulusan</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Peranan</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Had Minimum (RM)</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Had Maksimum (RM)</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {matrix.map(row => (
                  <tr key={row.level} className={`${row.active ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className="px-5 py-4"><div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${row.status === 'LULUS' ? 'bg-green-500 text-white' : row.active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{row.level}</div></td>
                    <td className={`px-5 py-4 font-semibold ${row.active ? 'text-blue-700' : 'text-gray-700'}`}>{row.role}</td>
                    <td className={`px-5 py-4 ${row.active ? 'text-blue-700 font-bold' : 'text-gray-600'}`}>{row.min}</td>
                    <td className={`px-5 py-4 ${row.active ? 'text-blue-700 font-bold' : 'text-gray-600'}`}>{row.max}</td>
                    <td className="px-5 py-4">{statusCell(row.status, row.detail)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">AI</div>
            <p className="text-sm text-indigo-800">Sistem AI telah menghalang pengeluaran secara automatik kerana had kuasa tidak mencukupi. Permohonan telah dihantar ke Jawatankuasa Kredit.</p>
          </div>
        </div>
        <div className="w-80 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4"><span className="text-base">🔄</span><h3 className="font-bold text-gray-800 text-sm">Jejak Eskalasi</h3></div>
            <div className="space-y-4">
              {escalationSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${step.done ? 'bg-green-500 text-white' : step.active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{step.done ? '✓' : step.step}</div>
                    {i < escalationSteps.length - 1 && <div className={`w-0.5 h-6 mt-1 ${step.done ? 'bg-green-400' : 'bg-gray-200'}`}></div>}
                  </div>
                  <div className="pt-1">
                    <p className={`text-sm font-semibold ${step.active ? 'text-blue-700' : step.done ? 'text-gray-700' : 'text-gray-400'}`}>{step.label}</p>
                    {step.time && <p className={`text-xs mt-0.5 ${step.active ? 'text-blue-500 font-semibold' : 'text-gray-500'}`}>{step.time}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4"><span className="text-base">👥</span><h3 className="font-bold text-gray-800 text-sm">Kelulusan Jawatankuasa Kredit</h3></div>
            <div className="flex justify-between mb-4">
              <div><p className="text-xs text-gray-500 mb-1">Ahli Jawatankuasa</p>
                <div className="space-y-3">
                  {committee.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${c.approved ? 'bg-green-500' : 'bg-gray-200'}`}>{c.approved && <span className="text-white text-xs">✓</span>}</div>
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">👤</div>
                      <span className="text-sm text-gray-700">{c.name}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${c.role === 'Pengerusi' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{c.role}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-right"><p className="text-xs text-gray-500 mb-1">Status Kelulusan</p><p className="text-2xl font-bold text-gray-900">{approvedCount} / {committee.length}</p><p className="text-xs text-gray-500">telah meluluskan</p></div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="font-semibold text-gray-600">Kemajuan Undian</span><span className="font-bold text-gray-700">{pct}%</span></div>
              <div className="w-full bg-gray-100 rounded-full h-2.5"><div className="h-2.5 rounded-full bg-green-500" style={{ width: `${pct}%` }}></div></div>
            </div>
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
              <Clock className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-orange-700"><strong>SLA:</strong> Kelulusan diperlukan dalam 24 jam.<br /><strong>Masa berbaki: 18 jam 30 minit</strong></p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Tindakan Eskalasi</p>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors">
              <Send className="w-4 h-4" /> Hantar Peringatan ke Jawatankuasa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
