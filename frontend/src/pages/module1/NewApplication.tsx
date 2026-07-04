import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ChevronRight, ChevronLeft, CheckCircle, Loader2 } from 'lucide-react';
import { createApplication } from '@/services/applicationService';
import { SCHEME_CONFIG } from '@/types/application';
import type { StoreApplicationPayload, ApplicationScheme } from '@/types/application';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 1, label: 'Pilih Skim' },
  { id: 2, label: 'Maklumat Peribadi' },
  { id: 3, label: 'Maklumat Perniagaan' },
  { id: 4, label: 'Semak & Hantar' },
];

const SCHEMES = [
  { key: 'tekun_micro' as ApplicationScheme, label: 'TEKUN Micro', desc: 'Pembiayaan kecil tanpa keperluan SSM', max: 10000, color: '#1B2B5E', features: ['Tanpa SSM', 'Proses 3 hari', 'Kadar 4% p.a.'] },
  { key: 'tekun_usahawan' as ApplicationScheme, label: 'TEKUN Usahawan', desc: 'Pembiayaan untuk usahawan berdaftar', max: 50000, color: '#2E7D32', features: ['Perlu SSM', 'Proses 7 hari', 'Kadar 3.5% p.a.'] },
  { key: 'tekun_wanita' as ApplicationScheme, label: 'TEKUN Wanita', desc: 'Pembiayaan khas untuk usahawan wanita', max: 30000, color: '#C2185B', features: ['Khas wanita', 'Proses 5 hari', 'Kadar 3% p.a.'] },
  { key: 'tekun_belia' as ApplicationScheme, label: 'TEKUN Belia', desc: 'Pembiayaan untuk usahawan muda 18-35 tahun', max: 20000, color: '#E65100', features: ['Umur 18-35', 'Proses 5 hari', 'Kadar 3% p.a.'] },
];

