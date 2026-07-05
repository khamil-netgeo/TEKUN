import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, ArrowRight, ChevronDown } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';

interface FormData {
  age: string;
  gender: string;
  citizenship: string;
  businessAge: string;
  blacklisted: string;
  bankrupt: string;
  existingTekun: string;
  amount: string;
}

interface SchemeResult {
  name: string;
  eligible: boolean;
  maxAmount: string;
  reason?: string;
}

function checkEligibility(form: FormData): { eligible: boolean; schemes: SchemeResult[]; generalIssues: string[] } {
  const age = parseInt(form.age);
  const generalIssues: string[] = [];

  if (form.citizenship !== 'yes') generalIssues.push('Pemohon mestilah warganegara Malaysia.');
  if (form.blacklisted === 'yes') generalIssues.push('Pemohon tidak boleh disenaraihitamkan oleh mana-mana institusi kewangan.');
  if (form.bankrupt === 'yes') generalIssues.push('Pemohon tidak boleh dalam status muflis.');
  if (form.existingTekun === 'yes') generalIssues.push('Pemohon tidak boleh mempunyai pembiayaan TEKUN aktif yang lain.');
  if (age < 18 || age > 60) generalIssues.push(`Umur pemohon (${age} tahun) mestilah antara 18-60 tahun.`);

  if (generalIssues.length > 0) {
    return { eligible: false, schemes: [], generalIssues };
  }

  const schemes: SchemeResult[] = [
    {
      name: 'TEKUN MICRO',
      eligible: form.businessAge === 'new' || form.businessAge === 'under2',
      maxAmount: 'RM10,000',
      reason: (form.businessAge !== 'new' && form.businessAge !== 'under2')
        ? 'TEKUN MICRO adalah untuk perniagaan baharu atau beroperasi kurang dari 2 tahun.'
        : undefined,
    },
    {
      name: 'TEKUN USAHAWAN',
      eligible: form.businessAge === 'over2' || form.businessAge === 'over5',
      maxAmount: 'RM50,000',
      reason: (form.businessAge !== 'over2' && form.businessAge !== 'over5')
        ? 'TEKUN USAHAWAN memerlukan perniagaan beroperasi melebihi 2 tahun.'
        : undefined,
    },
    {
      name: 'TEKUN WANITA',
      eligible: form.gender === 'female' && (form.businessAge === 'over2' || form.businessAge === 'over5' || form.businessAge === 'new' || form.businessAge === 'under2'),
      maxAmount: 'RM50,000',
      reason: form.gender !== 'female' ? 'TEKUN WANITA adalah khusus untuk usahawan wanita.' : undefined,
    },
    {
      name: 'TEKUN BELIA',
      eligible: age >= 18 && age <= 40,
      maxAmount: 'RM20,000',
      reason: age > 40 ? `TEKUN BELIA adalah untuk belia berumur 18-40 tahun. Umur anda (${age}) melebihi had.` : undefined,
    },
  ];

  const anyEligible = schemes.some(s => s.eligible);
  return { eligible: anyEligible, schemes, generalIssues: [] };
}

