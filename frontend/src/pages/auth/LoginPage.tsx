import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Globe, Loader2, ShieldCheck, Lock } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';

/**
 * TEKUN SPPT — Login Page (Professional Redesign)
 *
 * Demo accounts are documented externally in AGENTS.md and project docs.
 * This page does NOT display demo credentials — enter them directly.
 *
 * Approval Authority Matrix:
 * - Below RM 10,000 : Pengurus Cawangan (branch_manager)
 * - RM 10,001–50,000: Penganalisis Kredit (credit_officer)
 * - Above RM 50,000 : Pengurusan Atasan (executive)
 */

const DEMO_ACCOUNTS = [
  { email: 'usahawan@tekun.gov.my',  password: 'demo1234', role: 'usahawan',      role_label: 'Usahawan',                  name: 'Ahmad Bin Mohd Noor',          branch: null,                  branch_code: null, state: 'Selangor',         permissions: { modules: ['module1','module4','module5'], actions: ['application.create','application.view_own','account.view_own','payment.make'], data_scope: 'own' as const, approval_limit: 0 }, description: 'Portal permohonan & bayaran balik sendiri', color: '#7B1FA2' },
  { email: 'pegawai@tekun.gov.my',   password: 'demo1234', role: 'branch_officer', role_label: 'Pegawai Pembiayaan Cawangan', name: 'Ahmad Fadzillah Bin Razak',    branch: 'Cawangan Kuala Lumpur', branch_code: 'KL01', state: 'WP Kuala Lumpur', permissions: { modules: ['module1','module2','module7'], actions: ['application.view','application.process','application.pre_assess','document.verify','entrepreneur.view','field_visit.create'], data_scope: 'branch' as const, approval_limit: 0 }, description: 'Proses permohonan & lawatan lapangan', color: '#1565C0' },
  { email: 'pengurus@tekun.gov.my',  password: 'demo1234', role: 'branch_manager', role_label: 'Pengurus Cawangan',          name: 'Noraini Binti Hassan',         branch: 'Cawangan Kuala Lumpur', branch_code: 'KL01', state: 'WP Kuala Lumpur', permissions: { modules: ['module1','module2','module3','module7','module8'], actions: ['application.approve','application.reject','credit.view_score','disbursement.view','branch.view_own'], data_scope: 'branch' as const, approval_limit: 10000 }, description: 'Lulus permohonan ≤ RM 10,000', color: '#0277BD' },
  { email: 'kredit@tekun.gov.my',    password: 'demo1234', role: 'credit_officer', role_label: 'Penganalisis Kredit',        name: 'Mohd Hafizi Bin Ismail',       branch: 'Ibu Pejabat TEKUN',     branch_code: 'HQ',   state: 'WP Kuala Lumpur', permissions: { modules: ['module2','module3','module5','module6','module7'], actions: ['credit.score','credit.view_ccris','credit.view_ctos','credit.approve_recommendation','npl.view','dunning.generate','report.view','entrepreneur.view','field_visit.view'], data_scope: 'national' as const, approval_limit: 50000 }, description: 'Skor kredit AI | Lulus ≤ RM 50,000', color: '#00695C' },
  { email: 'kewangan@tekun.gov.my',  password: 'demo1234', role: 'finance_officer', role_label: 'Pegawai Kewangan',         name: 'Siti Hajar Binti Yusof',       branch: 'Ibu Pejabat TEKUN',     branch_code: 'HQ',   state: 'WP Kuala Lumpur', permissions: { modules: ['module3','module4','module5'], actions: ['disbursement.process_batch','disbursement.generate_payment_file','tawidh.calculate','moratorium.process','statement.generate'], data_scope: 'national' as const, approval_limit: 0 }, description: "Pengeluaran dana berkelompok | Ta'widh | Moratorium", color: '#E65100' },
  { email: 'eksekutif@tekun.gov.my', password: 'demo1234', role: 'executive',      role_label: 'Pengurusan Atasan',         name: 'Dato Sri Razali Bin Ahmad',    branch: 'Ibu Pejabat TEKUN',     branch_code: 'HQ',   state: 'WP Kuala Lumpur', permissions: { modules: ['module6','module8','module11'], actions: ['dashboard.view','report.view','report.export','analytics.view','analytics.drill_down','branch.view','audit.view'], data_scope: 'national' as const, approval_limit: 999999 }, description: 'Dashboard analitik nasional | Laporan eksekutif', color: '#4A148C' },
  { email: 'admin@tekun.gov.my',     password: 'demo1234', role: 'system_admin',   role_label: 'Pentadbir Sistem',          name: 'Siti Aminah Binti Kamarudin', branch: 'Ibu Pejabat TEKUN',     branch_code: 'HQ',   state: 'WP Kuala Lumpur', permissions: { modules: ['*'], actions: ['*'], data_scope: 'national' as const, approval_limit: 999999 }, description: 'Akses penuh semua modul | Pentadbiran sistem', color: '#B71C1C' },
];

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Demo login — match against DEMO_ACCOUNTS first
    const demo = DEMO_ACCOUNTS.find(a => a.email === email && a.password === password);
    if (demo) {
      const { password: _, ...user } = demo;
      login(
        { ...user, id: Math.floor(Math.random() * 1000), token: 'demo-token-' + Date.now() },
        'demo-token'
      );
      toast.success(`Selamat datang, ${user.name}! (${user.role_label})`);
      navigate('/dashboard');
      setLoading(false);
      return;
    }

    // Real API login
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      toast.success(`Selamat datang, ${res.data.user.name}!`);
      navigate('/dashboard');
    } catch {
      toast.error('E-mel atau kata laluan tidak sah.');
    } finally {
      setLoading(false);
    }
  };

  const isMs = i18n.language === 'ms';

  return (
    <div className="min-h-screen flex" style={{ background: '#F0F2F5' }}>
      <Toaster position="top-right" />

      {/* ── Left panel — full-height branding ── */}
      <div
        className="hidden lg:flex flex-col w-[52%] relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0D1E4A 0%, #1B2B5E 45%, #1A3A6B 100%)' }}
      >
        {/* Decorative geometric shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
            style={{ background: '#C62828' }}
          />
          <div
            className="absolute top-1/3 -left-24 w-72 h-72 rounded-full opacity-8"
            style={{ background: '#2E7D32' }}
          />
          <div
            className="absolute -bottom-20 right-20 w-80 h-80 rounded-full opacity-10"
            style={{ background: '#1565C0' }}
          />
          {/* Grid pattern overlay */}
          <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-14">
          {/* Logo block */}
          <div className="mb-auto">
            <div className="flex items-center gap-4 mb-14">
              <img
                src="/images/tekun-icon.png"
                alt="TEKUN Nasional"
                className="h-16 w-16 object-contain drop-shadow-lg"
              />
              <div>
                <div className="text-white font-extrabold text-2xl tracking-wide leading-tight">
                  TEKUN NASIONAL
                </div>
                <div className="text-white/50 text-xs tracking-widest uppercase mt-0.5">
                  Tabung Ekonomi Kumpulan Usaha Niaga
                </div>
              </div>
            </div>

            <div className="mb-10">
              <div
                className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-6"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
              >
                {isMs ? 'Portal Dalaman' : 'Internal Portal'}
              </div>
              <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
                {isMs ? (
                  <>Sistem Pengurusan<br />Pembiayaan TEKUN</>
                ) : (
                  <>TEKUN Financing<br />Management System</>
                )}
              </h1>
              <p className="text-white/55 text-sm leading-relaxed max-w-sm">
                {isMs
                  ? 'Platform digital bersepadu untuk pengurusan pembiayaan usahawan Malaysia — dari permohonan hingga penyelesaian, dikuasakan oleh kecerdasan buatan.'
                  : 'An integrated digital platform for managing Malaysian entrepreneur financing — from application to settlement, powered by artificial intelligence.'}
              </p>
            </div>

            {/* Feature pills */}
            <div className="space-y-3">
              {[
                { dot: '#C62828', text: isMs ? 'Pemarkahan kredit AI & pengecaman dokumen automatik' : 'AI credit scoring & automatic document recognition' },
                { dot: '#2E7D32', text: isMs ? 'Kawalan akses berasaskan peranan (7 peringkat RBAC)' : 'Role-based access control (7-tier RBAC)' },
                { dot: '#1565C0', text: isMs ? 'Dashboard analitik nasional & laporan eksekutif' : 'National analytics dashboard & executive reports' },
                { dot: '#E65100', text: isMs ? 'Dwibahasa — Bahasa Malaysia & English' : 'Bilingual — Bahasa Malaysia & English' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: f.dot }}
                  />
                  <span className="text-white/60 text-sm">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom info */}
          <div className="mt-auto pt-10 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <img
                src="/images/tekun-logo-official.png"
                alt="TEKUN Nasional"
                className="h-7 w-auto object-contain opacity-40"
              />
            </div>
            <p className="text-white/25 text-xs leading-relaxed">
              {isMs
                ? '© 2026 TEKUN Nasional. Hak Cipta Terpelihara.'
                : '© 2026 TEKUN Nasional. All Rights Reserved.'}<br />
              {isMs
                ? 'Di bawah Kementerian Pembangunan Usahawan dan Koperasi (KUSKOP)'
                : 'Under the Ministry of Entrepreneur and Cooperative Development (KUSKOP)'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Right panel — login form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12">
        {/* Top bar — mobile logo + language toggle */}
        <div className="w-full max-w-sm mb-8 flex items-center justify-between">
          {/* Mobile-only logo */}
          <div className="flex items-center gap-2.5 lg:invisible">
            <img
              src="/images/tekun-icon.png"
              alt="TEKUN"
              className="h-9 w-9 object-contain"
            />
            <span className="font-bold text-sm" style={{ color: '#1B2B5E' }}>TEKUN NASIONAL</span>
          </div>
          {/* Language toggle */}
          <button
            onClick={() => i18n.changeLanguage(isMs ? 'en' : 'ms')}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-slate-50"
            style={{ borderColor: '#D1D5DB', color: '#6B7280' }}
          >
            <Globe size={13} />
            {isMs ? 'English' : 'Bahasa Malaysia'}
          </button>
        </div>

        {/* Login card */}
        <div
          className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden"
          style={{ boxShadow: '0 20px 60px rgba(27,43,94,0.12), 0 4px 16px rgba(0,0,0,0.06)' }}
        >
          {/* Card top accent bar */}
          <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #C62828 0%, #1B2B5E 50%, #2E7D32 100%)' }} />

          <div className="p-8">
            {/* Heading */}
            <div className="mb-7">
              <div className="flex items-center gap-2 mb-1">
                <Lock size={16} style={{ color: '#1B2B5E' }} />
                <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#1B2B5E' }}>
                  {isMs ? 'Log Masuk Selamat' : 'Secure Sign In'}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold" style={{ color: '#0D1E4A' }}>
                {isMs ? 'Selamat Datang' : 'Welcome Back'}
              </h2>
              <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
                {isMs
                  ? 'Sila masukkan maklumat log masuk anda untuk meneruskan.'
                  : 'Please enter your credentials to continue.'}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email field */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5 tracking-wide"
                  style={{ color: '#374151' }}
                >
                  {isMs ? 'Alamat E-mel' : 'Email Address'}
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 text-sm rounded-xl border transition-all outline-none"
                  style={{
                    borderColor: '#E5E7EB',
                    color: '#111827',
                    background: '#FAFAFA',
                  }}
                  placeholder={isMs ? 'nama@tekun.gov.my' : 'name@tekun.gov.my'}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={e => { e.currentTarget.style.borderColor = '#1B2B5E'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,43,94,0.08)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#FAFAFA'; e.currentTarget.style.boxShadow = 'none'; }}
                  required
                  autoComplete="email"
                />
              </div>

              {/* Password field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    className="block text-xs font-semibold tracking-wide"
                    style={{ color: '#374151' }}
                  >
                    {isMs ? 'Kata Laluan' : 'Password'}
                  </label>
                  <a
                    href="#"
                    className="text-xs font-medium transition-colors hover:underline"
                    style={{ color: '#1B2B5E' }}
                  >
                    {isMs ? 'Lupa kata laluan?' : 'Forgot password?'}
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="w-full px-4 py-3 pr-11 text-sm rounded-xl border transition-all outline-none"
                    style={{
                      borderColor: '#E5E7EB',
                      color: '#111827',
                      background: '#FAFAFA',
                    }}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={e => { e.currentTarget.style.borderColor = '#1B2B5E'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,43,94,0.08)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#FAFAFA'; e.currentTarget.style.boxShadow = 'none'; }}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors hover:text-slate-600"
                    style={{ color: '#9CA3AF' }}
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: loading
                    ? '#1B2B5E'
                    : 'linear-gradient(135deg, #1B2B5E 0%, #0D1E4A 100%)',
                  boxShadow: loading ? 'none' : '0 4px 14px rgba(27,43,94,0.35)',
                }}
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> {isMs ? 'Mengesahkan...' : 'Verifying...'}</>
                ) : (
                  isMs ? 'Log Masuk' : 'Sign In'
                )}
              </button>
            </form>

            {/* Security notice */}
            <div
              className="mt-6 flex items-start gap-2.5 p-3.5 rounded-xl"
              style={{ background: '#F0F4FF', border: '1px solid #DBEAFE' }}
            >
              <ShieldCheck size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#1B2B5E' }} />
              <p className="text-xs leading-relaxed" style={{ color: '#4B5563' }}>
                {isMs
                  ? 'Sesi ini dilindungi dengan penyulitan TLS 1.3. Jangan kongsi kata laluan anda dengan sesiapa.'
                  : 'This session is protected with TLS 1.3 encryption. Never share your password with anyone.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-1">
          <p className="text-xs" style={{ color: '#9CA3AF' }}>
            TEKUN SPPT v1.0 &nbsp;·&nbsp; {isMs ? 'Kementerian Pembangunan Usahawan dan Koperasi' : 'Ministry of Entrepreneur and Cooperative Development'}
          </p>
          <p className="text-xs" style={{ color: '#C4C9D4' }}>
            {isMs ? 'Rujukan Tender: TEKUN/SPPT/2026/TENDER' : 'Tender Reference: TEKUN/SPPT/2026/TENDER'}
          </p>
        </div>
      </div>
    </div>
  );
}
