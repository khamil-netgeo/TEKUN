import { useState } from 'react';
import api from '@/services/api';

const ACCOUNTS = [
  { no: 'SPPT-ACC-00234', name: 'Razif Bin Hamid', days: 15, amount: 763.89, level: 1, status: 'SMS Dihantar 01/07' },
  { no: 'SPPT-ACC-00456', name: 'Faridah Bt Yusof', days: 45, amount: 1527.78, level: 2, status: 'Surat Dihantar 28/06' },
  { no: 'SPPT-ACC-00678', name: 'Mohd Azri', days: 95, amount: 2291.67, level: 3, status: 'Notis Muktamad Dihantar' },
  { no: 'SPPT-ACC-00112', name: 'Siti Aisyah Bt Ismail', days: 30, amount: 982.50, level: 1, status: 'SMS Dihantar 29/06' },
  { no: 'SPPT-ACC-00321', name: 'Ahmad Faizal', days: 60, amount: 3450.00, level: 2, status: 'Surat Dihantar 30/06' },
  { no: 'SPPT-ACC-00567', name: 'Noraini Bt Hassan', days: 120, amount: 4125.80, level: 3, status: 'Notis Muktamad Dihantar' },
  { no: 'SPPT-ACC-00789', name: 'Zulkifli Bin Omar', days: 75, amount: 1875.20, level: 2, status: 'Surat Dihantar 29/06' },
  { no: 'SPPT-ACC-00901', name: 'Rosnah Bt Rahman', days: 20, amount: 654.32, level: 1, status: 'SMS Dihantar 30/06' },
];

const LEVEL_COLORS: Record<number, string> = { 1: '#F59E0B', 2: '#F97316', 3: '#DC2626' };
const LEVEL_LABELS: Record<number, string> = { 1: 'NOTIS 1', 2: 'NOTIS 2', 3: 'NOTIS 3' };

const PREVIEW_ACCOUNT = ACCOUNTS[1]; // Faridah Bt Yusof for preview

