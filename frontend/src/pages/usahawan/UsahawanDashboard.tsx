import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Calendar, Wallet, Gauge, Lightbulb, Plus, Eye, FileText, CheckCircle } from 'lucide-react';
import api from '@/services/api';
import PageHeader from '@/components/ui/PageHeader';
import AiBadge from '@/components/ui/AiBadge';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(amount);

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' });
};

interface DashboardData {
  active_financing: number;
  next_payment_date: string;
  next_payment_amount: number;
  total_paid: number;
  outstanding_balance: number;
  application_count: number;
  latest_application_status: string;
  latest_application_ref: string;
  credit_score: number;
  ai_insight: string;
  ai_risk_level: 'rendah' | 'sederhana' | 'tinggi';
}

const DEMO_DASHBOARD_DATA: DashboardData = {
  active_financing: 35000,
  next_payment_date: '2026-08-01',
  next_payment_amount: 875,
  total_paid: 8750,
  outstanding_balance: 26250,
  application_count: 2,
  latest_application_status: 'Dalam Penilaian',
  latest_application_ref: 'SPPT-2026-07-00123',
  credit_score: 72,
  ai_insight: 'Rekod pembayaran anda konsisten. Risiko lalai adalah rendah berdasarkan analisis 10 bulan terakhir.',
  ai_risk_level: 'rendah',
};

const UsahawanDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get('/api/usahawan/dashboard');
        setData(response.data.data);
      } catch (err: any) {
        if (err.response?.status === 401 || err.response?.status === 404) {
          console.warn('API /api/usahawan/dashboard failed, using demo fallback.', err);
          setData(DEMO_DASHBOARD_DATA);
        } else {
          setError('Ralat memuatkan data dashboard.');
          console.error('Failed to fetch dashboard data:', err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getRiskLevelColor = (level: 'rendah' | 'sederhana' | 'tinggi') => {
    switch (level) {
      case 'rendah': return 'bg-green-100 text-green-800';
      case 'sederhana': return 'bg-orange-100 text-orange-800';
      case 'tinggi': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderRingGauge = (value: number, max: number, color: string) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / max) * circumference;

    return (
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            className="text-gray-200"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
          />
          <circle
            className={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
          />
        </svg>
        <div className="absolute text-lg font-bold text-gray-800">{value}%</div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <PageHeader
          title="Dashboard Usahawan"
          description="Gambaran keseluruhan status pembiayaan dan permohonan anda."
        />
        <div className="text-center py-10">Memuatkan data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <PageHeader
          title="Dashboard Usahawan"
          description="Gambaran keseluruhan status pembiayaan dan permohonan anda."
        />
        <div className="text-center py-10 text-red-600">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <PageHeader
          title="Dashboard Usahawan"
          description="Gambaran keseluruhan status pembiayaan dan permohonan anda."
        />
        <div className="text-center py-10">Tiada data untuk dipaparkan.</div>
      </div>
    );
  }

  const creditScoreColor = data.credit_score >= 70 ? 'text-green-500' : data.credit_score >= 50 ? 'text-orange-500' : 'text-red-500';

  return (
    <div className="p-6">
      <PageHeader
        title="Dashboard Usahawan"
        description="Gambaran keseluruhan status pembiayaan dan permohonan anda."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        {/* KPI Card: Active Financing */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4">
          <div className="p-3 rounded-full bg-navy-100" style={{ backgroundColor: '#E0E7FF' }}>
            <DollarSign className="w-6 h-6 text-navy-700" style={{ color: '#1B2B5E' }} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pembiayaan Aktif</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(data.active_financing)}</p>
          </div>
        </div>

        {/* KPI Card: Next Payment */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4">
          <div className="p-3 rounded-full bg-green-100" style={{ backgroundColor: '#D4EDDA' }}>
            <Calendar className="w-6 h-6 text-green-700" style={{ color: '#2E7D32' }} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Bayaran Seterusnya</p>
            <p className="text-xl font-semibold text-gray-900">{formatDate(data.next_payment_date)}</p>
            <p className="text-sm text-gray-600">{formatCurrency(data.next_payment_amount)}</p>
          </div>
        </div>

        {/* KPI Card: Outstanding Balance */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4">
          <div className="p-3 rounded-full bg-orange-100" style={{ backgroundColor: '#FFEDD5' }}>
            <Wallet className="w-6 h-6 text-orange-700" style={{ color: '#E65100' }} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Baki Tertunggak</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(data.outstanding_balance)}</p>
          </div>
        </div>

        {/* KPI Card: Credit Score */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4">
          <div className="p-3 rounded-full bg-purple-100" style={{ backgroundColor: '#EFE7FC' }}>
            <Gauge className="w-6 h-6 text-purple-700" style={{ color: '#673AB7' }} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Skor Kredit</p>
            <p className={`text-xl font-semibold ${creditScoreColor}`}>{data.credit_score}</p>
          </div>
        </div>
      </div>

      {/* AI Health Panel */}
      <div
        className="mt-8 p-6 rounded-lg border-2"
        style={{ backgroundColor: 'rgba(103, 58, 183, 0.1)', borderColor: '#673AB7' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-purple-800 flex items-center gap-2" style={{ color: '#673AB7' }}>
            <Lightbulb className="w-5 h-5" /> Analisis Kesihatan Kewangan <AiBadge />
          </h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(data.ai_risk_level)}`}>
            Risiko: {data.ai_risk_level.charAt(0).toUpperCase() + data.ai_risk_level.slice(1)}
          </span>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            {renderRingGauge(data.credit_score, 100, creditScoreColor)}
          </div>
          <div className="flex-grow">
            <p className="text-gray-700 leading-relaxed">{data.ai_insight}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tindakan Pantas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/module1/new')}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-md text-white font-medium"
              style={{ backgroundColor: '#1B2B5E' }}
            >
              <Plus className="w-5 h-5" /> Mohon Pembiayaan
            </button>
            <button
              onClick={() => navigate('/usahawan/account')}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200"
            >
              <Eye className="w-5 h-5" /> Lihat Akaun
            </button>
            <button
              onClick={() => navigate('/usahawan/moratorium')}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200"
            >
              <FileText className="w-5 h-5" /> Mohon Moratorium
            </button>
            <button
              onClick={() => navigate('/semak-kelayakan')}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200"
            >
              <CheckCircle className="w-5 h-5" /> Semak Kelayakan
            </button>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Permohonan Terkini</h3>
          {data.application_count > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">{data.latest_application_ref}</p>
                  <p className="text-sm text-gray-600">Status: {data.latest_application_status}</p>
                </div>
                <button
                  onClick={() => navigate(`/module1/timeline/${data.latest_application_ref}`)}
                  className="text-sm text-navy-600 hover:underline"
                  style={{ color: '#1B2B5E' }}
                >
                  Lihat Status
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">Tiada permohonan terkini.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsahawanDashboard;