/**
 * Module 3 — Pengeluaran Dana
 * AgingEscalation.tsx — SLA aging dashboard with real API and escalation actions.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Clock, CheckCircle, RefreshCw, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import StatCard from '../../../components/ui/StatCard';
import AiBadge from '../../../components/ui/AiBadge';
import PageHeader from '../../../components/ui/PageHeader';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import disbursementService, { type AgingRecord, type AgingSummary } from '../services/disbursementService';

const SLA_COLOURS: Record<string, string> = {
  KRITIKAL: 'bg-red-100 text-red-800 border-red-200',
  AMARAN: 'bg-orange-100 text-orange-800 border-orange-200',
  NORMAL: 'bg-green-100 text-green-800 border-green-200',
};

const ROW_COLOURS: Record<string, string> = {
  KRITIKAL: 'bg-red-50 border-l-4 border-l-red-500',
  AMARAN: 'bg-orange-50 border-l-4 border-l-orange-400',
  NORMAL: '',
};

export default function AgingEscalation() {
  const [records, setRecords] = useState<AgingRecord[]>([]);
  const [summary, setSummary] = useState<AgingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [escalatingId, setEscalatingId] = useState<number | null>(null);
  const [filterSla, setFilterSla] = useState<string>('');

  const fetchAging = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await disbursementService.getAgingReport();
      setRecords(res.data);
      setSummary(res.summary);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Gagal memuatkan laporan penuaan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAging();
  }, [fetchAging]);

  const handleEscalate = async (id: number, refNo: string) => {
    setEscalatingId(id);
    try {
      await disbursementService.escalate(id);
      toast.success(`Fail ${refNo} berjaya dieskalasi.`);
      fetchAging();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Gagal mengekskalasi fail.');
    } finally {
      setEscalatingId(null);
    }
  };

  const filtered = filterSla ? records.filter(r => r.sla_status === filterSla) : records;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Papan Pemuka Penuaan & Eskalasi"
        subtitle="Pantau fail yang tertangguh dan ambil tindakan eskalasi"
      />

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Kritikal (>2 hari)" value={summary.critical} icon={<AlertTriangle size={20} />} colour="orange" />
          <StatCard title="Amaran (1-2 hari)" value={summary.warning} icon={<Clock size={20} />} colour="orange" />
          <StatCard title="Normal (<1 hari)" value={summary.normal} icon={<CheckCircle size={20} />} colour="green" />
          <StatCard title="Auto Dieskalasi" value={summary.auto_escalated} icon={<TrendingUp size={20} />} colour="navy" />
        </div>
      )}

      {/* AI Insight Panel */}
      {summary && summary.critical > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
          <AiBadge label="AI Analisis" size="md" variant="gradient" />
          <div>
            <p className="text-sm font-semibold text-purple-900">
              {summary.critical} fail dalam status KRITIKAL memerlukan tindakan segera.
            </p>
            <p className="text-xs text-purple-700 mt-1">
              AI mengesyorkan eskalasi automatik kepada Pengurus Cawangan untuk fail yang melebihi 2 hari bekerja.
            </p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Tapis SLA:</label>
        <div className="flex gap-2">
          {['', 'KRITIKAL', 'AMARAN', 'NORMAL'].map(sla => (
            <button
              key={sla}
              onClick={() => setFilterSla(sla)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterSla === sla
                  ? 'bg-[#1B2B5E] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {sla || 'Semua'}
            </button>
          ))}
        </div>
        <button onClick={fetchAging} className="ml-auto p-1.5 text-gray-500 hover:text-[#1B2B5E]" title="Muat semula">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><LoadingSpinner /></div>
        ) : error ? (
          <div className="text-center py-16 text-red-500">
            <AlertTriangle className="mx-auto mb-2" size={32} />
            <p className="text-sm">{error}</p>
            <button onClick={fetchAging} className="mt-3 text-[#1B2B5E] underline text-sm">Cuba semula</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CheckCircle className="mx-auto mb-2" size={32} />
            <p className="text-sm">Tiada fail tertangguh. Semua dalam SLA.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1B2B5E] text-white">
                  <th className="px-4 py-3 text-left">No. Rujukan</th>
                  <th className="px-4 py-3 text-left">Pemohon</th>
                  <th className="px-4 py-3 text-left">Pegawai</th>
                  <th className="px-4 py-3 text-right">Amaun</th>
                  <th className="px-4 py-3 text-center">Hari Tertangguh</th>
                  <th className="px-4 py-3 text-center">Status SLA</th>
                  <th className="px-4 py-3 text-center">Dieskalasi</th>
                  <th className="px-4 py-3 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(r => (
                  <tr key={r.id} className={`${ROW_COLOURS[r.sla_status] || ''} hover:bg-gray-50 transition-colors`}>
                    <td className="px-4 py-3 font-mono text-xs text-[#1B2B5E] font-semibold">{r.ref_no}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                    <td className="px-4 py-3 text-gray-600">{r.officer || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(r.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${r.sla_status === 'KRITIKAL' ? 'text-red-600' : r.sla_status === 'AMARAN' ? 'text-orange-600' : 'text-green-600'}`}>
                        {r.elapsed_days} hari
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${SLA_COLOURS[r.sla_status] || 'bg-gray-100 text-gray-800'}`}>
                        {r.sla_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.is_escalated ? <AiBadge label="Dieskalasi" size="xs" /> : <span className="text-gray-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {!r.is_escalated && (
                        <button
                          onClick={() => handleEscalate(r.id, r.ref_no)}
                          disabled={escalatingId === r.id}
                          className="flex items-center gap-1 mx-auto px-3 py-1.5 bg-[#E65100] text-white rounded-lg text-xs font-semibold hover:bg-orange-700 disabled:opacity-50 transition-colors"
                        >
                          {escalatingId === r.id ? <LoadingSpinner size="sm" /> : <AlertTriangle size={12} />}
                          Eskalasi
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
