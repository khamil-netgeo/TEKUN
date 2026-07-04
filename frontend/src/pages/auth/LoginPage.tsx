import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Globe, Loader2 } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';

/**
 * TEKUN SPPT — Login Page
 * 7 demo accounts matching Tender Document: TEKUN/SPPT/2026/TENDER
 *
 * Approval Authority Matrix:
 * - Below RM 10,000 : Pengurus Cawangan (branch_manager)
 * - RM 10,001–50,000: Penganalisis Kredit (credit_officer)
 * - Above RM 50,000 : Pengurusan Atasan (executive)
 */

const DEMO_ACCOUNTS = [
  {
    email:       'usahawan@tekun.gov.my',
    password:    'demo1234',
    role:        'usahawan',
    role_label:  'Usahawan',
    name:        'Ahmad Bin Mohd Noor',
    branch:      null,
    branch_code: null,
    state:       'Selangor',
    permissions: {
      modules:        ['module1', 'module4', 'module5'],
      actions:        ['application.create', 'application.view_own', 'account.view_own', 'payment.make'],
      data_scope:     'own' as const,
      approval_limit: 0,
    },
    description: 'Portal permohonan & bayaran balik sendiri',
    color:       '#7B1FA2',
  },
  {
    email:       'pegawai@tekun.gov.my',
    password:    'demo1234',
    role:        'branch_officer',
    role_label:  'Pegawai Pembiayaan Cawangan',
    name:        'Ahmad Fadzillah Bin Razak',
    branch:      'Cawangan Kuala Lumpur',
    branch_code: 'KL01',
    state:       'WP Kuala Lumpur',
    permissions: {
      modules:        ['module1', 'module2', 'module7'],
      actions:        ['application.view', 'application.process', 'application.pre_assess', 'document.verify', 'entrepreneur.view', 'field_visit.create'],
      data_scope:     'branch' as const,
      approval_limit: 0,
    },
    description: 'Proses permohonan & lawatan lapangan',
    color:       '#1565C0',
  },
  {
    email:       'pengurus@tekun.gov.my',
    password:    'demo1234',
    role:        'branch_manager',
    role_label:  'Pengurus Cawangan',
    name:        'Noraini Binti Hassan',
    branch:      'Cawangan Kuala Lumpur',
    branch_code: 'KL01',
    state:       'WP Kuala Lumpur',
    permissions: {
      modules:        ['module1', 'module2', 'module3', 'module7', 'module8'],
      actions:        ['application.approve', 'application.reject', 'credit.view_score', 'disbursement.view', 'branch.view_own'],
      data_scope:     'branch' as const,
      approval_limit: 10000,
    },
    description: 'Lulus permohonan ≤ RM 10,000 | Data cawangan sahaja',
    color:       '#0277BD',
  },
  {
    email:       'kredit@tekun.gov.my',
    password:    'demo1234',
    role:        'credit_officer',
    role_label:  'Penganalisis Kredit',
    name:        'Mohd Hafizi Bin Ismail',
    branch:      'Ibu Pejabat TEKUN',
    branch_code: 'HQ',
    state:       'WP Kuala Lumpur',
    permissions: {
      modules:        ['module2', 'module3', 'module5', 'module6', 'module7'],
      actions:        ['credit.score', 'credit.view_ccris', 'credit.view_ctos', 'credit.approve_recommendation', 'npl.view', 'dunning.generate', 'report.view', 'entrepreneur.view', 'field_visit.view'],
      data_scope:     'national' as const,
      approval_limit: 50000,
    },
    description: 'Skor kredit AI | Lulus ≤ RM 50,000 | Data nasional',
    color:       '#00695C',
  },
  {
    email:       'kewangan@tekun.gov.my',
    password:    'demo1234',
    role:        'finance_officer',
    role_label:  'Pegawai Kewangan',
    name:        'Siti Hajar Binti Yusof',
    branch:      'Ibu Pejabat TEKUN',
    branch_code: 'HQ',
    state:       'WP Kuala Lumpur',
    permissions: {
      modules:        ['module3', 'module4', 'module5'],
      actions:        ['disbursement.process_batch', 'disbursement.generate_payment_file', 'tawidh.calculate', 'moratorium.process', 'statement.generate'],
      data_scope:     'national' as const,
      approval_limit: 0,
    },
    description: 'Pengeluaran dana berkelompok | Ta\'widh | Moratorium',
    color:       '#E65100',
  },
  {
    email:       'eksekutif@tekun.gov.my',
    password:    'demo1234',
    role:        'executive',
    role_label:  'Pengurusan Atasan',
    name:        'Dato Sri Razali Bin Ahmad',
    branch:      'Ibu Pejabat TEKUN',
    branch_code: 'HQ',
    state:       'WP Kuala Lumpur',
    permissions: {
      modules:        ['module6', 'module8', 'module11'],
      actions:        ['dashboard.view', 'report.view', 'report.export', 'analytics.view', 'analytics.drill_down', 'branch.view', 'audit.view'],
      data_scope:     'national' as const,
      approval_limit: 999999,
    },
    description: 'Dashboard analitik nasional | Laporan eksekutif sahaja',
    color:       '#4A148C',
  },
  {
    email:       'admin@tekun.gov.my',
    password:    'demo1234',
    role:        'system_admin',
    role_label:  'Pentadbir Sistem',
    name:        'Siti Aminah Binti Kamarudin',
    branch:      'Ibu Pejabat TEKUN',
    branch_code: 'HQ',
    state:       'WP Kuala Lumpur',
    permissions: {
      modules:        ['*'],
      actions:        ['*'],
      data_scope:     'national' as const,
      approval_limit: 999999,
    },
    description: 'Akses penuh semua modul | Pentadbiran sistem',
    color:       '#B71C1C',
  },
];

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAllRoles, setShowAllRoles] = useState(false);

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

  const visibleAccounts = showAllRoles ? DEMO_ACCOUNTS : DEMO_ACCOUNTS.slice(0, 4);

  return (
    <div className="min-h-screen flex" style={{ background: '#F5F6FA' }}>
      <Toaster position="top-right" />

      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-2/5 p-12"
        style={{ background: '#1B2B5E' }}
      >
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-2xl"
              style={{ background: '#2E7D32' }}
            >
              T
            </div>
            <div>
              <div className="text-white font-bold text-xl">TEKUN SPPT</div>
              <div className="text-white/60 text-sm">Sistem Pengurusan Pembiayaan</div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
            Platform Pembiayaan<br />Digital TEKUN Nasional
          </h2>
          <p className="text-white/60 text-sm leading-relaxed mb-8">
            Sistem bersepadu untuk pengurusan pembiayaan usahawan Malaysia —
            dari permohonan hingga penyelesaian, dikuasakan oleh AI.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="space-y-4">
          {[
            { icon: '🤖', text: 'Pemarkahan kredit AI & pengecaman dokumen automatik' },
            { icon: '🔒', text: 'RBAC 7 peranan — kawalan akses berasaskan tender' },
            { icon: '📊', text: 'Dashboard analitik nasional & laporan Power BI' },
            { icon: '🌐', text: 'Dwibahasa — Bahasa Malaysia & English' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xl">{f.icon}</span>
              <span className="text-white/70 text-sm">{f.text}</span>
            </div>
          ))}
        </div>

        <div className="text-white/30 text-xs">
          © 2026 TEKUN Nasional. Hak Cipta Terpelihara.<br />
          Rujukan Tender: TEKUN/SPPT/2026/TENDER
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Language toggle */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => i18n.changeLanguage(i18n.language === 'ms' ? 'en' : 'ms')}
              className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border"
              style={{ borderColor: '#D1D5DB', color: '#6B7280' }}
            >
              <Globe size={14} />
              {i18n.language === 'ms' ? 'English' : 'Bahasa Malaysia'}
            </button>
          </div>

          <div className="sppt-card">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-1" style={{ color: '#1B2B5E' }}>
                {t('auth.login')}
              </h1>
              <p className="text-sm" style={{ color: '#6B7280' }}>
                Sila masukkan maklumat log masuk anda
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="sppt-label">{t('auth.email')}</label>
                <input
                  type="email"
                  className="sppt-input"
                  placeholder="nama@tekun.gov.my"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="sppt-label">{t('auth.password')}</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="sppt-input pr-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: '#9CA3AF' }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <a href="#" className="text-xs" style={{ color: '#1B2B5E' }}>
                  {t('auth.forgotPassword')}
                </a>
              </div>
              <button
                type="submit"
                className="btn btn-navy w-full justify-center"
                disabled={loading}
                style={{ padding: '11px', fontSize: 14 }}
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Memuatkan...</>
                ) : (
                  t('auth.loginBtn')
                )}
              </button>
            </form>

            {/* Demo accounts — 7 roles */}
            <div className="mt-5 p-3 rounded-lg" style={{ background: '#F0F4FF' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold" style={{ color: '#1B2B5E' }}>
                  🔑 Akaun Demo POC — 7 Peranan (Tender TEKUN/SPPT/2026):
                </p>
                <button
                  type="button"
                  onClick={() => setShowAllRoles(!showAllRoles)}
                  className="text-xs underline"
                  style={{ color: '#1565C0' }}
                >
                  {showAllRoles ? 'Sembunyikan' : 'Lihat semua'}
                </button>
              </div>
              <div className="space-y-1.5">
                {visibleAccounts.map(a => (
                  <button
                    key={a.email}
                    type="button"
                    onClick={() => { setEmail(a.email); setPassword(a.password); }}
                    className="block w-full text-left rounded-md px-2 py-1.5 hover:bg-white/60 transition-colors"
                    style={{ border: `1px solid ${a.color}22` }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: a.color }}
                      />
                      <span className="text-xs font-semibold" style={{ color: a.color }}>
                        {a.role_label}
                      </span>
                      <span className="text-xs" style={{ color: '#6B7280' }}>
                        — {a.email}
                      </span>
                    </div>
                    <div className="text-xs mt-0.5 ml-4" style={{ color: '#9CA3AF' }}>
                      {a.description}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>
                Kata laluan semua akaun: <strong>demo1234</strong>
              </p>
            </div>
          </div>

          <p className="text-center text-xs mt-4" style={{ color: '#9CA3AF' }}>
            TEKUN SPPT v1.0 | Kementerian Pembangunan Usahawan dan Koperasi
          </p>
        </div>
      </div>
    </div>
  );
}
