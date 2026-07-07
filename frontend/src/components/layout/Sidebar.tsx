/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  ⛔  DO NOT MODIFY — SHARED INFRASTRUCTURE FILE                            ║
 * ║                                                                              ║
 * ║  This file is OWNED by the Core Foundation Agent and the Orchestrator.      ║
 * ║  It is shared across ALL 12 modules.                                        ║
 * ║                                                                              ║
 * ║  Module agents (M1–M12) MUST NOT edit this file.                            ║
 * ║  Any change to this file requires Orchestrator approval.                    ║
 * ║                                                                              ║
 * ║  If you need to add module-specific navigation items, add them to           ║
 * ║  your module's routes.tsx file — NOT here.                                  ║
 * ║                                                                              ║
 * ║  Violations will be detected by the pre-commit hook and rejected.           ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Activity, BarChart3, Banknote, Building2, ChevronDown, ChevronRight,
  ClipboardCheck, ClipboardList, CreditCard, FileText, Globe, LayoutDashboard,
  LogOut, Package, Settings, Shield, TrendingUp, UserCog, Users,
  Home, Wallet, FileCheck, AlertCircle
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * TEKUN SPPT — Role-Based Sidebar Navigation
 * Based on Tender Document: TEKUN/SPPT/2026/TENDER
 *
 * Module visibility per role:
 * usahawan         → M1 (own), M4, M5 (payment only)
 * branch_officer   → M1, M2, M7
 * branch_manager   → M1, M2, M3, M7, M8
 * credit_officer   → M2, M3, M5, M6, M7
 * finance_officer  → M3, M4, M5
 * executive        → M6, M8, M11
 * system_admin     → ALL modules
 */

interface ModuleItem {
  key: string;
  icon: React.ElementType;
  labelKey: string;
  allowedRoles: string[];  // '*' means all authenticated users
  subItems: { path: string; labelKey: string; allowedRoles?: string[] }[];
}