export default function DunningWorkflow() {
  const [selectedAccount, setSelectedAccount] = useState(PREVIEW_ACCOUNT);
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(2);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [cawangan, setCawangan] = useState('Semua Cawangan');
  const [kategori, setKategori] = useState('Semua Kategori');

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post('/npl/dunning/generate', { account_id: selectedAccount.no, level: activeTab });
    } catch {}
    setGenerating(false);
    setGenerated(true);
    setTimeout(() => setGenerated(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="sppt-card">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold" style={{ color: '#1B2B5E' }}>
            Automasi Notis Tuntutan - Pengurusan Kutipan AI
          </h1>
          <button onClick={handleGenerate} disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-semibold text-sm"
            style={{ background: '#1B2B5E' }}>
            {generating ? '⏳ Menjana...' : generated ? '✅ Dijana!' : '🤖 Jana Notis Automatik AI'}
          </button>
        </div>
        <div className="flex gap-4 mt-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Cawangan</label>
            <select value={cawangan} onChange={e => setCawangan(e.target.value)}
              className="p-2 border border-gray-300 rounded text-sm min-w-[180px]">
              <option>Semua Cawangan</option>
              <option>Kuala Lumpur</option>
              <option>Shah Alam</option>
              <option>Johor Bahru</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Kategori Tunggakan</label>
            <select value={kategori} onChange={e => setKategori(e.target.value)}
              className="p-2 border border-gray-300 rounded text-sm min-w-[180px]">
              <option>Semua Kategori</option>
              <option>1-30 hari</option>
              <option>31-90 hari</option>
              <option>90+ hari</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Bulan</label>
            <select className="p-2 border border-gray-300 rounded text-sm min-w-[140px]">
              <option>📅 Julai 2026</option>
              <option>Jun 2026</option>
              <option>Mei 2026</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Account List */}
        <div className="sppt-card">
          <h2 className="font-bold text-base mb-3" style={{ color: '#1B2B5E' }}>Senarai Akaun Untuk Notis</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="p-2 text-left w-6">#</th>
                  <th className="p-2 text-left">No Akaun</th>
                  <th className="p-2 text-left">Nama</th>
                  <th className="p-2 text-right">Hari</th>
                  <th className="p-2 text-right">Amaun</th>
                  <th className="p-2 text-center">Level</th>
                  <th className="p-2 text-center">Status AI</th>
                  <th className="p-2 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {ACCOUNTS.map((acc, i) => (
                  <tr key={acc.no}
                    onClick={() => { setSelectedAccount(acc); setActiveTab(acc.level as 1|2|3); }}
                    className={`border-b cursor-pointer ${selectedAccount.no === acc.no ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <td className="p-2 text-gray-400">{i + 1}</td>
                    <td className="p-2 text-blue-600 font-mono text-xs">{acc.no}</td>
                    <td className="p-2">{acc.name}</td>
                    <td className="p-2 text-right">{acc.days} hari</td>
                    <td className="p-2 text-right">RM {acc.amount.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</td>
                    <td className="p-2 text-center">
                      <span className="px-2 py-0.5 rounded text-xs font-bold text-white"
                        style={{ background: LEVEL_COLORS[acc.level] }}>
                        {LEVEL_LABELS[acc.level]}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <span className={`text-xs ${acc.level === 3 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                        {acc.status}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <button className="px-2 py-1 rounded border border-blue-300 text-blue-600 text-xs hover:bg-blue-50">
                        👁 View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
            <span>Memaparkan 1 hingga 8 daripada 124 rekod</span>
            <div className="flex gap-1">
              {['«','1','2','3','4','5','...','16','»'].map((p, i) => (
                <button key={i} className={`w-7 h-7 rounded text-xs ${p === '1' ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Notice Preview */}
        <div className="sppt-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base" style={{ color: '#1B2B5E' }}>Pratonton Notis Tuntutan (Dijana AI)</h2>
            <button className="flex items-center gap-1 px-3 py-1.5 rounded text-white text-xs font-semibold" style={{ background: '#16A34A' }}>
              ✨ Dijana Automatik
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {([1, 2, 3] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${
                  activeTab === tab ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}>
                Notis {tab} ({tab === 1 ? 'SMS' : tab === 2 ? 'Surat' : 'Muktamad'})
              </button>
            ))}
          </div>

          {/* Notice Content */}
          {activeTab === 2 && (
            <div className="border border-gray-200 rounded-lg p-4 text-sm bg-white">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-bold text-blue-800 text-base">TEKUN NASIONAL</div>
                  <div className="text-xs text-gray-500">Perbadanan Tabung Ekonomi Kumpulan Usaha Niaga</div>
                  <div className="text-xs text-gray-500">Level 15, Menara TEKUN, No. 7, Jalan Sultan Haji Ahmad Shah</div>
                  <div className="text-xs text-gray-500">50480 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur</div>
                  <div className="text-xs text-gray-500">Tel: 03-26143600 | www.tekun.gov.my</div>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <div>Rujukan Kami: TN/NOTIS/2026/07/00456</div>
                  <div>Tarikh: 1 Julai 2026</div>
                </div>
              </div>
              <div className="font-bold text-center mb-3 text-sm">NOTIS TUNTUTAN — NOTIS 2 (SURAT)</div>
              <div className="font-semibold mb-2">Tuan/Puan,</div>
              <div className="font-bold mb-2">PENGURUSAN AKAUN PEMBIAYAAN</div>
              <p className="text-xs text-gray-600 mb-3">Saya dengan hormatnya merujuk kepada akaun pembiayaan tuan/puan seperti butiran berikut:</p>
              <table className="w-full text-xs mb-3 border border-gray-200">
                <tbody>
                  {[
                    ['No Akaun', selectedAccount.no],
                    ['Nama Pelanggan', selectedAccount.name],
                    ['No Kad Pengenalan', '760525-10-5122'],
                    ['No Telefon', '012-345 6789'],
                    ['Cawangan', 'Cawangan Shah Alam'],
                  ].map(([k, v]) => (
                    <tr key={k} className="border-b border-gray-100">
                      <td className="p-1.5 font-semibold w-40">{k}</td>
                      <td className="p-1.5">: {v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-600 mb-2">
                Berdasarkan rekod kami, akaun tuan/puan telah tertunggak melebihi 45 hari dengan butiran seperti berikut:
              </p>
              <div className="p-2 bg-gray-50 border border-gray-200 rounded mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold">Amaun Tunggakan Semasa:</span>
                <span className="font-bold text-red-600">RM {selectedAccount.amount.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</span>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                Sehubungan itu, tuan/puan adalah diminta untuk menjelaskan keseluruhan amaun tertunggak tersebut selewat-lewatnya pada atau sebelum <strong className="text-red-600">14 Julai 2026</strong>.
              </p>
              <p className="text-xs text-gray-500 mb-3">Kegagalan tuan/puan berbuat demikian boleh menyebabkan tindakan lanjut termasuk:</p>
              <ol className="text-xs text-gray-500 list-roman ml-4 mb-3 space-y-1">
                <li>i. Pengeluaran Notis Muktamad;</li>
                <li>ii. Tindakan undang-undang; dan</li>
                <li>iii. Penerimaan maklumat ke agensi pelaporan kredit (CTOS/CCRIS).</li>
              </ol>
              <p className="text-xs text-gray-600 mb-2">Kerjasama dan tindakan segera tuan/puan amat dihargai.</p>
              <p className="text-xs text-gray-600 mb-1">Sekian, terima kasih.</p>
              <p className="text-xs italic text-gray-500">"TEKUN Bersama, Usaha Berjaya"</p>
            </div>
          )}

          {activeTab === 1 && (
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="text-sm font-semibold mb-2">📱 Notis SMS</div>
              <div className="p-3 bg-gray-100 rounded-lg text-sm font-mono">
                [TEKUN] Tuan/Puan {selectedAccount.name}, akaun {selectedAccount.no} mempunyai tunggakan RM {selectedAccount.amount.toFixed(2)}. Sila hubungi kami di 03-26143600 atau bayar di portal SPPT. Terima kasih.
              </div>
            </div>
          )}

          {activeTab === 3 && (
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="text-sm font-semibold mb-2 text-red-700">⚠️ Notis Muktamad</div>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                <p className="font-bold text-red-800 mb-2">NOTIS MUKTAMAD SEBELUM TINDAKAN UNDANG-UNDANG</p>
                <p className="text-gray-700">Akaun {selectedAccount.no} - {selectedAccount.name}</p>
                <p className="text-gray-700 mt-1">Tunggakan: <strong className="text-red-600">RM {selectedAccount.amount.toFixed(2)}</strong> ({selectedAccount.days} hari)</p>
                <p className="text-gray-600 mt-2 text-xs">Ini adalah notis muktamad. Kegagalan menjelaskan tunggakan dalam 7 hari akan menyebabkan tindakan undang-undang diambil tanpa notis lanjut.</p>
              </div>
            </div>
          )}

          {/* Delivery Channels */}
          <div className="mt-4">
            <div className="font-semibold text-sm mb-2">Saluran Penghantaran untuk Tahap Ini</div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: '✉️', label: 'Email', status: 'Dihantar', time: '01/07/2026 10:15 AM', ok: true },
                { icon: '💬', label: 'SMS', status: 'Dihantar', time: '01/07/2026 10:16 AM', ok: true },
                { icon: '🔔', label: 'Notifikasi Portal', status: 'Dihantar', time: '01/07/2026 10:17 AM', ok: true },
                { icon: '📮', label: 'Pos Berdaftar', status: 'Dalam Proses', time: '01/07/2026 10:18 AM', ok: false },
              ].map(ch => (
                <div key={ch.label} className="p-2 border border-gray-200 rounded-lg text-center">
                  <div className="text-xl mb-1">{ch.icon}</div>
                  <div className="text-xs font-semibold">{ch.label}</div>
                  <div className={`text-xs ${ch.ok ? 'text-green-600' : 'text-orange-500'}`}>
                    {ch.ok ? '✅' : '⏳'} {ch.status}
                  </div>
                  <div className="text-xs text-gray-400">{ch.time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Scheduling */}
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
            <span>🤖</span>
            <div className="text-xs">
              <span className="font-semibold">Jadualan AI (Cadangan Automatik): </span>
              Notis 3 akan dihantar automatik pada <strong>15 Julai 2026</strong> jika tiada bayaran diterima.
            </div>
          </div>

          {/* Performance */}
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <span>📊</span>
            <div className="text-xs">
              <span className="font-semibold">Statistik Prestasi (Tahap Ini): </span>
              Kadar kejayaan Notis 2: <strong className="text-green-700">45%</strong> (bayaran diterima dalam 14 hari)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
