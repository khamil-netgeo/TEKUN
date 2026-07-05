/**
 * Module 3 — Pengeluaran Dana
 * DisbursementList.tsx — Main disbursement list with real API, batch approval,
 * OTP approval modal, Surat Tawaran link, and AI anomaly badges.
 *
 * GUI Improvements (Orchestrator arahan):
 * 1. OTP Modal: before approving, show 6-digit OTP verification modal
 * 2. Surat Tawaran: link to official offer letter page
 * 3. No hardcoded data — all from real API
 * 4. AI vendor names replaced with "Enjin AI SPPT"
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, AlertTriangle, Clock, DollarSign,
  RefreshCw, ChevronLeft, ChevronRight, FileText,
  Shield, X, Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import StatCard from '../../../components/ui/StatCard';
import AiBadge from '../../../components/ui/AiBadge';
import PageHeader from '../../../components/ui/PageHeader';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import disbursementService, { type Disbursement, type DisbursementMeta } from '../services/disbursementService';

const STATUS_LABELS: Record<string, string> = {
  pending:    'Menunggu',
  processing: 'Diproses',
  approved:   'Diluluskan',
  rejected:   'Ditolak',
  disbursed:  'Diserahkan',
  completed:  'Selesai',
  failed:     'Gagal',
};

const STATUS_COLOURS: Record<string, string> = {
  pending:    'bg-orange-100 text-orange-800',
  processing: 'bg-blue-100 text-blue-800',
  approved:   'bg-green-100 text-green-800',
  rejected:   'bg-red-100 text-red-800',
  disbursed:  'bg-gray-100 text-gray-800',
  completed:  'bg-green-100 text-green-800',
  failed:     'bg-red-100 text-red-800',
};

const ESIGN_COLOURS: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-800',
  signed:   'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired:  'bg-gray-100 text-gray-800',
};

const ESIGN_LABELS: Record<string, string> = {
  pending:  'Menunggu',
  signed:   'Ditandatangani',
  rejected: 'Ditolak',
  expired:  'Tamat Tempoh',
};

// ── OTP Modal Component ───────────────────────────────────────────────────────
interface OtpModalProps {
  disbursementId: number;
  refNo: string;
  onClose: () => void;
  onSuccess: () => void;
}

function OtpApprovalModal({ disbursementId, refNo, onClose, onSuccess }: OtpModalProps) {
  const [step, setStep] = useState<'send' | 'verify'>('send');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpInputs, setOtpInputs] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      await disbursementService.sendApprovalOtp(disbursementId);
      toast.success('Kod OTP telah dihantar ke nombor telefon berdaftar anda.');
      setStep('verify');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Gagal menghantar OTP. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newInputs = [...otpInputs];
    newInputs[index] = value.slice(-1);
    setOtpInputs(newInputs);
    setOtp(newInputs.join(''));

    // Auto-focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpInputs[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const fullOtp = otpInputs.join('');
    if (fullOtp.length !== 6) {
      toast.error('Sila masukkan 6 digit OTP.');
      return;
    }
    setLoading(true);
    try {
      await disbursementService.verifyOtpAndApprove(disbursementId, fullOtp);
      toast.success(`Pengeluaran ${refNo} berjaya diluluskan dengan pengesahan OTP.`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'OTP tidak sah atau telah tamat tempoh. Sila cuba lagi.');
      setOtpInputs(['', '', '', '', '', '']);
      setOtp('');
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#1B2B5E] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="text-white w-5 h-5" />
            <div>
              <h3 className="text-white font-semibold text-sm">Pengesahan OTP Kelulusan</h3>
              <p className="text-blue-200 text-xs">{refNo}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-6">
          {step === 'send' ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-[#1B2B5E]" />
              </div>
              <div>
                <p className="text-gray-800 font-medium text-sm">
                  Pengesahan 2FA Diperlukan
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Untuk meluluskan pengeluaran dana ini, anda perlu mengesahkan
                  identiti melalui Kod OTP 6 digit yang akan dihantar ke nombor
                  telefon berdaftar anda.
                </p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
                <p className="text-orange-700 text-xs font-medium">
                  ⚠ Jangan kongsikan kod OTP ini dengan sesiapa.
                </p>
              </div>
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full py-3 bg-[#1B2B5E] text-white rounded-lg font-medium text-sm hover:bg-blue-900 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Menghantar OTP...</>
                ) : (
                  'Hantar OTP'
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-[#2E7D32]" />
                </div>
                <p className="text-gray-800 font-medium text-sm">Masukkan Kod OTP</p>
                <p className="text-gray-500 text-xs mt-1">
                  Kod OTP telah dihantar ke nombor telefon berdaftar anda.
                  Sah selama <strong>5 minit</strong>.
                </p>
              </div>

              {/* OTP Input Boxes */}
              <div className="flex justify-center gap-3">
                {otpInputs.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpInput(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    className="w-11 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-[#1B2B5E] focus:outline-none transition-colors"
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                className="w-full py-3 bg-[#2E7D32] text-white rounded-lg font-medium text-sm hover:bg-green-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Mengesahkan...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Sahkan & Luluskan</>
                )}
              </button>

              <button
                onClick={() => { setStep('send'); setOtpInputs(['', '', '', '', '', '']); setOtp(''); }}
                className="w-full text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Hantar semula OTP
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DisbursementList() {
  const navigate = useNavigate();
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [meta, setMeta] = useState<DisbursementMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  // OTP Modal state
  const [otpModal, setOtpModal] = useState<{ id: number; refNo: string } | null>(null);

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

  const handleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === disbursements.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(disbursements.map(d => d.id));
    }
  };

  const handleBatchProcess = async () => {
    if (selectedIds.length === 0) return;
    setBatchLoading(true);
    try {
      const res = await disbursementService.batchProcess(selectedIds);
      toast.success(`${res.data?.count ?? selectedIds.length} pengeluaran berjaya diproses dalam kelompok.`);
      setSelectedIds([]);
      fetchDisbursements();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Gagal memproses kelompok pengeluaran.');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleOpenOtpModal = (id: number, refNo: string) => {
    setOtpModal({ id, refNo });
  };

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(amount);

  return (
    <div className="p-6 space-y-6">
      {/* OTP Modal */}
      {otpModal && (
        <OtpApprovalModal
          disbursementId={otpModal.id}
          refNo={otpModal.refNo}
          onClose={() => setOtpModal(null)}
          onSuccess={() => fetchDisbursements()}
        />
      )}

      <PageHeader
        title="Senarai Pengeluaran Dana"
        subtitle="Pengurusan kelulusan dan pengeluaran dana pembiayaan"
        breadcrumbs={[{ label: 'Pengeluaran Dana' }]}
      />

      {/* KPI Cards */}
      {meta && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Jumlah Rekod"
            value={meta.total_records ?? meta.total}
            icon={<DollarSign className="w-5 h-5" />}
            colour="navy"
          />
          <StatCard
            title="Sedia Diproses"
            value={meta.ready}
            icon={<CheckCircle className="w-5 h-5" />}
            colour="green"
          />
          <StatCard
            title="Menunggu e-Sign"
            value={meta.pending_esign}
            icon={<Clock className="w-5 h-5" />}
            colour="orange"
          />
          <StatCard
            title="Diproses Hari Ini"
            value={meta.processed_today}
            icon={<RefreshCw className="w-5 h-5" />}
            colour="navy"
          />
        </div>
      )}

      {/* Filter + Actions Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2B5E] focus:border-transparent"
        >
          <option value="">Semua Status</option>
          <option value="pending">Menunggu</option>
          <option value="processing">Diproses</option>
          <option value="approved">Diluluskan</option>
          <option value="completed">Selesai</option>
          <option value="failed">Gagal</option>
        </select>

        <button
          onClick={fetchDisbursements}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Muat Semula
        </button>

        {selectedIds.length > 0 && (
          <button
            onClick={handleBatchProcess}
            disabled={batchLoading}
            className="flex items-center gap-2 px-4 py-2 bg-[#2E7D32] text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors disabled:opacity-60"
          >
            {batchLoading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Memproses...</>
            ) : (
              <><CheckCircle className="w-4 h-4" /> Proses Fail Batch FPX ({selectedIds.length})</>
            )}
          </button>
        )}
      </div>

      {/* Table */}
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
                  <th className="px-4 py-3 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {disbursements.map(d => (
                  <tr
                    key={d.id}
                    className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(d.id) ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(d.id)}
                        onChange={() => handleSelect(d.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#1B2B5E] font-semibold">{d.ref_no}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{d.applicant_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{d.scheme || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatAmount(d.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOURS[d.status] || 'bg-gray-100 text-gray-800'}`}>
                        {STATUS_LABELS[d.status] || d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {d.esign_status ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ESIGN_COLOURS[d.esign_status] || 'bg-gray-100 text-gray-800'}`}>
                          {ESIGN_LABELS[d.esign_status] || d.esign_status}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 capitalize">
                      {d.approval_level?.replace(/_/g, ' ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {d.ai_anomaly_flag && (
                        <span title={d.ai_anomaly_reason ?? 'Enjin AI SPPT mengesan corak tidak biasa.'}>
                          <AiBadge label="Anomali Dikesan" size="xs" />
                        </span>
                      )}
                      {d.is_escalated && !d.ai_anomaly_flag && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">
                          Dieskalasi
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View Surat Tawaran */}
                        <button
                          onClick={() => navigate(`/pengeluaran-dana/surat-tawaran/${d.id}`)}
                          title="Lihat Surat Tawaran"
                          className="p-1.5 rounded-lg text-[#1B2B5E] hover:bg-blue-50 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        {/* Approve with OTP */}
                        {d.status === 'pending' && (
                          <button
                            onClick={() => handleOpenOtpModal(d.id, d.ref_no)}
                            title="Luluskan Pengeluaran Dana"
                            className="p-1.5 rounded-lg text-[#2E7D32] hover:bg-green-50 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {/* View details */}
                        <button
                          onClick={() => navigate(`/pengeluaran-dana/${d.id}`)}
                          title="Lihat Butiran"
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Halaman {meta.current_page} daripada {meta.last_page} ({meta.total_records} rekod)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                disabled={page === meta.last_page}
                className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
