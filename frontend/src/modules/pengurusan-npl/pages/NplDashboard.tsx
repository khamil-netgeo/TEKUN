/**
 * Module 5 — Dashboard NPL & Kutipan Hutang
 * Semua data dari API Laravel + PostgreSQL. Tiada data hardcoded.
 */
import React, { useState } from 'react';
import {
  AlertTriangle, TrendingDown, DollarSign, Activity,
  MessageSquare, Mail, Sparkles, RefreshCw,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import StatCard    from '@/components/ui/StatCard';
import AiBadge     from '@/components/ui/AiBadge';
import PageHeader  from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast }   from '@/components/ui/Toast';
import { useNplDashboard, useAiAutomation } from '../hooks/useNpl';

function fmt(n: number | undefined | null) {
  if (n == null) return '—';
  return new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR', maximumFractionDigits: 0 }).format(n);
}

const CAT_COLOURS = ['#2E7D32', '#E65100', '#F57C00', '#C62828', '#7B1FA2'];

export default function NplDashboard() {
  const { data, loading, error, refetch } = useNplDashboard();
  const { data: ai, loading: aiLoading }  = useAiAutomation();
  const [refreshing, setRefreshing]       = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    toast.success('Data dikemaskini.');
  };

  if (loading) return <LoadingSpinner />;
  if (error)   return (
    <div className="p-8 text-center text-red-600">
      <AlertTriangle className="mx-auto mb-2" size={32} />
      <p>{error}</p>
    </div>
  );

  const categories = data?.categories ?? [];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Dashboard NPL & Kutipan Hutang"
          subtitle="Pemantauan akaun tidak berbayar dan prestasi kutipan"
        />
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: '#1B2B5E' }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Kemaskini
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Jumlah Akaun NPL" value={data?.total_npl ?? 0}
          subtitle="Akaun dalam tunggakan" icon={<AlertTriangle size={20} />} colour="orange" />
        <StatCard title="Kadar NPL" value={`${data?.npl_rate ?? 0}%`}
          subtitle="Nisbah NPL keseluruhan" icon={<TrendingDown size={20} />} colour="orange" />
        <StatCard title="Jumlah Tertunggak" value={fmt(data?.total_outstanding)}
          subtitle="Nilai baki tertunggak" icon={<DollarSign size={20} />} colour="navy" />
        <StatCard title="Kadar Kutipan" value={`${data?.collection_rate ?? 0}%`}
          subtitle={`Kutipan bulan ini: ${fmt(data?.collected_mtd)}`} icon={<Activity size={20} />} colour="green" />
      </div>

      {/* Chart + AI Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#1B2B5E' }}>Pecahan Kategori Akaun NPL</h3>
          {categories.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categories} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(val: number, name: string) =>
                  name === 'count' ? [val, 'Bilangan'] : [fmt(val), 'Nilai (RM)']} />
                <Bar dataKey="count" name="count" radius={[4, 4, 0, 0]}>
                  {categories.map((_: unknown, i: number) => (
                    <Cell key={i} fill={CAT_COLOURS[i % CAT_COLOURS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Tiada data.</div>
          )}
        </div>

        {/* AI Automation Panel */}
        <div className="rounded-xl p-5 flex flex-col gap-4" style={{ background: '#F3E8FF', border: '1.5px solid #673AB7' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold" style={{ color: '#673AB7' }}>Status Automasi Kutipan</h3>
            <AiBadge label="SPPT AI" variant="gradient" />
          </div>
          {aiLoading ? <div className="flex justify-center py-4"><LoadingSpinner /></div> : ai ? (
            <>
              <div className="bg-white rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mesej Dihantar Hari Ini</p>
                {[
                  { icon: <MessageSquare size={14} className="text-green-600" />, label: 'SMS', val: ai.sms_sent },
                  { icon: <MessageSquare size={14} className="text-green-500" />, label: 'WhatsApp', val: ai.whatsapp_sent },
                  { icon: <Mail size={14} className="text-blue-500" />, label: 'E-mel', val: ai.email_sent },
                ].map(({ icon, label, val }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">{icon}<span>{label}</span></div>
                    <span className="font-bold text-sm" style={{ color: '#1B2B5E' }}>{val}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">Jumlah</span>
                  <span className="font-bold" style={{ color: '#673AB7' }}>{ai.total_sent}</span>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Kadar Respons Usahawan</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${Math.min(ai.response_rate, 100)}%`, background: '#673AB7' }} />
                  </div>
                  <span className="text-sm font-bold" style={{ color: '#673AB7' }}>{ai.response_rate}%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{ai.pending_tasks} tugasan menunggu tindakan</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center gap-1 mb-2">
                  <Sparkles size={12} style={{ color: '#673AB7' }} />
                  <p className="text-xs font-semibold" style={{ color: '#673AB7' }}>Cadangan Tindakan Seterusnya</p>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">{ai.ai_next_action}</p>
              </div>
            </>
          ) : <p className="text-xs text-gray-500 text-center py-4">Data automasi tidak tersedia.</p>}
        </div>
      </div>

      {/* Category Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold" style={{ color: '#1B2B5E' }}>Ringkasan Kategori NPL</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Kategori</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Bilangan</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Nilai Tertunggak</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, i) => (
              <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-800">{cat.label}</td>
                <td className="px-5 py-3 text-right font-semibold" style={{ color: CAT_COLOURS[i] }}>{cat.count}</td>
                <td className="px-5 py-3 text-right text-gray-700">{fmt(cat.amount)}</td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={3} className="px-5 py-8 text-center text-gray-400">Tiada data tersedia.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
