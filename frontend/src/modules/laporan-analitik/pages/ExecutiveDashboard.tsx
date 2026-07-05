import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { RefreshCw, TrendingUp, TrendingDown, AlertTriangle, Brain, ChevronRight } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast, ToastContainer } from "@/components/ui/Toast";
import AiBadge from "@/components/ui/AiBadge";
import api from "@/services/api";

interface KpiData {
  total_portfolio: number;
  approval_rate: number;
  npl_ratio: number;
  disbursement_volume: number;
  total_portfolio_change: number;
  approval_rate_change: number;
  npl_ratio_change: number;
  disbursement_change: number;
  as_of: string;
}

interface TrendPoint {
  period: string;
  disbursements: number;
  approvals: number;
  rejections: number;
  npl_amount: number;
}

interface AiInsight {
  id: string;
  type: "warning" | "opportunity" | "info";
  title: string;
  description: string;
  confidence: number;
  generated_at: string;
}

interface BranchRanking {
  rank: number;
  branch_name: string;
  state: string;
  approval_rate: number;
  npl_ratio: number;
  disbursement_volume: number;
  performance_score: number;
}

const NAVY = "#1B2B5E";
const GREEN = "#2E7D32";
const ORANGE = "#E65100";
const RED = "#C62828";
const PURPLE = "#673AB7";

export default function ExecutiveDashboard() {
  const { t } = useTranslation();
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [branches, setBranches] = useState<BranchRanking[]>([]);
  const [aiInsights, setAiInsights] = useState<AiInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [kpiRes, trendsRes, branchRes, insightRes] = await Promise.all([
        api.get("/dashboard/kpi"),
        api.get(`/dashboard/trends?period=${period}`),
        api.get("/dashboard/branch-performance"),
        api.get("/dashboard/ai-insights"),
      ]);
      setKpi(kpiRes.data.data ?? kpiRes.data);
      setTrends(trendsRes.data.data ?? trendsRes.data);
      setBranches(((branchRes.data.data ?? branchRes.data) as BranchRanking[]).slice(0, 5));
      setAiInsights(((insightRes.data.data ?? insightRes.data) as AiInsight[]).slice(0, 3));
      if (isRefresh) setToast({ message: "Data dikemas kini.", type: "success" });
    } catch {
      setToast({ message: "Gagal memuatkan data dashboard.", type: "error" });
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [period]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const formatRM = (v: number) =>
    v >= 1_000_000 ? `RM ${(v / 1_000_000).toFixed(1)}J` : `RM ${(v / 1_000).toFixed(0)}K`;

  const insightIcon = (type: AiInsight["type"]) => {
    if (type === "warning") return <AlertTriangle size={16} className="text-orange-500" />;
    if (type === "opportunity") return <TrendingUp size={16} className="text-green-600" />;
    return <Brain size={16} className="text-purple-600" />;
  };

  if (loading) return <LoadingSpinner fullPage />;

  const totalApproved = trends.reduce((s, t) => s + (t.approvals || 0), 0);
  const totalRejected = trends.reduce((s, t) => s + (t.rejections || 0), 0);
  const pieData = [
    { name: "Diluluskan", value: totalApproved },
    { name: "Ditolak", value: totalRejected },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {toast && <ToastContainer />}

      <div className="flex items-center justify-between">
        <PageHeader
          title={t("module6.executiveDashboard", "Dashboard Eksekutif")}
          subtitle={kpi ? `Dikemas kini: ${new Date(kpi.as_of).toLocaleString("ms-MY")}` : ""}
        />
        <button onClick={() => fetchAll(true)} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: NAVY }}>
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Memuatkan..." : "Muat Semula"}
        </button>
      </div>

      <div className="flex gap-2">
        {(["monthly", "quarterly", "yearly"] as const).map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              period === p ? "text-white border-transparent" : "bg-white border-gray-300 text-gray-600"
            }`}
            style={period === p ? { backgroundColor: NAVY } : {}}>
            {p === "monthly" ? "Bulanan" : p === "quarterly" ? "Suku Tahunan" : "Tahunan"}
          </button>
        ))}
      </div>

      {kpi && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Jumlah Portfolio" value={formatRM(kpi.total_portfolio)} icon={<TrendingUp size={20} />} colour="navy" />
          <StatCard title="Kadar Kelulusan" value={`${kpi.approval_rate.toFixed(1)}%`} icon={<TrendingUp size={20} />} colour="green" />
          <StatCard title="Nisbah NPL" value={`${kpi.npl_ratio.toFixed(2)}%`} icon={<TrendingDown size={20} />} colour="orange" />
          <StatCard title="Jumlah Pengeluaran" value={formatRM(kpi.disbursement_volume)} icon={<TrendingUp size={20} />} colour="orange" />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: NAVY }}>Trend Pengeluaran Dana</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="disbGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={NAVY} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={NAVY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(((v: number) => formatRM(v)) as any) as any} />
              <Area type="monotone" dataKey="disbursements" stroke={NAVY} fill="url(#disbGrad)"
                strokeWidth={2} name="Pengeluaran" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: NAVY }}>Kelulusan vs Penolakan</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={i === 0 ? GREEN : RED} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: NAVY }}>Trend NPL</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="period" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => formatRM(v)} />
            <Tooltip formatter={(((v: number) => formatRM(v)) as any) as any} />
            <Bar dataKey="npl_amount" fill={RED} name="Jumlah NPL" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: NAVY }}>5 Cawangan Teratas</h3>
            <a href="/dashboard/branch-performance"
              className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: NAVY }}>
              Lihat Semua <ChevronRight size={12} />
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="pb-2 pr-3">#</th>
                  <th className="pb-2 pr-3">Cawangan</th>
                  <th className="pb-2 pr-3">Negeri</th>
                  <th className="pb-2 pr-3 text-right">Kelulusan</th>
                  <th className="pb-2 pr-3 text-right">NPL</th>
                  <th className="pb-2 text-right">Skor</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => (
                  <tr key={b.rank} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 pr-3 font-bold text-gray-400">{b.rank}</td>
                    <td className="py-2 pr-3 font-medium text-gray-800">{b.branch_name}</td>
                    <td className="py-2 pr-3 text-gray-500">{b.state}</td>
                    <td className="py-2 pr-3 text-right">
                      <span className="text-green-700 font-medium">{b.approval_rate.toFixed(1)}%</span>
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <span className="font-medium"
                        style={{ color: b.npl_ratio > 5 ? RED : b.npl_ratio > 3 ? ORANGE : GREEN }}>
                        {b.npl_ratio.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: b.performance_score >= 80 ? GREEN : b.performance_score >= 60 ? ORANGE : RED }}>
                        {b.performance_score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl p-5 border"
          style={{ background: "linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%)", borderColor: "#c4b5fd" }}>
          <div className="flex items-center gap-2 mb-4">
            <Brain size={18} style={{ color: PURPLE }} />
            <h3 className="text-sm font-semibold" style={{ color: PURPLE }}>Pandangan SPPT AI</h3>
            <AiBadge label="Dijana AI" />
          </div>
          {aiInsights.length === 0 ? (
            <p className="text-xs text-gray-500">Tiada pandangan AI tersedia.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {aiInsights.map((insight) => (
                <div key={insight.id} className="bg-white rounded-lg p-3 border" style={{ borderColor: "#e9d5ff" }}>
                  <div className="flex items-start gap-2">
                    {insightIcon(insight.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 leading-tight">{insight.title}</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{insight.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "#ede9fe", color: PURPLE }}>
                          Keyakinan: {(insight.confidence * 100).toFixed(0)}%
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(insight.generated_at).toLocaleDateString("ms-MY")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <a href="/dashboard/predictive"
            className="flex items-center justify-center gap-1 mt-4 text-xs font-medium hover:underline"
            style={{ color: PURPLE }}>
            Lihat Analitik Prediktif Penuh <ChevronRight size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}
