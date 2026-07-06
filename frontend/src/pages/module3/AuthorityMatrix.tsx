import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, MinusCircle, AlertTriangle, Send, ArrowLeft, Building2, Globe, Landmark } from 'lucide-react';

/* ── Types ──────────────────────────────────────────────────────────── */
type EscalationLevel = 'cawangan' | 'negeri' | 'hq';

interface LocationState {
  applicationId?:   string;
  applicantName?:   string;
  amount?:          number;
  scheme?:          string;
  escalationLevel?: EscalationLevel;
  authority?:       string;
}

/* ── Static demo fallback ───────────────────────────────────────────── */
const DEMO: Required<LocationState> = {
  applicationId:   'SPPT-2026-07-00092',
  applicantName:   'Zulkifli Omar',
  amount:          45000,
  scheme:          'TEKUN Usahawan',
  escalationLevel: 'negeri',
  authority:       'Jawatankuasa Kredit',
};

/* ── Authority matrix rows ──────────────────────────────────────────── */
function buildMatrix(amount: number) {
  return [
    { level: 1, role: 'Pegawai Kewangan',    min: 'RM 0',        max: 'RM 10,000',    threshold: 10000,  icon: Building2 },
    { level: 2, role: 'Pengurus Cawangan',   min: 'RM 10,001',   max: 'RM 30,000',    threshold: 30000,  icon: Building2 },
    { level: 3, role: 'Jawatankuasa Kredit', min: 'RM 30,001',   max: 'RM 100,000',   threshold: 100000, icon: Globe     },
    { level: 4, role: 'Lembaga Pengarah',    min: 'RM 100,001',  max: 'Tiada Had',    threshold: Infinity, icon: Landmark },
  ].map(row => {
    const isActive  = amount > (row.level === 1 ? 0 : [0, 10000, 30000, 100000][row.level - 1]) && amount <= row.threshold;
    const isDone    = amount > row.threshold;
    const status    = isDone ? 'LULUS' : isActive ? 'MENUNGGU' : 'TIDAK BERKAITAN';
    return { ...row, isActive, isDone, status };
  });
}

/* ── Escalation steps ───────────────────────────────────────────────── */
function buildEscalation(level: EscalationLevel) {
  const steps = [
    { key: 'cawangan', label: 'Pegawai Kewangan mengesahkan',   time: '03/07 09:00' },
    { key: 'cawangan', label: 'Pengurus Cawangan meluluskan',   time: '03/07 10:30' },
    { key: 'negeri',   label: 'Jawatankuasa Kredit',            time: 'Dijangka: 04/07 sebelum 5PM' },
    { key: 'hq',       label: 'Lembaga Pengarah',               time: 'Dijangka: 07/07 sebelum 5PM' },
    { key: 'done',     label: 'Pengeluaran Dana',               time: '' },
  ];
  const levelOrder: Record<string, number> = { cawangan: 1, negeri: 2, hq: 3, done: 4 };
  const currentOrder = levelOrder[level] ?? 1;
  return steps.map(s => ({
    ...s,
    done:   levelOrder[s.key] < currentOrder,
    active: levelOrder[s.key] === currentOrder,
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

/* ── Committee members ──────────────────────────────────────────────── */
const committee = [
  { name: 'Encik Hafiz',  role: 'Pengerusi', approved: true  },
  { name: 'Puan Salmah',  role: 'Ahli',      approved: false },
  { name: 'Encik Rauf',   role: 'Ahli',      approved: false },
];

/* ── Main component ─────────────────────────────────────────────────── */
export default function AuthorityMatrix() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const state     = (location.state as LocationState) ?? {};

  /* Merge with demo fallback */
  const app: Required<LocationState> = {
    applicationId:   state.applicationId   ?? DEMO.applicationId,
    applicantName:   state.applicantName   ?? DEMO.applicantName,
    amount:          state.amount          ?? DEMO.amount,
    scheme:          state.scheme          ?? DEMO.scheme,
    escalationLevel: state.escalationLevel ?? DEMO.escalationLevel,
    authority:       state.authority       ?? DEMO.authority,
  };

  const matrix         = buildMatrix(app.amount);
  const escalationSteps = buildEscalation(app.escalationLevel);
  const approvedCount  = committee.filter(c => c.approved).length;
  const pct            = Math.round((approvedCount / committee.length) * 100);

  /* Escalation level label */
  const levelLabel: Record<EscalationLevel, string> = {
    cawangan: 'Cawangan',
    negeri:   'Negeri',
    hq:       'Ibu Pejabat (HQ)',
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Back button */}
      <button
        onClick={() => navigate('/module3/disbursement')}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 mb-4 transition-colors"
      >
        <ArrowLeft size={16} /> Kembali ke Senarai Pengeluaran
      </button>

      {/* Alert banner */}
      <div className="bg-orange-500 text-white rounded-xl px-5 py-3 mb-6 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-semibold">
          <strong>PERHATIAN:</strong> Jumlah RM {app.amount.toLocaleString()} melebihi had kuasa Pengurus Cawangan (RM 30,000).
          Pengesahan <strong>{app.authority}</strong> diperlukan — Peringkat: <strong>{levelLabel[app.escalationLevel]}</strong>.
        </p>
      </div>

      {/* Application info */}
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
              <div>
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className={`font-bold text-sm ${item.color}`}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left: Matrix table */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">🛡</div>
              <h2 className="text-base font-bold" style={{ color: '#1B2B5E' }}>Matriks Had Kuasa Pengeluaran Dana</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Peringkat', 'Peranan', 'Had Min', 'Had Maks', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {matrix.map(row => {
                  const Icon = row.icon;
                  return (
                    <tr
                      key={row.level}
                      className={`transition-colors ${row.isActive ? 'bg-orange-50' : row.isDone ? 'bg-green-50/40' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-5 py-4">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                          row.isDone   ? 'bg-green-500 text-white'
                          : row.isActive ? 'bg-orange-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                        }`}>
                          {row.isDone ? '✓' : row.level}
                        </div>
                      </td>
                      <td className={`px-5 py-4 font-semibold flex items-center gap-2 ${row.isActive ? 'text-orange-700' : row.isDone ? 'text-green-700' : 'text-gray-500'}`}>
                        <Icon size={14} className="flex-shrink-0" />
                        {row.role}
                      </td>
                      <td className={`px-5 py-4 ${row.isActive ? 'text-orange-700 font-bold' : 'text-gray-600'}`}>{row.min}</td>
                      <td className={`px-5 py-4 ${row.isActive ? 'text-orange-700 font-bold' : 'text-gray-600'}`}>{row.max}</td>
                      <td className="px-5 py-4">
                        <StatusCell
                          status={row.status}
                          detail={
                            row.isDone   ? 'Telah diluluskan'
                            : row.isActive ? `Dihantar ${new Date().toLocaleDateString('ms-MY')}`
                            : undefined
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* AI note */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">AI</div>
            <p className="text-sm text-indigo-800">
              Sistem AI telah menghalang pengeluaran secara automatik kerana had kuasa tidak mencukupi.
              Permohonan telah dihantar ke <strong>{app.authority}</strong> untuk kelulusan.
            </p>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-80 space-y-4">

          {/* Escalation trail */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">🔄</span>
              <h3 className="font-bold text-gray-800 text-sm">Jejak Eskalasi</h3>
              <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: '#E65100' }}>
                {levelLabel[app.escalationLevel]}
              </span>
            </div>
            <div className="space-y-4">
              {escalationSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      step.done   ? 'bg-green-500 text-white'
                      : step.active ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                    }`}>
                      {step.done ? '✓' : i + 1}
                    </div>
                    {i < escalationSteps.length - 1 && (
                      <div className={`w-0.5 h-6 mt-1 ${step.done ? 'bg-green-400' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <div className="pt-1">
                    <p className={`text-sm font-semibold ${step.active ? 'text-orange-700' : step.done ? 'text-gray-700' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    {step.time && (
                      <p className={`text-xs mt-0.5 ${step.active ? 'text-orange-500 font-semibold' : 'text-gray-500'}`}>
                        {step.time}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Committee approval */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">👥</span>
              <h3 className="font-bold text-gray-800 text-sm">Kelulusan {app.authority}</h3>
            </div>
            <div className="space-y-3 mb-4">
              {committee.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${c.approved ? 'bg-green-500' : 'bg-gray-200'}`}>
                    {c.approved && <span className="text-white text-xs">✓</span>}
                  </div>
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs">👤</div>
                  <span className="text-sm text-gray-700 flex-1">{c.name}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${c.role === 'Pengerusi' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {c.role}
                  </span>
                </div>
              ))}
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-gray-600">Kemajuan Undian</span>
                <span className="font-bold text-gray-700">{approvedCount}/{committee.length} ({pct}%)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="h-2.5 rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
              <Clock className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-orange-700">
                <strong>SLA:</strong> Kelulusan diperlukan dalam 24 jam.<br />
                <strong>Masa berbaki: 18 jam 30 minit</strong>
              </p>
            </div>
          </div>

          {/* Escalation action */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Tindakan Eskalasi</p>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-colors mb-2" style={{ background: '#E65100' }}>
              <Send className="w-4 h-4" /> Hantar Peringatan ke {app.authority}
            </button>
            <button
              onClick={() => navigate('/module3/disbursement')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Senarai
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
