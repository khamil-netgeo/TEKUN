import { useState, useEffect, FC, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import {
  Landmark,
  CalendarClock,
  FileCheck2,
  HeartPulse,
  CreditCard,
  FileSearch,
  PlusCircle,
  Folder,
  Sparkles,
  Bell,
  ReceiptText,
  FileText,
  Cog,
  AlertCircle,
  LoaderCircle,
} from 'lucide-react';

// --- TYPE DEFINITIONS ---
interface NotificationItemData {
  id: string;
  icon: 'payment' | 'application' | 'system';
  message: string;
  date: string; // ISO 8601 date string
}

interface LatestApplicationData {
  ref_number: string;
  scheme_name: string;
  status: string;
}

interface DashboardData {
  active_financing: number;
  next_installment_amount: number;
  next_installment_date: string; // "YYYY-MM-DD"
  application_status: string;
  credit_score: number;
  latest_application: LatestApplicationData;
  notifications: NotificationItemData[];
  ai_insight: string;
}

// --- HELPER FUNCTIONS & CONSTANTS ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
  }).format(amount);
};

const formatDate = (dateString: string, options?: Intl.DateTimeFormatOptions) => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  };
  return new Intl.DateTimeFormat('ms-MY', { ...defaultOptions, ...options }).format(new Date(dateString));
};

const isDueSoon = (dateString: string): boolean => {
  const dueDate = new Date(dateString);
  const today = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(today.getDate() + 7);
  // Check if due date is in the future but within the next 7 days
  return dueDate > today && dueDate <= sevenDaysFromNow;
};

