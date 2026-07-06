import { useState, useEffect, useRef } from 'react';
import ChatbotWidget from '@/components/ChatbotWidget';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, CheckCircle2,
  Menu, X, Phone, Mail, MapPin, ChevronLeft, ChevronRight
} from 'lucide-react';

/* ============ i18n copy ============ */
const COPY = {
  bm: {
    nav: { schemes: 'Skim Pembiayaan', how: 'Cara Mohon', contact: 'Hubungi Kami', login: 'Log Masuk' },
    hero: {
      slides: [
        {
          img: '/images/hero_slide1.jpg',
          h1: 'Pembiayaan mikro untuk usahawan Malaysia.',
          sub: 'Mohon pembiayaan perniagaan anda secara dalam talian. Keputusan lebih pantas, proses lebih mudah.',
        },
        {
          img: '/images/hero_slide2.jpg',
          h1: 'Sokong perniagaan makanan & minuman anda.',
          sub: 'Dapatkan modal permulaan atau pengembangan untuk perniagaan F&B anda dengan mudah dan pantas.',
        },
        {
          img: '/images/hero_slide3.jpg',
          h1: 'Bina perniagaan keluarga yang berkekalan.',
          sub: 'TEKUN Nasional membantu usahawan Malaysia membina perniagaan yang kukuh bersama keluarga.',
        },
      ],
      cta1: 'Mohon Sekarang',
      cta2: 'Ketahui Lebih Lanjut',
    },
    schemes: {
      title: 'Skim Pembiayaan TEKUN',
      sub: 'Pilih skim yang paling sesuai dengan keperluan perniagaan anda.',
      upTo: 'Sehingga',
      rate: 'Kadar', tenure: 'Tempoh',
      apply: 'Mohon Sekarang',
      items: [
        {
          name: 'TEKUN MICRO',
          img: '/images/scheme_micro.jpg',
          amount: 'RM10,000',
          desc: 'Permulaan perniagaan anda',
          elig: ['Warganegara Malaysia, 18–60 tahun', 'Perniagaan baharu atau kurang 2 tahun'],
        },
        {
          name: 'TEKUN USAHAWAN',
          img: '/images/scheme_usahawan.jpg',
          amount: 'RM50,000',
          desc: 'Kembangkan perniagaan anda',
          elig: ['Perniagaan aktif melebihi 2 tahun', 'Rekod pembayaran yang baik'],
        },
        {
          name: 'TEKUN WANITA',
          img: '/images/scheme_wanita.jpg',
          amount: 'RM50,000',
          desc: 'Memperkasa usahawan wanita',
          elig: ['Usahawan wanita warganegara Malaysia', 'Berumur 18–60 tahun'],
        },
        {
          name: 'TEKUN BELIA',
          img: '/images/scheme_belia.jpg',
          amount: 'RM20,000',
          desc: 'Menyokong usahawan belia',
          elig: ['Belia berumur 18–40 tahun', 'Warganegara Malaysia'],
        },
      ],
    },
    stats: {
      items: [
        { value: '400,000+', label: 'Usahawan Dibantu' },
        { value: 'RM3.5B', label: 'Pembiayaan Diagihkan' },
        { value: '4%', label: 'Kadar Keuntungan Tetap' },
        { value: '198', label: 'Cawangan Seluruh Malaysia' },
      ],
    },
    how: {
      title: 'Cara Mohon',
      sub: 'Proses permohonan yang mudah dan telus sepenuhnya dalam talian.',
      cta: 'Lihat Panduan Lengkap',
    },
    cta: {
      title: 'Mulakan perjalanan perniagaan anda hari ini',
      sub: 'Sertai lebih 400,000 usahawan yang telah dibantu oleh TEKUN Nasional sejak 1998.',
      btn: 'Mohon Sekarang',
      btn2: 'Semak Kelayakan Anda',
    },
    footer: {
      about: 'TEKUN Nasional — agensi di bawah Kementerian Pembangunan Usahawan dan Koperasi (KUSKOP) yang menyediakan pembiayaan mikro kepada usahawan Malaysia.',
      quick: 'PAUTAN PANTAS', info: 'MAKLUMAT', contact: 'HUBUNGI KAMI',
      links1: ['Laman Utama', 'Skim Pembiayaan', 'Cara Mohon', 'Semak Kelayakan'],
      links2: ['Mengenai TEKUN', 'Soalan Lazim', 'Terma & Syarat', 'Dasar Privasi'],
      status: 'Status Sistem: Aktif',
      rights: 'Hak Cipta Terpelihara',
    },
  },
  en: {
    nav: { schemes: 'Financing Schemes', how: 'How to Apply', contact: 'Contact Us', login: 'Login' },
    hero: {
      slides: [
        {
          img: '/images/hero_slide1.jpg',
          h1: 'Micro-financing for Malaysian entrepreneurs.',
          sub: 'Apply for business financing online. Faster decisions, simpler process.',
        },
        {
          img: '/images/hero_slide2.jpg',
          h1: 'Support your food & beverage business.',
          sub: 'Get startup or expansion capital for your F&B business easily and quickly.',
        },
        {
          img: '/images/hero_slide3.jpg',
          h1: 'Build a lasting family business.',
          sub: 'TEKUN Nasional helps Malaysian entrepreneurs build strong businesses together.',
        },
      ],
      cta1: 'Apply Now',
      cta2: 'Learn More',
    },
    schemes: {
      title: 'TEKUN Financing Schemes',
      sub: 'Choose the scheme that best suits your business needs.',
      upTo: 'Up to',
      rate: 'Rate', tenure: 'Tenure',
      apply: 'Apply Now',
      items: [
        {
          name: 'TEKUN MICRO',
          img: '/images/scheme_micro.jpg',
          amount: 'RM10,000',
          desc: 'Start your business',
          elig: ['Malaysian citizen, aged 18–60', 'New business or under 2 years'],
        },
        {
          name: 'TEKUN USAHAWAN',
          img: '/images/scheme_usahawan.jpg',
          amount: 'RM50,000',
          desc: 'Grow your business',
          elig: ['Active business over 2 years', 'Good repayment record'],
        },
        {
          name: 'TEKUN WANITA',
          img: '/images/scheme_wanita.jpg',
          amount: 'RM50,000',
          desc: 'Empowering women entrepreneurs',
          elig: ['Malaysian women entrepreneurs', 'Aged 18–60'],
        },
        {
          name: 'TEKUN BELIA',
          img: '/images/scheme_belia.jpg',
          amount: 'RM20,000',
          desc: 'Supporting youth entrepreneurs',
          elig: ['Youth aged 18–40', 'Malaysian citizen'],
        },
      ],
    },
    stats: {
      items: [
        { value: '400,000+', label: 'Entrepreneurs Assisted' },
        { value: 'RM3.5B', label: 'Financing Disbursed' },
        { value: '4%', label: 'Fixed Profit Rate' },
        { value: '198', label: 'Branches Nationwide' },
      ],
    },
    how: {
      title: 'How to Apply',
      sub: 'A simple and transparent application process, fully online.',
      cta: 'View Full Guide',
    },
    cta: {
      title: 'Start your business journey today',
      sub: 'Join over 400,000 entrepreneurs assisted by TEKUN Nasional since 1998.',
      btn: 'Apply Now',
      btn2: 'Check Your Eligibility',
    },
    footer: {
      about: 'TEKUN Nasional — an agency under the Ministry of Entrepreneur Development and Cooperatives (KUSKOP) providing micro-financing to Malaysian entrepreneurs.',
      quick: 'QUICK LINKS', info: 'INFORMATION', contact: 'CONTACT US',
      links1: ['Home', 'Financing Schemes', 'How to Apply', 'Check Eligibility'],
      links2: ['About TEKUN', 'FAQ', 'Terms & Conditions', 'Privacy Policy'],
      status: 'System Status: Active',
      rights: 'All Rights Reserved',
    },
  },
};

