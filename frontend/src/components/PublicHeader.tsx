/**
 * PublicHeader — Shared navigation header for all public-facing pages.
 * Matches the LandingPage header exactly: white/translucent, TEKUN logo,
 * nav links, font-size controls, BM/EN toggle, and Log Masuk button.
 *
 * Usage:
 *   <PublicHeader lang={lang} setLang={setLang} />
 */
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const NAV_COPY = {
  bm: {
    schemes: 'Skim Pembiayaan',
    how: 'Cara Mohon',
    contact: 'Hubungi Kami',
    login: 'Log Masuk',
    apply: 'Mula Mohon',
  },
  en: {
    schemes: 'Financing Schemes',
    how: 'How to Apply',
    contact: 'Contact Us',
    login: 'Login',
    apply: 'Apply Now',
  },
};

interface PublicHeaderProps {
  lang: 'bm' | 'en';
  setLang: (l: 'bm' | 'en') => void;
  /** Optional: override font scale state from parent */
  fontScale?: number;
  setFontScale?: (s: number) => void;
}

export default function PublicHeader({
  lang,
  setLang,
  fontScale = 1,
  setFontScale,
}: PublicHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = NAV_COPY[lang];
  const isLanding = location.pathname === '/';

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center shrink-0">
          <img
            src="/images/tekun-icon.png"
            alt="TEKUN Nasional"
            className="h-20 w-auto object-contain transition-transform duration-300 hover:scale-105 md:h-24"
          />
        </a>

        {/* Desktop nav links */}
        <nav className="hidden lg:flex items-center gap-8">
          {isLanding ? (
            <>
              <a href="#skim" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                {t.schemes}
              </a>
              <a href="#cara" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                {t.how}
              </a>
              <a href="#hubungi" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                {t.contact}
              </a>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/#skim')}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                {t.schemes}
              </button>
              <button
                onClick={() => navigate('/cara-mohon')}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === '/cara-mohon'
                    ? 'text-[#1B2B5E] font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.how}
              </button>
              <button
                onClick={() => navigate('/#hubungi')}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                {t.contact}
              </button>
            </>
          )}
        </nav>

        {/* Desktop right controls */}
        <div className="hidden lg:flex items-center gap-5">
          {/* Font size controls */}
          {setFontScale && (
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-400">
              <button
                onClick={() => setFontScale(0.925)}
                className={`px-1.5 py-1 rounded hover:text-slate-700 transition-colors ${fontScale < 1 ? 'text-[#1B2B5E]' : ''}`}
              >
                A-
              </button>
              <button
                onClick={() => setFontScale(1)}
                className={`px-1.5 py-1 rounded hover:text-slate-700 transition-colors ${fontScale === 1 ? 'text-[#1B2B5E]' : ''}`}
              >
                A
              </button>
              <button
                onClick={() => setFontScale(1.075)}
                className={`px-1.5 py-1 rounded hover:text-slate-700 transition-colors ${fontScale > 1 ? 'text-[#1B2B5E]' : ''}`}
              >
                A+
              </button>
            </div>
          )}

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === 'bm' ? 'en' : 'bm')}
            className="text-xs font-semibold text-slate-500 border border-slate-200 rounded-full px-3 py-1.5 hover:bg-slate-50 transition-colors"
          >
            {lang === 'bm' ? 'EN' : 'BM'}
          </button>

          {/* Mula Mohon button */}
          <button
            onClick={() => navigate('/mula-mohon')}
            className="border border-[#1B2B5E] text-[#1B2B5E] px-4 py-2 rounded-full text-sm font-medium hover:bg-[#1B2B5E]/5 active:scale-95 transition-all"
          >
            {t.apply}
          </button>

          {/* Log Masuk button */}
          <button
            onClick={() => navigate('/login')}
            className="bg-[#1B2B5E] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#111c3d] active:scale-95 transition-all"
          >
            {t.login}
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 text-slate-600"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-slate-100 px-6 py-4 space-y-3">
          <button
            onClick={() => { navigate('/'); setMobileOpen(false); }}
            className="block w-full text-left text-sm font-medium text-slate-600 py-1"
          >
            {t.schemes}
          </button>
          <button
            onClick={() => { navigate('/cara-mohon'); setMobileOpen(false); }}
            className="block w-full text-left text-sm font-medium text-slate-600 py-1"
          >
            {t.how}
          </button>
          <button
            onClick={() => { navigate('/'); setMobileOpen(false); }}
            className="block w-full text-left text-sm font-medium text-slate-600 py-1"
          >
            {t.contact}
          </button>
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => { setLang(lang === 'bm' ? 'en' : 'bm'); setMobileOpen(false); }}
              className="text-xs font-semibold text-slate-500 border border-slate-200 rounded-full px-3 py-1.5"
            >
              {lang === 'bm' ? 'EN' : 'BM'}
            </button>
            <button
              onClick={() => { navigate('/mula-mohon'); setMobileOpen(false); }}
              className="flex-1 border border-[#1B2B5E] text-[#1B2B5E] py-2.5 rounded-full text-sm font-medium"
            >
              {t.apply}
            </button>
            <button
              onClick={() => { navigate('/login'); setMobileOpen(false); }}
              className="flex-1 bg-[#1B2B5E] text-white py-2.5 rounded-full text-sm font-medium"
            >
              {t.login}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
