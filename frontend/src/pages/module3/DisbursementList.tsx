import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare, Square, Search, Calendar, Filter,
  FileText, Mail, AlertCircle, ChevronDown,
  ArrowRight, Building2, Globe, Landmark,
} from 'lucide-react';

/* ── Types ──────────────────────────────────────────────────────────── */
type EscalationLevel = 'cawangan' | 'negeri' | 'hq';

interface Disbursement {
  id: string;
  name: string;
  scheme: string;
  amount: number;
  approvedDate: string;
  bankStatus: string;
  esignStatus: string;
  authority: string;
  escalationLevel: EscalationLevel;
}

/* ── Mock data ──────────────────────────────────────────────────────── */
const disbursements: Disbursement[] = [
  { id: 'SPPT-2026-07-00089', name: 'Siti Nurhaliza',       scheme: 'TEKUN Usahawan', amount: 25000, approvedDate: '03/07/2026', bankStatus: 'DISAHKAN', esignStatus: 'DITANDATANGANI', authority: 'Pengurus Cawangan',   escalationLevel: 'cawangan' },
  { id: 'SPPT-2026-07-00090', name: 'Ahmad Razif',          scheme: 'TEKUN Micro',    amount: 8000,  approvedDate: '03/07/2026', bankStatus: 'DISAHKAN', esignStatus: 'DITANDATANGANI', authority: 'Pengurus Cawangan',   escalationLevel: 'cawangan' },
  { id: 'SPPT-2026-07-00091', name: 'Noraini Hassan',       scheme: 'TEKUN Wanita',   amount: 15000, approvedDate: '02/07/2026', bankStatus: 'DISAHKAN', esignStatus: 'MENUNGGU',       authority: 'Pengurus Cawangan',   escalationLevel: 'cawangan' },
  { id: 'SPPT-2026-07-00092', name: 'Zulkifli Omar',        scheme: 'TEKUN Usahawan', amount: 45000, approvedDate: '01/07/2026', bankStatus: 'DISAHKAN', esignStatus: 'DITANDATANGANI', authority: 'Jawatankuasa Kredit', escalationLevel: 'negeri'   },
  { id: 'SPPT-2026-07-00093', name: 'Haslinda Abdul Rahman',scheme: 'TEKUN Micro',    amount: 10000, approvedDate: '01/07/2026', bankStatus: 'DISAHKAN', esignStatus: 'DITANDATANGANI', authority: 'Pengurus Cawangan',   escalationLevel: 'cawangan' },
  { id: 'SPPT-2026-07-00094', name: 'Mohd Firdaus',         scheme: 'TEKUN Usahawan', amount: 30000, approvedDate: '30/06/2026', bankStatus: 'DISAHKAN', esignStatus: 'DITANDATANGANI', authority: 'Jawatankuasa Kredit', escalationLevel: 'negeri'   },
  { id: 'SPPT-2026-07-00095', name: 'Sharifah Aisyah',      scheme: 'TEKUN Wanita',   amount: 12500, approvedDate: '30/06/2026', bankStatus: 'DISAHKAN', esignStatus: 'MENUNGGU',       authority: 'Pengurus Cawangan',   escalationLevel: 'cawangan' },
  { id: 'SPPT-2026-07-00096', name: 'Azman Ismail',         scheme: 'TEKUN Micro',    amount: 6000,  approvedDate: '29/06/2026', bankStatus: 'DISAHKAN', esignStatus: 'DITANDATANGANI', authority: 'Pengurus Cawangan',   escalationLevel: 'cawangan' },
  { id: 'SPPT-2026-07-00097', name: 'Tengku Amirul',        scheme: 'TEKUN Usahawan', amount: 120000,approvedDate: '28/06/2026', bankStatus: 'DISAHKAN', esignStatus: 'DITANDATANGANI', authority: 'Lembaga Pengarah',    escalationLevel: 'hq'       },
];

/* ── Helpers ────────────────────────────────────────────────────────── */
const esignBadge = (status: string) =>
  status === 'DITANDATANGANI'
    ? <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">DITANDATANGANI</span>
    : <span className="px-2 py-1 rounded text-xs font-semibold bg-orange-100 text-orange-700">MENUNGGU</span>;

const authorityBadge = (auth: string) => {
  if (auth === 'Jawatankuasa Kredit') return <span className="px-2 py-1 rounded text-xs font-semibold bg-orange-100 text-orange-700">{auth}</span>;
  if (auth === 'Lembaga Pengarah')    return <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700">{auth}</span>;
  return <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">{auth}</span>;
};

/* ── Escalation flow banner ─────────────────────────────────────────── */
const ESCALATION_STEPS = [
  { key: 'cawangan', label: 'Cawangan',      icon: Building2, color: '#1B2B5E' },
  { key: 'negeri',   label: 'Negeri',         icon: Globe,     color: '#E65100' },
  { key: 'hq',       label: 'Ibu Pejabat (HQ)', icon: Landmark, color: '#C62828' },
];

function EscalationBanner({ level }: { level: EscalationLevel }) {
  const idx = ESCALATION_STEPS.findIndex(s => s.key === level);
  return (
    <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-4">
      <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
      <span className="text-xs font-semibold text-orange-700 mr-2">Aliran Kelulusan:</span>
      {ESCALATION_STEPS.map((step, i) => {
        const Icon = step.icon;
        const isActive  = i === idx;
        const isDone    = i < idx;
        return (
          <div key={step.key} className="flex items-center gap-1">
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${
                isActive  ? 'text-white border-transparent'
                : isDone  ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-white text-gray-400 border-gray-200'
              }`}
              style={isActive ? { background: step.color, borderColor: step.color } : {}}
            >
              <Icon size={12} />
              {step.label}
              {isDone && <span className="ml-1">✓</span>}
            </div>
            {i < ESCALATION_STEPS.length - 1 && (
              <ArrowRight size={12} className="text-gray-400 mx-0.5" />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────── */
export default function DisbursementList() {
  const navigate = useNavigate();
  const [selected, setSelected]   = useState<string[]>(['SPPT-2026-07-00089', 'SPPT-2026-07-00090']);
  const [activeTab, setActiveTab] = useState<'all' | 'sedia' | 'esign'>('all');
  const [search, setSearch]       = useState('');
  const [escalateId, setEscalateId] = useState<string | null>(null);

  const toggleSelect = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const selectedTotal = disbursements
    .filter(d => selected.includes(d.id))
    .reduce((sum, d) => sum + d.amount, 0);

  const filtered = disbursements
    .filter(d => {
      if (activeTab === 'sedia') return d.esignStatus === 'DITANDATANGANI';
      if (activeTab === 'esign') return d.esignStatus === 'MENUNGGU';
      return true;
    })
    .filter(d =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase())
    );

  /* Navigate to authority matrix, passing the application data */
  const handleEscalate = (d: Disbursement) => {
    setEscalateId(d.id);
    navigate('/module3/authority', {
      state: {
        applicationId:   d.id,
        applicantName:   d.name,
        amount:          d.amount,
        scheme:          d.scheme,
        escalationLevel: d.escalationLevel,
        authority:       d.authority,
      },
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#1B2B5E' }}>
          Pengeluaran Dana — Senarai Sedia Diproses
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Aliran kelulusan: Cawangan → Negeri → Ibu Pejabat (HQ)
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Sedia Diproses',          value: '23',        sub: 'permohonan',  color: '#1B2B5E', bg: 'bg-blue-100'   },
          { label: 'Jumlah Dana',              value: 'RM 412,500',sub: '',            color: '#2E7D32', bg: 'bg-green-100'  },
          { label: 'Menunggu e-Tandatangan',   value: '7',         sub: 'permohonan',  color: '#E65100', bg: 'bg-orange-100' },
          { label: 'Perlu Kelulusan Tambahan', value: '3',         sub: 'eskalasi',    color: '#C62828', bg: 'bg-red-100'    },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${c.bg} flex items-center justify-center`}>
              <Filter className="w-6 h-6" style={{ color: c.color }} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{c.label}</p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: c.color }}>{c.value}</p>
              {c.sub && <p className="text-xs text-gray-400">{c.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Table */}
        <div className="flex-1">
          {/* AI Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">AI</div>
            <p className="text-sm text-blue-800 font-medium">
              AI telah mengenal pasti semua permohonan yang layak secara automatik. 3 permohonan memerlukan eskalasi kelulusan.
            </p>
          </div>

          {/* Escalation flow banner */}
          <EscalationBanner level="cawangan" />

          {/* Tabs + Search */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {[
                { key: 'all',   label: `Semua (${disbursements.length})`,     active: 'bg-gray-800 text-white border-gray-800',   inactive: 'bg-white text-gray-600 border-gray-200' },
                { key: 'sedia', label: 'Sedia Sepenuhnya (16)',                active: 'bg-green-600 text-white border-green-600', inactive: 'bg-white text-green-700 border-green-300' },
                { key: 'esign', label: 'Menunggu e-Sign (7)',                  active: 'bg-orange-500 text-white border-orange-500', inactive: 'bg-white text-orange-700 border-orange-300' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as 'all' | 'sedia' | 'esign')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${activeTab === tab.key ? tab.active : tab.inactive}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cari No Permohonan / Nama Pemohon"
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-50">
                <Calendar className="w-4 h-4" /> Pilih Julat Tarikh <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Table */}
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
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">e-Sign</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Had Kuasa</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(d => (
                  <tr
                    key={d.id}
                    className={`hover:bg-gray-50 transition-colors ${selected.includes(d.id) ? 'bg-blue-50' : ''} ${escalateId === d.id ? 'opacity-60' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(d.id)}>
                        {selected.includes(d.id)
                          ? <CheckSquare className="w-4 h-4 text-blue-600" />
                          : <Square className="w-4 h-4 text-gray-400" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-blue-600 font-medium cursor-pointer hover:underline">{d.id}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{d.name}</td>
                    <td className="px-4 py-3 text-gray-600">{d.scheme}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">RM {d.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">{d.approvedDate}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">DISAHKAN</span>
                    </td>
                    <td className="px-4 py-3">{esignBadge(d.esignStatus)}</td>
                    <td className="px-4 py-3">{authorityBadge(d.authority)}</td>
                    <td className="px-4 py-3">
                      {d.esignStatus === 'MENUNGGU' ? (
                        <button
                          disabled
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 border border-gray-200 bg-gray-50 cursor-not-allowed"
                        >
                          ⏱ Tunggu e-Sign
                        </button>
                      ) : d.authority === 'Jawatankuasa Kredit' || d.authority === 'Lembaga Pengarah' ? (
                        /* ── ESCALATION BUTTON — clickable, navigates to /module3/authority ── */
                        <button
                          onClick={() => handleEscalate(d)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:scale-105 active:scale-95 shadow-sm"
                          style={{ background: d.authority === 'Lembaga Pengarah' ? '#C62828' : '#E65100' }}
                          title={`Eskalasi ke ${d.authority}`}
                        >
                          <ArrowRight size={12} />
                          Perlu Kelulusan Tambahan
                        </button>
                      ) : (
                        <button
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-all"
                          style={{ background: '#1B2B5E' }}
                        >
                          ▶ Proses
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bulk action bar */}
          {selected.length > 0 && (
            <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-semibold text-gray-800">{selected.length} permohonan dipilih</span>
                <span className="text-gray-300">|</span>
                <span className="font-bold text-green-600">Jumlah: RM {selectedTotal.toLocaleString()}</span>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">
                  <FileText className="w-4 h-4" /> Jana Fail Batch ISO 20022
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-semibold hover:opacity-90" style={{ background: '#1B2B5E' }}>
                  <Mail className="w-4 h-4" /> Jana Surat Tawaran Batch
                </button>
                <button
                  onClick={() => setSelected([])}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* AI footer */}
          <div className="mt-4 bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">AI</div>
              <p className="text-sm text-gray-700">
                AI telah mengesahkan semua 16 permohonan memenuhi syarat pengeluaran. 3 permohonan memerlukan eskalasi kelulusan tambahan.
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white flex-shrink-0">✓</div>
          </div>
        </div>

        {/* Sidebar — Authority Matrix summary */}
        <div className="w-64 bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-fit space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-gray-800 text-sm">Matriks Had Kuasa</h3>
          </div>
          <div className="space-y-3 text-sm">
            {[
              { role: 'Pegawai Kewangan',    range: 'sehingga RM 10,000',       color: 'text-gray-700', icon: Building2 },
              { role: 'Pengurus Cawangan',   range: 'sehingga RM 30,000',       color: 'text-blue-700', icon: Building2 },
              { role: 'Jawatankuasa Kredit', range: 'RM 30,001 – RM 100,000',   color: 'text-orange-600 font-bold', icon: Globe },
              { role: 'Lembaga Pengarah',    range: 'Melebihi RM 100,000',      color: 'text-red-600 font-bold', icon: Landmark },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.role} className="flex items-start gap-2">
                  <Icon size={14} className="mt-0.5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500">{item.role}</p>
                    <p className={`text-xs ${item.color}`}>{item.range}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-gray-100 pt-3">
            <button
              onClick={() => navigate('/module3/authority')}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: '#1B2B5E' }}
            >
              <ArrowRight size={13} /> Lihat Matriks Penuh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
