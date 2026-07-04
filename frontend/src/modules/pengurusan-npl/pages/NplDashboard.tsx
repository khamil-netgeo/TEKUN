import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CheckCircle, AlertCircle, Clock, AlertTriangle, Brain } from "lucide-react";

const agingData = [
  { cat: "Lancar (0)", accounts: 1234, amount: 18200000 },
  { cat: "Perhatian (1-30)", accounts: 89, amount: 1100000 },
  { cat: "Tidak Lancar (31-90)", accounts: 34, amount: 456000 },
  { cat: "NPL Sub (91-180)", accounts: 8, amount: 112000 },
  { cat: "NPL Doubtful (181-365)", accounts: 3, amount: 54000 },
  { cat: "NPL Loss (>365)", accounts: 1, amount: 23000 },
];

const collectionTrend = [
  { month: "Ogo 25", rate: 74 }, { month: "Sep 25", rate: 78 }, { month: "Okt 25", rate: 81 },
  { month: "Nov 25", rate: 83 }, { month: "Dis 25", rate: 79 }, { month: "Jan 26", rate: 82 },
  { month: "Feb 26", rate: 84 }, { month: "Mac 26", rate: 85 }, { month: "Apr 26", rate: 87 },
  { month: "Mei 26", rate: 86 }, { month: "Jun 26", rate: 88 }, { month: "Jul 26", rate: 89 },
];

const actionColors: Record<string, string> = {
  "Auto-Peringatan Aktif": "#2E7D32",
  "Notis 1 Dihantar": "#1565C0",
  "Notis 2 Dihantar": "#E65100",
  "Notis 3 + Panggilan": "#C62828",
  "Rujuk Peguam Panel": "#7C3AED",
  "Tindakan Undang-undang": "#B71C1C",
};

export default function NplDashboard() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: "#1B2B5E" }}>
          Dashboard Kutipan & NPL — Cawangan Kuala Lumpur | Julai 2026
        </h1>
        <div className="flex items-center gap-2">
          <select className="text-xs border rounded px-3 py-1.5" style={{ borderColor: "#E5E7EB" }}>
            <option>Julai 2026</option><option>Jun 2026</option>
          </select>
          <button className="text-xs px-3 py-1.5 rounded border" style={{ borderColor: "#E5E7EB" }}>Tapis</button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Akaun Lancar", value: "1,234", sub: "akaun", money: "RM 18.2 Juta", icon: CheckCircle, color: "#2E7D32", bg: "#E8F5E9" },
          { label: "Perhatian Khusus", sub2: "(1-30 hari)", value: "89", sub: "akaun", money: "RM 1.1 Juta", icon: AlertCircle, color: "#F9A825", bg: "#FFFDE7" },
          { label: "Tidak Lancar", sub2: "(31-90 hari)", value: "34", sub: "akaun", money: "RM 456K", icon: Clock, color: "#E65100", bg: "#FFF3E0" },
          { label: "NPL", sub2: "(>90 hari)", value: "12", sub: "akaun", money: "RM 189K", icon: AlertTriangle, color: "#C62828", bg: "#FFEBEE" },
          { label: "Dijangka NPL", sub2: "(AI Prediction)", value: "8", sub: "akaun", money: "RM 98K — Risiko Tinggi", icon: Brain, color: "#7C3AED", bg: "#EDE9FE" },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs font-semibold" style={{ color: c.color }}>{c.label}</p>
                  {c.sub2 && <p className="text-xs" style={{ color: "#9CA3AF" }}>{c.sub2}</p>}
                </div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: c.bg }}>
                  <Icon size={18} style={{ color: c.color }} />
                </div>
              </div>
              <p className="text-3xl font-bold" style={{ color: c.color }}>{c.value}</p>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>{c.sub}</p>
              <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: c.color }}>
                <span>💰</span><span>{c.money}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Aging Table */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-sm" style={{ color: "#1B2B5E" }}>Analisis Penuaan Akaun (Aging Analysis)</h2>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  {["Kategori","Bil Akaun","Jumlah Tertunggak","% Portfolio","Tindakan AI"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: "#6B7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { cat: "Lancar (0 hari)", color: "#2E7D32", accounts: "1,234", amount: "RM 18.2M", pct: "92.3%", action: "Auto-Peringatan Aktif" },
                  { cat: "Perhatian Khusus (1-30)", color: "#F9A825", accounts: "89", amount: "RM 1.1M", pct: "5.6%", action: "Notis 1 Dihantar" },
                  { cat: "Tidak Lancar (31-90)", color: "#E65100", accounts: "34", amount: "RM 456K", pct: "1.7%", action: "Notis 2 Dihantar" },
                  { cat: "NPL Substandard (91-180)", color: "#C62828", accounts: "8", amount: "RM 112K", pct: "0.3%", action: "Notis 3 + Panggilan" },
                  { cat: "NPL Doubtful (181-365)", color: "#C62828", accounts: "3", amount: "RM 54K", pct: "0.1%", action: "Rujuk Peguam Panel" },
                  { cat: "NPL Loss (>365)", color: "#B71C1C", accounts: "1", amount: "RM 23K", pct: "0.0%", action: "Tindakan Undang-undang" },
                ].map((row) => (
                  <tr key={row.cat} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: row.color }} />
                      <span style={{ color: "#374151" }}>{row.cat}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: "#111827" }}>{row.accounts}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: "#111827" }}>{row.amount}</td>
                    <td className="px-4 py-3" style={{ color: "#6B7280" }}>{row.pct}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold text-white" style={{ background: actionColors[row.action] || "#6B7280" }}>
                        {row.action}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Collection Trend Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-bold text-sm mb-3" style={{ color: "#1B2B5E" }}>Kadar Kutipan Bulanan (%)</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={collectionTrend} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} domain={[60, 100]} />
                <Tooltip formatter={(v) => [`${v}%`, "Kadar Kutipan"]} contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="rate" fill="#1B2B5E" radius={[3, 3, 0, 0]} label={{ position: "top", fontSize: 8, fill: "#9CA3AF" }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Automation Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm" style={{ color: "#1B2B5E" }}>Status Automasi Kutipan AI</h3>
            <span className="text-xs" style={{ color: "#6B7280" }}>ⓘ</span>
          </div>
          <div className="space-y-4">
            {[
              { level: 1, title: "Notis SMS Automatik", detail: "Dihantar kepada 89 akaun", rate: "Kadar Respons: 67%", color: "#2E7D32", icon: "💬" },
              { level: 2, title: "Surat Tuntutan Rasmi", detail: "Dihantar kepada 34 akaun", rate: "Kadar Respons: 45%", color: "#E65100", icon: "✉️" },
              { level: 3, title: "Notis Muktamad + Panggilan", detail: "8 akaun", rate: "Kadar Respons: 23%", color: "#C62828", icon: "📞" },
            ].map((item) => (
              <div key={item.level} className="flex items-start gap-3 p-3 rounded-xl border" style={{ borderColor: "#F3F4F6" }}>
                <div className="flex-shrink-0">
                  <div className="text-xs font-bold" style={{ color: "#9CA3AF" }}>LEVEL</div>
                  <div className="text-2xl font-bold" style={{ color: item.color }}>{item.level}</div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: item.color }}>{item.title}</p>
                  <p className="text-xs mt-1" style={{ color: "#6B7280" }}>• {item.detail}</p>
                  <p className="text-xs" style={{ color: "#6B7280" }}>• {item.rate}</p>
                </div>
                <span className="text-xl">{item.icon}</span>
              </div>
            ))}
          </div>

          {/* AI Prediction Banner */}
          <div className="mt-4 p-3 rounded-xl" style={{ background: "#EDE9FE" }}>
            <div className="flex items-start gap-2">
              <span className="text-lg flex-shrink-0">🤖</span>
              <div className="flex-1">
                <p className="text-xs font-semibold" style={{ color: "#7C3AED" }}>AI</p>
                <p className="text-xs mt-1" style={{ color: "#374151" }}>
                  AI menjangkakan <strong>8 akaun berisiko NPL</strong> dalam 30 hari. Tindakan segera diperlukan.
                </p>
              </div>
              <button className="text-xs px-2 py-1 rounded font-bold text-white flex-shrink-0" style={{ background: "#C62828" }}>Risiko Tinggi</button>
            </div>
          </div>
          <p className="text-xs mt-3" style={{ color: "#9CA3AF" }}>ⓘ Model AI dikemas kini setiap hari berdasarkan data terkini.</p>
        </div>
      </div>
    </div>
  );
}
