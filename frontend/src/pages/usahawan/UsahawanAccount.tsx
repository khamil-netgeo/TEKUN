import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import {
  Wallet, Landmark, Calendar, TrendingUp, TrendingDown, Hash,
  FileText, ShieldQuestion, CreditCard, Sparkles, ChevronDown, ChevronRight, AlertCircle, LoaderCircle
} from 'lucide-react';

// --- TYPE DEFINITIONS ---
interface TransactionItem {
  id: string;
  date: string;
  amount: number;
  channel: string;
  receipt_no: string;
}

interface PaymentScheduleItem {
  id: string;
  month: string;
  principal: number;
  profit: number;
  balance: number;
}

interface AccountData {
  account_number: string;
  scheme: string;
  total_financing: number;
  balance_remaining: number;
  monthly_payment: number;
  next_due_date: string;
  health_score: number;
  ai_forecast: string;
  payment_schedule: PaymentScheduleItem[];
  payment_history: TransactionItem[];
}

// --- DEMO FALLBACK DATA ---
const demoAccountData: AccountData = {
  account_number: "TKN-2024-001234",
  scheme: "TEKUN USAHAWAN",
  total_financing: 50000,
  balance_remaining: 23456.78,
  monthly_payment: 763.89,
  next_due_date: "2026-08-01",
  health_score: 87,
  ai_forecast: "Akaun anda dijangka kekal LANCAR sepanjang tempoh pembiayaan berdasarkan corak pembayaran semasa.",
  payment_schedule: [
    { id: 's1', month: 'Ogos 2026', principal: 650.11, profit: 113.78, balance: 22806.67 },
    { id: 's2', month: 'September 2026', principal: 652.34, profit: 111.55, balance: 22154.33 },
    { id: 's3', month: 'Oktober 2026', principal: 654.58, profit: 109.31, balance: 21499.75 },
    { id: 's4', month: 'November 2026', principal: 656.83, profit: 107.06, balance: 20842.92 },
    { id: 's5', month: 'Disember 2026', principal: 659.09, profit: 104.80, balance: 20183.83 },
    { id: 's6', month: 'Januari 2027', principal: 661.36, profit: 102.53, balance: 19522.47 },
    { id: 's7', month: 'Februari 2027', principal: 663.64, profit: 100.25, balance: 18858.83 },
  ],
  payment_history: [
    { id: 'h1', date: '2026-07-01', amount: 763.89, channel: 'JomPAY', receipt_no: 'JP987654321' },
    { id: 'h2', date: '2026-06-01', amount: 763.89, channel: 'Kaunter TEKUN', receipt_no: 'KT123456789' },
    { id: 'h3', date: '2026-05-01', amount: 763.89, channel: 'Perbankan Internet', receipt_no: 'PI543216789' },
    { id: 'h4', date: '2026-04-01', amount: 763.89, channel: 'JomPAY', receipt_no: 'JP987654123' },
    { id: 'h5', date: '2026-03-01', amount: 763.89, channel: 'JomPAY', receipt_no: 'JP987654321' },
    { id: 'h6', date: '2026-02-01', amount: 763.89, channel: 'Kaunter TEKUN', receipt_no: 'KT123456789' },
  ],
};

// --- HELPER FUNCTIONS & COMPONENTS ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const getHealthScoreProps = (score: number): { color: string; label: string; ringColor: string } => {
  if (score > 70) return { color: 'text-green-600', label: 'Baik', ringColor: 'ring-green-600' };
  if (score >= 40) return { color: 'text-orange-500', label: 'Sederhana', ringColor: 'ring-orange-500' };
  return { color: 'text-red-600', label: 'Berisiko', ringColor: 'ring-red-600' };
};

const InfoItem: React.FC<{ icon: React.ElementType; label: string; value: string | number; isCurrency?: boolean }> = ({ icon: Icon, label, value, isCurrency = false }) => (
  <div className="flex items-start space-x-3">
    <div className="mt-1 flex-shrink-0">
      <Icon className="h-5 w-5 text-navy-600" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-navy-900">{isCurrency ? formatCurrency(Number(value)) : value}</p>
    </div>
  </div>
);

const AiBadge: React.FC = () => (
  <div className="inline-flex items-center rounded-full bg-purple-600 px-2.5 py-0.5 text-xs font-semibold text-white">
    <Sparkles className="-ml-0.5 mr-1.5 h-3 w-3" />
    Analisis AI
  </div>
);