export default function NewApplication() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [createdApp, setCreatedApp] = useState<{ id: number; ref_no: string } | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<StoreApplicationPayload>({
    defaultValues: { scheme: undefined, amount_requested: 0, ic_no: '', full_name: '', phone: '', email: '', business_name: '', business_type: '', business_address: '', business_age_months: 0, monthly_income: 0, monthly_expense: 0, loan_purpose: '' },
  });

  const watchedScheme = watch('scheme');
  const watchedAll = watch();
  const selectedScheme = SCHEMES.find(s => s.key === watchedScheme);
  const inputClass = "w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-100";
  const labelClass = "block text-xs font-semibold mb-1";

  const onSubmit = async (data: StoreApplicationPayload) => {
    setSubmitting(true);
    try {
      const res = await createApplication(data);
      setCreatedApp({ id: res.application.id, ref_no: res.application.ref_no });
      toast.success('Permohonan berjaya disimpan sebagai draf!');
      setStep(5);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Ralat menyimpan permohonan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#1B2B5E' }}>Permohonan Pembiayaan Baharu</h1>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Sila lengkapkan semua maklumat yang diperlukan</p>
      </div>

      {step <= 4 && (
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: step > s.id ? '#2E7D32' : step === s.id ? '#1B2B5E' : '#E5E7EB', color: step >= s.id ? '#fff' : '#9CA3AF' }}>
                  {step > s.id ? <CheckCircle size={16} /> : s.id}
                </div>
                <span className="text-xs mt-1 text-center" style={{ color: step === s.id ? '#1B2B5E' : '#9CA3AF', fontWeight: step === s.id ? 600 : 400 }}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className="flex-1 h-0.5 mx-2 mb-5" style={{ background: step > s.id ? '#2E7D32' : '#E5E7EB' }} />}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {SCHEMES.map(s => (
                <button key={s.key} type="button" onClick={() => setValue('scheme', s.key)}
                  className="text-left p-5 rounded-xl border-2 transition-all"
                  style={{ borderColor: watchedScheme === s.key ? s.color : '#E5E7EB', background: watchedScheme === s.key ? `${s.color}08` : '#fff' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm" style={{ color: s.color }}>{s.label}</span>
                    {watchedScheme === s.key && <CheckCircle size={18} style={{ color: s.color }} />}
                  </div>
                  <p className="text-xs mb-3" style={{ color: '#6B7280' }}>{s.desc}</p>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#111827' }}>Sehingga RM {s.max.toLocaleString()}</p>
                  <ul className="space-y-1">{s.features.map(f => <li key={f} className="text-xs flex items-center gap-1" style={{ color: '#6B7280' }}><span style={{ color: s.color }}>✓</span> {f}</li>)}</ul>
                </button>
              ))}
            </div>
            {watchedScheme && (
              <div className="p-4 rounded-xl border" style={{ background: '#F0FDF4', borderColor: '#BBF7D0' }}>
                <label className={labelClass} style={{ color: '#15803D' }}>Jumlah Pembiayaan Dipohon (RM)</label>
                <input type="number" className={inputClass} style={{ borderColor: '#D1FAE5' }}
                  placeholder={`Min RM1,000 — Maks RM${selectedScheme?.max.toLocaleString()}`}
                  {...register('amount_requested', { required: 'Sila masukkan jumlah', min: { value: 1000, message: 'Minimum RM1,000' }, max: { value: selectedScheme?.max ?? 50000, message: `Maksimum RM${selectedScheme?.max.toLocaleString()}` } })} />
                {errors.amount_requested && <p className="text-xs mt-1" style={{ color: '#DC2626' }}>{errors.amount_requested.message}</p>}
              </div>
            )}
            <div className="flex justify-end">
              <button type="button" onClick={() => watchedScheme && watchedAll.amount_requested > 0 && setStep(2)}
                disabled={!watchedScheme || !watchedAll.amount_requested}
                className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: '#1B2B5E' }}>
                Seterusnya <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-base" style={{ color: '#1B2B5E' }}>Maklumat Peribadi Pemohon</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass} style={{ color: '#374151' }}>Nama Penuh (seperti dalam MyKad)</label>
                <input className={inputClass} style={{ borderColor: '#E5E7EB' }} placeholder="Contoh: Ahmad bin Abdullah"
                  {...register('full_name', { required: 'Nama penuh diperlukan' })} />
                {errors.full_name && <p className="text-xs mt-1" style={{ color: '#DC2626' }}>{errors.full_name.message}</p>}</div>
              <div><label className={labelClass} style={{ color: '#374151' }}>Nombor Kad Pengenalan</label>
                <input className={inputClass} style={{ borderColor: '#E5E7EB' }} placeholder="Contoh: 900101-14-1234"
                  {...register('ic_no', { required: 'No. K/P diperlukan', pattern: { value: /^\d{6}-\d{2}-\d{4}$/, message: 'Format: 900101-14-1234' } })} />
                {errors.ic_no && <p className="text-xs mt-1" style={{ color: '#DC2626' }}>{errors.ic_no.message}</p>}</div>
              <div><label className={labelClass} style={{ color: '#374151' }}>Nombor Telefon</label>
                <input className={inputClass} style={{ borderColor: '#E5E7EB' }} placeholder="Contoh: 0123456789"
                  {...register('phone', { required: 'No. telefon diperlukan' })} />
                {errors.phone && <p className="text-xs mt-1" style={{ color: '#DC2626' }}>{errors.phone.message}</p>}</div>
              <div><label className={labelClass} style={{ color: '#374151' }}>Alamat E-mel</label>
                <input type="email" className={inputClass} style={{ borderColor: '#E5E7EB' }} placeholder="Contoh: ahmad@email.com"
                  {...register('email', { required: 'E-mel diperlukan' })} />
                {errors.email && <p className="text-xs mt-1" style={{ color: '#DC2626' }}>{errors.email.message}</p>}</div>
            </div>
            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(1)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border font-medium" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}><ChevronLeft size={16} /> Kembali</button>
              <button type="button" onClick={() => setStep(3)} className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#1B2B5E' }}>Seterusnya <ChevronRight size={16} /></button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-base" style={{ color: '#1B2B5E' }}>Maklumat Perniagaan</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass} style={{ color: '#374151' }}>Nama Perniagaan</label>
                <input className={inputClass} style={{ borderColor: '#E5E7EB' }} placeholder="Nama perniagaan anda"
                  {...register('business_name', { required: 'Nama perniagaan diperlukan' })} />
                {errors.business_name && <p className="text-xs mt-1" style={{ color: '#DC2626' }}>{errors.business_name.message}</p>}</div>
              <div><label className={labelClass} style={{ color: '#374151' }}>Jenis Perniagaan</label>
                <input className={inputClass} style={{ borderColor: '#E5E7EB' }} placeholder="Contoh: Makanan & Minuman"
                  {...register('business_type', { required: 'Jenis perniagaan diperlukan' })} />
                {errors.business_type && <p className="text-xs mt-1" style={{ color: '#DC2626' }}>{errors.business_type.message}</p>}</div>
              <div className="col-span-2"><label className={labelClass} style={{ color: '#374151' }}>Alamat Perniagaan</label>
                <textarea className={inputClass} rows={2} style={{ borderColor: '#E5E7EB' }} placeholder="Alamat penuh premis perniagaan"
                  {...register('business_address', { required: 'Alamat perniagaan diperlukan' })} />
                {errors.business_address && <p className="text-xs mt-1" style={{ color: '#DC2626' }}>{errors.business_address.message}</p>}</div>
              <div><label className={labelClass} style={{ color: '#374151' }}>Tempoh Perniagaan (Bulan)</label>
                <input type="number" className={inputClass} style={{ borderColor: '#E5E7EB' }} placeholder="Contoh: 24"
                  {...register('business_age_months', { required: 'Tempoh perniagaan diperlukan', min: { value: 0, message: 'Minimum 0' } })} />
                {errors.business_age_months && <p className="text-xs mt-1" style={{ color: '#DC2626' }}>{errors.business_age_months.message}</p>}</div>
              <div><label className={labelClass} style={{ color: '#374151' }}>Pendapatan Bulanan (RM)</label>
                <input type="number" className={inputClass} style={{ borderColor: '#E5E7EB' }} placeholder="Contoh: 3000"
                  {...register('monthly_income', { required: 'Pendapatan bulanan diperlukan', min: { value: 0, message: 'Min 0' } })} />
                {errors.monthly_income && <p className="text-xs mt-1" style={{ color: '#DC2626' }}>{errors.monthly_income.message}</p>}</div>
              <div><label className={labelClass} style={{ color: '#374151' }}>Perbelanjaan Bulanan (RM)</label>
                <input type="number" className={inputClass} style={{ borderColor: '#E5E7EB' }} placeholder="Contoh: 1500"
                  {...register('monthly_expense', { required: 'Perbelanjaan bulanan diperlukan', min: { value: 0, message: 'Min 0' } })} />
                {errors.monthly_expense && <p className="text-xs mt-1" style={{ color: '#DC2626' }}>{errors.monthly_expense.message}</p>}</div>
              <div className="col-span-2"><label className={labelClass} style={{ color: '#374151' }}>Tujuan Pembiayaan</label>
                <textarea className={inputClass} rows={3} style={{ borderColor: '#E5E7EB' }} placeholder="Nyatakan tujuan penggunaan pembiayaan secara terperinci..."
                  {...register('loan_purpose', { required: 'Tujuan pembiayaan diperlukan', minLength: { value: 10, message: 'Minimum 10 aksara' } })} />
                {errors.loan_purpose && <p className="text-xs mt-1" style={{ color: '#DC2626' }}>{errors.loan_purpose.message}</p>}</div>
            </div>
            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(2)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border font-medium" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}><ChevronLeft size={16} /> Kembali</button>
              <button type="button" onClick={() => setStep(4)} className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#1B2B5E' }}>Semak & Hantar <ChevronRight size={16} /></button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-base mb-4" style={{ color: '#1B2B5E' }}>Semak Maklumat Permohonan</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Skim Pembiayaan', SCHEME_CONFIG[watchedAll.scheme as ApplicationScheme]?.label ?? watchedAll.scheme],
                  ['Jumlah Dipohon', `RM ${Number(watchedAll.amount_requested).toLocaleString()}`],
                  ['Nama Penuh', watchedAll.full_name],
                  ['No. Kad Pengenalan', watchedAll.ic_no],
                  ['No. Telefon', watchedAll.phone],
                  ['E-mel', watchedAll.email],
                  ['Nama Perniagaan', watchedAll.business_name],
                  ['Jenis Perniagaan', watchedAll.business_type],
                  ['Tempoh Perniagaan', `${watchedAll.business_age_months} bulan`],
                  ['Pendapatan Bulanan', `RM ${Number(watchedAll.monthly_income).toLocaleString()}`],
                  ['Perbelanjaan Bulanan', `RM ${Number(watchedAll.monthly_expense).toLocaleString()}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-gray-50">
                    <span style={{ color: '#6B7280' }}>{label}</span>
                    <span className="font-semibold" style={{ color: '#111827' }}>{value}</span>
                  </div>
                ))}
                <div className="col-span-2 py-2 border-b border-gray-50">
                  <span style={{ color: '#6B7280' }}>Tujuan Pembiayaan</span>
                  <p className="font-semibold mt-1" style={{ color: '#111827' }}>{watchedAll.loan_purpose}</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl border" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
              <p className="text-xs" style={{ color: '#92400E' }}>
                <strong>Peringatan:</strong> Permohonan ini akan disimpan sebagai <strong>draf</strong>. Anda perlu muat naik dokumen sokongan dan menghantar permohonan untuk memulakan proses semakan.
              </p>
            </div>
            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(3)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border font-medium" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}><ChevronLeft size={16} /> Kembali</button>
              <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: '#2E7D32' }}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {submitting ? 'Menyimpan...' : 'Simpan Draf Permohonan'}
              </button>
            </div>
          </div>
        )}

        {step === 5 && createdApp && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: '#F0FDF4' }}>
              <CheckCircle size={36} style={{ color: '#2E7D32' }} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: '#1B2B5E' }}>Permohonan Berjaya Disimpan!</h2>
            <p className="text-sm" style={{ color: '#6B7280' }}>No. Rujukan: <span className="font-bold font-mono" style={{ color: '#1B2B5E' }}>{createdApp.ref_no}</span></p>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>Sila muat naik dokumen sokongan dan hantar permohonan untuk memulakan proses semakan.</p>
            <div className="flex justify-center gap-3 pt-2">
              <button type="button" onClick={() => navigate(`/module1/documents/${createdApp.id}`)}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#1B2B5E' }}>Muat Naik Dokumen</button>
              <button type="button" onClick={() => navigate('/module1')}
                className="px-5 py-2 rounded-lg text-sm border font-medium" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>Kembali ke Senarai</button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
