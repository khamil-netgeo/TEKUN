import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, CheckCircle2, FileText, CreditCard,
  Building2, Receipt, UserCheck, Upload, Brain, Banknote
} from 'lucide-react';

const COPY = {
  bm: {
    back: 'Kembali ke Laman Utama',
    eyebrow: 'PANDUAN PERMOHONAN',
    title: 'Cara Mohon Pembiayaan TEKUN',
    subtitle: 'Proses permohonan yang mudah, telus dan sepenuhnya dalam talian. Dari pendaftaran hingga dana diterima dalam masa 24 jam.',

    steps: [
      {
        num: '01',
        icon: 'user',
        title: 'Daftar & Mohon',
        desc: 'Daftar akaun baharu menggunakan nombor MyKad anda. Lengkapkan borang permohonan dalam talian dalam masa kurang 10 minit. Pilih skim pembiayaan yang sesuai dengan keperluan perniagaan anda.',
        img: '/images/cara_mohon_step1.png',
        points: ['Daftar dengan nombor MyKad', 'Pilih skim pembiayaan', 'Isi maklumat perniagaan'],
      },
      {
        num: '02',
        icon: 'upload',
        title: 'Muat Naik Dokumen',
        desc: 'Muat naik dokumen sokongan yang diperlukan dalam format PDF atau gambar yang jelas. Sistem kami akan mengesahkan dokumen anda secara automatik menggunakan teknologi AI.',
        img: '/images/cara_mohon_step2.png',
        points: ['Salinan MyKad', 'Sijil Pendaftaran SSM', 'Penyata Bank (3 bulan)', 'Penyata Kewangan Perniagaan'],
      },
      {
        num: '03',
        icon: 'brain',
        title: 'Penilaian AI',
        desc: 'Kelayakan kredit anda dinilai secara telus dan adil menggunakan teknologi AI terkini. Proses penilaian mengambil masa kurang dari 10 minit dan anda akan dimaklumkan melalui e-mel.',
        img: '/images/cara_mohon_step3.png',
        points: ['Penilaian kredit automatik', 'Semakan rekod CCRIS & CTOS', 'Keputusan dalam masa 10 minit'],
      },
      {
        num: '04',
        icon: 'banknote',
        title: 'Terima Dana',
        desc: 'Setelah diluluskan, dana pembiayaan akan dikreditkan terus ke akaun bank anda dalam tempoh 24 jam bekerja. Anda akan menerima notifikasi pengesahan melalui SMS dan e-mel.',
        img: '/images/cara_mohon_step4.png',
        points: ['Dana dikreditkan dalam 24 jam', 'Notifikasi SMS & e-mel', 'Jadual bayaran balik yang fleksibel'],
      },
    ],

    docs: {
      title: 'Dokumen Yang Diperlukan',
      sub: 'Sediakan dokumen-dokumen berikut sebelum memulakan permohonan.',
      items: [
        { icon: 'id', label: 'Salinan MyKad', desc: 'Depan dan belakang, jelas dan tidak kabur' },
        { icon: 'biz', label: 'Sijil Pendaftaran SSM', desc: 'Sijil terkini yang masih sah' },
        { icon: 'bank', label: 'Penyata Bank', desc: '3 bulan terkini atas nama pemohon' },
        { icon: 'receipt', label: 'Penyata Kewangan', desc: 'Penyata kewangan perniagaan terkini' },
      ],
    },

    cta: {
      title: 'Bersedia untuk memulakan?',
      sub: 'Daftar akaun baharu atau log masuk jika anda sudah mempunyai akaun.',
      daftar: 'Daftar Akaun Baharu',
      login: 'Sudah Ada Akaun? Log Masuk',
    },
  },
  en: {
    back: 'Back to Home',
    eyebrow: 'APPLICATION GUIDE',
    title: 'How to Apply for TEKUN Financing',
    subtitle: 'A simple, transparent and fully online application process. From registration to receiving funds within 24 hours.',

    steps: [
      {
        num: '01',
        icon: 'user',
        title: 'Register & Apply',
        desc: 'Register a new account using your MyKad number. Complete the online application form in under 10 minutes. Choose the financing scheme that suits your business needs.',
        img: '/images/cara_mohon_step1.png',
        points: ['Register with MyKad number', 'Choose financing scheme', 'Fill in business information'],
      },
      {
        num: '02',
        icon: 'upload',
        title: 'Upload Documents',
        desc: 'Upload the required supporting documents in PDF or clear image format. Our system will automatically verify your documents using AI technology.',
        img: '/images/cara_mohon_step2.png',
        points: ['MyKad copy', 'SSM Registration Certificate', 'Bank Statement (3 months)', 'Business Financial Statement'],
      },
      {
        num: '03',
        icon: 'brain',
        title: 'AI Assessment',
        desc: 'Your credit eligibility is assessed transparently and fairly using the latest AI technology. The assessment process takes less than 10 minutes and you will be notified by email.',
        img: '/images/cara_mohon_step3.png',
        points: ['Automated credit assessment', 'CCRIS & CTOS record check', 'Decision within 10 minutes'],
      },
      {
        num: '04',
        icon: 'banknote',
        title: 'Receive Funds',
        desc: 'Once approved, the financing funds will be credited directly to your bank account within 24 working hours. You will receive a confirmation notification via SMS and email.',
        img: '/images/cara_mohon_step4.png',
        points: ['Funds credited within 24 hours', 'SMS & email notification', 'Flexible repayment schedule'],
      },
    ],

    docs: {
      title: 'Required Documents',
      sub: 'Prepare the following documents before starting your application.',
      items: [
        { icon: 'id', label: 'MyKad Copy', desc: 'Front and back, clear and not blurry' },
        { icon: 'biz', label: 'SSM Registration Certificate', desc: 'Latest valid certificate' },
        { icon: 'bank', label: 'Bank Statement', desc: 'Latest 3 months in applicant\'s name' },
        { icon: 'receipt', label: 'Financial Statement', desc: 'Latest business financial statement' },
      ],
    },

    cta: {
      title: 'Ready to get started?',
      sub: 'Register a new account or log in if you already have one.',
      daftar: 'Register New Account',
      login: 'Already Have an Account? Log In',
    },
  },
};

const STEP_ICONS: Record<string, React.ReactNode> = {
  user: <UserCheck size={22} />,
  upload: <Upload size={22} />,
  brain: <Brain size={22} />,
  banknote: <Banknote size={22} />,
};

const DOC_ICONS: Record<string, React.ReactNode> = {
  id: <CreditCard size={26} className="text-[#1B2B5E]" />,
  biz: <Building2 size={26} className="text-[#1B2B5E]" />,
  bank: <FileText size={26} className="text-[#1B2B5E]" />,
  receipt: <Receipt size={26} className="text-[#1B2B5E]" />,
};

export default function CaraMohonPage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'bm' | 'en'>('bm');
  const [activeStep, setActiveStep] = useState(0);
  const t = COPY[lang];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">

      {/* ── Navbar ── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={16} />
            {t.back}
          </button>
          <img src="/images/tekun-icon.png" alt="TEKUN Nasional" className="h-10 w-auto object-contain" />
          <button
            onClick={() => setLang(lang === 'bm' ? 'en' : 'bm')}
            className="text-xs font-semibold text-slate-500 border border-slate-200 rounded-full px-3 py-1.5 hover:bg-slate-50 transition-colors"
          >
            {lang === 'bm' ? 'EN' : 'BM'}
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-[#1B2B5E] py-16 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs font-bold tracking-[0.2em] text-white/50 uppercase mb-4">{t.eyebrow}</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white">{t.title}</h1>
          <p className="mt-5 text-lg text-white/70 leading-relaxed">{t.subtitle}</p>
        </div>
      </section>

      {/* ── Step Progress Bar ── */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between">
            {t.steps.map((step, i) => (
              <button
                key={step.num}
                onClick={() => setActiveStep(i)}
                className="flex flex-col items-center gap-2 flex-1 group"
              >
                <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  i === activeStep
                    ? 'bg-[#1B2B5E] text-white shadow-lg shadow-[#1B2B5E]/30 scale-110'
                    : i < activeStep
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                }`}>
                  {i < activeStep ? <CheckCircle2 size={20} /> : step.num}
                </div>
                <p className={`text-xs font-semibold hidden md:block transition-colors ${i === activeStep ? 'text-[#1B2B5E]' : 'text-slate-400'}`}>
                  {step.title}
                </p>
                {/* Connector line */}
                {i < t.steps.length - 1 && (
                  <div className="absolute" />
                )}
              </button>
            ))}
          </div>
          {/* Progress line */}
          <div className="relative mt-2 h-1 bg-slate-100 rounded-full mx-6 hidden md:block">
            <div
              className="absolute inset-y-0 left-0 bg-[#1B2B5E] rounded-full transition-all duration-500"
              style={{ width: `${(activeStep / (t.steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      </section>

      {/* ── Active Step Detail ── */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-6">
          {t.steps.map((step, i) => (
            <div
              key={step.num}
              className={`transition-all duration-500 ${i === activeStep ? 'block' : 'hidden'}`}
            >
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Step image */}
                <div className="relative h-64 md:h-80 overflow-hidden">
                  <img
                    src={step.img}
                    alt={step.title}
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-6 left-6 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-[#1B2B5E] flex items-center justify-center text-white">
                      {STEP_ICONS[step.icon]}
                    </div>
                    <div>
                      <p className="text-white/70 text-xs font-bold uppercase tracking-widest">
                        {lang === 'bm' ? `LANGKAH ${step.num}` : `STEP ${step.num}`}
                      </p>
                      <h2 className="text-white text-xl font-bold">{step.title}</h2>
                    </div>
                  </div>
                </div>

                {/* Step content */}
                <div className="p-8 md:p-10">
                  <p className="text-base text-slate-600 leading-relaxed">{step.desc}</p>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                    {step.points.map((point) => (
                      <div key={point} className="flex items-start gap-2.5 bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-sm font-medium text-slate-700">{point}</span>
                      </div>
                    ))}
                  </div>

                  {/* Navigation */}
                  <div className="mt-8 flex items-center justify-between">
                    <button
                      onClick={() => setActiveStep(Math.max(0, i - 1))}
                      disabled={i === 0}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowLeft size={16} />
                      {lang === 'bm' ? 'Langkah Sebelum' : 'Previous Step'}
                    </button>

                    {i < t.steps.length - 1 ? (
                      <button
                        onClick={() => setActiveStep(i + 1)}
                        className="inline-flex items-center gap-2 bg-[#1B2B5E] text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-[#111c3d] active:scale-95 transition-all"
                      >
                        {lang === 'bm' ? 'Langkah Seterusnya' : 'Next Step'}
                        <ArrowRight size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate('/mula-mohon')}
                        className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-emerald-700 active:scale-95 transition-all"
                      >
                        {lang === 'bm' ? 'Mula Mohon Sekarang' : 'Start Applying Now'}
                        <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Documents Required ── */}
      <section className="py-12 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{t.docs.title}</h2>
          <p className="text-slate-500 mb-8">{t.docs.sub}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {t.docs.items.map((doc) => (
              <div key={doc.label} className="flex items-start gap-4 p-5 rounded-xl border border-slate-200 bg-slate-50 hover:border-slate-300 transition-colors">
                <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                  {DOC_ICONS[doc.icon]}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{doc.label}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{doc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 bg-[#1B2B5E]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white">{t.cta.title}</h2>
          <p className="text-white/70 mt-3 mb-8">{t.cta.sub}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate('/daftar')}
              className="inline-flex justify-center items-center gap-2 rounded-full bg-white px-8 py-3.5 text-base font-bold text-[#1B2B5E] shadow-sm hover:bg-slate-100 active:scale-95 transition-all"
            >
              {t.cta.daftar} <ArrowRight size={17} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex justify-center items-center rounded-full bg-white/15 backdrop-blur-sm px-8 py-3.5 text-base font-semibold text-white border border-white/30 hover:bg-white/25 active:scale-95 transition-all"
            >
              {t.cta.login}
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer strip ── */}
      <footer className="border-t border-slate-800 bg-slate-900 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">© 2026 TEKUN Nasional · KUSKOP · Hak Cipta Terpelihara</p>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
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
