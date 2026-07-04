import { AlertTriangle, Clock, CheckCircle, TrendingUp, Bell, User } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const files = [
  { id: 'SPPT-00078', name: 'Mohd Hafiz', officer: 'Azri Bin Hamid', received: '01/07/2026 09:00', elapsed: '3h 12m', sla: '>2 hari', status: 'KRITIKAL', action: 'Eskalasi ke Pengurus' },
  { id: 'SPPT-00079', name: 'Siti Rahimah', officer: 'Nurul Ain', received: '01/07/2026 11:30', elapsed: '2h 45m', sla: '>2 hari', status: 'KRITIKAL', action: 'Eskalasi ke Pengurus' },
  { id: 'SPPT-00080', name: 'Razif Ismail', officer: 'Azri Bin Hamid', received: '02/07/2026 08:00', elapsed: '1h 55m', sla: '1-2 hari', status: 'AMARAN', action: 'Hantar Peringatan' },
  { id: 'SPPT-00081', name: 'Faridah Bt Yusof', officer: 'Khairul Anwar', received: '02/07/2026 10:15', elapsed: '1h 20m', sla: '1-2 hari', status: 'AMARAN', action: 'Hantar Peringatan' },
  { id: 'SPPT-00082', name: 'Aminah Binti Daud', officer: 'Nurul Ain', received: '02/07/2026 14:00', elapsed: '45m', sla: '<1 hari', status: 'NORMAL', action: 'Tiada' },
  { id: 'SPPT-00083', name: 'Zulkifli Bakar', officer: 'Khairul Anwar', received: '03/07/2026 08:30', elapsed: '30m', sla: '<1 hari', status: 'NORMAL', action: 'Tiada' },
  { id: 'SPPT-00084', name: 'Norliza Hamdan', officer: 'Azri Bin Hamid', received: '03/07/2026 09:00', elapsed: '25m', sla: '<1 hari', status: 'NORMAL', action: 'Tiada' },
];

const agingData = [
  { label: '<1 Hari', count: 23, color: '#16A34A' },
  { label: '1-2 Hari', count: 12, color: '#F97316' },
  { label: '>2 Hari', count: 7, color: '#DC2626' },
];

const escalationLog = [
  { time: '03/07 09:15', action: 'Fail SPPT-00078 dieskalasi ke Pengurus Cawangan', type: 'escalate' },
  { time: '03/07 09:15', action: 'Fail SPPT-00079 dieskalasi ke Pengurus Cawangan', type: 'escalate' },
  { time: '03/07 08:30', action: 'Peringatan dihantar kepada Azri Bin Hamid (SPPT-00080)', type: 'reminder' },
  { time: '03/07 08:30', action: 'Peringatan dihantar kepada Nurul Ain (SPPT-00081)', type: 'reminder' },
  { time: '02/07 17:00', action: 'Fail SPPT-00075 selesai dalam masa SLA (1h 45m)', type: 'complete' },
];

const statusBadge = (status: string) => {
  if (status === 'KRITIKAL') return <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700">KRITIKAL</span>;
  if (status === 'AMARAN') return <span className="px-2 py-1 rounded text-xs font-semibold bg-orange-100 text-orange-700">AMARAN</span>;
  return <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">NORMAL</span>;
};

export default function AgingEscalation() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Aging & Eskalasi Fail</h1>
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-700 font-semibold">7 fail melebihi SLA 2 hari bekerja</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-red-500 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Melebihi SLA</p><p className="text-3xl font-bold text-red-600">7</p><p className="text-xs text-gray-500">fail kritikal</p></div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-orange-400 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center"><Clock className="w-6 h-6 text-orange-500" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Hampir SLA</p><p className="text-3xl font-bold text-orange-500">12</p><p className="text-xs text-gray-500">1-2 hari</p></div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-green-500 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle className="w-6 h-6 text-green-600" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Dalam SLA</p><p className="text-3xl font-bold text-green-600">23</p><p className="text-xs text-gray-500">fail</p></div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-blue-500 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-blue-600" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Jumlah Aktif</p><p className="text-3xl font-bold text-blue-600">42</p><p className="text-xs text-gray-500">fail</p></div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main Table */}
        <div className="flex-1">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold">AI</div>
            <p className="text-sm text-red-800 font-medium">AI mengesan 7 fail melebihi SLA. Eskalasi automatik telah dihantar kepada Pengurus Cawangan.</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">No Fail</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Nama Pemohon</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Pegawai</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Diterima</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Masa Berlalu</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status SLA</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Tindakan AI</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Manual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {files.map(f => (
                  <tr key={f.id} className={`hover:bg-gray-50 transition-colors ${f.status === 'KRITIKAL' ? 'bg-red-50' : f.status === 'AMARAN' ? 'bg-orange-50' : ''}`}>
                    <td className="px-4 py-3 text-blue-600 font-medium cursor-pointer hover:underline">{f.id}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{f.name}</td>
                    <td className="px-4 py-3 text-gray-600 flex items-center gap-1"><User className="w-3 h-3" /> {f.officer}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{f.received}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{f.elapsed}</td>
                    <td className="px-4 py-3">{statusBadge(f.status)}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{f.action}</td>
                    <td className="px-4 py-3">
                      {f.status === 'KRITIKAL' ? (
                        <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-500 hover:bg-red-600">Eskalasi</button>
                      ) : f.status === 'AMARAN' ? (
                        <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600">Peringatan</button>
                      ) : (
                        <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 border border-gray-200">-</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Escalation Log */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 text-sm mb-3">Log Eskalasi Automatik</h3>
            <div className="space-y-3">
              {escalationLog.map((log, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${log.type === 'escalate' ? 'bg-red-500' : log.type === 'reminder' ? 'bg-orange-400' : 'bg-green-500'}`}></div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500">{log.time}</span>
                    <p className="text-xs text-gray-700">{log.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-64 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 text-sm mb-4">Taburan Aging Fail</h3>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={agingData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {agingData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 text-sm mb-3">Beban Kerja Pegawai</h3>
            <div className="space-y-3">
              {[
                { name: 'Azri Bin Hamid', count: 18, pct: 75 },
                { name: 'Nurul Ain', count: 14, pct: 58 },
                { name: 'Khairul Anwar', count: 10, pct: 42 },
              ].map((o, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-700 font-medium">{o.name}</span>
                    <span className="text-gray-500">{o.count} fail</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${o.pct > 70 ? 'bg-red-500' : o.pct > 50 ? 'bg-orange-400' : 'bg-green-500'}`} style={{ width: `${o.pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">AI</div>
              <span className="text-xs font-bold text-indigo-700">Cadangan AI</span>
            </div>
            <p className="text-xs text-indigo-700">Azri Bin Hamid mempunyai beban kerja tertinggi. AI mencadangkan pengagihan semula 4 fail kepada Khairul Anwar.</p>
            <button className="mt-3 w-full flex items-center justify-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700">
              <Bell className="w-3 h-3" /> Agih Semula Automatik
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
