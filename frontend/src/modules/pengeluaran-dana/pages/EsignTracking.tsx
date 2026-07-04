import { CheckCircle, Clock, AlertTriangle, Users, Bell, RefreshCw } from 'lucide-react';

const queue = [
  { no: 1, id: 'SPPT-00089', name: 'Siti Nurhaliza', sent: '03/07', deadline: '10/07', status: 'DITANDATANGANI', daysLeft: null, reminder: 'Selesai' },
  { no: 2, id: 'SPPT-00091', name: 'Noraini Hassan', sent: '02/07', deadline: '09/07', status: 'MENUNGGU', daysLeft: 6, reminder: 'Peringatan Hari-3 Dihantar' },
  { no: 3, id: 'SPPT-00093', name: 'Haslinda', sent: '01/07', deadline: '08/07', status: 'MENUNGGU', daysLeft: 5, reminder: 'Peringatan Hari-6 Dihantar' },
  { no: 4, id: 'SPPT-00095', name: 'Sharifah', sent: '25/06', deadline: '02/07', status: 'TAMAT TEMPOH', daysLeft: 0, reminder: 'Eskalasi Automatik' },
  { no: 5, id: 'SPPT-00096', name: 'Muhammad Rizal', sent: '26/06', deadline: '03/07', status: 'TAMAT TEMPOH', daysLeft: 0, reminder: 'Eskalasi Automatik' },
  { no: 6, id: 'SPPT-00097', name: 'Zarina Binti Ali', sent: '27/06', deadline: '04/07', status: 'MENUNGGU', daysLeft: 1, reminder: 'Peringatan Hari-6 Dihantar' },
  { no: 7, id: 'SPPT-00098', name: 'Ahmad Faizal', sent: '28/06', deadline: '05/07', status: 'MENUNGGU', daysLeft: 2, reminder: 'Peringatan Hari-3 Dihantar' },
  { no: 8, id: 'SPPT-00099', name: 'Rohani Abdul Rahman', sent: '29/06', deadline: '06/07', status: 'MENUNGGU', daysLeft: 3, reminder: 'Peringatan Hari-3 Dihantar' },
];

const statusBadge = (status: string) => {
  if (status === 'DITANDATANGANI') return <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">{status} 03/07 14:23</span>;
  if (status === 'TAMAT TEMPOH') return <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700">{status}</span>;
  return <span className="px-2 py-1 rounded text-xs font-semibold bg-orange-100 text-orange-700">{status}</span>;
};

const reminderBadge = (reminder: string) => {
  if (reminder === 'Selesai') return <span className="flex items-center gap-1 text-green-600 text-xs font-semibold"><CheckCircle className="w-3 h-3" /> Selesai</span>;
  if (reminder === 'Eskalasi Automatik') return <span className="flex items-center gap-1 text-red-600 text-xs font-semibold"><AlertTriangle className="w-3 h-3" /> Eskalasi Automatik</span>;
  return <span className="flex items-center gap-1 text-orange-600 text-xs font-semibold"><Bell className="w-3 h-3" /> {reminder}</span>;
};

