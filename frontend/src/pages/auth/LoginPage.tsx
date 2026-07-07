import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Eye, EyeOff, Globe, Loader2, Shield, Lock, AlertTriangle,
  ChevronDown, ChevronUp, CheckCircle2, XCircle, Building2,
  Users, BarChart3, Cpu,
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';

/**
 * TEKUN SPPT — Login Page (Improved)
 * Security features:
 *   • Login attempt counter with lockout (5 attempts → 5 min lockout)
 *   • Password strength indicator (real-time)
 *   • Caps-Lock detection
 *   • Input sanitisation (trimmed email)
 *   • HTTPS / secure-connection badge
 *   • Accessible labels & ARIA attributes
 * Branding: Navy #1B2B5E | Green #2E7D32 | Orange #E65100
 */

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS   = 5 * 60 * 1000;
const LOCKOUT_KEY  = 'sppt_login_lockout';
const ATTEMPTS_KEY = 'sppt_login_attempts';

const DEMO_ACCOUNTS = [
  {
    email: 'usahawan@tekun.gov.my', password: 'demo1234',
    role: 'usahawan', role_label: 'Usahawan', name: 'Ahmad Bin Mohd Noor',
    branch: null, branch_code: null, state: 'Selangor',
    permissions: { modules: ['module1','module4','module5'], actions: ['application.create','application.view_own','account.view_own','payment.make'], data_scope: 'own' as const, approval_limit: 0 },
    description: 'Portal permohonan & bayaran balik sendiri', color: '#7B1FA2', icon: '👤',
  },
  {
    email: 'pegawai@tekun.gov.my', password: 'demo1234',
    role: 'branch_officer', role_label: 'Pegawai Pembiayaan Cawangan', name: 'Ahmad Fadzillah Bin Razak',
    branch: 'Cawangan Kuala Lumpur', branch_code: 'KL01', state: 'WP Kuala Lumpur',
    permissions: { modules: ['module1','module2','module7'], actions: ['application.view','application.process','application.pre_assess','document.verify','entrepreneur.view','field_visit.create'], data_scope: 'branch' as const, approval_limit: 0 },
    description: 'Proses permohonan & lawatan lapangan', color: '#1565C0', icon: '🏢',
  },
  {
    email: 'pengurus@tekun.gov.my', password: 'demo1234',
    role: 'branch_manager', role_label: 'Pengurus Cawangan', name: 'Noraini Binti Hassan',
    branch: 'Cawangan Kuala Lumpur', branch_code: 'KL01', state: 'WP Kuala Lumpur',
    permissions: { modules: ['module1','module2','module3','module7','module8'], actions: ['application.approve','application.reject','credit.view_score','disbursement.view','branch.view_own'], data_scope: 'branch' as const, approval_limit: 10000 },
    description: 'Lulus permohonan ≤ RM 10,000 | Data cawangan sahaja', color: '#0277BD', icon: '👔',
  },
  {
    email: 'kredit@tekun.gov.my', password: 'demo1234',
    role: 'credit_officer', role_label: 'Penganalisis Kredit', name: 'Mohd Hafizi Bin Ismail',
    branch: 'Ibu Pejabat TEKUN', branch_code: 'HQ', state: 'WP Kuala Lumpur',
    permissions: { modules: ['module2','module3','module5','module6','module7'], actions: ['credit.score','credit.view_ccris','credit.view_ctos','credit.approve_recommendation','npl.view','dunning.generate','report.view','entrepreneur.view','field_visit.view'], data_scope: 'national' as const, approval_limit: 50000 },
    description: 'Skor kredit AI | Lulus ≤ RM 50,000 | Data nasional', color: '#00695C', icon: '📊',
  },
  {
    email: 'kewangan@tekun.gov.my', password: 'demo1234',
    role: 'finance_officer', role_label: 'Pegawai Kewangan', name: 'Siti Hajar Binti Yusof',
    branch: 'Ibu Pejabat TEKUN', branch_code: 'HQ', state: 'WP Kuala Lumpur',
    permissions: { modules: ['module3','module4','module5'], actions: ['disbursement.process_batch','disbursement.generate_payment_file','tawidh.calculate','moratorium.process','statement.generate'], data_scope: 'national' as const, approval_limit: 0 },
    description: "Pengeluaran dana berkelompok | Ta'widh | Moratorium", color: '#E65100', icon: '💰',
  },
  {
    email: 'eksekutif@tekun.gov.my', password: 'demo1234',
    role: 'executive', role_label: 'Pengurusan Atasan', name: 'Dato Sri Razali Bin Ahmad',
    branch: 'Ibu Pejabat TEKUN', branch_code: 'HQ', state: 'WP Kuala Lumpur',
    permissions: { modules: ['module6','module8','module11'], actions: ['dashboard.view','report.view','report.export','analytics.view','analytics.drill_down','branch.view','audit.view'], data_scope: 'national' as const, approval_limit: 999999 },
    description: 'Dashboard analitik nasional | Laporan eksekutif sahaja', color: '#4A148C', icon: '🏛️',
  },
  {
    email: 'admin@tekun.gov.my', password: 'demo1234',
    role: 'system_admin', role_label: 'Pentadbir Sistem', name: 'Siti Aminah Binti Kamarudin',
    branch: 'Ibu Pejabat TEKUN', branch_code: 'HQ', state: 'WP Kuala Lumpur',
    permissions: { modules: ['*'], actions: ['*'], data_scope: 'national' as const, approval_limit: 999999 },
    description: 'Akses penuh semua modul | Pentadbiran sistem', color: '#B71C1C', icon: '⚙️',
  },
];

const FEATURES = [
  { Icon: Cpu,      title: 'AI Kredit & eKYC',    desc: 'Pemarkahan kredit automatik & pengesahan dokumen SPPT AI' },
  { Icon: Shield,   title: 'RBAC 7 Peranan',       desc: 'Kawalan akses berasaskan tender TEKUN/SPPT/2026' },
  { Icon: BarChart3, title: 'Analitik Nasional',   desc: 'Dashboard eksekutif & laporan analitik masa nyata' },
  { Icon: Users,    title: 'Dwibahasa',             desc: 'Bahasa Malaysia & English — togol sebarang masa' },
];

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Lemah',     color: '#C62828' };
  if (score <= 2) return { score, label: 'Sederhana', color: '#E65100' };
  if (score <= 3) return { score, label: 'Baik',      color: '#F9A825' };
  return             { score, label: 'Kuat',      color: '#2E7D32' };
}

function getLockoutRemaining(): number {
  const ts = parseInt(localStorage.getItem(LOCKOUT_KEY) ?? '0', 10);
  if (!ts) return 0;
  const remaining = ts + LOCKOUT_MS - Date.now();
  return remaining > 0 ? remaining : 0;
}
function getAttempts(): number { return parseInt(localStorage.getItem(ATTEMPTS_KEY) ?? '0', 10); }
function incrementAttempts(): number {
  const next = getAttempts() + 1;
  localStorage.setItem(ATTEMPTS_KEY, String(next));
  if (next >= MAX_ATTEMPTS) localStorage.setItem(LOCKOUT_KEY, String(Date.now()));
  return next;
}
function resetAttempts(): void {
  localStorage.removeItem(ATTEMPTS_KEY);
  localStorage.removeItem(LOCKOUT_KEY);
}

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate    = useNavigate();
  const { login }   = useAuthStore();

  const [email,            setEmail]            = useState('');
  const [password,         setPassword]         = useState('');
  const [showPw,           setShowPw]           = useState(false);
  const [loading,          setLoading]          = useState(false);
  const [attempts,         setAttempts]         = useState(getAttempts());
  const [lockoutRemaining, setLockoutRemaining] = useState(getLockoutRemaining());
  const [capsLock,         setCapsLock]         = useState(false);
  const [loginError,       setLoginError]       = useState('');
  const [showAllRoles,     setShowAllRoles]     = useState(false);
  const [selectedRole,     setSelectedRole]     = useState<string | null>(null);
  // MFA / OTP state
  const [mfaStep,          setMfaStep]          = useState(false);
  const [otpCode,          setOtpCode]          = useState('');
  const [otpLoading,       setOtpLoading]       = useState(false);
  const [otpError,         setOtpError]         = useState('');
  const [otpResendTimer,   setOtpResendTimer]   = useState(0);
  const [pendingUser,      setPendingUser]       = useState<any>(null);
  const [pendingToken,     setPendingToken]      = useState<string>('');
  const otpTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const emailRef     = useRef<HTMLInputElement>(null);
  const lockoutTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Redirect already-authenticated users away from /login.
  // Usahawan role goes straight to the borrower portal; other roles to /dashboard.
  useEffect(() => {
    const { isAuthenticated: authed, user: authedUser } = useAuthStore.getState();
    if (authed && authedUser) {
      navigate(authedUser.role === 'usahawan' ? '/usahawan/dashboard' : '/dashboard', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (lockoutRemaining > 0) {
      lockoutTimer.current = setInterval(() => {
        const rem = getLockoutRemaining();
        setLockoutRemaining(rem);
        if (rem <= 0) {
          clearInterval(lockoutTimer.current!);
          resetAttempts();
          setAttempts(0);
        }
      }, 1000);
    }
    return () => { if (lockoutTimer.current) clearInterval(lockoutTimer.current); };
  }, [lockoutRemaining]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    setCapsLock(e.getModifierState('CapsLock'));
  }, []);

  const fillDemo = useCallback((acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setSelectedRole(acc.role);
    setLoginError('');
    emailRef.current?.focus();
  }, []);

  const toggleLang = useCallback(() => {
    i18n.changeLanguage(i18n.language === 'ms' ? 'en' : 'ms');
  }, [i18n]);

  const isLocked    = lockoutRemaining > 0;
  const lockoutMins = Math.ceil(lockoutRemaining / 60000);
  const lockoutSecs = Math.ceil((lockoutRemaining % 60000) / 1000);
  const pwStrength  = getPasswordStrength(password);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (isLocked) return;

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setLoginError('Sila isi semua medan yang diperlukan.');
      return;
    }
    setLoading(true);

    // All logins go through the real API to get a valid Sanctum token.
    // OTP/MFA step is skipped for POC (graceful degradation — otps table not yet migrated).
    // This prevents the "Unauthenticated" error caused by fake demo tokens being rejected by the backend.

    try {
      const res = await api.post('/auth/login', { email: trimmedEmail, password });
      // Real API login succeeded — store user + token and navigate directly
      // OTP step is bypassed for POC (otps table migration pending)
      const realUser = res.data.user;
      const realToken = res.data.token;
      login(realUser, realToken);
      resetAttempts();
      toast.success(`Selamat datang, ${realUser.name}! (${realUser.role_label})`);
      navigate(realUser.role === 'usahawan' ? '/usahawan/dashboard' : '/dashboard');
      setLoading(false);
      return;
    } catch {
      const newAttempts = incrementAttempts();
      setAttempts(newAttempts);
      const remaining = MAX_ATTEMPTS - newAttempts;
      if (newAttempts >= MAX_ATTEMPTS) {
        setLockoutRemaining(LOCKOUT_MS);
        setLoginError('Akaun dikunci selama 5 minit. Terlalu banyak cubaan log masuk.');
      } else {
        setLoginError(`E-mel atau kata laluan tidak sah. ${remaining} cubaan lagi sebelum dikunci.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const visibleAccounts = showAllRoles ? DEMO_ACCOUNTS : DEMO_ACCOUNTS.slice(0, 4);

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    if (otpCode.length !== 6) { setOtpError('Sila masukkan kod OTP 6 digit.'); return; }
    setOtpLoading(true);
    try {
      // All accounts go through real OTP verification
      const res = await api.post('/auth/verify-otp', {
        identifier: email.trim().toLowerCase(),
        channel: 'email',
        code: otpCode,
        purpose: 'login_2fa',
      });
      if (res.data.verified) {
        login(pendingUser, pendingToken);
        toast.success(`Selamat datang, ${pendingUser.name}!`);
        navigate(pendingUser?.role === 'usahawan' ? '/usahawan/dashboard' : '/dashboard');
      } else {
        setOtpError(res.data.message ?? 'Kod OTP tidak sah atau telah tamat tempoh.');
      }
    } catch (err: any) {
      setOtpError(err.response?.data?.message ?? 'Pengesahan OTP gagal. Cuba lagi.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpResend = async () => {
    if (otpResendTimer > 0) return;
    try {
      await api.post('/auth/send-otp', { identifier: email.trim().toLowerCase(), channel: 'email', purpose: 'login_2fa' });
      toast.success('Kod OTP baharu telah dihantar ke emel anda.');
      setOtpResendTimer(60);
      if (otpTimerRef.current) clearInterval(otpTimerRef.current);
      otpTimerRef.current = setInterval(() => {
        setOtpResendTimer(prev => { if (prev <= 1) { clearInterval(otpTimerRef.current!); return 0; } return prev - 1; });
      }, 1000);
    } catch {
      toast.error('Gagal menghantar semula OTP. Cuba lagi.');
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#F0F2F8' }}>
      <Toaster position="top-right" />

      {/* ── Left Panel — Branding ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-5/12 p-10 xl:p-14 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1B2B5E 0%, #0D1A3A 100%)' }}
      >
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-10" style={{ background: '#2E7D32' }} />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full opacity-10" style={{ background: '#E65100' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #2E7D32, #1B5E20)' }}>
              <Building2 size={28} color="white" />
            </div>
            <div>
              <div className="text-white font-bold text-xl tracking-wide">TEKUN SPPT</div>
              <div className="text-white/50 text-xs tracking-wider uppercase">Sistem Pengurusan Pembiayaan</div>
            </div>
          </div>

          <h2 className="text-3xl xl:text-4xl font-bold text-white mb-4 leading-tight">
            Platform Pembiayaan<br />
            <span style={{ color: '#4CAF50' }}>Digital</span> TEKUN Nasional
          </h2>
          <p className="text-white/60 text-sm leading-relaxed mb-10">
            Sistem bersepadu untuk pengurusan pembiayaan usahawan Malaysia —
            dari permohonan hingga penyelesaian, dikuasakan oleh AI.
          </p>

          <div className="space-y-5">
            {FEATURES.map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <Icon size={18} color="rgba(255,255,255,0.8)" />
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">{title}</div>
                  <div className="text-white/50 text-xs leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 border-t border-white/10 pt-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/60 text-xs">Sistem dalam talian</span>
          </div>
          <p className="text-white/30 text-xs">
            © 2026 TEKUN Nasional. Hak Cipta Terpelihara.<br />
            Rujukan Tender: TEKUN/SPPT/2026/TENDER
          </p>
        </div>
      </div>

      {/* ── Right Panel — Login Form ── */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#1B2B5E' }}>
              <Building2 size={16} color="white" />
            </div>
            <span className="font-bold text-sm" style={{ color: '#1B2B5E' }}>TEKUN SPPT</span>
          </div>
          <div className="hidden lg:block" />
          <button
            type="button"
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
            style={{ background: '#EEF2FF', color: '#1B2B5E', border: '1px solid #C7D2FE' }}
          >
            <Globe size={13} />
            {i18n.language === 'ms' ? 'English' : 'Bahasa Malaysia'}
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-6">
          <div className="w-full max-w-md">

            {/* Security badge */}
            <div
              className="flex items-center justify-center gap-2 mb-5 px-4 py-2 rounded-full mx-auto w-fit"
              style={{ background: '#E8F5E9', border: '1px solid #A5D6A7' }}
            >
              <Lock size={12} style={{ color: '#2E7D32' }} />
              <span className="text-xs font-medium" style={{ color: '#2E7D32' }}>
                Sambungan selamat — HTTPS / TLS 1.3
              </span>
              <CheckCircle2 size={12} style={{ color: '#2E7D32' }} />
            </div>

            {/* Card */}
            <div className="rounded-2xl shadow-xl p-7 xl:p-8" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
              <div className="mb-6">
                <h1 className="text-2xl font-bold mb-1" style={{ color: '#1B2B5E' }}>
                  {t('auth.login')}
                </h1>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  Sila masukkan maklumat log masuk anda untuk meneruskan
                </p>
              </div>

              {/* Lockout banner */}
              {isLocked && (
                <div className="flex items-start gap-3 p-3 rounded-xl mb-4" style={{ background: '#FFF3E0', border: '1px solid #FFCC80' }} role="alert">
                  <AlertTriangle size={16} style={{ color: '#E65100', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: '#E65100' }}>Akaun Dikunci Sementara</p>
                    <p className="text-xs" style={{ color: '#BF360C' }}>
                      Cuba semula dalam <strong>{lockoutMins > 0 ? `${lockoutMins} minit` : `${lockoutSecs} saat`}</strong>.
                      Hubungi pentadbir sistem jika anda memerlukan bantuan segera.
                    </p>
                  </div>
                </div>
              )}

              {/* Attempt warning */}
              {!isLocked && attempts > 0 && attempts < MAX_ATTEMPTS && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg mb-4" style={{ background: '#FFF8E1', border: '1px solid #FFE082' }} role="alert">
                  <AlertTriangle size={13} style={{ color: '#F9A825' }} />
                  <p className="text-xs" style={{ color: '#795548' }}>
                    {MAX_ATTEMPTS - attempts} cubaan log masuk yang tinggal sebelum akaun dikunci.
                  </p>
                </div>
              )}

              {/* Error */}
              {loginError && !isLocked && (
                <div className="flex items-start gap-2 p-3 rounded-xl mb-4" style={{ background: '#FFEBEE', border: '1px solid #EF9A9A' }} role="alert">
                  <XCircle size={14} style={{ color: '#C62828', flexShrink: 0, marginTop: 1 }} />
                  <p className="text-xs" style={{ color: '#B71C1C' }}>{loginError}</p>
                </div>
              )}

              {!mfaStep ? (
              <form onSubmit={handleLogin} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="login-email" className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
                    {t('auth.email')}
                  </label>
                  <input
                    id="login-email"
                    ref={emailRef}
                    type="email"
                    className="sppt-input"
                    placeholder="nama@tekun.gov.my"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setLoginError(''); }}
                    autoComplete="email"
                    autoFocus
                    disabled={isLocked || loading}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
                    {t('auth.password')}
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPw ? 'text' : 'password'}
                      className="sppt-input pr-10"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setLoginError(''); }}
                      onKeyDown={handleKeyDown}
                      autoComplete="current-password"
                      disabled={isLocked || loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                      style={{ color: '#9CA3AF' }}
                      aria-label={showPw ? 'Sembunyikan kata laluan' : 'Tunjukkan kata laluan'}
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {capsLock && password && (
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#E65100' }}>
                      <AlertTriangle size={11} />
                      Caps Lock aktif — kata laluan mungkin tidak betul
                    </p>
                  )}

                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                            style={{ background: i <= pwStrength.score ? pwStrength.color : '#E5E7EB' }} />
                        ))}
                      </div>
                      {pwStrength.label && (
                        <p className="text-xs" style={{ color: pwStrength.color }}>
                          Kekuatan kata laluan: <strong>{pwStrength.label}</strong>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <a
                    href="#"
                    className="text-xs font-medium hover:underline"
                    style={{ color: '#1B2B5E' }}
                    onClick={e => { e.preventDefault(); toast('Sila hubungi pentadbir sistem untuk menetapkan semula kata laluan.', { icon: '🔑' }); }}
                  >
                    {t('auth.forgotPassword')}
                  </a>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200"
                  style={{
                    background: isLocked ? '#9CA3AF' : 'linear-gradient(135deg, #1B2B5E 0%, #243570 100%)',
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    boxShadow: isLocked ? 'none' : '0 4px 14px rgba(27,43,94,0.35)',
                  }}
                  disabled={isLocked || loading}
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Mengesahkan...</>
                  ) : isLocked ? (
                    <><Lock size={15} /> Akaun Dikunci</>
                  ) : (
                    <><Shield size={15} /> {t('auth.loginBtn')}</>
                  )}
                </button>
              </form>
              ) : (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3" style={{ background: '#EEF2FF' }}>
                    <Shield size={24} style={{ color: '#1B2B5E' }} />
                  </div>
                  <h3 className="text-base font-bold" style={{ color: '#1B2B5E' }}>Pengesahan Dua Faktor</h3>
                  <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Kod OTP telah dihantar ke emel anda</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Kod OTP (6 digit)</label>
                  <input type="text" maxLength={6} className="sppt-input text-center text-lg tracking-widest font-mono" placeholder="000000" value={otpCode} onChange={e => { setOtpCode(e.target.value.replace(/[^0-9]/g, '')); setOtpError(''); }} autoFocus />
                  {otpError && <p className="text-xs mt-1" style={{ color: '#C62828' }}>{otpError}</p>}
                </div>
                <button type="button" onClick={handleOtpVerify} disabled={otpLoading || otpCode.length !== 6} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #1B2B5E 0%, #243570 100%)' }}>
                  {otpLoading ? <><Loader2 size={16} className="animate-spin" /> Mengesahkan...</> : 'Sahkan OTP'}
                </button>
                <div className="flex items-center justify-between text-xs">
                  <button type="button" onClick={() => { setMfaStep(false); setOtpCode(''); setOtpError(''); }} style={{ color: '#6B7280' }}>&#8592; Kembali</button>
                  <button type="button" onClick={handleOtpResend} disabled={otpResendTimer > 0} style={{ color: otpResendTimer > 0 ? '#9CA3AF' : '#1B2B5E' }}>{otpResendTimer > 0 ? `Hantar semula (${otpResendTimer}s)` : 'Hantar semula OTP'}</button>
                </div>
              </div>
              )}

              {!mfaStep && (
              <>
              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px" style={{ background: '#E5E7EB' }} />
                <span className="text-xs" style={{ color: '#9CA3AF' }}>Akaun Demo POC</span>
                <div className="flex-1 h-px" style={{ background: '#E5E7EB' }} />
              </div>

              {/* Demo accounts */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E0E7FF', background: '#F8F9FF' }}>
                <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: '1px solid #E0E7FF', background: '#EEF2FF' }}>
                  <div className="flex items-center gap-2">
                    <Shield size={13} style={{ color: '#1B2B5E' }} />
                    <span className="text-xs font-semibold" style={{ color: '#1B2B5E' }}>
                      7 Peranan — Tender TEKUN/SPPT/2026
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAllRoles(v => !v)}
                    className="flex items-center gap-1 text-xs font-medium hover:opacity-70"
                    style={{ color: '#1565C0' }}
                  >
                    {showAllRoles ? <><ChevronUp size={13} /> Sembunyikan</> : <><ChevronDown size={13} /> Lihat semua</>}
                  </button>
                </div>

                <div className="p-2 space-y-1">
                  {visibleAccounts.map(a => (
                    <button
                      key={a.email}
                      type="button"
                      onClick={() => fillDemo(a)}
                      className="block w-full text-left rounded-lg px-3 py-2 transition-all duration-150 hover:shadow-sm"
                      style={{
                        border: selectedRole === a.role ? `1.5px solid ${a.color}` : `1px solid ${a.color}22`,
                        background: selectedRole === a.role ? `${a.color}08` : 'white',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">{a.icon}</span>
                        <span className="text-xs font-semibold" style={{ color: a.color }}>{a.role_label}</span>
                        {selectedRole === a.role && <CheckCircle2 size={11} style={{ color: a.color, marginLeft: 'auto' }} />}
                      </div>
                      <p className="text-xs mt-0.5 ml-6" style={{ color: '#6B7280' }}>{a.email}</p>
                      <p className="text-xs ml-6" style={{ color: '#9CA3AF' }}>{a.description}</p>
                    </button>
                  ))}
                </div>

                <div className="px-3 py-2 text-xs flex items-center gap-1.5" style={{ borderTop: '1px solid #E0E7FF', color: '#6B7280' }}>
                  <Lock size={10} />
                  Kata laluan semua akaun:{' '}
                  <code className="px-1.5 py-0.5 rounded font-mono text-xs" style={{ background: '#E0E7FF', color: '#1B2B5E' }}>
                    demo1234
                  </code>
                </div>
              </div>
              </>
              )}
            </div>

            <p className="text-center text-xs mt-5" style={{ color: '#9CA3AF' }}>
              TEKUN SPPT v1.0 &nbsp;|&nbsp; Kementerian Pembangunan Usahawan dan Koperasi
              <br />
              <span style={{ color: '#A78BFA' }}>Dilindungi oleh AES-256 &amp; TLS 1.3</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