/* ============ Scroll reveal hook ============ */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, cls: visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6' };
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, cls } = useReveal();
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${cls}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ============ Hero Slider ============ */
function HeroSlider({ slides, cta1, cta2, onApply, onLearn }: {
  slides: { img: string; h1: string; sub: string }[];
  cta1: string; cta2: string;
  onApply: () => void; onLearn: () => void;
}) {
  const [current, setCurrent] = useState(0);
  const total = slides.length;

  // Auto-advance every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => setCurrent((c) => (c + 1) % total), 6000);
    return () => clearInterval(timer);
  }, [total]);

  const prev = () => setCurrent((c) => (c - 1 + total) % total);
  const next = () => setCurrent((c) => (c + 1) % total);

  return (
    <div className="relative w-full h-screen min-h-[600px] max-h-[900px] overflow-hidden">
      {/* Slides */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* Background image */}
          <img
            src={slide.img}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          {/* Dark gradient overlay — left side for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      ))}

      {/* Text content — always on top */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-2xl">
            {slides.map((slide, i) => (
              <div
                key={i}
                className={`transition-all duration-700 ${i === current ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute pointer-events-none'}`}
              >
                {i === current && (
                  <>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
                      {slide.h1}
                    </h1>
                    <p className="mt-6 text-lg md:text-xl text-white/80 leading-relaxed max-w-xl">
                      {slide.sub}
                    </p>
                  </>
                )}
              </div>
            ))}

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap gap-4">
              <button
                onClick={onApply}
                className="inline-flex items-center gap-2 bg-white text-slate-900 px-7 py-3.5 rounded-full font-semibold hover:bg-slate-100 active:scale-95 transition-all shadow-lg"
              >
                {cta1} <ArrowRight size={17} />
              </button>
              <button
                onClick={onLearn}
                className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white border border-white/30 px-7 py-3.5 rounded-full font-semibold hover:bg-white/25 active:scale-95 transition-all"
              >
                {cta2}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Prev / Next arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/35 transition-colors"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/35 transition-colors"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-300 ${i === current ? 'bg-white w-8 h-2.5' : 'bg-white/50 w-2.5 h-2.5 hover:bg-white/75'}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ============ Component ============ */
export default function LandingPage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'bm' | 'en'>('bm');
  const [fontScale, setFontScale] = useState(1);
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = COPY[lang];

  const goMulaMohon = () => navigate('/mula-mohon');
  const goCaraMohon = () => navigate('/cara-mohon');
  const goLogin = () => navigate('/login');
  const goSemakKelayakan = () => navigate('/semak-kelayakan');

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased" style={{ fontSize: `${fontScale}rem` }}>

      {/* ===== Navbar ===== */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <a href="/" className="flex items-center shrink-0">
            <img
              src="/images/tekun-icon.png"
              alt="TEKUN Nasional"
              className="h-20 w-auto object-contain transition-transform duration-300 hover:scale-105 md:h-24"
            />
          </a>

          <nav className="hidden lg:flex items-center gap-8">
            <a href="#skim" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">{t.nav.schemes}</a>
            <a href="#cara" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">{t.nav.how}</a>
            <a href="#hubungi" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">{t.nav.contact}</a>
          </nav>

          <div className="hidden lg:flex items-center gap-5">
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-400">
              <button onClick={() => setFontScale(0.925)} className={`px-1.5 py-1 rounded hover:text-slate-700 transition-colors ${fontScale < 1 ? 'text-[#1B2B5E]' : ''}`}>A-</button>
              <button onClick={() => setFontScale(1)} className={`px-1.5 py-1 rounded hover:text-slate-700 transition-colors ${fontScale === 1 ? 'text-[#1B2B5E]' : ''}`}>A</button>
              <button onClick={() => setFontScale(1.075)} className={`px-1.5 py-1 rounded hover:text-slate-700 transition-colors ${fontScale > 1 ? 'text-[#1B2B5E]' : ''}`}>A+</button>
            </div>
            <button
              onClick={() => setLang(lang === 'bm' ? 'en' : 'bm')}
              className="text-xs font-semibold text-slate-500 border border-slate-200 rounded-full px-3 py-1.5 hover:bg-slate-50 transition-colors"
            >
              {lang === 'bm' ? 'EN' : 'BM'}
            </button>
            <button
              onClick={goLogin}
              className="bg-[#1B2B5E] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#111c3d] active:scale-95 transition-all"
            >
              {t.nav.login}
            </button>
          </div>

          <button className="lg:hidden p-2 text-slate-600" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 px-6 py-4 space-y-3">
            <a href="#skim" className="block text-sm font-medium text-slate-600 py-1" onClick={() => setMobileOpen(false)}>{t.nav.schemes}</a>
            <a href="#cara" className="block text-sm font-medium text-slate-600 py-1" onClick={() => setMobileOpen(false)}>{t.nav.how}</a>
            <a href="#hubungi" className="block text-sm font-medium text-slate-600 py-1" onClick={() => setMobileOpen(false)}>{t.nav.contact}</a>
            <button onClick={goLogin} className="w-full bg-[#1B2B5E] text-white py-2.5 rounded-full text-sm font-medium mt-2">{t.nav.login}</button>
          </div>
        )}
      </header>

      {/* ===== Hero Fullscreen Slider ===== */}
      {/* Offset for fixed navbar (h-24 = 96px) */}
      <div className="pt-24">
        <HeroSlider
          slides={t.hero.slides}
          cta1={t.hero.cta1}
          cta2={t.hero.cta2}
          onApply={goMulaMohon}
          onLearn={() => document.getElementById('skim')?.scrollIntoView({ behavior: 'smooth' })}
        />
      </div>

      {/* ===== Stats Bar ===== */}
      <section className="bg-[#1B2B5E] py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {t.stats.items.map((s, i) => (
            <Reveal key={s.label} delay={i * 80}>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-white tracking-tight">{s.value}</p>
                <p className="text-xs font-medium text-white/60 uppercase tracking-widest mt-2">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== Schemes with Images ===== */}
      <section id="skim" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 text-center">{t.schemes.title}</h2>
            <p className="text-lg text-slate-500 text-center mt-4 max-w-2xl mx-auto">{t.schemes.sub}</p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
            {t.schemes.items.map((s, i) => (
              <Reveal key={s.name} delay={i * 90}>
                <div className="group bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70 hover:border-slate-300">
                  {/* Concept image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={s.img}
                      alt={s.name}
                      className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Scheme name badge on image */}
                    <div className="absolute top-3 left-3 bg-[#1B2B5E]/90 backdrop-blur-sm text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full">
                      {s.name}
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-6 flex flex-col flex-1">
                    <p className="text-sm text-slate-500">{s.desc}</p>
                    <p className="text-[11px] font-medium text-slate-400 mt-4 uppercase tracking-wide">{t.schemes.upTo}</p>
                    <p className="text-4xl font-bold tracking-tight text-slate-900 mt-1">{s.amount}</p>

                    <div className="flex gap-8 border-b border-slate-100 pb-5 mb-5 mt-5">
                      <div>
                        <p className="text-xs text-slate-400">{t.schemes.rate}</p>
                        <p className="text-sm font-semibold text-slate-900 mt-0.5">4% p.a.</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">{t.schemes.tenure}</p>
                        <p className="text-sm font-semibold text-slate-900 mt-0.5">5 {lang === 'bm' ? 'tahun' : 'years'}</p>
                      </div>
                    </div>

                    <ul className="space-y-2 flex-1">
                      {s.elig.map((e) => (
                        <li key={e} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                          {e}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={goMulaMohon}
                      className="mt-6 w-full py-3 rounded-xl bg-[#1B2B5E] text-white text-sm font-semibold hover:bg-[#111c3d] active:scale-95 transition-all"
                    >
                      {t.schemes.apply}
                    </button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Cara Mohon Preview ===== */}
      <section id="cara" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="flex flex-col lg:flex-row items-center gap-16">
              {/* Left: image */}
              <div className="w-full lg:w-1/2 relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-300/40">
                <img
                  src="/images/cara_mohon_hero.jpg"
                  alt="Cara Mohon TEKUN"
                  className="w-full h-[420px] object-cover object-center"
                />
                {/* Step count overlay */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-8">
                  <div className="flex items-center gap-6">
                    {['01', '02', '03', '04'].map((n) => (
                      <div key={n} className="flex flex-col items-center gap-1">
                        <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white font-bold text-sm">
                          {n}
                        </div>
                      </div>
                    ))}
                    <div className="h-px flex-1 bg-white/30" />
                    <ArrowRight size={20} className="text-white/70" />
                  </div>
                </div>
              </div>

              {/* Right: text */}
              <div className="w-full lg:w-1/2">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">{t.how.title}</h2>
                <p className="text-lg text-slate-500 mt-5 leading-relaxed">{t.how.sub}</p>

                {/* 4 steps summary */}
                <div className="mt-8 space-y-4">
                  {[
                    { n: '01', bm: 'Daftar & Mohon', en: 'Register & Apply' },
                    { n: '02', bm: 'Muat Naik Dokumen', en: 'Upload Documents' },
                    { n: '03', bm: 'Penilaian & Kelulusan', en: 'Assessment & Approval' },
                    { n: '04', bm: 'Terima Dana', en: 'Receive Funds' },
                  ].map((step) => (
                    <div key={step.n} className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-[#1B2B5E] text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {step.n}
                      </div>
                      <p className="text-base font-semibold text-slate-800">{lang === 'bm' ? step.bm : step.en}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={goCaraMohon}
                  className="mt-10 inline-flex items-center gap-2 bg-[#1B2B5E] text-white px-7 py-3.5 rounded-full font-semibold hover:bg-[#111c3d] active:scale-95 transition-all shadow-md shadow-slate-900/10"
                >
                  {t.how.cta} <ArrowRight size={17} />
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-24 bg-[#1B2B5E]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">{t.cta.title}</h2>
            <p className="text-lg text-white/70 mt-5">{t.cta.sub}</p>
            <button
              onClick={goSemakKelayakan}
              className="mt-10 inline-flex items-center gap-2 bg-white text-[#1B2B5E] px-8 py-4 rounded-full font-bold hover:bg-slate-100 active:scale-95 transition-all shadow-lg"
            >
              {t.cta.btn2} <ArrowRight size={17} />
            </button>
          </Reveal>
        </div>
      </section>

      {/* ===== Floating Chatbot ===== */}
      <ChatbotWidget lang={lang} />

      {/* ===== Footer ===== */}
      <footer id="hubungi" className="bg-slate-900 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-1">
              <img src="/images/tekun-icon.png" alt="TEKUN Nasional" className="h-12 w-auto object-contain" />
              <p className="text-sm text-slate-400 leading-relaxed mt-5">{t.footer.about}</p>
            </div>
            <div>
              <p className="text-xs font-bold tracking-[0.15em] text-slate-500 mb-5">{t.footer.quick}</p>
              <ul className="space-y-3">
                {t.footer.links1.map((l, i) => {
                  const hrefs1 = ['/', '#skim', '/cara-mohon', '/semak-kelayakan'];
                  return <li key={l}><a href={hrefs1[i]} className="text-sm text-slate-400 hover:text-white transition-colors">{l}</a></li>;
                })}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold tracking-[0.15em] text-slate-500 mb-5">{t.footer.info}</p>
              <ul className="space-y-3">
                {t.footer.links2.map((l, i) => {
                  const hrefs2 = ['/mengenai', '/faq', '/terma-syarat', '/dasar-privasi'];
                  return <li key={l}><a href={hrefs2[i]} className="text-sm text-slate-400 hover:text-white transition-colors">{l}</a></li>;
                })}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold tracking-[0.15em] text-slate-500 mb-5">{t.footer.contact}</p>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-center gap-2.5"><Phone size={15} className="text-slate-500" /> 03-9059 8888</li>
                <li className="flex items-center gap-2.5"><Mail size={15} className="text-slate-500" /> mailbox@tekun.gov.my</li>
                <li className="flex items-start gap-2.5"><MapPin size={15} className="text-slate-500 mt-0.5 shrink-0" /> Menara TEKUN, T5-01-01, Maju Link, Jalan Lingkaran Tengah 2, 57000 Bandar Tasik Selatan, Kuala Lumpur</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              © 2026 TEKUN Nasional · KUSKOP · {t.footer.rights}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              {t.footer.status}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}