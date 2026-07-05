/**
 * Module 3 — Pengeluaran Dana
 * DisbursementList.tsx — Main disbursement list with real API, batch approval, and AI anomaly badges.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertTriangle, Clock, DollarSign, RefreshCw, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import StatCard from '../../../components/ui/StatCard';
import AiBadge from '../../../components/ui/AiBadge';
import PageHeader from '../../../components/ui/PageHeader';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import disbursementService, { type Disbursement, type DisbursementMeta } from '../services/disbursementService';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Menunggu',
  processing: 'Diproses',
  approved: 'Diluluskan',
  rejected: 'Ditolak',
  disbursed: 'Diserahkan',
};

const STATUS_COLOURS: Record<string, string> = {
  pending: 'bg-orange-100 text-orange-800',
  processing: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  disbursed: 'bg-gray-100 text-gray-800',
};

const ESIGN_COLOURS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  signed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-800',
};

export default function DisbursementList() {
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [meta, setMeta] = useState<DisbursementMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  const fetchDisbursements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await disbursementService.getList({ status: statusFilter || undefined, page });
      setDisbursements(res.data);
      setMeta(res.meta);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Gagal memuatkan data pengeluaran.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchDisbursements();
  }, [fetchDisbursements]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(disbursements.map(d => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) {
      toast.error('Sila pilih sekurang-kurangnya satu rekod.');
      return;
    }
    setBatchLoading(true);
    try {
      const res = await disbursementService.batchProcess(selectedIds, 'fpx');
      toast.success(res.message || `${selectedIds.length} pengeluaran berjaya diproses.`);
      setSelectedIds([]);
      fetchDisbursements();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Gagal memproses batch.');
    } finally {
      setBatchLoading(false);
    }
  };

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(amount);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Senarai Pengeluaran Dana"
        subtitle="Urus dan pantau semua permohonan pengeluaran dana"
      />

      {meta && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Jumlah Rekod" value={meta.total} icon={<DollarSign size={20} />} colour="navy" />
          <StatCard title="Menunggu Proses" value={meta.ready} icon={<Clock size={20} />} colour="orange" />
          <StatCard title="Menunggu e-Sign" value={meta.pending_esign} icon={<AlertTriangle size={20} />} colour="orange" />
          <StatCard title="Jumlah Amaun" value={formatAmount(meta.total_amount)} icon={<CheckCircle size={20} />} colour="green" />
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]"
            >
              <option value="">Semua</option>
              <option value="pending">Menunggu</option>
              <option value="processing">Diproses</option>
              <option value="approved">Diluluskan</option>
              <option value="rejected">Ditolak</option>
            </select>
            <button onClick={fetchDisbursements} className="p-1.5 text-gray-500 hover:text-[#1B2B5E] transition-colors" title="Muat semula">
              <RefreshCw size={16} />
            </button>
          </div>
          {selectedIds.length > 0 && (
            <button
              onClick={handleBatchApprove}
              disabled={batchLoading}
              className="flex items-center gap-2 bg-[#2E7D32] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {batchLoading ? <LoadingSpinner size="sm" /> : <FileText size={16} />}
              Jana Fail Batch FPX ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><LoadingSpinner /></div>
        ) : error ? (
          <div className="text-center py-16 text-red-500">
            <AlertTriangle className="mx-auto mb-2" size={32} />
            <p className="text-sm">{error}</p>
            <button onClick={fetchDisbursements} className="mt-3 text-[#1B2B5E] underline text-sm">Cuba semula</button>
          </div>
        ) : disbursements.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <DollarSign className="mx-auto mb-2" size={32} />
            <p className="text-sm">Tiada rekod pengeluaran ditemui.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1B2B5E] text-white">
                  <th className="px-4 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === disbursements.length && disbursements.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">No. Rujukan</th>
                  <th className="px-4 py-3 text-left">Pemohon</th>
                  <th className="px-4 py-3 text-left">Skim</th>
                  <th className="px-4 py-3 text-right">Amaun (RM)</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">e-Sign</th>
                  <th className="px-4 py-3 text-left">Kuasa</th>
                  <th className="px-4 py-3 text-left">AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {disbursements.map(d => (
                  <tr key={d.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(d.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedIds.includes(d.id)} onChange={() => handleSelect(d.id)} className="rounded" />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#1B2B5E] font-semibold">{d.ref_no}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{d.applicant_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{d.scheme || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatAmount(d.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOURS[d.status] || 'bg-gray-100 text-gray-800'}`}>
                        {STATUS_LABELS[d.status] || d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {d.esign_status ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ESIGN_COLOURS[d.esign_status] || 'bg-gray-100 text-gray-800'}`}>
                          {d.esign_status}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 capitalize">{d.approval_level?.replace(/_/g, ' ') || '—'}</td>
                    <td className="px-4 py-3">
                      {d.is_escalated && <AiBadge label="Dieskalasi" size="xs" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-600">Halaman {meta.current_page} daripada {meta.last_page} ({meta.total_records} rekod)</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page} className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