export default function EsignTracking() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button className="text-gray-400 hover:text-gray-600">←</button>
          <h1 className="text-2xl font-bold text-gray-900">Penjejakan e-Tandatangan - Surat Tawaran</h1>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">AI</div>
          <span className="text-sm text-blue-700 font-medium">Peringatan automatik dihantar oleh AI</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle className="w-6 h-6 text-green-600" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Ditandatangani</p><p className="text-3xl font-bold text-green-600">16</p></div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center"><Clock className="w-6 h-6 text-orange-500" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Menunggu</p><p className="text-3xl font-bold text-orange-500">7</p></div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tamat Tempoh</p><p className="text-3xl font-bold text-red-600">2</p></div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center"><Users className="w-6 h-6 text-blue-600" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Jumlah Aktif</p><p className="text-3xl font-bold text-blue-600">25</p></div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Queue Table */}
        <div className="flex-1">
          <h2 className="text-base font-bold text-gray-800 mb-3">Senarai e-Tandatangan (Queue)</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 w-8">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">No Permohonan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Nama Pemohon</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Tarikh Hantar</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Tarikh Akhir</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Hari Berbaki</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Peringatan AI</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {queue.map(q => (
                  <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 text-xs">{q.no}</td>
                    <td className="px-4 py-3 text-blue-600 font-medium cursor-pointer hover:underline">{q.id}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{q.name}</td>
                    <td className="px-4 py-3 text-gray-600">{q.sent}</td>
                    <td className="px-4 py-3 text-gray-600">{q.deadline}</td>
                    <td className="px-4 py-3">{statusBadge(q.status)}</td>
                    <td className="px-4 py-3 text-gray-700 font-semibold">{q.daysLeft !== null ? `${q.daysLeft} hari` : '-'}</td>
                    <td className="px-4 py-3">{reminderBadge(q.reminder)}</td>
                    <td className="px-4 py-3">
                      {q.status === 'DITANDATANGANI' ? (
                        <button className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">👁 View</button>
                      ) : q.status === 'TAMAT TEMPOH' ? (
                        <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-500 hover:bg-red-600"><RefreshCw className="w-3 h-3" /> Jana Semula</button>
                      ) : (
                        <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700"><Bell className="w-3 h-3" /> Hantar Semula</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
              <span>Memaparkan 1 hingga 8 daripada 25 rekod</span>
              <div className="flex items-center gap-2">
                <select className="border border-gray-200 rounded px-2 py-1 text-xs">
                  <option>10</option><option>25</option><option>50</option>
                </select>
                <button className="px-2 py-1 rounded border border-gray-200 text-xs hover:bg-gray-50">‹</button>
                <button className="px-2 py-1 rounded bg-blue-600 text-white text-xs">1</button>
                <button className="px-2 py-1 rounded border border-gray-200 text-xs hover:bg-gray-50">2</button>
                <button className="px-2 py-1 rounded border border-gray-200 text-xs hover:bg-gray-50">3</button>
                <button className="px-2 py-1 rounded border border-gray-200 text-xs hover:bg-gray-50">›</button>
              </div>
            </div>
          </div>
        </div>

        {/* AI Reminder Engine Panel */}
        <div className="w-72 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm">Enjin Peringatan AI</h3>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Jadual Peringatan Automatik</p>
            <div className="space-y-3">
              {[
                { day: 'Day 0', text: 'Surat Tawaran Dihantar (E-mel + SMS + Portal)' },
                { day: 'Day 3', text: 'Peringatan Pertama (SMS + E-mel) - Auto' },
                { day: 'Day 6', text: 'Peringatan Kedua (SMS + E-mel + Panggilan) - Auto' },
                { day: 'Day 8', text: 'Notis Akhir (Berdaftar + SMS) - Auto' },
                { day: 'Day 10', text: 'Tamat Tempoh - Eskalasi ke Pengurus - Auto' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-indigo-500 mt-0.5 flex-shrink-0"></div>
                    {i < 4 && <div className="w-0.5 h-6 bg-indigo-200 mt-1"></div>}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-indigo-600">{item.day}</span>
                    <p className="text-xs text-gray-600 mt-0.5">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Integrasi e-Tandatangan</p>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">☁</div>
                <span className="text-sm font-semibold text-gray-700">SigningCloud</span>
              </div>
              <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">TERHUBUNG ✓</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Kadar tandatangan dalam 24 jam</p>
                <p className="text-2xl font-bold text-blue-600">67%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Kadar tandatangan keseluruhan</p>
                <p className="text-2xl font-bold text-green-600">89%</p>
              </div>
            </div>
            <div className="bg-indigo-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-indigo-700 mb-1">AI Prediction</p>
              <p className="text-xs text-indigo-600">Dijangka 5 dari 7 pemohon akan menandatangani dalam 3 hari akan datang.</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-semibold text-gray-700 mb-3">Tindakan Pukal untuk Semua Yang Menunggu (7)</p>
            <p className="text-xs text-gray-500 mb-3">Hantar peringatan kepada semua pemohon yang masih menunggu.</p>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">
              <Bell className="w-4 h-4" /> Hantar Peringatan Batch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
