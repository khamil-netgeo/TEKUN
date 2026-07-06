import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, CreditCard, TrendingUp, Calendar, CheckCircle,
  AlertCircle, ChevronRight, Download, ArrowUpRight
} from 'lucide-react';
import api from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AccountData {
  account_no: string;
  scheme_type: string;
  financing_amount: number;
  outstanding_balance: number;
  monthly_installment: number;
  profit_rate: number;
  tenure_months: number;
  remaining_months: number;
  start_date: string;
  maturity_date: string;
  status: string;
  classification: string;
  repayment_progress: number;
  payment_history: PaymentRecord[];
  upcoming_schedule: ScheduleItem[];
}

interface PaymentRecord {
  id: number;
  payment_date: string;
  amount: number;
  type: string;
  reference: string;
  status: string;
}

interface ScheduleItem {
  installment_no: number;
  due_date: string;
  principal: number;
  profit: number;
  total: number;
  balance: number;
  status: string;
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UsahawanAccount() {
  const navigate = useNavigate();
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'schedule'>('overview');

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const res = await api.get('/accounts/my');
        setAccount(res.data.data ?? res.data);
      } catch {
        // Demo fallback
        setAccount({
          account_no: 'SPPT-ACC-2026-00001',
          scheme_type: 'Pembiayaan Mikro',
          financing_amount: 50000,
          outstanding_balance: 45000,
          monthly_installment: 850,
          profit_rate: 4.5,
          tenure_months: 60,
          remaining_months: 53,
          start_date: '2026-02-01',
          maturity_date: '2031-01-01',
          status: 'active',
          classification: 'Lancar',
          repayment_progress: 11.3,
          payment_history: [
            { id: 1, payment_date: '2026-07-01', amount: 850, type: 'Ansuran', reference: 'PAY-2026-0007', status: 'completed' },
            { id: 2, payment_date: '2026-06-01', amount: 850, type: 'Ansuran', reference: 'PAY-2026-0006', status: 'completed' },
            { id: 3, payment_date: '2026-05-01', amount: 850, type: 'Ansuran', reference: 'PAY-2026-0005', status: 'completed' },
          ],
          upcoming_schedule: [
            { installment_no: 8, due_date: '2026-08-01', principal: 770, profit: 80, total: 850, balance: 44230, status: 'upcoming' },
            { installment_no: 9, due_date: '2026-09-01', principal: 773, profit: 77, total: 850, balance: 43457, status: 'upcoming' },
            { installment_no: 10, due_date: '2026-10-01', principal: 776, profit: 74, total: 850, balance: 42681, status: 'upcoming' },
          ],
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAccount();
  }, []);

  const formatCurrency = (amount: number) =>
    `RM ${amount.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}`;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: '#E8EAF0', borderTopColor: '#1B2B5E' }} />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="p-6 text-center">
        <Wallet size={48} className="mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-600">Tiada Akaun Pembiayaan</h3>
        <p className="text-sm text-gray-400 mt-2">Anda belum mempunyai akaun pembiayaan aktif.</p>
        <button
          onClick={() => navigate('/usahawan/applications')}
          className="mt-4 px-6 py-2.5 rounded-lg text-sm font-semibold text-white"
          style={{ backgroundColor: '#1B2B5E' }}
        >
          Mohon Pembiayaan
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1B2B5E' }}>Akaun Pembiayaan Saya</h1>
          <p className="text-sm text-gray-500 mt-1">{account.account_no} — {account.scheme_type}</p>
        </div>
        <button
          onClick={() => navigate('/usahawan/payment')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ backgroundColor: '#2E7D32' }}
        >
          <CreditCard size={16} />
          Buat Bayaran
        </button>
      </div>

      {/* Account Summary Card */}
      <div className="bg-gradient-to-br from-[#1B2B5E] to-[#2E4A9E] rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-blue-200 text-sm">Baki Semasa</p>
            <p className="text-4xl font-bold mt-1">{formatCurrency(account.outstanding_balance)}</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: account.status === 'active' ? '#2E7D32' : '#E65100', color: 'white' }}>
            {account.classification}
          </span>
        </div>
        <div className="mb-4">
          <div className="flex justify-between text-sm text-blue-200 mb-2">
            <span>Kemajuan Pembayaran Balik</span>
            <span>{account.repayment_progress.toFixed(1)}%</span>
          </div>
          <div className="w-full h-2 bg-blue-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-green-400 transition-all duration-500"
              style={{ width: `${account.repayment_progress}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-blue-200 text-xs">Jumlah Pembiayaan</p>
            <p className="font-semibold text-sm mt-0.5">{formatCurrency(account.financing_amount)}</p>
          </div>
          <div>
            <p className="text-blue-200 text-xs">Ansuran Bulanan</p>
            <p className="font-semibold text-sm mt-0.5">{formatCurrency(account.monthly_installment)}</p>
          </div>
          <div>
            <p className="text-blue-200 text-xs">Kadar Keuntungan</p>
            <p className="font-semibold text-sm mt-0.5">{account.profit_rate}% setahun</p>
          </div>
        </div>
      </div>

      {/* Key Dates */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tarikh Mula', value: formatDate(account.start_date), icon: Calendar, color: '#1B2B5E' },
          { label: 'Tarikh Matang', value: formatDate(account.maturity_date), icon: Calendar, color: '#E65100' },
          { label: 'Tempoh (Bulan)', value: `${account.tenure_months} bulan`, icon: TrendingUp, color: '#2E7D32' },
          { label: 'Baki Tempoh', value: `${account.remaining_months} bulan`, icon: TrendingUp, color: '#673AB7' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <item.icon size={16} style={{ color: item.color }} className="mb-2" />
            <p className="text-xs text-gray-500">{item.label}</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {(['overview', 'history', 'schedule'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === tab ? 'border-b-2 text-blue-900' : 'text-gray-500 hover:text-gray-700'}`}
              style={activeTab === tab ? { borderBottomColor: '#1B2B5E', color: '#1B2B5E' } : {}}
            >
              {tab === 'overview' ? 'Ringkasan' : tab === 'history' ? 'Sejarah Bayaran' : 'Jadual Bayaran'}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: '#F0FFF4' }}>
                <CheckCircle size={20} style={{ color: '#2E7D32' }} />
                <div>
                  <p className="text-sm font-semibold text-gray-700">Akaun dalam keadaan baik</p>
                  <p className="text-xs text-gray-500">Tiada tunggakan. Teruskan pembayaran tepat masa.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/usahawan/moratorium')}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-700">Mohon Moratorium</p>
                    <p className="text-xs text-gray-400 mt-0.5">Tangguh bayaran sementara</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
                <button
                  onClick={() => navigate('/usahawan/payment')}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-700">Buat Bayaran</p>
                    <p className="text-xs text-gray-400 mt-0.5">Bayar ansuran sekarang</p>
                  </div>
                  <ArrowUpRight size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-2">
              {account.payment_history.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Tiada rekod pembayaran</p>
              ) : (
                account.payment_history.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8F5E9' }}>
                        <CheckCircle size={14} style={{ color: '#2E7D32' }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{payment.type}</p>
                        <p className="text-xs text-gray-400">{payment.reference} · {formatDate(payment.payment_date)}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: '#2E7D32' }}>
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">No.</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Tarikh Bayar</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Prinsipal</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Keuntungan</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Jumlah</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Baki</th>
                  </tr>
                </thead>
                <tbody>
                  {account.upcoming_schedule.map((item) => (
                    <tr key={item.installment_no} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 px-3 text-gray-600">{item.installment_no}</td>
                      <td className="py-2.5 px-3 text-gray-600">{formatDate(item.due_date)}</td>
                      <td className="py-2.5 px-3 text-right text-gray-600">{formatCurrency(item.principal)}</td>
                      <td className="py-2.5 px-3 text-right text-gray-600">{formatCurrency(item.profit)}</td>
                      <td className="py-2.5 px-3 text-right font-semibold" style={{ color: '#1B2B5E' }}>{formatCurrency(item.total)}</td>
                      <td className="py-2.5 px-3 text-right text-gray-500">{formatCurrency(item.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