const getScoreColorClasses = (score: number): { text: string; bg: string; border: string } => {
  if (score > 70) return { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-500' };
  if (score >= 40) return { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-500' };
  return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-500' };
};

const statusColorMap: { [key: string]: string } = {
  "Diluluskan": "bg-green-100 text-green-800",
  "Dalam Penilaian Kredit": "bg-blue-100 text-blue-800",
  "Dalam Semakan": "bg-blue-100 text-blue-800",
  "Ditolak": "bg-red-100 text-red-800",
  "Perlu Maklumat Lanjut": "bg-yellow-100 text-yellow-800",
  "Lengkap": "bg-green-100 text-green-800",
};

const notificationIconMap: { [key in NotificationItemData['icon']]: ReactNode } = {
  payment: <ReceiptText className="h-6 w-6 text-green-500" />,
  application: <FileText className="h-6 w-6 text-blue-500" />,
  system: <Cog className="h-6 w-6 text-gray-500" />,
};

// --- SUB-COMPONENTS ---
const StatCard: FC<{
  icon: React.ElementType;
  title: string;
  value: ReactNode;
  subtitle?: string;
  colorClass: string;
}> = ({ icon: Icon, title, value, subtitle, colorClass }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border-l-4" style={{ borderLeftColor: colorClass }}>
    <div className="flex items-center">
      <div className="p-2 rounded-full mr-4" style={{ backgroundColor: `${colorClass}20` }}>
        <Icon className="h-6 w-6" style={{ color: colorClass }} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl font-bold text-navy-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  </div>
);

const ActionButton: FC<{
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}> = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center space-y-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors w-full text-center"
  >
    <Icon className="h-6 w-6 text-navy-700" />
    <span className="text-xs font-medium text-navy-800">{label}</span>
  </button>
);

const StatusBadge: FC<{ status: string }> = ({ status }) => (
  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${statusColorMap[status] || 'bg-gray-100 text-gray-800'}`}>
    {status}
  </span>
);

const AiBadge: FC = () => (
  <span className="inline-flex items-center gap-x-1.5 rounded-md bg-purple-200 px-2 py-1 text-xs font-medium text-purple-800">
    <Sparkles className="h-3 w-3" />
    AI
  </span>
);

// --- MAIN COMPONENT ---
const UsahawanDashboard: FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get<DashboardData>('/api/usahawan/dashboard');
        setData(response.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data, using fallback.", err);
        setError("Tidak dapat memuatkan data. Memaparkan data demo.");
        
        const soonDate = new Date();
        soonDate.setDate(soonDate.getDate() + 3);
        const fallbackNextInstallmentDate = soonDate.toISOString().split('T')[0];

        const fallbackData: DashboardData = {
          active_financing: 23456,
          next_installment_amount: 763.89,
          next_installment_date: fallbackNextInstallmentDate,
          application_status: "Dalam Penilaian Kredit",
          credit_score: 87,
          latest_application: {
            ref_number: "TEKUN/SPPT/2024/07-1234",
            scheme_name: "Skim Pembiayaan TEKUN Niaga",
            status: "Dalam Penilaian Kredit",
          },
          notifications: [
            { id: '1', icon: 'payment', message: 'Bayaran bulanan sebanyak RM763.89 telah diterima.', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
            { id: '2', icon: 'application', message: 'Dokumen sokongan anda telah disahkan.', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
            { id: '3', icon: 'system', message: 'Selamat datang ke portal SPPT baharu!', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
          ],
          ai_insight: "Akaun anda dijangka kekal LANCAR berdasarkan corak pembayaran semasa. Teruskan momentum ini!",
        };
        setData(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <LoaderCircle className="w-12 h-12 animate-spin text-navy-600" />
          <p className="mt-4 text-lg text-gray-600">Memuatkan Papan Pemuka...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
          <h2 className="mt-4 text-xl font-bold text-red-700">Ralat</h2>
          <p className="mt-2 text-gray-600">{error || "Gagal memuatkan data papan pemuka. Sila cuba lagi kemudian."}</p>
        </div>
      </div>
    );
  }

  const scoreColor = getScoreColorClasses(data.credit_score);
  const nextPaymentDueSoon = isDueSoon(data.next_installment_date);

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-navy-900">
            Selamat datang, {user?.name || 'Usahawan'}! 👋
          </h1>
          <p className="text-gray-500">{formatDate(new Date().toISOString())}</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Landmark}
            title="Pembiayaan Aktif"
            value={formatCurrency(data.active_financing)}
            colorClass="#2E7D32"
          />
          <StatCard
            icon={CalendarClock}
            title="Bayaran Seterusnya"
            value={formatCurrency(data.next_installment_amount)}
            subtitle={`pada ${formatDate(data.next_installment_date)}`}
            colorClass={nextPaymentDueSoon ? "#E65100" : "#607D8B"}
          />
          <StatCard
            icon={FileCheck2}
            title="Status Permohonan"
            value={<StatusBadge status={data.application_status} />}
            colorClass="#1B2B5E"
          />
          <StatCard
            icon={HeartPulse}
            title="Skor Kesihatan"
            value={<span className={scoreColor.text}>{data.credit_score} / 100</span>}
            colorClass={scoreColor.text.includes('green') ? '#2E7D32' : scoreColor.text.includes('orange') ? '#E65100' : '#D32F2F'}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ActionButton icon={CreditCard} label="Buat Bayaran" onClick={() => navigate('/module4/pay')} />
          <ActionButton icon={FileSearch} label="Semak Status" onClick={() => navigate('/module1/timeline/latest')} />
          <ActionButton icon={PlusCircle} label="Mohon Baru" onClick={() => navigate('/module1/new')} />
          <ActionButton icon={Folder} label="Dokumen Saya" onClick={() => navigate('/module1/documents')} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Latest Application */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-navy-800 mb-4">Permohonan Terkini</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">No. Rujukan</span>
                  <span className="font-medium text-gray-800">{data.latest_application.ref_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Skim Pembiayaan</span>
                  <span className="font-medium text-gray-800">{data.latest_application.scheme_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Status</span>
                  <StatusBadge status={data.latest_application.status} />
                </div>
              </div>
              <button className="mt-6 w-full bg-navy-600 text-white py-2 px-4 rounded-lg hover:bg-navy-700 transition-colors font-semibold">
                Lihat Status Terperinci
              </button>
            </div>

            {/* AI Insight Panel */}
            <div className="bg-purple-50 border-l-4 border-purple-500 p-5 rounded-lg shadow-sm text-purple-900">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Sparkles className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold">Pandangan AI</h4>
                    <AiBadge />
                  </div>
                  <p className="text-sm">{data.ai_insight}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center mb-4">
              <Bell className="h-5 w-5 text-navy-800 mr-2" />
              <h3 className="text-lg font-semibold text-navy-800">Notifikasi Terkini</h3>
            </div>
            <ul className="space-y-4">
              {data.notifications.map((item) => (
                <li key={item.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 pt-1">
                    {notificationIconMap[item.icon]}
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">{item.message}</p>
                    <p className="text-xs text-gray-400">{formatDate(item.date, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsahawanDashboard;