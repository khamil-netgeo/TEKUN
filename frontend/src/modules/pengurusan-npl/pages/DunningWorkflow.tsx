import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Send, Filter, Brain, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { AiBadge } from "@/components/ui/AiBadge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/Toast";
import { useDunningList } from "../hooks/useNpl";
import api from "@/lib/api";

const STAGE_OPTIONS = [
  { value: "", label: "Semua Peringkat" },
  { value: "stage1", label: "Peringkat 1 (1-30 hari)" },
  { value: "stage2", label: "Peringkat 2 (31-90 hari)" },
  { value: "stage3", label: "Peringkat 3 (91-180 hari)" },
  { value: "stage4", label: "Peringkat 4 (>180 hari)" },
];

export default function DunningWorkflow() {
  const { t } = useTranslation();
  const [stageFilter, setStageFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sending, setSending] = useState(false);

  const { data: dunningRecords, loading, error, refetch } = useDunningList(stageFilter);

  const handleSendDunning = async () => {
    if (selectedIds.length === 0) {
      toast({ type: "warning", message: t("npl.dunning.selectFirst", "Sila pilih akaun terlebih dahulu") });
      return;
    }
    setSending(true);
    try {
      // Send dunning for each selected account
      let totalSent = 0;
      for (const id of selectedIds) {
        const res = await api.post(`/collections/dunning/${id}`, { channel: "sms" });
        totalSent += res.data?.notis_sent ?? 0;
      }
      toast({ type: "success", message: t("npl.dunning.sent", `${totalSent} notis dihantar berjaya`) });
      setSelectedIds([]);
      refetch();
    } catch {
      toast({ type: "error", message: t("npl.dunning.error", "Ralat menghantar notis") });
    } finally {
      setSending(false);
    }
  };

  const columns = [
    {
      key: "account_no",
      header: t("npl.dunning.accountNo", "No. Akaun"),
      render: (row: { account_no: string }) => (
        <span className="font-mono text-sm">{row.account_no}</span>
      ),
    },
    {
      key: "borrower_name",
      header: t("npl.dunning.borrower", "Nama Peminjam"),
    },
    {
      key: "days_overdue",
      header: t("npl.dunning.daysOverdue", "Hari Tertunggak"),
      render: (row: { days_overdue: number }) => (
        <span className={`font-semibold ${row.days_overdue > 90 ? "text-red-600" : row.days_overdue > 30 ? "text-orange-600" : "text-yellow-600"}`}>
          {row.days_overdue} {t("common.days", "hari")}
        </span>
      ),
    },
    {
      key: "outstanding",
      header: t("npl.dunning.outstanding", "Baki Tertunggak"),
      render: (row: { outstanding: number | string }) => (
        <span className="font-semibold text-red-700">
          RM {Number(row.outstanding).toLocaleString("ms-MY", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "dunning_stage",
      header: t("npl.dunning.stage", "Peringkat Dunning"),
      render: (row: { dunning_stage: string }) => {
        const stageColors: Record<string, string> = {
          stage1: "bg-yellow-100 text-yellow-800",
          stage2: "bg-orange-100 text-orange-800",
          stage3: "bg-red-100 text-red-800",
          stage4: "bg-red-900 text-white",
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${stageColors[row.dunning_stage] ?? "bg-gray-100 text-gray-700"}`}>
            {row.dunning_stage?.toUpperCase() ?? "-"}
          </span>
        );
      },
    },
    {
      key: "ai_risk_level",
      header: t("npl.dunning.aiRisk", "Risiko AI"),
      render: (row: { ai_risk_level: string }) =>
        row.ai_risk_level ? (
          <div className="flex items-center gap-1">
            <Brain className="w-4 h-4 text-purple-600" />
            <AiBadge label={row.ai_risk_level} />
          </div>
        ) : null,
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div className="p-6 text-red-600">
      <AlertCircle className="inline mr-2" />
      {t("npl.dunning.loadError", "Ralat memuatkan senarai dunning")}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t("npl.dunning.title", "Aliran Kerja Dunning")}
        subtitle={t("npl.dunning.subtitle", "Urus notis tuntutan dan susulan akaun NPL")}
      />

      {/* Filter & Actions */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl shadow p-4">
        <Filter className="w-4 h-4 text-gray-500" />
        <select
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2B5E]"
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
        >
          {STAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <div className="ml-auto flex gap-2">
          <button
            onClick={handleSendDunning}
            disabled={sending || selectedIds.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#1B2B5E] text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[#152347] transition-colors"
          >
            <Send className="w-4 h-4" />
            {sending
              ? t("npl.dunning.sending", "Menghantar...")
              : t("npl.dunning.sendSelected", `Hantar Notis (${selectedIds.length})`)}
          </button>
        </div>
      </div>

      {/* Dunning Table */}
      <DataTable
        columns={columns}
        data={dunningRecords}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        rowKey="id"
      />
    </div>
  );
}