const MODULES: ModuleItem[] = [
  {
    key: 'module1',
    icon: FileText,
    labelKey: 'nav.module1',
    allowedRoles: ['branch_officer', 'branch_manager', 'system_admin'],
    subItems: [
      { path: '/module1/applications', labelKey: 'module1.applicationList' },
      {
        path: '/module1/new',
        labelKey: 'module1.newApplication',
        allowedRoles: ['branch_officer', 'system_admin'],
      },
    ],
  },
  {
    key: 'module2',
    icon: ClipboardCheck,
    labelKey: 'nav.module2',
    allowedRoles: ['branch_officer', 'branch_manager', 'credit_officer', 'system_admin'],
    subItems: [
      { path: '/module2/dashboard', labelKey: 'module2.creditScore' },
      { path: '/module2/approval',  labelKey: 'module2.approvalWorkflow' },
    ],
  },
  {
    key: 'module3',
    icon: Banknote,
    labelKey: 'nav.module3',
    allowedRoles: ['branch_manager', 'credit_officer', 'finance_officer', 'system_admin'],
    subItems: [
      { path: '/module3/disbursement', labelKey: 'module3.disbursementList' },
      { path: '/module3/authority',    labelKey: 'module3.authorityMatrix' },
      { path: '/module3/esign',        labelKey: 'module3.esignTracking' },
      { path: '/module3/aging',        labelKey: 'module3.agingEscalation' },
    ],
  },
  {
    key: 'module4',
    icon: CreditCard,
    labelKey: 'nav.module4',
    allowedRoles: ['finance_officer', 'system_admin'],
    subItems: [
      { path: '/module4/accounts',    labelKey: 'module4.account360' },
      { path: '/module4/payments',    labelKey: 'module4.paymentChannels' },
      { path: '/module4/moratorium',  labelKey: 'module4.moratorium' },
      { path: '/module4/tawidh',      labelKey: 'module4.tawidh' },
    ],
  },
  {
    key: 'module5',
    icon: TrendingUp,
    labelKey: 'nav.module5',
    allowedRoles: ['credit_officer', 'finance_officer', 'system_admin'],
    subItems: [
      { path: '/module5/npl',     labelKey: 'module5.nplDashboard' },
      { path: '/module5/dunning', labelKey: 'module5.dunning' },
    ],
  },
  {
    key: 'module6',
    icon: BarChart3,
    labelKey: 'nav.module6',
    allowedRoles: ['credit_officer', 'executive', 'system_admin'],
    subItems: [
      { path: '/module6/dashboard',          labelKey: 'module6.executiveDashboard' },
      { path: '/module6/branch-performance',  labelKey: 'module6.branchPerformance' },
      { path: '/module6/predictive',          labelKey: 'module6.predictiveAnalytics' },
      { path: '/module6/reports',             labelKey: 'module6.reportBuilder' },
      { path: '/module6/ai-builder',          labelKey: 'module6.aiDashboardBuilder' },
      { path: '/module6/officer-skill',       labelKey: 'module6.officerSkillProfile' },
    ],
  },
  {
    key: 'module7',
    icon: Users,
    labelKey: 'nav.module7',
    allowedRoles: ['branch_officer', 'branch_manager', 'credit_officer', 'system_admin'],
    subItems: [
      { path: '/module7/entrepreneurs', labelKey: 'module7.entrepreneurProfile' },
      { path: '/module7/field-visits',  labelKey: 'module7.fieldVisit' },
    ],
  },
  {
    key: 'module8',
    icon: Building2,
    labelKey: 'nav.module8',
    allowedRoles: ['branch_manager', 'executive', 'system_admin'],
    subItems: [
      { path: '/module8/branches', labelKey: 'module8.branchManagement' },
    ],
  },
  {
    key: 'module9',
    icon: Package,
    labelKey: 'nav.module9',
    allowedRoles: ['system_admin'],
    subItems: [
      { path: '/module9/products',    labelKey: 'module9.productConfig' },
      { path: '/module9/eligibility', labelKey: 'module9.eligibilityChecker' },
    ],
  },
  {
    key: 'module10',
    icon: Activity,
    labelKey: 'nav.module10',
    allowedRoles: ['system_admin'],
    subItems: [
      { path: '/module10/api-health', labelKey: 'module10.apiHealth' },
    ],
  },
  {
    key: 'module11',
    icon: Shield,
    labelKey: 'nav.module11',
    allowedRoles: ['executive', 'system_admin'],
    subItems: [
      { path: '/module11/audit-trail', labelKey: 'module11.auditTrail' },
    ],
  },
  {
    key: 'module12',
    icon: UserCog,
    labelKey: 'nav.module12',
    allowedRoles: ['system_admin'],
    subItems: [
      { path: '/module12/users', labelKey: 'module12.userManagement' },
    ],
  },
];

/** Role badge colour mapping */
const ROLE_BADGE_COLORS: Record<string, string> = {
  usahawan:       '#7B1FA2',
  branch_officer: '#1565C0',
  branch_manager: '#0277BD',
  credit_officer: '#00695C',
  finance_officer:'#E65100',
  executive:      '#4A148C',
  system_admin:   '#B71C1C',
};

