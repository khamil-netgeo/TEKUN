import React, { useState, useEffect, useCallback } from 'react';
import { Shield, CheckCircle, AlertTriangle, RefreshCw, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import AiBadge from '../../../components/ui/AiBadge';
import PageHeader from '../../../components/ui/PageHeader';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import disbursementService, { type AuthorityLevel, type Disbursement } from '../services/disbursementService';

const LEVEL_COLOURS: Record<string, string> = {
  L1: 'border-green-300 bg-green-50',
  L2: 'border-blue-300 bg-blue-50',
  L3: 'border-orange-300 bg-orange-50',
  L4: 'border-red-300 bg-red-50',
};

const LEVEL_BADGE: Record<string, string> = {
  L1: 'bg-green-100 text-green-800',
  L2: 'bg-blue-100 text-blue-800',
  L3: 'bg-orange-100 text-orange-800',
  L4: 'bg-red-100 text-red-800',
};

export default function AuthorityMatrix() {
  const [matrix, setMatrix] = useState<AuthorityLevel[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Disbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [applicable, setApplicable] = useState<AuthorityLevel | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [matrixRes, listRes] = await Promise.all([
        disbursementService.getAuthorityMatrix(),
        disbursementService.getList({ status: 'pending' }),
      ]);
      setMatrix(matrixRes.data);
      setPendingApprovals(listRes.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Gagal memuat turun data matriks atau senarai kelulusan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCheckAmount = async () => {
    const amount = parseFloat(amountInput);
    if (!amount || isNaN(amount)) return;
    try {
      const res = await disbursementService.getAuthorityMatrix(amount);
      setApplicable(res.applicable);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Gagal menyemak had kuasa.');
    }
  };

  const handleApprove = async (id: number, refNo: string) => {
    setApprovingId(id);
    try {
      await disbursementService.approve(id);
      toast.success(`Pengeluaran ${refNo} berjaya diluluskan.`);
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Gagal meluluskan pengeluaran. Semak had kuasa anda.');
    } finally {
      setApprovingId(null);
    }
  };

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(amount);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Matriks Had Kuasa Pengeluaran"
        subtitle="Semak had kuasa kelulusan dan luluskan pengeluaran mengikut aras"
      />

      {loading ? (
        <div className="flex items-center justify-center py-16"><LoadingSpinner /></div>
      ) : (
        <>
          {/* Authority Matrix Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {matrix.map(level => (
              <div key={level.level_code} className={`rounded-xl border-2 p-5 ${LEVEL_COLOURS[level.level_code] || 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${LEVEL_BADGE[level.level_code] || 'bg-gray-100 text-gray-800'}`}>
                    {level.level_code}
                  </span>
                  <Shield size={20} className="text-gray-500" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{level.label}</h3>
                <p className="text-xs text-gray-600 mb-3">{level.description}</p>
                <div className="text-xs font-semibold text-gray-700">
                  {level.min === 0 ? 'Sehingga' : `RM ${level.min.toLocaleString()} –`}
                  {level.max < 999999999 ? ` RM ${level.max.toLocaleString()}` : ' ke atas'}
                </div>
              </div>
            ))}
          </div>

          {/* Amount Checker */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <AiBadge label="Semak Had Kuasa" size="sm" />
              <h3 className="font-semibold text-gray-800">Semak Aras Kelulusan Diperlukan</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <DollarSign className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                  type="number"
                  value={amountInput}
                  onChange={e => setAmountInput(e.target.value)}
                  placeholder="Masukkan amaun (RM)"
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]"
                />
              </div>
              <button
                onClick={handleCheckAmount}
                className="px-4 py-2 bg-[#1B2B5E] text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors"
              >
                Semak
              </button>
            </div>
            {applicable && (
              <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm font-semibold text-purple-900">
                  Amaun RM {parseFloat(amountInput).toLocaleString()} memerlukan kelulusan:
                </p>
                <p className="text-lg font-bold text-purple-800 mt-1">{applicable.label} ({applicable.level_code})</p>
                <p className="text-xs text-purple-600 mt-1">{applicable.description}</p>
              </div>
            )}
          </div>

          {/* Pending Approvals */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Kelulusan Menunggu Tindakan</h3>
              <button onClick={fetchData} className="p-1.5 text-gray-500 hover:text-[#1B2B5E]" title="Muat semula">
                <RefreshCw size={16} />
              </button>
            </div>
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <CheckCircle className="mx-auto mb-2" size={32} />
                <p className="text-sm">Tiada kelulusan menunggu.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">No. Rujukan</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Pemohon</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Amaun</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Aras Diperlukan</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingApprovals.map(d => (
                      <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-[#1B2B5E] font-semibold">{d.ref_no}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{d.applicant_name || '—'}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatAmount(d.amount)}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 capitalize">{d.approval_level?.replace(/_/g, ' ') || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleApprove(d.id, d.ref_no)}
                            disabled={approvingId === d.id}
                            className="flex items-center gap-1 mx-auto px-3 py-1.5 bg-[#2E7D32] text-white rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            {approvingId === d.id ? <LoadingSpinner size="sm" /> : <CheckCircle size={12} />}
                            Lulus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}