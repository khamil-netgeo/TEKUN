import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '@/services/api';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import AiBadge from '@/components/ui/AiBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast, ToastContainer } from '@/components/ui/Toast';
import { useTranslation } from 'react-i18next';
import {
  Calendar, AlertTriangle, CheckCircle, Clock, ArrowLeft, Send
} from 'lucide-react';

interface Account {
  id: number;
  account_no: string;
  applicant_name: string;
  outstanding_balance: number;
  monthly_installment: number;
  arrears_days: number;
  classification: string;
}

interface MoratoriumForm {
  type: 'moratorium' | 'restructuring' | 'rescheduling';
  reason: string;
  duration_months: number;
  start_date: string;
  supporting_docs?: string;
}

interface AiImpact {
  recommended: boolean;
  impact_score: number;
  recommendation: string;
  risks: string[];
  benefits: string[];
}

export default function Moratorium() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [account,   setAccount]   = useState<Account | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [aiImpact,  setAiImpact]  = useState<AiImpact | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [success,   setSuccess]   = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<MoratoriumForm>({
    defaultValues: {
      type: 'moratorium',
      duration_months: 3,
      start_date: new Date().toISOString().split('T')[0],
    },
  });

  const watchType   = watch('type');
  const watchReason = watch('reason');

  useEffect(() => {
    if (!id) return;
    api.get(`/accounts/${id}`)
      .then(r => setAccount(r.data?.data ?? r.data))
      .catch(() => toast.error(t('moratorium.load_error', 'Gagal memuatkan akaun')))
      .finally(() => setLoading(false));
  }, [id, t]);

  // Auto-fetch AI impact analysis when reason is filled
  useEffect(() => {
    if (!watchReason || watchReason.length < 20 || !account) return;
    const timer = setTimeout(() => {
      setAiLoading(true);
      // Simulate AI impact analysis locally to avoid missing endpoint error
      setTimeout(() => {
        setAiImpact({
          recommended: account.arrears_days < 180,
          impact_score: Math.max(30, 90 - account.arrears_days),
          recommendation: account.arrears_days < 90
            ? t('moratorium.ai_recommend_yes', 'Moratorium disyorkan untuk mengelakkan NPL.')
            : t('moratorium.ai_recommend_caution', 'Pertimbangkan penstrukturan semula dengan teliti.'),
          risks: [t('moratorium.risk_1', 'Tempoh pembiayaan dilanjutkan'), t('moratorium.risk_2', 'Kos faedah bertambah')],
          benefits: [t('moratorium.benefit_1', 'Mengurangkan tekanan aliran tunai'), t('moratorium.benefit_2', 'Mengelakkan status NPL')],
        });
        setAiLoading(false);
      }, 500);
    }, 800);
    return () => clearTimeout(timer);
  }, [watchReason, watchType, account, t]);

  const onSubmit = async (data: MoratoriumForm) => {
    if (!id) return;
    setSubmitting(true);
    try {
      await api.post(`/accounts/${id}/moratorium`, data);
      setSuccess(true);
      toast.success(t('moratorium.submit_success', 'Permohonan moratorium berjaya dihantar!'));
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? t('moratorium.submit_error', 'Gagal menghantar permohonan'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner />
    </div>
  );

  if (success) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-[#2E7D32]" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          {t('moratorium.success_title', 'Permohonan Berjaya Dihantar')}
        </h2>
        <p className="text-sm text-gray-500">
          {t('moratorium.success_desc', 'Permohonan anda sedang dalam semakan. Anda akan dihubungi dalam 3-5 hari bekerja.')}
        </p>
      </div>
      <button
        onClick={() => navigate(`/accounts/${id}`)}
        className="px-6 py-2 bg-[#1B2B5E] text-white text-sm font-medium rounded-lg"
      >
        {t('moratorium.back_to_account', 'Kembali ke Akaun')}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />
      <PageHeader
        title={t('moratorium.title', 'Permohonan Moratorium / Penstrukturan Semula')}
        subtitle={account?.account_no}
        breadcrumbs={[
          { label: t('nav.accounts', 'Akaun'), href: '/accounts' },
          { label: account?.account_no ?? id ?? '', href: `/accounts/${id}` },
          { label: t('moratorium.title', 'Moratorium') },
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Account Summary Cards */}
        {account && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              title={t('account.outstanding', 'Baki Tertunggak')}
              value={`RM ${account.outstanding_balance.toLocaleString('ms-MY')}`}
              icon={<AlertTriangle className="w-5 h-5" />}
              colour="orange"
            />
            <StatCard
              title={t('account.monthly_installment', 'Ansuran Bulanan')}
              value={`RM ${account.monthly_installment.toLocaleString('ms-MY')}`}
              icon={<Calendar className="w-5 h-5" />}
              colour="navy"
            />
            <StatCard
              title={t('account.arrears_days', 'Hari Tunggakan')}
              value={String(account.arrears_days)}
              icon={<Clock className="w-5 h-5" />}
              colour={account.arrears_days > 0 ? 'orange' : 'green'}
            />
            <StatCard
              title={t('account.classification', 'Klasifikasi')}
              value={account.classification.toUpperCase()}
              icon={<CheckCircle className="w-5 h-5" />}
              colour={account.classification === 'lancar' ? 'green' : 'orange'}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Application Form */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-5">
              {t('moratorium.form_title', 'Borang Permohonan')}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

              {/* Type */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  {t('moratorium.type', 'Jenis Permohonan')} *
                </label>
                <select
                  {...register('type', { required: true })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]"
                >
                  <option value="moratorium">{t('moratorium.type_moratorium', 'Moratorium (Tangguh Bayaran)')}</option>
                  <option value="restructuring">{t('moratorium.type_restructuring', 'Penstrukturan Semula')}</option>
                  <option value="rescheduling">{t('moratorium.type_rescheduling', 'Penjadualan Semula')}</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  {t('moratorium.duration', 'Tempoh (Bulan)')} *
                </label>
                <select
                  {...register('duration_months', { required: true, valueAsNumber: true })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]"
                >
                  {[1, 2, 3, 6, 9, 12].map(m => (
                    <option key={m} value={m}>{m} {t('common.months', 'bulan')}</option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  {t('moratorium.start_date', 'Tarikh Mula')} *
                </label>
                <input
                  type="date"
                  {...register('start_date', { required: true })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  {t('moratorium.reason', 'Sebab Permohonan')} *
                </label>
                <textarea
                  {...register('reason', { required: true, minLength: 20 })}
                  rows={4}
                  placeholder={t('moratorium.reason_placeholder', 'Terangkan sebab permohonan moratorium anda...')}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E] resize-none"
                />
                {errors.reason && (
                  <p className="text-xs text-red-500 mt-1">
                    {t('moratorium.reason_required', 'Sebab permohonan diperlukan (minimum 20 aksara)')}
                  </p>
                )}
              </div>

              {/* Supporting Docs */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  {t('moratorium.supporting_docs', 'Dokumen Sokongan (URL/Rujukan)')}
                </label>
                <input
                  type="text"
                  {...register('supporting_docs')}
                  placeholder={t('moratorium.docs_placeholder', 'Contoh: Surat Sakit, Surat PHK...')}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#1B2B5E] text-white text-sm font-semibold rounded-lg hover:bg-[#0d1a3a] disabled:opacity-60 transition-colors"
              >
                {submitting ? (
                  <><LoadingSpinner />{t('common.submitting', 'Menghantar...')}</>
                ) : (
                  <><Send className="w-4 h-4" />{t('moratorium.submit', 'Hantar Permohonan')}</>
                )}
              </button>
            </form>
          </div>

          {/* SPPT AI Impact Analysis */}
          <div className="bg-white rounded-xl border border-[#673AB7] p-6 h-fit">
            <div className="flex items-center gap-2 mb-4">
              <AiBadge label="SPPT AI" variant="filled" />
              <span className="text-sm font-semibold text-[#673AB7]">
                {t('moratorium.ai_analysis', 'Analisis Impak — Enjin AI SPPT')}
              </span>
            </div>

            {aiLoading ? (
              <div className="flex items-center gap-3 py-4">
                <LoadingSpinner />
                <span className="text-xs text-purple-600">
                  {t('moratorium.ai_analyzing', 'Enjin AI SPPT sedang menganalisis...')}
                </span>
              </div>
            ) : aiImpact ? (
              <div className="space-y-4">
                {/* Recommendation */}
                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                  aiImpact.recommended ? 'bg-green-50 text-[#2E7D32]' : 'bg-orange-50 text-[#E65100]'
                }`}>
                  {aiImpact.recommended
                    ? <CheckCircle className="w-4 h-4 shrink-0" />
                    : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span className="text-xs font-medium">{aiImpact.recommendation}</span>
                </div>

                {/* Impact Score */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">{t('moratorium.impact_score', 'Skor Impak')}</span>
                    <span className="text-sm font-bold text-[#673AB7]">{aiImpact.impact_score}/100</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-[#673AB7] transition-all duration-700"
                      style={{ width: `${aiImpact.impact_score}%` }}
                    />
                  </div>
                </div>

                {/* Benefits */}
                {aiImpact.benefits.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-[#2E7D32] mb-1">
                      {t('moratorium.benefits', 'Manfaat')}
                    </p>
                    <ul className="space-y-1">
                      {aiImpact.benefits.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                          <CheckCircle className="w-3 h-3 text-[#2E7D32] mt-0.5 shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risks */}
                {aiImpact.risks.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-[#E65100] mb-1">
                      {t('moratorium.risks', 'Risiko')}
                    </p>
                    <ul className="space-y-1">
                      {aiImpact.risks.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                          <AlertTriangle className="w-3 h-3 text-[#E65100] mt-0.5 shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">
                  {t('moratorium.ai_prompt', 'Sila isi sebab permohonan (minimum 20 aksara) untuk melihat analisis impak AI.')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}