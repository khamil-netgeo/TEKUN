import React from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { AlertCircle, Clock, AlertTriangle, Brain, TrendingDown } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { AiBadge } from "@/components/ui/AiBadge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useNplDashboard } from "../hooks/useNpl";

export default function NplDashboard() {
  const { t } = useTranslation();
  const { data, loading, error } = useNplDashboard();

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div className="p-6 text-red-600">
      <AlertCircle className="inline mr-2" />
      {t("npl.dashboard.error", "Ralat memuatkan data NPL")}
    </div>
  );

  const agingData = (data?.categories ?? []).map((c: { label: string; count: number; amount: number }) => ({
    cat: c.label,
    accounts: c.count,
    amount: c.amount,
  }));

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t("npl.dashboard.title", "Dashboard NPL & Kutipan Hutang")}
        subtitle={t("npl.dashboard.subtitle", "Pemantauan akaun tidak lancar dan kutipan")}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t("npl.dashboard.totalNpl", "Jumlah Akaun NPL")}
          value={String(data?.total_npl ?? 0)}
          icon={<AlertCircle className="w-5 h-5 text-red-600" />}
          color="red"
        />
        <StatCard
          title={t("npl.dashboard.nplRate", "Kadar NPL")}
          value={`${data?.npl_rate ?? 0}%`}
          icon={<TrendingDown className="w-5 h-5 text-orange-600" />}
          color="orange"
        />
        <StatCard
          title={t("npl.dashboard.outstanding", "Baki Tertunggak")}
          value={`RM ${Number(data?.total_outstanding ?? 0).toLocaleString("ms-MY", { minimumFractionDigits: 2 })}`}
          icon={<AlertTriangle className="w-5 h-5 text-yellow-600" />}
          color="yellow"
        />
        <StatCard
          title={t("npl.dashboard.collectedMtd", "Kutipan Bulan Ini")}
          value={`RM ${Number(data?.collected_mtd ?? 0).toLocaleString("ms-MY", { minimumFractionDigits: 2 })}`}
          icon={<Clock className="w-5 h-5 text-green-600" />}
          color="green"
        />
      </div>

      {/* Aging Chart */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-[#1B2B5E]">
            {t("npl.dashboard.agingChart", "Analisis Penuaan Akaun")}
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={agingData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="cat" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="accounts" fill="#C62828" name={t("npl.dashboard.accounts", "Akaun")} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* AI Insight Panel */}
      {data?.ai_prediction && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-purple-700" />
            <h3 className="font-semibold text-purple-800">
              {t("npl.dashboard.aiInsight", "Ramalan AI")}
            </h3>
            <AiBadge label="AI" />
          </div>
          <p className="text-purple-900 text-sm">{data.ai_prediction}</p>
        </div>
      )}
    </div>
  );
}
