import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Send, Filter } from 'lucide-react';
import DataTable, { type Column } from '@/components/ui/DataTable';
import AiBadge       from '@/components/ui/AiBadge';
import PageHeader    from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast }     from '@/components/ui/Toast';
import { useDunningList, useSendDunning, type DunningRecord } from '../hooks/useNpl';

function fmt(n: number | string | undefined | null) {
  const num = typeof n === 'string' ? parseFloat(n) : (n ?? 0);
  return new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR', maximumFractionDigits: 0 }).format(num);
}

function getDunningStage(days: number): string {
  if (days > 90)  return 'stage3';
  if (days > 60)  return 'stage2';
  if (days >= 30) return 'stage1';
  return 'none';
}

function TahapBadge({ days }: { days: number }) {
  const { t } = useTranslation();
  const stage = getDunningStage(days);
  
  if (stage === 'stage3') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: '#FFEBEE', color: '#C62828' }}>
      🔴 {t('Tindakan Undang-undang')}
    </span>
  );
  if (stage === 'stage2') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: '#FFF3E0', color: '#E65100' }}>
      🟠 {t('Panggilan Telefon')}
    </span>
  );
  if (stage === 'stage1') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: '#FFFDE7', color: '#F57F17' }}>
      🟡 {t('SMS/WhatsApp Automatik')}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
      — {t('Tiada Tindakan')}
    </span>
  );
}

function RiskBadge({ level }: { level: string }) {
  const { t } = useTranslation();
  const colours: Record<string, { bg: string; text: string }> = {
    Tinggi:    { bg: '#FFEBEE', text: '#C62828' },
    Sederhana: { bg: '#FFF3E0', text: '#E65100' },
    Rendah:    { bg: '#E8F5E9', text: '#2E7D32' },
  };
  const c = colours[level] ?? { bg: '#F3E8FF', text: '#673AB7' };
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.text }}>
      {level ? t(level) : '—'}
    </span>
  );
}

export default function DunningWorkflow() {
  const { t } = useTranslation();
  const [selectedStage, setSelectedStage] = useState('');
  const [sendingId, setSendingId]         = useState<number | null>(null);
  const { data, total, loading, error, refetch } = useDunningList(selectedStage || undefined);
  const { send } = useSendDunning();

  const STAGE_FILTERS = [
    { label: t('Semua'), value: '' },
    { label: t('🟡 Level 1 (30-60 hari)'), value: 'stage1' },
    { label: t('🟠 Level 2 (61-90 hari)'), value: 'stage2' },
    { label: t('🔴 Level 3 (>90 hari)'),   value: 'stage3' },
  ];

  const handleSendDunning = async (record: DunningRecord) => {
    setSendingId(record.id);
    const stage   = getDunningStage(record.days_overdue);
    const channel = stage === 'stage1' ? 'sms' : stage === 'stage2' ? 'phone' : 'letter';
    const result  = await send(record.id, channel);
    setSendingId(null);
    if (result) {
      toast.success(t('Notis dunning dihantar kepada {{name}} melalui {{channel}}.', { name: record.borrower_name, channel: channel.toUpperCase() }));
      refetch();
    } else {
      toast.error(t('Gagal menghantar notis dunning. Sila cuba lagi.'));
    }
  };

  const columns: Column<DunningRecord>[] = [
    {
      key: 'account_no',
      header: t('No. Akaun'),
      render: (row) => <span className="font-mono text-xs font-semibold" style={{ color: '#1B2B5E' }}>{row.account_no}</span>,
    },
    {
      key: 'borrower_name',
      header: t('Nama Peminjam'),
      render: (row) => <span className="font-medium text-gray-800">{row.borrower_name}</span>,
    },
    {
      key: 'days_overdue',
      header: t('Hari Tunggakan'),
      align: 'center',
      render: (row) => (
        <span className="font-bold" style={{ color: row.days_overdue > 90 ? '#C62828' : row.days_overdue > 60 ? '#E65100' : '#F57F17' }}>
          {row.days_overdue} {t('hari')}
        </span>
      ),
    },
    {
      key: 'dunning_stage',
      header: t('Tahap Tindakan'),
      render: (row) => <TahapBadge days={row.days_overdue} />,
    },
    {
      key: 'outstanding',
      header: t('Baki Tertunggak'),
      align: 'right',
      render: (row) => <span className="font-semibold text-gray-700">{fmt(row.outstanding)}</span>,
    },
    {
      key: 'ai_risk_level',
      header: t('Risiko AI'),
      render: (row) => (
        <div className="flex flex-col gap-1">
          <RiskBadge level={row.ai_risk_level} />
          <AiBadge size="xs" />
        </div>
      ),
    },
    {
      key: 'id',
      header: t('Tindakan'),
      render: (row) => (
        <button
          onClick={() => handleSendDunning(row)}
          disabled={sendingId === row.id}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: '#1B2B5E' }}
        >
          <Send size={12} />
          {sendingId === row.id ? t('Menghantar...') : t('Hantar Notis')}
        </button>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error)   return (
    <div className="p-8 text-center text-red-600">
      <AlertTriangle className="mx-auto mb-2" size={32} />
      <p>{error}</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t('Aliran Kerja Dunning')}
        subtitle={t('Pengurusan notis kutipan mengikut tahap eskalasi')}
      />
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <Filter size={14} />
          <span>{t('Tapis Tahap:')}</span>
        </div>
        {STAGE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setSelectedStage(f.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
            style={selectedStage === f.value
              ? { background: '#1B2B5E', color: 'white', borderColor: '#1B2B5E' }
              : { background: 'white', color: '#374151', borderColor: '#D1D5DB' }}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-500">{total} {t('rekod ditemui')}</span>
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-blue-800 mb-2">{t('Panduan Tahap Eskalasi Tindakan')}</p>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
            <span><strong>{t('Level 1 (30–60 hari):')}</strong> {t('SMS/WhatsApp Automatik')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
            <span><strong>{t('Level 2 (61–90 hari):')}</strong> {t('Panggilan Telefon')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 inline-block" />
            <span><strong>{t('Level 3 (>90 hari):')}</strong> {t('Tindakan Undang-undang')}</span>
          </div>
        </div>
      </div>
      <DataTable<DunningRecord>
        columns={columns}
        data={data}
        loading={loading}
        rowKey={(row) => row.id}
        emptyMessage={t('Tiada rekod dunning ditemui.')}
      />
    </div>
  );
}