export default function Sidebar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>(null);

  const role = user?.role ?? '';
  const isAdmin = role === 'system_admin';

  /** Check if the current user can see a module */
  const canSeeModule = (mod: ModuleItem) =>
    isAdmin || mod.allowedRoles.includes(role);

  /** Check if the current user can see a sub-item */
  const canSeeSubItem = (sub: { allowedRoles?: string[] }) =>
    !sub.allowedRoles || isAdmin || sub.allowedRoles.includes(role);

  const toggleLang = () =>
    i18n.changeLanguage(i18n.language === 'ms' ? 'en' : 'ms');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleModules = MODULES.filter(canSeeModule);

  return (
    <div className="flex flex-col h-screen w-64 flex-shrink-0" style={{ background: '#1B2B5E' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
          style={{ background: '#2E7D32' }}
        >
          T
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-tight">TEKUN SPPT</div>
          <div className="text-white/50 text-xs leading-tight">Sistem Pembiayaan</div>
        </div>
      </div>

      {/* User info with role badge */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: ROLE_BADGE_COLORS[role] ?? '#E65100' }}
          >
            {user?.name?.charAt(0) ?? 'U'}
          </div>
          <div className="min-w-0">
            <div className="text-white text-xs font-semibold truncate">{user?.name ?? 'Pengguna'}</div>
            <div
              className="text-xs truncate px-1.5 py-0.5 rounded-full inline-block mt-0.5"
              style={{
                background: ROLE_BADGE_COLORS[role] ? `${ROLE_BADGE_COLORS[role]}33` : 'rgba(255,255,255,0.15)',
                color: '#fff',
                fontSize: '10px',
              }}
            >
              {user?.role_label ?? 'Pegawai'}
            </div>
          </div>
        </div>
        {/* Branch info */}
        {user?.branch && (
          <div className="text-white/40 text-xs mt-1 truncate">📍 {user.branch}</div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {/* Dashboard — visible to all */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={16} />
          <span>{t('nav.dashboard')}</span>
        </NavLink>

        {/* Usahawan Portal — only visible to usahawan role */}
        {role === 'usahawan' && (
          <>
            <div className="nav-section-title">PORTAL USAHAWAN</div>
            <NavLink to="/usahawan/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Home size={16} />
              <span>Papan Pemuka Saya</span>
            </NavLink>
            <NavLink to="/usahawan/applications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FileText size={16} />
              <span>Permohonan Saya</span>
            </NavLink>
            <NavLink to="/module1/new" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FileCheck size={16} />
              <span>Mohon Pembiayaan</span>
            </NavLink>
            <NavLink to="/usahawan/account" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Wallet size={16} />
              <span>Akaun Pembiayaan</span>
            </NavLink>
            <NavLink to="/usahawan/moratorium" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <AlertCircle size={16} />
              <span>Mohon Moratorium</span>
            </NavLink>
          </>
        )}

        {/* Module section — only visible to staff roles */}
        {role !== 'usahawan' && <div className="nav-section-title">MODUL SISTEM</div>}

        {visibleModules.map((mod) => {
          const Icon = mod.icon;
          const isExpanded = expanded === mod.key;
          const visibleSubs = mod.subItems.filter(canSeeSubItem);

          return (
            <div key={mod.key}>
              <button
                onClick={() => setExpanded(isExpanded ? null : mod.key)}
                className="nav-item w-full text-left"
                style={{ justifyContent: 'space-between' }}
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} />
                  <span>{t(mod.labelKey)}</span>
                </div>
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {isExpanded && (
                <div className="ml-6 mt-1 mb-1">
                  {visibleSubs.map((sub) => (
                    <NavLink
                      key={sub.path}
                      to={sub.path}
                      className={({ isActive }) =>
                        `nav-item text-xs py-2 ${isActive ? 'active' : ''}`
                      }
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 flex-shrink-0" />
                      <span>{t(sub.labelKey)}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Admin section — only for system_admin */}
        {isAdmin && (
          <>
            <div className="nav-section-title">PENTADBIRAN</div>
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Settings size={16} />
              <span>{t('nav.admin')}</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Bottom actions */}
      <div className="px-2 py-3 border-t border-white/10 space-y-1">
        <button onClick={toggleLang} className="nav-item w-full text-left">
          <Globe size={16} />
          <span>{i18n.language === 'ms' ? 'English' : 'Bahasa Malaysia'}</span>
          <span
            className="ml-auto text-xs px-2 py-0.5 rounded"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            {i18n.language === 'ms' ? 'BM' : 'EN'}
          </span>
        </button>
        <button
          onClick={handleLogout}
          className="nav-item w-full text-left"
          style={{ color: 'rgba(255,100,100,0.8)' }}
        >
          <LogOut size={16} />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </div>
  );
}
