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

import { Bell, Search, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import { ms as msLocale } from 'date-fns/locale';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export default function TopBar({ title, subtitle }: TopBarProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const now = new Date();

  const dateStr = i18n.language === 'ms'
    ? format(now, "EEEE, d MMMM yyyy", { locale: msLocale })
    : format(now, "EEEE, d MMMM yyyy");

  return (
    <div
      className="flex items-center justify-between px-6 py-3 border-b"
      style={{ background: 'white', borderColor: '#E8EAF0', minHeight: 60 }}
    >
      {/* Left: Page title */}
      <div>
        <h1 className="text-base font-bold" style={{ color: '#1B2B5E' }}>{title}</h1>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{subtitle}</p>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Date */}
        <span className="text-xs hidden md:block" style={{ color: '#9CA3AF' }}>{dateStr}</span>

        {/* Search */}
        <div className="relative hidden md:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
          <input
            type="text"
            placeholder={t('common.search')}
            className="sppt-input pl-8 text-xs"
            style={{ width: 200, padding: '6px 10px 6px 30px' }}
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors">
          <Bell size={18} style={{ color: '#6B7280' }} />
          <span
            className="absolute top-1 right-1 w-4 h-4 rounded-full text-white flex items-center justify-center"
            style={{ background: '#C62828', fontSize: 9, fontWeight: 700 }}
          >
            3
          </span>
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ background: '#1B2B5E' }}
          >
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="hidden md:block">
            <div className="text-xs font-semibold" style={{ color: '#1B2B5E' }}>{user?.name || 'Pengguna'}</div>
            <div className="text-xs" style={{ color: '#9CA3AF' }}>{user?.branch || 'HQ'}</div>
          </div>
          <ChevronDown size={14} style={{ color: '#9CA3AF' }} />
        </div>
      </div>
    </div>
  );
}