// --- MAIN COMPONENT ---
const UsahawanAccount: React.FC = () => {
  const { user } = useAuthStore();
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllSchedule, setShowAllSchedule] = useState<boolean>(false);

  useEffect(() => {
    const fetchAccountData = async () => {
      setLoading(true);
      setError(null);
      try {
        // In a real app, the API call would be:
        // const response = await api.get<AccountData>('/api/accounts/my');
        // setAccountData(response.data);
        
        // Simulating API call with a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        // To test error state, uncomment the line below
        // throw new Error("Gagal memuatkan data akaun.");
        setAccountData(demoAccountData);

      } catch (err) {
        console.error("Failed to fetch account data:", err);
        setError("Gagal memuatkan data akaun. Memaparkan data demo.");
        setAccountData(demoAccountData); // Use fallback data on error
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, []);

  const healthScoreProps = useMemo(() => accountData ? getHealthScoreProps(accountData.health_score) : getHealthScoreProps(0), [accountData]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="flex flex-col items-center space-y-4">
          <LoaderCircle className="h-12 w-12 animate-spin text-navy-600" />
          <p className="text-lg text-gray-600">Memuatkan maklumat akaun...</p>
        </div>
      </div>
    );
  }

  if (!accountData) {
    return (
      <div className="p-4 md:p-6">
        <div className="rounded-lg border border-red-300 bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Tiada Data Akaun</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Kami tidak dapat mencari maklumat akaun pembiayaan aktif untuk anda. Sila hubungi cawangan TEKUN yang berdekatan.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const visibleSchedule = showAllSchedule ? accountData.payment_schedule : accountData.payment_schedule.slice(0, 6);
  const visibleHistory = accountData.payment_history.slice(0, 5);

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-navy-900">Akaun Pembiayaan</h1>
        <p className="text-gray-600 mt-1">Selamat datang, {user?.name || 'Usahawan TEKUN'}. Berikut adalah ringkasan akaun anda.</p>
      </header>

      {error && (
        <div className="mb-6 rounded-md bg-orange-50 p-4 border border-orange-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-orange-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-orange-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Summary Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">Ringkasan Akaun</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <InfoItem icon={Hash} label="No. Akaun" value={accountData.account_number} />
              <InfoItem icon={Landmark} label="Skim Pembiayaan" value={accountData.scheme} />
              <InfoItem icon={Wallet} label="Jumlah Pembiayaan" value={accountData.total_financing} isCurrency />
              <InfoItem icon={TrendingDown} label="Baki Terkini" value={accountData.balance_remaining} isCurrency />
              <InfoItem icon={CreditCard} label="Bayaran Bulanan" value={accountData.monthly_payment} isCurrency />
              <InfoItem icon={Calendar} label="Tarikh Akhir Bayaran" value={formatDate(accountData.next_due_date)} />
            </div>
          </div>

          {/* AI Forecast Panel */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="bg-purple-600 p-2 rounded-full">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <AiBadge />
              <p className="mt-2 text-purple-800">{accountData.ai_forecast}</p>
            </div>
          </div>

          {/* Payment Schedule */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">Jadual Bayaran</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bulan</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Prinsipal (RM)</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Keuntungan (RM)</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Baki (RM)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visibleSchedule.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.month}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{item.principal.toFixed(2)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{item.profit.toFixed(2)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold text-right">{item.balance.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {accountData.payment_schedule.length > 6 && (
              <button onClick={() => setShowAllSchedule(!showAllSchedule)} className="mt-4 w-full flex items-center justify-center text-sm font-semibold text-navy-700 hover:text-navy-900">
                {showAllSchedule ? 'Papar Sedikit' : 'Lihat Semua'}
                {showAllSchedule ? <ChevronDown className="h-4 w-4 ml-1 transform rotate-180" /> : <ChevronDown className="h-4 w-4 ml-1" />}
              </button>
            )}
          </div>

          {/* Payment History */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">Sejarah Bayaran Terkini</h2>
            <ul className="divide-y divide-gray-200">
              {visibleHistory.map((tx) => (
                <li key={tx.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tx.channel}</p>
                    <p className="text-sm text-gray-500">{formatDate(tx.date)} &bull; No. Resit: {tx.receipt_no}</p>
                  </div>
                  <p className="text-sm font-semibold text-green-700">{formatCurrency(tx.amount)}</p>
                </li>
              ))}
            </ul>
            <Link to="/module4/payment-history" className="mt-4 w-full flex items-center justify-center text-sm font-semibold text-navy-700 hover:text-navy-900">
              Lihat Semua Transaksi
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">
          {/* Health Score Gauge */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
            <h3 className="text-lg font-semibold text-navy-900 mb-2">Skor Kesihatan Akaun</h3>
            <div className="relative inline-flex items-center justify-center my-4">
              <div className={`absolute text-4xl font-bold ${healthScoreProps.color}`}>{accountData.health_score}</div>
              <svg className="w-40 h-40 transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-200" />
                <circle
                  cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent"
                  strokeDasharray={2 * Math.PI * 70}
                  strokeDashoffset={(2 * Math.PI * 70) * (1 - accountData.health_score / 100)}
                  className={healthScoreProps.color}
                />
              </svg>
            </div>
            <p className={`text-lg font-semibold ${healthScoreProps.color}`}>{healthScoreProps.label}</p>
            <p className="text-sm text-gray-500 mt-1">Skor yang baik memudahkan kelulusan pembiayaan masa hadapan.</p>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-navy-900 mb-4">Tindakan Pantas</h3>
            <div className="space-y-3">
              <Link to="/module4/pay" className="flex items-center justify-center w-full px-4 py-3 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors">
                <CreditCard className="w-5 h-5 mr-2" />
                Buat Bayaran
              </Link>
              <Link to="/module4/statement" className="flex items-center justify-center w-full px-4 py-3 text-sm font-semibold text-navy-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                <FileText className="w-5 h-5 mr-2" />
                Muat Turun Penyata
              </Link>
              <Link to="/module4/moratorium-request" className="flex items-center justify-center w-full px-4 py-3 text-sm font-semibold text-navy-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                <ShieldQuestion className="w-5 h-5 mr-2" />
                Mohon Moratorium
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsahawanAccount;