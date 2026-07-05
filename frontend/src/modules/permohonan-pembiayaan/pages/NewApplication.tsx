import { toast, ToastContainer } from '@/components/ui/Toast';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { PageHeader, LoadingSpinner,  } from '@/components/ui';
import AiBadge from '@/components/ui/AiBadge';
import { useTranslation } from 'react-i18next';
import { Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://34.177.95.116:8000';

interface Scheme {
  id: number;
  code: string;
  name: string;
  name_en: string;
  min_amount: number;
  max_amount: number;
  max_tenure_months: number;
  profit_rate: number;
}

interface FormData {
  scheme: string;
  amount_requested: number;
  tenure_months: number;
  ic_no: string;
  full_name: string;
  phone: string;
  email: string;
  business_name: string;
  business_type: string;
  business_address: string;
  business_age_months: number;
  monthly_income: number;
  monthly_expense: number;
  loan_purpose: string;
}

interface OcrData {
  full_name?: string;
  ic_no?: string;
  address?: string;
  [key: string]: string | undefined;
}

const STEPS = ['Skim Pembiayaan', 'Maklumat Pemohon', 'Maklumat Perniagaan', 'Semakan & Hantar'];

export default function NewApplication() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isBM = i18n.language === 'ms';
  const token = localStorage.getItem('token') || '';

  const [step, setStep] = useState(0);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loadingSchemes, setLoadingSchemes] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocrData, setOcrData] = useState<OcrData | null>(null);
  const [ocrApplied, setOcrApplied] = useState(false);

  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<FormData>({
    defaultValues: { tenure_months: 24, amount_requested: 5000 },
  });

  const selectedScheme = watch('scheme');
  const scheme = schemes.find(s => s.code === selectedScheme);

  useEffect(() => {
    const load = async () => {
      setLoadingSchemes(true);
      try {
        const res = await axios.get(`${API_BASE}/api/applications/schemes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data?.data || res.data?.schemes || res.data || [];
        setSchemes(Array.isArray(data) ? data : []);
      } catch {
        setSchemes([
          { id: 1, code: 'tekun_micro', name: 'TEKUN Mikro', name_en: 'TEKUN Micro', min_amount: 1000, max_amount: 10000, max_tenure_months: 36, profit_rate: 4.0 },
          { id: 2, code: 'tekun_usahawan', name: 'TEKUN Usahawan', name_en: 'TEKUN Entrepreneur', min_amount: 5000, max_amount: 50000, max_tenure_months: 60, profit_rate: 4.5 },
          { id: 3, code: 'tekun_wanita', name: 'TEKUN Wanita', name_en: 'TEKUN Women', min_amount: 1000, max_amount: 20000, max_tenure_months: 48, profit_rate: 3.5 },
          { id: 4, code: 'tekun_belia', name: 'TEKUN Belia', name_en: 'TEKUN Youth', min_amount: 1000, max_amount: 15000, max_tenure_months: 36, profit_rate: 3.0 },
        ]);
      } finally {
        setLoadingSchemes(false);
      }
    };
    load();
  }, [token]);

  useEffect(() => {
    const stored = sessionStorage.getItem('ocr_data');
    if (stored) {
      try { setOcrData(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const applyOcrFill = () => {
    if (!ocrData) return;
    if (ocrData['Nama Penuh'] || ocrData.full_name) setValue('full_name', ocrData['Nama Penuh'] || ocrData.full_name || '');
    if (ocrData['No. IC'] || ocrData.ic_no) setValue('ic_no', ocrData['No. IC'] || ocrData.ic_no || '');
    if (ocrData['Alamat'] || ocrData.address) setValue('business_address', ocrData['Alamat'] || ocrData.address || '');
    setOcrApplied(true);
    sessionStorage.removeItem('ocr_data');
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/api/applications`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const appId = res.data?.application?.id || res.data?.data?.id || res.data?.id;
      navigate(`/permohonan/${appId}/dokumen`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || (isBM ? 'Gagal menghantar permohonan' : 'Failed to submit application'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingSchemes) return <LoadingSpinner fullPage />;

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <PageHeader
        title={isBM ? 'Permohonan Baharu' : 'New Application'}
        subtitle={isBM ? 'Isi borang permohonan pembiayaan' : 'Fill in the financing application form'}
        breadcrumbs={[{ label: isBM ? 'Permohonan' : 'Applications', href: '/permohonan' }, { label: isBM ? 'Permohonan Baharu' : 'New Application' }]}
      />
      <ToastContainer />
      {ocrData && !ocrApplied && (
        <div className="mx-6 mt-4 p-4 rounded-lg border-2 border-purple-200 bg-purple-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#673AB7]" />
            <div>
              <p className="text-sm font-semibold text-purple-800">{isBM ? 'Data OCR Tersedia' : 'OCR Data Available'}</p>
              <p className="text-xs text-purple-600">{isBM ? 'Enjin AI SPPT telah mengekstrak data dari dokumen anda.' : 'SPPT AI Engine extracted data from your document.'}</p>
            </div>
            <AiBadge label="SPPT AI" />
          </div>
          <button onClick={applyOcrFill} className="px-4 py-2 bg-[#673AB7] text-white text-sm rounded-lg hover:bg-purple-800 transition-colors font-medium">
            {isBM ? 'Isi Automatik' : 'Auto-Fill'}
          </button>
        </div>
      )}
      {ocrApplied && (
        <div className="mx-6 mt-4 p-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2">
          <AiBadge label={isBM ? 'Auto-isi berjaya' : 'Auto-fill applied'} variant="filled" />
          <p className="text-sm text-green-700">{isBM ? 'Medan borang telah diisi dari data OCR. Sila semak sebelum menghantar.' : 'Form fields filled from OCR data. Please review before submitting.'}</p>
        </div>
      )}
      <div className="mx-6 mt-4">
        <div className="flex items-center">
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center gap-2 ${i <= step ? 'text-[#1B2B5E]' : 'text-gray-400'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i < step ? 'bg-[#2E7D32] text-white' : i === step ? 'bg-[#1B2B5E] text-white' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</div>
                <span className="text-xs font-medium hidden sm:block">{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-[#2E7D32]' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="mx-6 mt-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {step === 0 && (
            <div>
              <h3 className="text-base font-semibold text-[#1B2B5E] mb-4">{isBM ? 'Pilih Skim Pembiayaan' : 'Select Financing Scheme'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {schemes.map(s => (
                  <label key={s.code} className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedScheme === s.code ? 'border-[#1B2B5E] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" value={s.code} {...register('scheme', { required: true })} className="sr-only" />
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800">{isBM ? s.name : s.name_en}</p>
                        <p className="text-xs text-gray-500 mt-1">RM {s.min_amount.toLocaleString()} - RM {s.max_amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{isBM ? 'Kadar Keuntungan' : 'Profit Rate'}: {s.profit_rate}% p.a.</p>
                      </div>
                      <span className="text-xs bg-[#1B2B5E] text-white px-2 py-1 rounded">{s.max_tenure_months} {isBM ? 'bln' : 'mo'}</span>
                    </div>
                  </label>
                ))}
              </div>
              {errors.scheme && <p className="text-red-500 text-xs mt-2">{isBM ? 'Sila pilih skim' : 'Please select a scheme'}</p>}
              {scheme && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{isBM ? 'Jumlah Pembiayaan (RM)' : 'Financing Amount (RM)'}</label>
                    <input type="number" {...register('amount_requested', { required: true, min: scheme.min_amount, max: scheme.max_amount })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2B5E]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{isBM ? 'Tempoh (Bulan)' : 'Tenure (Months)'}</label>
                    <select {...register('tenure_months', { required: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2B5E]">
                      {[12, 24, 36, 48, 60].filter(t => t <= scheme.max_tenure_months).map(t => <option key={t} value={t}>{t} {isBM ? 'bulan' : 'months'}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
          {step === 1 && (
            <div>
              <h3 className="text-base font-semibold text-[#1B2B5E] mb-4">{isBM ? 'Maklumat Pemohon' : 'Applicant Information'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'full_name' as const, label: isBM ? 'Nama Penuh' : 'Full Name', type: 'text' },
                  { name: 'ic_no' as const, label: isBM ? 'No. Kad Pengenalan' : 'IC Number', type: 'text' },
                  { name: 'phone' as const, label: isBM ? 'No. Telefon' : 'Phone Number', type: 'tel' },
                  { name: 'email' as const, label: 'E-mel / Email', type: 'email' },
                ].map(field => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    <input type={field.type} {...register(field.name, { required: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2B5E]" />
                    {errors[field.name] && <p className="text-red-500 text-xs mt-1">{isBM ? 'Medan wajib diisi' : 'Required'}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <h3 className="text-base font-semibold text-[#1B2B5E] mb-4">{isBM ? 'Maklumat Perniagaan' : 'Business Information'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'business_name' as const, label: isBM ? 'Nama Perniagaan' : 'Business Name', type: 'text' },
                  { name: 'business_type' as const, label: isBM ? 'Jenis Perniagaan' : 'Business Type', type: 'text' },
                  { name: 'business_age_months' as const, label: isBM ? 'Umur Perniagaan (Bulan)' : 'Business Age (Months)', type: 'number' },
                  { name: 'monthly_income' as const, label: isBM ? 'Pendapatan Bulanan (RM)' : 'Monthly Income (RM)', type: 'number' },
                  { name: 'monthly_expense' as const, label: isBM ? 'Perbelanjaan Bulanan (RM)' : 'Monthly Expense (RM)', type: 'number' },
                ].map(field => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    <input type={field.type} {...register(field.name, { required: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2B5E]" />
                    {errors[field.name] && <p className="text-red-500 text-xs mt-1">{isBM ? 'Medan wajib diisi' : 'Required'}</p>}
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{isBM ? 'Alamat Perniagaan' : 'Business Address'}</label>
                  <textarea {...register('business_address', { required: true })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2B5E]" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{isBM ? 'Tujuan Pembiayaan' : 'Loan Purpose'}</label>
                  <textarea {...register('loan_purpose', { required: true })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2B5E]" />
                </div>
              </div>
            </div>
          )}
          {step === 3 && (
            <div>
              <h3 className="text-base font-semibold text-[#1B2B5E] mb-4">{isBM ? 'Semakan & Pengesahan' : 'Review & Confirm'}</h3>
              <div className="space-y-3">
                {[
                  { label: isBM ? 'Skim' : 'Scheme', value: scheme ? (isBM ? scheme.name : scheme.name_en) : '-' },
                  { label: isBM ? 'Jumlah' : 'Amount', value: `RM ${Number(getValues('amount_requested')).toLocaleString()}` },
                  { label: isBM ? 'Tempoh' : 'Tenure', value: `${getValues('tenure_months')} ${isBM ? 'bulan' : 'months'}` },
                  { label: isBM ? 'Nama' : 'Name', value: getValues('full_name') },
                  { label: isBM ? 'No. IC' : 'IC No.', value: getValues('ic_no') },
                  { label: isBM ? 'Telefon' : 'Phone', value: getValues('phone') },
                  { label: 'E-mel', value: getValues('email') },
                  { label: isBM ? 'Perniagaan' : 'Business', value: getValues('business_name') },
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">{row.label}</span>
                    <span className="text-sm font-medium text-gray-800">{row.value || '-'}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4">{isBM ? 'Dengan menghantar permohonan ini, saya mengesahkan bahawa semua maklumat yang diberikan adalah benar dan tepat.' : 'By submitting this application, I confirm that all information provided is true and accurate.'}</p>
            </div>
          )}
          <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/permohonan')} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" />
              {step === 0 ? (isBM ? 'Batal' : 'Cancel') : (isBM ? 'Kembali' : 'Back')}
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={() => setStep(s => s + 1)} className="flex items-center gap-2 px-4 py-2 bg-[#1B2B5E] text-white rounded-lg text-sm hover:bg-blue-900">
                {isBM ? 'Seterusnya' : 'Next'}<ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2 bg-[#2E7D32] text-white rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50">
                {submitting ? (isBM ? 'Menghantar...' : 'Submitting...') : (isBM ? 'Hantar Permohonan' : 'Submit Application')}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
