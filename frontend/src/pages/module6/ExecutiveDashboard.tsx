import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { RefreshCw, Bell, Brain } from "lucide-react";

const monthlyDisbursement = [
  { month: "Jan 2026", amount: 280 }, { month: "Feb 2026", amount: 320 },
  { month: "Mac 2026", amount: 310 }, { month: "Apr 2026", amount: 350 },
  { month: "Mei 2026", amount: 370 }, { month: "Jun 2026", amount: 390 },
  { month: "Jul 2026", amount: 420 },
];

const collectionTrend = [
  { month: "Jan 2026", rate: 74.0 }, { month: "Feb 2026", rate: 75.6 },
  { month: "Mac 2026", rate: 77.2 }, { month: "Apr 2026", rate: 79.3 },
  { month: "Mei 2026", rate: 81.2 }, { month: "Jun 2026", rate: 87.3 },
  { month: "Jul 2026", rate: 89.4 },
];

const portfolio = [
  { name: "Lancar", value: 92.3, color: "#2E7D32" },
  { name: "Perhatian Khusus", value: 5.6, color: "#F9A825" },
  { name: "Tidak Lancar", value: 1.7, color: "#E65100" },
  { name: "NPL", value: 0.4, color: "#C62828" },
];

const topBranches = [
  { name: "Cawangan KL Sentral", rate: 94 },
  { name: "Cawangan Johor Bahru", rate: 92 },
  { name: "Cawangan Pulau Pinang", rate: 90 },
  { name: "Cawangan Shah Alam", rate: 88 },
  { name: "Cawangan Ipoh", rate: 86 },
  { name: "Cawangan Kota Bharu", rate: 85 },
  { name: "Cawangan Melaka", rate: 83 },
  { name: "Cawangan Kuching", rate: 82 },
  { name: "Cawangan Alor Setar", rate: 80 },
  { name: "Cawangan Seremban", rate: 79 },
];

export default function ExecutiveDashboard() {
  const now = new Date().toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold" style={{ color: "#1B2B5E" }}>Dashboard Eksekutif TEKUN SPPT</h1>
          <span className="text-base font-semibold" style={{ color: "#6B7280" }}>| Julai 2026</span>
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold text-white" style={{ background: "#2E7D32" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs" style={{ color: "#6B7280" }}>
          <RefreshCw size={14} /> Dikemas kini: {now}
          <Bell size={16} />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex items-center gap-4">
        {[["Negeri","Semua Negeri"],["Cawangan","Semua Cawangan"],["Tempoh","Julai 2026"]].map(([label, val]) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>{label}</span>
            <select className="text-xs border rounded px-3 py-1.5" style={{ borderColor: "#E5E7EB" }}><option>{val}</option></select>
          </div>
        ))}
        <button className="ml-auto flex items-center gap-1 text-xs px-4 py-1.5 rounded font-bold text-white" style={{ background: "#1B2B5E" }}>
          <RefreshCw size={12} /> Kemaskini
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Jumlah Agihan Dana", value: "RM 4.2 Bilion", change: "+12.3% vs bulan lalu", color: "#1B2B5E", bg: "#EEF2FF", icon: "💰" },
          { label: "Kadar Kutipan", value: "89.4%", change: "+2.1%", color: "#2E7D32", bg: "#E8F5E9", icon: "📈" },
          { label: "Nisbah NPL", value: "1.8%", change: "-0.3% (Baik)", color: "#E65100", bg: "#FFF3E0", icon: "🛡️" },
          { label: "Permohonan Baharu", value: "1,247", change: "Bulan Ini", color: "#7C3AED", bg: "#EDE9FE", icon: "📋" },
          { label: "Kadar Kelulusan", value: "73.2%", change: "+5.4%", color: "#0097A7", bg: "#E0F7FA", icon: "✅" },
        ].map((c) => (
          <div key={c.label} className="rounded-xl p-4 text-white" style={{ background: c.color }}>
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-semibold opacity-80">{c.label}</p>
              <span className="text-xl">{c.icon}</span>
            </div>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-xs mt-1 opacity-70">{c.change}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-sm mb-3" style={{ color: "#1B2B5E" }}>1. Agihan Dana Bulanan (RM Juta)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyDisbursement} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} domain={[0, 500]} />
              <Tooltip formatter={(v) => [`RM ${v}M`, "Agihan"]} contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="amount" fill="#1B2B5E" radius={[4, 4, 0, 0]} label={{ position: "top", fontSize: 9, fill: "#9CA3AF" }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-sm mb-3" style={{ color: "#1B2B5E" }}>2. Komposisi Portfolio</h3>
          <div className="flex items-center gap-4">
            <PieChart width={160} height={160}>
              <Pie data={portfolio} cx={75} cy={75} innerRadius={50} outerRadius={75} dataKey="value" startAngle={90} endAngle={-270}>
                {portfolio.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
            </PieChart>
            <div className="flex-1 space-y-2">
              <p className="text-xs font-semibold" style={{ color: "#6B7280" }}>Jumlah Portfolio</p>
              <p className="text-sm font-bold" style={{ color: "#1B2B5E" }}>RM 4.20 Bilion</p>
              {portfolio.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                    <span style={{ color: "#374151" }}>{p.name}</span>
                  </div>
                  <span className="font-semibold" style={{ color: p.color }}>{p.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-sm mb-3" style={{ color: "#1B2B5E" }}>3. Trend Kadar Kutipan (%)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={collectionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} domain={[60, 100]} />
              <Tooltip formatter={(v) => [`${v}%`, "Kadar Kutipan"]} contentStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="rate" stroke="#2E7D32" strokeWidth={2.5} dot={{ fill: "#2E7D32", r: 4 }} label={{ position: "top", fontSize: 9, fill: "#9CA3AF" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm" style={{ color: "#1B2B5E" }}>4. Prestasi Top 10 Cawangan</h3>
            <span className="text-xs" style={{ color: "#6B7280" }}>Kadar Kutipan (%)</span>
          </div>
          <div className="space-y-2">
            {topBranches.map((b, i) => (
              <div key={b.name} className="flex items-center gap-2 text-xs">
                <span className="w-4 text-right flex-shrink-0" style={{ color: "#9CA3AF" }}>{i + 1}.</span>
                <span className="flex-1 truncate" style={{ color: "#374151" }}>{b.name}</span>
                <div className="w-32 h-2 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                  <div className="h-full rounded-full" style={{ width: `${b.rate}%`, background: "#1B2B5E" }} />
                </div>
                <span className="w-8 text-right font-semibold" style={{ color: "#1B2B5E" }}>{b.rate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insight + Export */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#EDE9FE" }}>
          <Brain size={20} style={{ color: "#7C3AED" }} />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold" style={{ color: "#7C3AED" }}>AI Insight:</p>
          <p className="text-sm" style={{ color: "#374151" }}>Cawangan Kelantan menunjukkan peningkatan NPL 0.8% dalam 30 hari. Tindakan segera disyorkan.</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button className="flex items-center gap-1 text-xs px-3 py-1.5 rounded font-semibold text-white" style={{ background: "#C62828" }}>📄 Eksport PDF</button>
          <button className="flex items-center gap-1 text-xs px-3 py-1.5 rounded font-semibold text-white" style={{ background: "#2E7D32" }}>📊 Eksport Excel</button>
        </div>
      </div>
    </div>
  );
}
