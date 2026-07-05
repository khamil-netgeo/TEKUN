import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import AiBadge from '@/components/ui/AiBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast, ToastContainer } from '@/components/ui/Toast';
import { useTranslation } from 'react-i18next';
import {
  DollarSign, AlertTriangle, Calculator, ArrowLeft, Info
} from 'lucide-react';

interface TawidhResult {
  arrears_days: number;
  arrears_amount: number;
  tawidh_rate: number;
  tawidh_amount: number;
  total_payable: number;
  calculation_date: string;
  breakdown: { label: string; value: string }[];
  ai_recommendation?: string;
}

export default function TawidhCalculator() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [result,  setResult]  = useState<TawidhResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/accounts/${id}/tawidh`)
      .then(r => setResult(r.data?.data ?? r.data))
      .catch(() => setError(t('tawidh.load_error', "Gagal mengira Ta'widh")))
      .finally(() => setLoading(false));
  }, [id, t]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner />
    </div>
  );

  if (error || !result) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <AlertTriangle className="w-12 h-12 text-red-500" />
      <p className="text-gray-600">{error ?? t('tawidh.no_data', 'Tiada data Ta\'widh')}</p>
      <button onClick={() => navigate(-1)} className="text-[#1B2B5E] underline text-sm">
        {t('common.back', 'Kembali')}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />
      <PageHeader
        title={t('tawidh.title', "Kalkulator Ta'widh")}
        subtitle={`${t('account.account_no', 'No. Akaun')}: ${id}`}
        breadcrumbs={[
          { label: t('nav.accounts', 'Akaun'), href: '/accounts' },
          { label: id ?? '', href: `/accounts/${id}` },
          { label: t('tawidh.title', "Ta'widh") },
        ]}
        action={
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1B2B5E]"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back', 'Kembali')}
          </button>
        }
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* KPI Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            title={t('tawidh.arrears_days', 'Hari Tunggakan')}
            value={String(result.arrears_days)}
            icon={<AlertTriangle className="w-5 h-5" />}
            colour={result.arrears_days > 0 ? 'orange' : 'green'}
          />
          <StatCard
            title={t('tawidh.arrears_amount', 'Jumlah Tunggakan')}
            value={`RM ${Number(result.arrears_amount).toLocaleString('ms-MY')}`}
            icon={<DollarSign className="w-5 h-5" />}
            colour="orange"
          />
          <StatCard
            title={t('tawidh.tawidh_rate', "Kadar Ta'widh")}
            value={`${result.tawidh_rate}%`}
            icon={<Calculator className="w-5 h-5" />}
            colour="navy"
          />
          <StatCard
            title={t('tawidh.tawidh_amount', "Amaun Ta'widh")}
            value={`RM ${Number(result.tawidh_amount).toLocaleString('ms-MY')}`}
            icon={<DollarSign className="w-5 h-5" />}
            colour="orange"
          />
        </div>

        {/* Calculation Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Calculator className="w-5 h-5 text-[#1B2B5E]" />
            <h3 className="text-sm font-semibold text-gray-700">
              {t('tawidh.breakdown', "Perincian Pengiraan Ta'widh")}
            </h3>
          </div>

          <div className="space-y-3">
            {(result.breakdown ?? []).map((item, i) => (
              <div
                key={i}
                className={`flex items-center justify-between py-3 px-4 rounded-lg ${
                  i === (result.breakdown?.length ?? 0) - 1
                    ? 'bg-[#1B2B5E] text-white'
                    : 'bg-gray-50'
                }`}
              >
                <span className={`text-sm ${i === (result.breakdown?.length ?? 0) - 1 ? 'font-semibold' : 'text-gray-600'}`}>
                  {item.label}
                </span>
                <span className={`text-sm font-bold ${i === (result.breakdown?.length ?? 0) - 1 ? 'text-white' : 'text-gray-800'}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {/* Total Payable */}
          <div className="mt-5 p-4 bg-[#C62828] rounded-xl text-white">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t('tawidh.total_payable', 'Jumlah Perlu Dibayar (Termasuk Ta\'widh)')}
              </span>
              <span className="text-xl font-bold">
                RM {Number(result.total_payable).toLocaleString('ms-MY')}
              </span>
            </div>
            <p className="text-xs text-red-200 mt-1">
              {t('tawidh.as_of', 'Sehingga')} {result.calculation_date}
            </p>
          </div>
        </div>

        {/* SPPT AI Recommendation */}
        <div className="bg-white rounded-xl border border-[#673AB7] p-6">
          <div className="flex items-center gap-2 mb-4">
            <AiBadge label="SPPT AI" variant="filled" />
            <span className="text-sm font-semibold text-[#673AB7]">
              {t('tawidh.ai_recommendation', "Cadangan Enjin AI SPPT")}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {result.ai_recommendation ??
              t('tawidh.ai_default',
                "Berdasarkan analisis Enjin AI SPPT, pembayaran segera akan mengurangkan amaun Ta'widh. Pertimbangkan moratorium jika menghadapi kesulitan kewangan."
              )}
          </p>
        </div>

        {/* Info Box */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">{t('tawidh.info_title', "Apa itu Ta'widh?")}</p>
            <p className="text-xs leading-relaxed">
              {t('tawidh.info_desc',
                "Ta'widh adalah pampasan yang dikenakan ke atas pembayaran tertunggak dalam pembiayaan Islam. Ia dikira berdasarkan kadar yang ditetapkan oleh Bank Negara Malaysia ke atas jumlah tunggakan dan bilangan hari tertunggak."
              )}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate(`/accounts/${id}/payment`)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2E7D32] text-white text-sm font-medium rounded-lg hover:bg-[#1B5E20] transition-colors"
          >
            <DollarSign className="w-4 h-4" />
            {t('account.record_payment', 'Rekod Pembayaran')}
          </button>
          <button
            onClick={() => navigate(`/accounts/${id}/moratorium`)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#E65100] text-white text-sm font-medium rounded-lg hover:bg-[#BF360C] transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            {t('account.apply_moratorium', 'Mohon Moratorium')}
          </button>
        </div>
      </div>
    </div>
  );
}
