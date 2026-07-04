import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { FileText, Clock, CheckCircle, AlertTriangle, ChevronRight, Brain } from 'lucide-react';

const PRIORITY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  kritikal: { bg: '#C62828', text: '#fff', label: 'KRITIKAL' },
  tinggi:   { bg: '#E65100', text: '#fff', label: 'TINGGI' },
  sederhana:{ bg: '#F9A825', text: '#000', label: 'SEDERHANA' },
  normal:   { bg: '#1565C0', text: '#fff', label: 'NORMAL' },
  rendah:   { bg: '#6B7280', text: '#fff', label: 'RENDAH' },
};

const taskInbox = [
  { ref: 'SPPT-2026-07-00089', name: 'Siti Nurhaliza', scheme: 'TEKUN Usahawan', amount: 25000, received: '2 jam lalu', aiScore: 78, priority: 'kritikal' },
  { ref: 'SPPT-2026-07-00090', name: 'Ahmad Faizal', scheme: 'TEKUN Micro', amount: 8000, received: '3 jam lalu', aiScore: 52, priority: 'tinggi' },
  { ref: 'SPPT-2026-07-00091', name: 'Nor Aisyah', scheme: 'TEKUN Wanita', amount: 15000, received: '4 jam lalu', aiScore: 48, priority: 'sederhana' },
  { ref: 'SPPT-2026-07-00092', name: 'Muhammad Hafiz', scheme: 'TEKUN Micro', amount: 12000, received: '5 jam lalu', aiScore: 66, priority: 'sederhana' },
  { ref: 'SPPT-2026-07-00093', name: 'Intan Puspita', scheme: 'TEKUN Usahawan', amount: 30000, received: '6 jam lalu', aiScore: 72, priority: 'normal' },
  { ref: 'SPPT-2026-07-00094', name: 'Raja Imran', scheme: 'TEKUN Micro', amount: 6000, received: '7 jam lalu', aiScore: 45, priority: 'normal' },
  { ref: 'SPPT-2026-07-00095', name: 'Farah Ayuni', scheme: 'TEKUN Wanita', amount: 10000, received: '8 jam lalu', aiScore: 61, priority: 'rendah' },
  { ref: 'SPPT-2026-07-00096', name: 'Azlan Shah', scheme: 'TEKUN Usahawan', amount: 18000, received: '9 jam lalu', aiScore: 70, priority: 'rendah' },
];

const performanceData = [
  { time: '8 AM', value: 1 }, { time: '9 AM', value: 2 }, { time: '10 AM', value: 3 },
  { time: '11 AM', value: 4 }, { time: '12 PM', value: 5 }, { time: '1 PM', value: 5 },
  { time: '2 PM', value: 5 }, { time: '3 PM', value: 5 }, { time: '4 PM', value: 5 }, { time: '5 PM', value: 5 },
];

const aiNotifications = [
  { icon: "\u{1F550}", message: 'Permohonan SPPT-00089 menunggu >4 jam', time: '2 jam lalu', color: '#E65100' },
  { icon: "\u26A0\uFE0F", message: 'Skor kredit borderline: SPPT-00090 perlu semakan manual', time: '3 jam lalu', color: '#F9A825' },
  { icon: "\u{1F4C4}", message: 'Dokumen tidak lengkap: SPPT-00091', time: '4 jam lalu', color: '#6B7280' },
];

export default function CreditDashboard() {
  const [filter, setFilter] = useState("Hari Ini");
  const today = new Date().toLocaleDateString("ms-MY", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "#1B2B5E" }}>Selamat Pagi, Ahmad Zulkifli</h1>
        <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>Pegawai Penilai Kredit &nbsp;|&nbsp; Cawangan Kuala Lumpur &nbsp;|&nbsp; {today}</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Permohonan Baharu", value: 8, sub: "Perlu Dinilai Hari Ini", icon: FileText, color: "#1B2B5E", bg: "#EEF2FF" },
          { label: "Dalam Penilaian", value: 12, sub: "Sedang Diproses", icon: Clock, color: "#E65100", bg: "#FFF3E0" },
          { label: "Selesai Hari Ini", value: 5, sub: "Dihantar ke Kelulusan", icon: CheckCircle, color: "#2E7D32", bg: "#E8F5E9" },
          { label: "Tertunggak (>2 hari)", value: 3, sub: "Perlukan Perhatian Segera", icon: AlertTriangle, color: "#C62828", bg: "#FFEBEE" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold mb-1" style={{ color: card.color }}>{card.label}</p>
                  <p className="text-4xl font-bold" style={{ color: card.color }}>{card.value}</p>
                  <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{card.sub}</p>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: card.bg }}>
                  <Icon size={22} style={{ color: card.color }} />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 text-xs" style={{ color: card.color }}>
                <span>Lihat Semua</span><ChevronRight size={12} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm" style={{ color: "#1B2B5E" }}>Peti Masuk Tugasan (AI-Prioritized)</h2>
              <span className="text-xs px-2 py-0.5 rounded-full text-white font-bold" style={{ background: "#7C3AED" }}>AI</span>
            </div>
            <button className="text-xs flex items-center gap-1 font-medium" style={{ color: "#1B2B5E" }}>Lihat Semua <ChevronRight size={12} /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  {["Keutamaan","No Permohonan","Pemohon","Skim","Jumlah","Masa Terima","Status AI","Tindakan"].map(h => (
                    <th key={h} className="px-3 py-3 text-left font-semibold" style={{ color: "#6B7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {taskInbox.map((row) => {
                  const p = PRIORITY_COLORS[row.priority];
                  const scoreColor = row.aiScore >= 70 ? "#2E7D32" : row.aiScore >= 50 ? "#F9A825" : "#C62828";
                  return (
                    <tr key={row.ref} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-3"><span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: p.bg, color: p.text }}>{p.label}</span></td>
                      <td className="px-3 py-3 font-mono" style={{ color: "#1B2B5E" }}>{row.ref}</td>
                      <td className="px-3 py-3 font-medium" style={{ color: "#111827" }}>{row.name}</td>
                      <td className="px-3 py-3" style={{ color: "#6B7280" }}>{row.scheme}</td>
                      <td className="px-3 py-3 font-semibold">RM {row.amount.toLocaleString()}</td>
                      <td className="px-3 py-3" style={{ color: "#9CA3AF" }}>{row.received}</td>
                      <td className="px-3 py-3"><span className="px-2 py-0.5 rounded text-xs font-semibold text-white" style={{ background: scoreColor }}>Skor AI: {row.aiScore}/100</span></td>
                      <td className="px-3 py-3"><button className="px-3 py-1.5 rounded text-xs font-bold text-white" style={{ background: "#1B2B5E" }}>Nilai</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm" style={{ color: "#1B2B5E" }}>Prestasi Hari Ini</h3>
              <select className="text-xs border rounded px-2 py-1" style={{ color: "#6B7280" }} value={filter} onChange={e => setFilter(e.target.value)}>
                <option>Hari Ini</option><option>Minggu Ini</option>
              </select>
            </div>
            <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>Sasaran: 12</p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={performanceData} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 8, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 8, fill: "#9CA3AF" }} axisLine={false} tickLine={false} domain={[0, 14]} />
                <ReferenceLine y={12} stroke="#E65100" strokeDasharray="4 4" />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="value" fill="#1B2B5E" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm" style={{ color: "#1B2B5E" }}>Notifikasi AI</h3>
              <span className="text-xs px-2 py-0.5 rounded-full text-white font-bold" style={{ background: "#7C3AED" }}>AI</span>
            </div>
            <div className="space-y-2">
              {aiNotifications.map((n, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: "#F9FAFB" }}>
                  <span className="text-sm flex-shrink-0">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ color: "#374151" }}>{n.message}</p>
                    <p className="text-xs mt-0.5" style={{ color: n.color }}>{n.time}</p>
                  </div>
                  <ChevronRight size={12} style={{ color: "#9CA3AF", flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#EDE9FE" }}>
          <Brain size={20} style={{ color: "#7C3AED" }} />
        </div>
        <p className="text-sm flex-1" style={{ color: "#374151" }}>
          AI telah mengagihkan <strong>8 permohonan baharu</strong> mengikut beban kerja dan kepakaran anda.
        </p>
        <button className="text-xs px-3 py-1.5 rounded border font-medium" style={{ color: "#7C3AED", borderColor: "#7C3AED" }}>Maklumat Lanjut ⓘ</button>
      </div>
    </div>
  );
}
