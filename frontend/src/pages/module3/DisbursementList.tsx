import { useState } from 'react';
import { CheckSquare, Square, Search, Calendar, Filter, FileText, Mail, AlertCircle, ChevronDown } from 'lucide-react';

const disbursements = [
  { id: 'SPPT-2026-07-00089', name: 'Siti Nurhaliza', scheme: 'TEKUN Usahawan', amount: 25000, approvedDate: '03/07/2026', bankStatus: 'DISAHKAN', esignStatus: 'DITANDATANGANI', authority: 'Pengurus Cawangan' },
  { id: 'SPPT-2026-07-00090', name: 'Ahmad Razif', scheme: 'TEKUN Micro', amount: 8000, approvedDate: '03/07/2026', bankStatus: 'DISAHKAN', esignStatus: 'DITANDATANGANI', authority: 'Pengurus Cawangan' },
  { id: 'SPPT-2026-07-00091', name: 'Noraini Hassan', scheme: 'TEKUN Wanita', amount: 15000, approvedDate: '02/07/2026', bankStatus: 'DISAHKAN', esignStatus: 'MENUNGGU', authority: 'Pengurus Cawangan' },
  { id: 'SPPT-2026-07-00092', name: 'Zulkifli Omar', scheme: 'TEKUN Usahawan', amount: 45000, approvedDate: '01/07/2026', bankStatus: 'DISAHKAN', esignStatus: 'DITANDATANGANI', authority: 'Jawatankuasa Kredit' },
  { id: 'SPPT-2026-07-00093', name: 'Haslinda Abdul Rahman', scheme: 'TEKUN Micro', amount: 10000, approvedDate: '01/07/2026', bankStatus: 'DISAHKAN', esignStatus: 'DITANDATANGANI', authority: 'Pengurus Cawangan' },
  { id: 'SPPT-2026-07-00094', name: 'Mohd Firdaus', scheme: 'TEKUN Usahawan', amount: 30000, approvedDate: '30/06/2026', bankStatus: 'DISAHKAN', esignStatus: 'DITANDATANGANI', authority: 'Jawatankuasa Kredit' },
  { id: 'SPPT-2026-07-00095', name: 'Sharifah Aisyah', scheme: 'TEKUN Wanita', amount: 12500, approvedDate: '30/06/2026', bankStatus: 'DISAHKAN', esignStatus: 'MENUNGGU', authority: 'Pengurus Cawangan' },
  { id: 'SPPT-2026-07-00096', name: 'Azman Ismail', scheme: 'TEKUN Micro', amount: 6000, approvedDate: '29/06/2026', bankStatus: 'DISAHKAN', esignStatus: 'DITANDATANGANI', authority: 'Pengurus Cawangan' },
];

const esignBadge = (status: string) => {
  if (status === 'DITANDATANGANI') return <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">DITANDATANGANI</span>;
  return <span className="px-2 py-1 rounded text-xs font-semibold bg-orange-100 text-orange-700">MENUNGGU</span>;
};

const authorityBadge = (auth: string) => {
  if (auth === 'Jawatankuasa Kredit') return <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700">{auth}</span>;
  return <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">{auth}</span>;
};

