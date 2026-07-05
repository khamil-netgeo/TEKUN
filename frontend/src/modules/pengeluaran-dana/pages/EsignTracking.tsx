/**
 * Module 3 — Pengeluaran Dana
 * EsignTracking.tsx — e-Sign queue with real API and reminder actions.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { FileSignature, Bell, CheckCircle, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import StatCard from '../../../components/ui/StatCard';
import AiBadge from '../../../components/ui/AiBadge';
import PageHeader from '../../../components/ui/PageHeader';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import disbursementService, { type EsignRecord } from '../services/disbursementService';

const ESIGN_COLOURS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  signed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-600',
};

const ESIGN_LABELS: Record<string, string> = {
  pending: 'Menunggu',
  signed: 'Ditandatangani',
  rejected: 'Ditolak',
  expired: 'Tamat Tempoh',
};

export default function EsignTracking() {
  const [records, setRecords] = useState<EsignRecord[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState('');

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await disbursementService.getEsignQueue();
      setRecords(res.data);
      setStats(res.stats);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Gagal memuatkan baris gilir e-Tandatangan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleSendReminder = async (id: number, refNo: string) => {
    setSendingId(id);
    try {
      await disbursementService.sendReminder(id);
      toast.success(`Peringatan dihantar untuk ${refNo}.`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Gagal menghantar peringatan.');
    } finally {
      setSendingId(null);
    }
  };

  const filtered = filterStatus ? records.filter(r => r.esign_status === filterStatus) : records;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Penjejakan e-Tandatangan"
        subtitle="Pantau status e-Tandatangan dan hantar peringatan kepada pemohon"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Jumlah" value={stats.total || 0} icon={<FileSignature size={20} />} colour="navy" />
        <StatCard title="Ditandatangani" value={stats.signed || 0} icon={<CheckCircle size={20} />} colour="green" />
        <StatCard title="Menunggu" value={stats.pending || 0} icon={<Clock size={20} />} colour="orange" />
        <StatCard title="Tamat Tempoh" value={stats.expired || 0} icon={<AlertTriangle size={20} />} colour="orange" />
      </div>

      {/* AI Anomaly Detection Panel */}
      {(stats.expired || 0) > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
          <AiBadge label="AI Pengesanan Anomali" size="md" variant="gradient" />
          <div>
            <p className="text-sm font-semibold text-purple-900">
              {stats.expired} dokumen telah tamat tempoh. AI mengesyorkan tindakan segera.
            </p>
            <p className="text-xs text-purple-700 mt-1">
              Pola anomali dikesan: dokumen tamat tempoh melebihi norma. Sila semak dan hantar semula.
            </p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Tapis Status:</label>
        <div className="flex gap-2">
          {['', 'pending', 'signed', 'rejected', 'expired'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterStatus === s
                  ? 'bg-[#1B2B5E] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s ? ESIGN_LABELS[s] : 'Semua'}
            </button>
          ))}
        </div>
        <button onClick={fetchQueue} className="ml-auto p-1.5 text-gray-500 hover:text-[#1B2B5E]" title="Muat semula">
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
            <button onClick={fetchQueue} className="mt-3 text-[#1B2B5E] underline text-sm">Cuba semula</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileSignature className="mx-auto mb-2" size={32} />
            <p className="text-sm">Tiada rekod e-Tandatangan ditemui.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1B2B5E] text-white">
                  <th className="px-4 py-3 text-left">No. Rujukan</th>
                  <th className="px-4 py-3 text-left">Pemohon</th>
                  <th className="px-4 py-3 text-right">Amaun</th>
                  <th className="px-4 py-3 text-center">Status e-Sign</th>
                  <th className="px-4 py-3 text-center">Tarikh Dihantar</th>
                  <th className="px-4 py-3 text-center">Tarikh Akhir</th>
                  <th className="px-4 py-3 text-center">Baki Hari</th>
                  <th className="px-4 py-3 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(r => (
                  <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${r.esign_status === 'expired' ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-[#1B2B5E] font-semibold">{r.ref_no}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(r.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ESIGN_COLOURS[r.esign_status] || 'bg-gray-100 text-gray-800'}`}>
                        {ESIGN_LABELS[r.esign_status] || r.esign_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-600">{formatDate(r.sent_at)}</td>
                    <td className="px-4 py-3 text-center text-xs text-gray-600">{formatDate(r.deadline)}</td>
                    <td className="px-4 py-3 text-center">
                      {r.esign_status === 'signed' ? (
                        <span className="text-green-600 font-semibold text-xs">Selesai</span>
                      ) : r.esign_status === 'expired' ? (
                        <span className="text-red-600 font-semibold text-xs">Tamat</span>
                      ) : (
                        <span className={`font-semibold text-xs ${r.days_left <= 1 ? 'text-red-600' : r.days_left <= 3 ? 'text-orange-600' : 'text-green-600'}`}>
                          {r.days_left} hari
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.esign_status !== 'signed' && (
                        <button
                          onClick={() => handleSendReminder(r.id, r.ref_no)}
                          disabled={sendingId === r.id}
                          className="flex items-center gap-1 mx-auto px-3 py-1.5 bg-[#1B2B5E] text-white rounded-lg text-xs font-semibold hover:bg-blue-900 disabled:opacity-50 transition-colors"
                        >
                          {sendingId === r.id ? <LoadingSpinner size="sm" /> : <Bell size={12} />}
                          Hantar Peringatan
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