export default function SemakKelayakanPage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'bm' | 'en'>('bm');
  const [form, setForm] = useState<FormData>({
    age: '', gender: '', citizenship: '', businessAge: '',
    blacklisted: '', bankrupt: '', existingTekun: '', amount: '',
  });
  const [result, setResult] = useState<ReturnType<typeof checkEligibility> | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isComplete = Object.values(form).every(v => v !== '');

  const handleCheck = () => {
    if (!isComplete) return;
    setResult(checkEligibility(form));
    setSubmitted(true);
    setTimeout(() => {
      document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleReset = () => {
    setForm({ age: '', gender: '', citizenship: '', businessAge: '', blacklisted: '', bankrupt: '', existingTekun: '', amount: '' });
    setResult(null);
    setSubmitted(false);
  };

  const SelectField = ({ label, field, options }: { label: string; field: keyof FormData; options: { value: string; label: string }[] }) => (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
      <div className="relative">
        <select
          value={form[field]}
          onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          className="w-full appearance-none px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B2B5E] focus:border-transparent"
        >
          <option value="">-- Pilih --</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader lang={lang} setLang={setLang} />

      {/* Page title section */}
      <div className="bg-[#1B2B5E] text-white pt-40 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold">Semak Kelayakan Pembiayaan</h1>
          <p className="text-white/70 mt-3 text-lg">Jawab beberapa soalan mudah untuk mengetahui skim pembiayaan TEKUN yang sesuai untuk anda.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Form */}
        {!submitted && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-8">Maklumat Pemohon</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Age */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Umur Anda</label>
                <input
                  type="number"
                  min="1" max="100"
                  placeholder="Contoh: 35"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]"
                />
              </div>

              <SelectField
                label="Jantina"
                field="gender"
                options={[{ value: 'male', label: 'Lelaki' }, { value: 'female', label: 'Perempuan' }]}
              />

              <SelectField
                label="Adakah anda warganegara Malaysia?"
                field="citizenship"
                options={[{ value: 'yes', label: 'Ya' }, { value: 'no', label: 'Tidak' }]}
              />

              <SelectField
                label="Tempoh perniagaan anda beroperasi"
                field="businessAge"
                options={[
                  { value: 'new', label: 'Belum bermula (perniagaan baharu)' },
                  { value: 'under2', label: 'Kurang dari 2 tahun' },
                  { value: 'over2', label: '2 - 5 tahun' },
                  { value: 'over5', label: 'Lebih dari 5 tahun' },
                ]}
              />

              <SelectField
                label="Adakah anda disenaraihitamkan?"
                field="blacklisted"
                options={[{ value: 'no', label: 'Tidak' }, { value: 'yes', label: 'Ya' }]}
              />

              <SelectField
                label="Adakah anda dalam status muflis?"
                field="bankrupt"
                options={[{ value: 'no', label: 'Tidak' }, { value: 'yes', label: 'Ya' }]}
              />

              <SelectField
                label="Adakah anda mempunyai pembiayaan TEKUN aktif?"
                field="existingTekun"
                options={[{ value: 'no', label: 'Tidak' }, { value: 'yes', label: 'Ya' }]}
              />

              <SelectField
                label="Anggaran jumlah yang diperlukan"
                field="amount"
                options={[
                  { value: 'under10k', label: 'Kurang dari RM10,000' },
                  { value: '10k-20k', label: 'RM10,001 - RM20,000' },
                  { value: '20k-50k', label: 'RM20,001 - RM50,000' },
                ]}
              />
            </div>

            <button
              onClick={handleCheck}
              disabled={!isComplete}
              className="mt-8 w-full py-4 bg-[#1B2B5E] text-white rounded-xl font-bold text-sm hover:bg-[#111c3d] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
            >
              Semak Kelayakan Saya →
            </button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div id="result-section" className="space-y-6">
            {/* Overall result banner */}
            <div className={`rounded-2xl p-6 flex items-start gap-4 ${result.eligible ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {result.eligible
                ? <CheckCircle size={28} className="text-green-500 shrink-0 mt-0.5" />
                : <XCircle size={28} className="text-red-500 shrink-0 mt-0.5" />
              }
              <div>
                <h3 className={`text-lg font-bold ${result.eligible ? 'text-green-800' : 'text-red-800'}`}>
                  {result.eligible ? 'Tahniah! Anda Layak Memohon' : 'Maaf, Anda Tidak Layak Pada Masa Ini'}
                </h3>
                <p className={`text-sm mt-1 ${result.eligible ? 'text-green-700' : 'text-red-700'}`}>
                  {result.eligible
                    ? 'Berdasarkan maklumat yang diberikan, anda layak untuk satu atau lebih skim pembiayaan TEKUN.'
                    : 'Berdasarkan maklumat yang diberikan, terdapat syarat yang tidak dipenuhi.'}
                </p>
              </div>
            </div>

            {/* General issues */}
            {result.generalIssues.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <AlertCircle size={18} className="text-red-500" /> Syarat Tidak Dipenuhi
                </h4>
                <ul className="space-y-3">
                  {result.generalIssues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                      <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Scheme results */}
            {result.schemes.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h4 className="font-bold text-slate-900 mb-5">Keputusan Mengikut Skim</h4>
                <div className="space-y-4">
                  {result.schemes.map((scheme) => (
                    <div
                      key={scheme.name}
                      className={`flex items-start justify-between gap-4 p-4 rounded-xl border ${
                        scheme.eligible ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {scheme.eligible
                          ? <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
                          : <XCircle size={18} className="text-slate-400 shrink-0 mt-0.5" />
                        }
                        <div>
                          <p className={`font-bold text-sm ${scheme.eligible ? 'text-green-800' : 'text-slate-500'}`}>
                            {scheme.name}
                          </p>
                          {scheme.reason && (
                            <p className="text-xs text-slate-500 mt-1">{scheme.reason}</p>
                          )}
                        </div>
                      </div>
                      {scheme.eligible && (
                        <div className="text-right shrink-0">
                          <p className="text-xs text-slate-500">Sehingga</p>
                          <p className="font-bold text-[#1B2B5E] text-sm">{scheme.maxAmount}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              {result.eligible ? (
                <button
                  onClick={() => navigate('/mula-mohon')}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#1B2B5E] text-white py-4 rounded-xl font-bold hover:bg-[#111c3d] transition-colors"
                >
                  Mohon Sekarang <ArrowRight size={17} />
                </button>
              ) : null}
              <button
                onClick={handleReset}
                className="flex-1 py-4 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
              >
                Semak Semula
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