export default function DisbursementList() {
  const [selected, setSelected] = useState<string[]>(['SPPT-2026-07-00089', 'SPPT-2026-07-00090']);
  const [activeTab, setActiveTab] = useState<'all' | 'sedia' | 'esign'>('all');
  const [search, setSearch] = useState('');

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectedTotal = disbursements.filter(d => selected.includes(d.id)).reduce((sum, d) => sum + d.amount, 0);

  const filtered = disbursements.filter(d => {
    if (activeTab === 'sedia') return d.esignStatus === 'DITANDATANGANI';
    if (activeTab === 'esign') return d.esignStatus === 'MENUNGGU';
    return true;
  }).filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>Pengeluaran Dana - Senarai Sedia Diproses</h1></div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center"><img src="/icons/icon-disbursement.png" alt="" className="w-7 h-7 object-contain" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Sedia Diproses</p><p className="text-3xl font-bold text-gray-900">23</p><p className="text-xs text-gray-500">permohonan</p></div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center"><span className="text-green-600 font-bold text-lg">RM</span></div>
          <div><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Jumlah Dana</p><p className="text-2xl font-bold text-green-600">RM 412,500</p></div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center"><img src="/icons/icon-esign.png" alt="" className="w-7 h-7 object-contain" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Menunggu e-Tandatangan</p><p className="text-3xl font-bold text-orange-600">7</p></div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center"><Filter className="w-6 h-6 text-purple-600" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Diproses Hari Ini</p><p className="text-3xl font-bold text-purple-600">8</p></div>
        </div>
      </div>
      <div className="flex gap-6">
        <div className="flex-1">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">AI</div>
            <p className="text-sm text-blue-800 font-medium">AI telah mengenal pasti semua permohonan yang layak secara automatik.</p>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${activeTab === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200'}`}>ALL ({disbursements.length})</button>
              <button onClick={() => setActiveTab('sedia')} className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${activeTab === 'sedia' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-green-700 border-green-300'}`}>Sedia Sepenuhnya (16)</button>
              <button onClick={() => setActiveTab('esign')} className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${activeTab === 'esign' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-orange-700 border-orange-300'}`}>Menunggu e-Sign (7)</button>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative"><Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari No Permohonan / Nama Pemohon" className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-300" /></div>
              <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-50"><Calendar className="w-4 h-4" /> Pilih Julat Tarikh <ChevronDown className="w-3 h-3" /></button>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="w-10 px-4 py-3"><CheckSquare className="w-4 h-4 text-blue-600" /></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">No Permohonan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Nama Pemohon</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Skim</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Jumlah (RM)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Tarikh Lulus</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status Bank</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status e-Sign</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Had Kuasa</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(d => (
                  <tr key={d.id} className={`hover:bg-gray-50 transition-colors ${selected.includes(d.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3"><button onClick={() => toggleSelect(d.id)}>{selected.includes(d.id) ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-400" />}</button></td>
                    <td className="px-4 py-3 text-blue-600 font-medium cursor-pointer hover:underline">{d.id}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{d.name}</td>
                    <td className="px-4 py-3 text-gray-600">{d.scheme}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">RM {d.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">{d.approvedDate}</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">DISAHKAN</span></td>
                    <td className="px-4 py-3">{esignBadge(d.esignStatus)}</td>
                    <td className="px-4 py-3">{authorityBadge(d.authority)}</td>
                    <td className="px-4 py-3">
                      {d.esignStatus === 'MENUNGGU' ? <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 border border-gray-200 bg-gray-50">⏱ Tunggu e-Sign</button>
                      : d.authority === 'Jawatankuasa Kredit' ? <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600">▶ Perlu Kelulusan Tambahan</button>
                      : <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800">▶ Proses</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selected.length > 0 && (
            <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><FileText className="w-4 h-4 text-blue-600" /></div>
                <span className="font-semibold text-gray-800">{selected.length} permohonan dipilih</span>
                <span className="text-gray-400">|</span>
                <span className="font-bold text-green-600">Jumlah: RM {selectedTotal.toLocaleString()}</span>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700"><FileText className="w-4 h-4" /> Jana Fail Batch ISO 20022</button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800"><Mail className="w-4 h-4" /> Jana Surat Tawaran Batch</button>
                <button onClick={() => setSelected([])} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">✕</button>
              </div>
            </div>
          )}
          <div className="mt-4 bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">AI</div>
              <p className="text-sm text-gray-700">AI telah mengesahkan semua 16 permohonan memenuhi syarat pengeluaran. Tiada semakan manual diperlukan.</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">✓</div>
          </div>
        </div>
        <div className="w-64 bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center"><AlertCircle className="w-4 h-4 text-white" /></div>
            <h3 className="font-bold text-gray-800 text-sm">Matriks Had Kuasa</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div><p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Pengurus Cawangan:</p><p className="text-gray-700">sehingga <span className="font-bold text-gray-900">RM 30,000</span></p></div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Jawatankuasa:</p><p className="text-red-600 font-bold">RM 30,001 - RM 100,000</p></div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Lembaga Pengarah:</p><p className="text-gray-700">Melebihi <span className="font-bold text-gray-900">RM 100,000</span></p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
