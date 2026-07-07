import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, Calendar, AlertCircle, TrendingUp, CreditCard, Download, Shield, Clock, Lightbulb } from 'lucide-react';
import api from '@/services/api';
import PageHeader from '@/components/ui/PageHeader';
import AiBadge from '@/components/ui/AiBadge';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(amount);

interface AccountData {
  account_no: string;
  borrower_name: string;
  principal: number;
  profit_rate: number;
  tenure_months: number;
  monthly_instalment: number;
  outstanding_balance: number;
  total_paid: number;
  arrears_amount: number;
  arrears_days: number;
  classification: string;
  moratorium_active: boolean;
  status: string;
  ai_prediction: {
    probability: number;
    risk_level: 'rendah' | 'sederhana' | 'tinggi';
    factors: string[];
    recommendation: string;
  };
}

const DEMO_ACCOUNT_DATA: AccountData = {
  account_no: 'ACC-2026-00123',
  borrower_name: 'Demo Usahawan',
  principal: 35000,
  profit_rate: 4.0,
  tenure_months: 48,
  monthly_instalment: 875,
  outstanding_balance: 26250,
  total_paid: 8750,
  arrears_amount: 0,
  arrears_days: 0,
  classification: 'Prestasi Baik',
  moratorium_active: false,
  status: 'Aktif',
  ai_prediction: {
    probability: 12,
    risk_level: 'rendah',
    factors: [
      'Pembayaran konsisten selama 10 bulan',
      'Tiada rekod tunggakan',
      'Aliran tunai perniagaan stabil'
    ],
    recommendation: 'Teruskan pembayaran mengikut jadual. Anda layak untuk tawaran pembiayaan tambahan pada masa hadapan.'
  }
};

const UsahawanAccount: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AccountData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccountData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get('/api/usahawan/account');
        setData(response.data.data);
      } catch (err: any) {
        if (err.response?.status === 401 || err.response?.status === 404) {
          console.warn('API /api/usahawan/account failed, using demo fallback.', err);
          setData(DEMO_ACCOUNT_DATA);
        } else {
          setError('Ralat memuatkan data akaun.');
          console.error('Failed to fetch account data:', err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccountData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6">
        <PageHeader title="Maklumat Akaun" description="Butiran terperinci pembiayaan anda." />
        <div className="text-center py-10">Memuatkan data akaun...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <PageHeader title="Maklumat Akaun" description="Butiran terperinci pembiayaan anda." />
        <div className="text-center py-10 text-red-600">{error || 'Tiada data akaun ditemui.'}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <PageHeader
          title={`Akaun: ${data.account_no}`}
          description="Butiran terperinci pembiayaan anda."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Account Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-navy-600" style={{ color: '#1B2B5E' }} />
              Ringkasan Pembiayaan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Jumlah Pembiayaan (Prinsipal)</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.principal)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Baki Tertunggak</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.outstanding_balance)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ansuran Bulanan</p>
                <p className="text-lg font-semibold text-gray-800">{formatCurrency(data.monthly_instalment)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tempoh Pembiayaan</p>
                <p className="text-lg font-semibold text-gray-800">{data.tenure_months} Bulan</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Kadar Keuntungan</p>
                <p className="text-lg font-semibold text-gray-800">{data.profit_rate}% setahun</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status Akaun</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                  {data.status}
                </span>
              </div>
            </div>
          </div>

          {/* Arrears & Moratorium Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" style={{ color: '#E65100' }} />
                Status Tunggakan
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Jumlah Tunggakan</p>
                  <p className={`text-xl font-bold ${data.arrears_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(data.arrears_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hari Tunggakan</p>
                  <p className="text-lg font-semibold text-gray-800">{data.arrears_days} Hari</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-navy-600" style={{ color: '#1B2B5E' }} />
                Status Moratorium
              </h3>
              <div className="flex flex-col h-full justify-center items-start space-y-4">
                <p className="text-sm text-gray-600">
                  {data.moratorium_active 
                    ? 'Akaun ini sedang dalam tempoh moratorium.' 
                    : 'Tiada moratorium aktif untuk akaun ini.'}
                </p>
                {!data.moratorium_active && (
                  <button
                    onClick={() => navigate('/usahawan/moratorium')}
                    className="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors"
                    style={{ backgroundColor: '#1B2B5E' }}
                  >
                    Mohon Moratorium
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Actions & AI */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Tindakan</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md text-white font-medium bg-green-600 hover:bg-green-700 transition-colors">
                <CreditCard className="w-5 h-5" /> Bayar Sekarang
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200 transition-colors">
                <Download className="w-5 h-5" /> Muat Turun Penyata
              </button>
            </div>
          </div>

          {/* AI Prediction Panel */}
          <div className="p-6 rounded-lg border-2" style={{ backgroundColor: 'rgba(103, 58, 183, 0.05)', borderColor: '#673AB7' }}>
            <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2" style={{ color: '#673AB7' }}>
              <Lightbulb className="w-5 h-5" /> Analisis AI <AiBadge />
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Risiko Lalai (Default Risk)</p>
                <div className="flex items-center gap-3">
                  <div className="flex-grow bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${data.ai_prediction.risk_level === 'rendah' ? 'bg-green-500' : data.ai_prediction.risk_level === 'sederhana' ? 'bg-orange-500' : 'bg-red-500'}`} 
                      style={{ width: `${data.ai_prediction.probability}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{data.ai_prediction.probability}%</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-800 mb-2">Faktor Utama:</p>
                <ul className="space-y-1">
                  {data.ai_prediction.factors.map((factor, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-purple-500 mt-0.5">•</span> {factor}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-purple-200">
                <p className="text-sm text-gray-700 italic">"{data.ai_prediction.recommendation}"</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsahawanAccount;