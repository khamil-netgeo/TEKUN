// FILE: AuthorityMatrix.tsx
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, MinusCircle, AlertTriangle, Send, ArrowLeft, Building2, Globe, Landmark, Crown, User, Users, ShieldCheck } from 'lucide-react';
import { useState, useMemo } from 'react';

/* ── Types ──────────────────────────────────────────────────────────── */
type EscalationLevel = 'branch' | 'state' | 'hq' | 'board';

interface LocationState {
  applicationId?:   string;
  applicantName?:   string;
  amount?:          number;
  scheme?:          string;
  escalationLevel?: EscalationLevel;
  authority?:       string;
}

/* ── Backend Truth (Single Source of Truth) ─────────────────────────── */
const AUTHORITY_MATRIX = [
  { key: 'branch', label: 'Cawangan', approvers: 'Pengurus Cawangan', min: 0, max: 10000, icon: Building2 },
  { key: 'state', label: 'Negeri', approvers: 'Pengurus Negeri', min: 10001, max: 50000, icon: Globe },
  { key: 'hq', label: 'Ibu Pejabat', approvers: 'Pengurus Besar', min: 50001, max: 200000, icon: Landmark },
  { key: 'board', label: 'Lembaga Pengarah', approvers: 'Lembaga Pengarah TEKUN', min: 200001, max: Infinity, icon: Crown },
];

const COMMITTEE_MEMBERS: Record<EscalationLevel, { name: string, role: string }[]> = {
  branch: [
    { name: 'En. Kamal (PC)', role: 'Pengurus Cawangan' },
  ],
  state: [
    { name: 'Pn. Aisha (PN)', role: 'Pengurus Negeri' },
    { name: 'En. Badrul (PKS)', role: 'Pegawai Kredit Kanan' },
  ],
  hq: [
    { name: 'Dato\' Razak (PB)', role: 'Pengurus Besar' },
    { name: 'Dr. Halim (TPB)', role: 'Timbalan Pengurus Besar' },
  ],
  board: [
    { name: 'Tan Sri Azman', role: 'Pengerusi' },
    { name: 'Datuk Seri Noraini', role: 'Ahli Lembaga' },
    { name: 'Ir. Dr. Hafiz', role: 'Ahli Lembaga' },
  ],
};

const levelLabel: Record<EscalationLevel, string> = {
  branch: 'Cawangan',
  state: 'Negeri',
  hq: 'Ibu Pejabat (HQ)',
  board: 'Lembaga Pengarah',
};

/* ── Static demo fallback ───────────────────────────────────────────── */
const DEMO: Required<LocationState> = {
  applicationId:   'SPPT-2026-07-00092',
  applicantName:   'Zulkifli Omar',
  amount:          35000,
  scheme:          'TEKUN Usahawan',
  escalationLevel: 'state',
  authority:       'Pengurus Negeri',
};

/* ── Authority matrix rows ──────────────────────────────────────────── */
function buildMatrix(amount: number) {
  return AUTHORITY_MATRIX.map((row, index) => {
    const isActive = amount >= row.min && amount <= row.max;
    const isDone = amount > row.max;
    const status = isDone ? 'LULUS' : isActive ? 'MENUNGGU' : 'TIDAK BERKAITAN';
    return { ...row, level: index + 1, isActive, isDone, status };
  });
}

/* ── Escalation steps ───────────────────────────────────────────────── */
function buildEscalation(level: EscalationLevel) {
  const steps = [
    { key: 'branch', label: 'Pengurus Cawangan mengesahkan' },
    { key: 'state',  label: 'Pengurus Negeri meluluskan' },
    { key: 'hq',     label: 'Pengurus Besar / Ibu Pejabat meluluskan' },
    { key: 'board',  label: 'Lembaga Pengarah TEKUN meluluskan' },
    { key: 'done',   label: 'Pengeluaran Dana diproses' },
  ];
  const levelOrder: Record<string, number> = { branch: 1, state: 2, hq: 3, board: 4, done: 5 };
  const currentOrder = levelOrder[level] ?? 1;
  return steps.map((s, i) => ({
    ...s,
    done:   levelOrder[s.key] < currentOrder,
    active: levelOrder[s.key] === currentOrder,
    time:   levelOrder[s.key] < currentOrder ? `0${i+1}/07 10:${i*15}` : (levelOrder[s.key] === currentOrder ? `Dijangka: 0${i+2}/07 sebelum 5PM` : '')
  }));
}

/* ── Status cell ────────────────────────────────────────────────────── */
function StatusCell({ status, detail }: { status: string; detail?: string }) {
  if (status === 'LULUS') return (
    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
      <div><p className="text-xs font-bold text-green-700">LULUS</p>{detail && <p className="text-xs text-green-600">{detail}</p>}</div>
    </div>
  );
  if (status === 'MENUNGGU') return (
    <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-300 rounded-lg">
      <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
      <div><p className="text-xs font-bold text-orange-700">MENUNGGU KELULUSAN</p>{detail && <p className="text-xs text-orange-600">{detail}</p>}</div>
    </div>
  );
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
      <MinusCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />
      <p className="text-xs font-semibold text-gray-400">TIDAK BERKAITAN</p>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────── */
export default function AuthorityMatrix() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const state     = (location.state as LocationState) ?? {};
  const [isEscalating, setIsEscalating] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);

  const app: Required<LocationState> = {
    applicationId:   state.applicationId   ?? DEMO.applicationId,
    applicantName:   state.applicantName   ?? DEMO.applicantName,
    amount:          state.amount          ?? DEMO.amount,
    scheme:          state.scheme          ?? DEMO.scheme,
    escalationLevel: state.escalationLevel ?? DEMO.escalationLevel,
    authority:       state.authority       ?? DEMO.authority,
  };

  const matrix = useMemo(() => buildMatrix(app.amount), [app.amount]);
  const escalationSteps = useMemo(() => buildEscalation(app.escalationLevel), [app.escalationLevel]);
  const committee = useMemo(() => COMMITTEE_MEMBERS[app.escalationLevel].map((m, i) => ({...m, approved: i === 0})), [app.escalationLevel]);
  
  const approvedCount = committee.filter(c => c.approved).length;
  const pct = Math.round((approvedCount / committee.length) * 100);

  const exceededLevel = useMemo(() => {
    const currentLevelIndex = AUTHORITY_MATRIX.findIndex(l => l.key === app.escalationLevel);
    return currentLevelIndex > 0 ? AUTHORITY_MATRIX[currentLevelIndex - 1] : null;
  }, [app.escalationLevel]);

  const handleApiCall = async (action: 'escalate' | 'notify') => {
    const setLoading = action === 'escalate' ? setIsEscalating : setIsNotifying;
    setLoading(true);
    console.log(`SIMULATING API CALL: POST /api/disbursements/${app.applicationId}/${action}`);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
    setLoading(false);
    alert(`Tindakan ${action} berjaya disimulasikan untuk ${app.applicationId}`);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 mb-4 transition-colors">
        <ArrowLeft size={16} /> Kembali ke Senarai Pengeluaran
      </button>

      <div className="bg-orange-500 text-white rounded-xl px-5 py-3 mb-6 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-semibold">
          <strong>PERHATIAN:</strong> Jumlah RM {app.amount.toLocaleString()}
          {exceededLevel && ` melebihi had kuasa ${exceededLevel.approvers} (RM ${exceededLevel.max.toLocaleString()}).`}
          {' '}Pengesahan <strong>{app.authority}</strong> diperlukan — Peringkat: <strong>{levelLabel[app.escalationLevel]}</strong>.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <h2 className="text-base font-bold text-gray-800 mb-4">Maklumat Permohonan</h2>
        <div className="grid grid-cols-4 gap-6">
          {[
            { icon: '📄', label: 'No. Permohonan', value: app.applicationId,  color: 'text-gray-900' },
            { icon: '👤', label: 'Pemohon',         value: app.applicantName,  color: 'text-gray-900' },
            { icon: '$',  label: 'Jumlah',           value: `RM ${app.amount.toLocaleString()}`, color: 'text-red-600' },
            { icon: '💼', label: 'Skim / Produk',   value: app.scheme,         color: 'text-gray-900' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 text-lg flex-shrink-0">{item.icon}</div>
              <div><p className="text-xs text-gray-500">{item.label}</p><p className={`font-bold text-sm ${item.color}`}>{item.value}</p></div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">🛡</div>
              <h2 className="text-base font-bold" style={{ color: '#1B2B5E' }}>Matriks Had Kuasa Pengeluaran Dana</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100"><tr>{['Peringkat', 'Peranan', 'Had Min', 'Had Maks', 'Status'].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-50">
                {matrix.map(row => {
                  const Icon = row.icon;
                  return (
                    <tr key={row.level} className={`transition-colors ${row.isActive ? 'bg-orange-50' : row.isDone ? 'bg-green-50/40' : 'hover:bg-gray-50'}`}>
                      <td className="px-5 py-4"><div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${row.isDone ? 'bg-green-500 text-white' : row.isActive ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{row.isDone ? '✓' : row.level}</div></td>
                      <td className={`px-5 py-4 font-semibold flex items-center gap-2 ${row.isActive ? 'text-orange-700' : row.isDone ? 'text-green-700' : 'text-gray-500'}`}><Icon size={14} className="flex-shrink-0" />{row.approvers}</td>
                      <td className={`px-5 py-4 ${row.isActive ? 'text-orange-700 font-bold' : 'text-gray-600'}`}>RM {row.min.toLocaleString()}</td>
                      <td className={`px-5 py-4 ${row.isActive ? 'text-orange-700 font-bold' : 'text-gray-600'}`}>{row.max === Infinity ? 'Tiada Had' : `RM ${row.max.toLocaleString()}`}</td>
                      <td className="px-5 py-4"><StatusCell status={row.status} detail={row.isDone ? 'Telah diluluskan' : row.isActive ? `Dihantar ${new Date().toLocaleDateString('ms-MY')}` : undefined} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">AI</div>
            <p className="text-sm text-purple-800">Sistem AI telah menghalang pengeluaran secara automatik kerana had kuasa tidak mencukupi. Permohonan telah dihantar ke <strong>{app.authority}</strong> untuk kelulusan.</p>
          </div>
        </div>

        <div className="w-80 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4"><span className="text-base">🔄</span><h3 className="font-bold text-gray-800 text-sm">Jejak Eskalasi</h3><span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: '#E65100' }}>{levelLabel[app.escalationLevel]}</span></div>
            <div className="space-y-4">
              {escalationSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${step.done ? 'bg-green-500 text-white' : step.active ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{step.done ? '✓' : i + 1}</div>
                    {i < escalationSteps.length - 1 && <div className={`w-0.5 h-6 mt-1 ${step.done ? 'bg-green-400' : 'bg-gray-200'}`} />}
                  </div>
                  <div className="pt-1"><p className={`text-sm font-semibold ${step.active ? 'text-orange-700' : step.done ? 'text-gray-700' : 'text-gray-400'}`}>{step.label}</p>{step.time && <p className={`text-xs mt-0.5 ${step.active ? 'text-orange-500 font-semibold' : 'text-gray-500'}`}>{step.time}</p>}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4"><Users className="w-4 h-4 text-gray-600" /><h3 className="font-bold text-gray-800 text-sm">Kelulusan {app.authority}</h3></div>
            <div className="space-y-3 mb-4">
              {committee.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${c.approved ? 'bg-green-500' : 'bg-gray-200'}`}>{c.approved && <span className="text-white text-xs">✓</span>}</div>
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs"><User size={14} /></div>
                  <span className="text-sm text-gray-700 flex-1">{c.name}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${c.role.includes('Pengerusi') || c.role.includes('Besar') ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{c.role}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="font-semibold text-gray-600">Kemajuan Undian</span><span className="font-bold text-gray-700">{approvedCount}/{committee.length} ({pct}%)</span></div>
              <div className="w-full bg-gray-100 rounded-full h-2.5"><div className="h-2.5 rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} /></div>
            </div>
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
              <Clock className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" /><p className="text-xs text-orange-700"><strong>SLA:</strong> Kelulusan diperlukan dalam 24 jam.<br /><strong>Masa berbaki: 18 jam 30 minit</strong></p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Tindakan Eskalasi</p>
            <button onClick={() => handleApiCall('notify')} disabled={isNotifying} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-colors mb-2 disabled:opacity-50" style={{ background: '#E65100' }}>
              <Send className="w-4 h-4" /> {isNotifying ? 'Menghantar...' : `Hantar Peringatan ke ${app.authority}`}
            </button>
            <button onClick={() => handleApiCall('escalate')} disabled={isEscalating} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-colors mb-2 disabled:opacity-50" style={{ background: '#1B2B5E' }}>
              <ShieldCheck className="w-4 h-4" /> {isEscalating ? 'Memproses...' : 'Hantar Eskalasi ke Peringkat Seterusnya'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
