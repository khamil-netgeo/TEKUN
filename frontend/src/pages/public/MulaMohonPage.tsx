import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, CheckCircle2, FileText, CreditCard,
  Building2, Receipt, Store, Briefcase, Users, Rocket,
  ChevronRight, Cpu, ShieldCheck, Landmark
} from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';

/* ──────────────────────────────────────────────
   i18n copy
────────────────────────────────────────────── */
const COPY = {
  bm: {
    back: 'Kembali ke Laman Utama',
    eyebrow: 'PANDUAN PERMOHONAN',
    title: 'Mulakan Permohonan Anda',
    subtitle: 'Sila semak syarat kelayakan dan sediakan dokumen yang diperlukan sebelum memulakan permohonan rasmi.',

    eligTitle: 'Semak Kelayakan',
    eligSub: 'Pastikan anda memenuhi syarat-syarat berikut sebelum memohon.',
    eligItems: [
      'Warganegara Malaysia berumur 18 hingga 60 tahun',
      'Perniagaan berdaftar dengan SSM (Suruhanjaya Syarikat Malaysia)',
      'Tidak disenaraikan hitam oleh mana-mana institusi kewangan',
      'Tidak mempunyai rekod muflis yang aktif',
      'Berdomisil di Malaysia',
      'Mempunyai akaun bank aktif atas nama pemohon',
    ],

    docsTitle: 'Dokumen Diperlukan',
    docsSub: 'Sediakan dokumen-dokumen berikut dalam format PDF atau gambar yang jelas.',
    docs: [
      { icon: 'id', label: 'Salinan MyKad' },
      { icon: 'biz', label: 'Sijil Pendaftaran SSM' },
      { icon: 'bank', label: 'Penyata Bank (3 bulan)' },
      { icon: 'receipt', label: 'Penyata Kewangan Perniagaan' },
    ],

    schemeTitle: 'Pilih Skim Pembiayaan',
    schemeSub: 'Pilih skim yang paling sesuai dengan keperluan perniagaan anda.',
    schemes: [
      {
        id: 'micro',
        name: 'TEKUN MICRO',
        icon: 'store',
        amount: 'RM10,000',
        desc: 'Sesuai untuk perniagaan baharu atau kurang 2 tahun.',
        elig: ['Warganegara Malaysia, 18–60 tahun', 'Perniagaan baharu atau kurang 2 tahun'],
        rate: '4% p.a.',
        tenure: '5 tahun',
      },
      {
        id: 'usahawan',
        name: 'TEKUN USAHAWAN',
        icon: 'briefcase',
        amount: 'RM50,000',
        desc: 'Untuk mengembangkan perniagaan yang telah aktif.',
        elig: ['Perniagaan aktif melebihi 2 tahun', 'Rekod pembayaran yang baik'],
        rate: '4% p.a.',
        tenure: '5 tahun',
      },
      {
        id: 'wanita',
        name: 'TEKUN WANITA',
        icon: 'users',
        amount: 'RM50,000',
        desc: 'Memperkasa usahawan wanita Malaysia.',
        elig: ['Usahawan wanita warganegara Malaysia', 'Berumur 18–60 tahun'],
        rate: '4% p.a.',
        tenure: '5 tahun',
      },
      {
        id: 'belia',
        name: 'TEKUN BELIA',
        icon: 'rocket',
        amount: 'RM20,000',
        desc: 'Menyokong usahawan muda yang bersemangat.',
        elig: ['Belia berumur 18–40 tahun', 'Warganegara Malaysia'],
        rate: '4% p.a.',
        tenure: '5 tahun',
      },
    ],

    ctaTitle: 'Bersedia untuk memohon?',
    ctaSub: 'Daftar akaun baharu atau log masuk jika anda sudah mempunyai akaun.',
    ctaDaftar: 'Daftar Akaun Baharu',
    ctaLogin: 'Sudah Ada Akaun? Log Masuk',

    trust1: 'Keselamatan Gred Kerajaan',
    trust2: 'Dikuasakan Teknologi AI',
    trust3: 'Patuh Shariah',
  },
  en: {
    back: 'Back to Home',
    eyebrow: 'APPLICATION GUIDE',
    title: 'Start Your Application',
    subtitle: 'Please check the eligibility requirements and prepare the necessary documents before starting your official application.',

    eligTitle: 'Check Eligibility',
    eligSub: 'Ensure you meet the following requirements before applying.',
    eligItems: [
      'Malaysian citizen aged 18 to 60 years',
      'Business registered with SSM (Companies Commission of Malaysia)',
      'Not blacklisted by any financial institution',
      'No active bankruptcy record',
      'Domiciled in Malaysia',
      'Have an active bank account in the applicant\'s name',
    ],

    docsTitle: 'Required Documents',
    docsSub: 'Prepare the following documents in PDF or clear image format.',
    docs: [
      { icon: 'id', label: 'MyKad Copy' },
      { icon: 'biz', label: 'SSM Registration Certificate' },
      { icon: 'bank', label: 'Bank Statement (3 months)' },
      { icon: 'receipt', label: 'Business Financial Statement' },
    ],

    schemeTitle: 'Choose Financing Scheme',
    schemeSub: 'Select the scheme that best suits your business needs.',
    schemes: [
      {
        id: 'micro',
        name: 'TEKUN MICRO',
        icon: 'store',
        amount: 'RM10,000',
        desc: 'Suitable for new businesses or under 2 years old.',
        elig: ['Malaysian citizen, aged 18–60', 'New business or under 2 years'],
        rate: '4% p.a.',
        tenure: '5 years',
      },
      {
        id: 'usahawan',
        name: 'TEKUN USAHAWAN',
        icon: 'briefcase',
        amount: 'RM50,000',
        desc: 'To grow an already active business.',
        elig: ['Active business over 2 years', 'Good repayment record'],
        rate: '4% p.a.',
        tenure: '5 years',
      },
      {
        id: 'wanita',
        name: 'TEKUN WANITA',
        icon: 'users',
        amount: 'RM50,000',
        desc: 'Empowering Malaysian women entrepreneurs.',
        elig: ['Malaysian women entrepreneurs', 'Aged 18–60'],
        rate: '4% p.a.',
        tenure: '5 years',
      },
      {
        id: 'belia',
        name: 'TEKUN BELIA',
        icon: 'rocket',
        amount: 'RM20,000',
        desc: 'Supporting enthusiastic young entrepreneurs.',
        elig: ['Youth aged 18–40', 'Malaysian citizen'],
        rate: '4% p.a.',
        tenure: '5 years',
      },
    ],

    ctaTitle: 'Ready to apply?',
    ctaSub: 'Register a new account or log in if you already have one.',
    ctaDaftar: 'Register New Account',
    ctaLogin: 'Already Have an Account? Log In',

    trust1: 'Government-Grade Security',
    trust2: 'AI Technology Powered',
    trust3: 'Shariah-Compliant',
  },
};

const SCHEME_ICONS: Record<string, any> = { store: Store, briefcase: Briefcase, users: Users, rocket: Rocket };

const DOC_ICONS: Record<string, React.ReactNode> = {
  id: <CreditCard size={28} className="text-slate-600" />,
  biz: <Building2 size={28} className="text-slate-600" />,
  bank: <FileText size={28} className="text-slate-600" />,
  receipt: <Receipt size={28} className="text-slate-600" />,
};

/* ──────────────────────────────────────────────
   Component
────────────────────────────────────────────── */
export default function MulaMohonPage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'bm' | 'en'>('bm');
  const [selectedScheme, setSelectedScheme] = useState<string>('micro');
  const t = COPY[lang];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">

      <PublicHeader lang={lang} setLang={setLang} />

      {/* ── Section A: Hero ── */}
      <section className="pt-24 pb-12 text-center bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs font-bold tracking-[0.2em] text-red-600 uppercase mb-4">{t.eyebrow}</p>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900">{t.title}</h1>
          <p className="mt-5 text-lg text-slate-600 leading-relaxed">{t.subtitle}</p>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap justify-center items-center gap-4">
            <span className="inline-flex items-center gap-2 text-slate-500 text-sm font-medium">
              <ShieldCheck size={15} className="text-slate-400" /> {t.trust1}
            </span>
            <span className="inline-flex items-center gap-2 text-slate-500 text-sm font-medium">
              <Cpu size={15} className="text-slate-400" /> {t.trust2}
            </span>
            <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100 text-xs font-semibold">
              <Landmark size={13} className="text-emerald-600" /> {t.trust3}
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">

        {/* ── Section B: Semak Kelayakan ── */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-1">{t.eligTitle}</h2>
          <p className="text-sm text-slate-500 mb-6">{t.eligSub}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {t.eligItems.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-sm text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Section C: Dokumen Diperlukan ── */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-1">{t.docsTitle}</h2>
          <p className="text-sm text-slate-500 mb-6">{t.docsSub}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {t.docs.map((doc) => (
              <div key={doc.label} className="flex flex-col items-center p-5 rounded-xl bg-slate-50 border border-slate-100 text-center gap-3 hover:border-slate-200 transition-colors">
                {DOC_ICONS[doc.icon]}
                <span className="text-sm font-semibold text-slate-800 leading-snug">{doc.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Section D: Pilih Skim ── */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-1">{t.schemeTitle}</h2>
          <p className="text-sm text-slate-500 mb-6">{t.schemeSub}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {t.schemes.map((scheme) => {
              const Icon = SCHEME_ICONS[scheme.icon];
              const isSelected = selectedScheme === scheme.id;
              return (
                <label
                  key={scheme.id}
                  className={`relative flex flex-col p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-red-500 bg-red-50/30 shadow-md shadow-red-100'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <input
                    type="radio"
                    name="skim"
                    value={scheme.id}
                    checked={isSelected}
                    onChange={() => setSelectedScheme(scheme.id)}
                    className="sr-only"
                  />
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-4 right-4 h-5 w-5 rounded-full bg-red-600 flex items-center justify-center">
                      <CheckCircle2 size={12} className="text-white" />
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isSelected ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{scheme.name}</p>
                      <p className="text-2xl font-bold text-slate-900">{scheme.amount}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{scheme.desc}</p>
                  <div className="flex gap-6 text-xs text-slate-500 border-t border-slate-100 pt-3 mt-auto">
                    <span><span className="font-semibold text-slate-700">{scheme.rate}</span> kadar</span>
                    <span><span className="font-semibold text-slate-700">{scheme.tenure}</span> tempoh</span>
                  </div>
                  <ul className="mt-3 space-y-1">
                    {scheme.elig.map((e) => (
                      <li key={e} className="flex items-start gap-2 text-xs text-slate-500">
                        <ChevronRight size={12} className="text-slate-400 mt-0.5 shrink-0" />
                        {e}
                      </li>
                    ))}
                  </ul>
                </label>
              );
            })}
          </div>
        </div>

        {/* ── Section E: CTA ── */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{t.ctaTitle}</h2>
          <p className="text-slate-500 mb-8">{t.ctaSub}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {/* Primary: Register */}
            <button
              onClick={() => navigate('/daftar')}
              className="inline-flex justify-center items-center gap-2 rounded-full bg-slate-900 px-8 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-[#1B2B5E] active:scale-95 transition-all"
            >
              {t.ctaDaftar} <ArrowRight size={17} />
            </button>
            {/* Secondary: Login */}
            <button
              onClick={() => navigate('/login')}
              className="inline-flex justify-center items-center rounded-full bg-white px-8 py-3.5 text-base font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 active:scale-95 transition-all"
            >
              {t.ctaLogin}
            </button>
          </div>
        </div>

      </div>

      {/* ── Footer strip ── */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400">© 2026 TEKUN Nasional · KUSKOP · Hak Cipta Terpelihara</p>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Status Sistem: Aktif
          </div>
        </div>
      </footer>
    </div>
  );
}
