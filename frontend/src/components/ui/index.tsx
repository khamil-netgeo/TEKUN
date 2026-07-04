/**
 * Core Foundation: Shared Design System Components
 *
 * All 12 modules must import shared UI components from this file.
 * Theme colours: Navy #1B2B5E | Green #2E7D32 | Orange #E65100
 *
 * Components exported:
 *   StatCard       — KPI metric card with trend indicator
 *   PageHeader     — Consistent page title + breadcrumb + action button
 *   DataTable      — Sortable, filterable table with pagination
 *   LoadingSpinner — Full-page and inline loading states
 *   EmptyState     — Empty data placeholder with call-to-action
 *   Badge          — Status badge with semantic colours
 *   Modal          — Accessible modal dialog
 *   ConfirmDialog  — Confirmation dialog for destructive actions
 */

import React, { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight,
  ChevronUp, ChevronDown, X, AlertTriangle, Search, Loader2,
  InboxIcon,
} from 'lucide-react';

// ── Colour Tokens ─────────────────────────────────────────────────────────────
export const COLOURS = {
  navy:   '#1B2B5E',
  green:  '#2E7D32',
  orange: '#E65100',
  aiPurple: '#7C3AED',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────────────────────────────────────────

interface StatCardProps {
  title:       string;
  value:       string | number;
  subtitle?:   string;
  trend?:      number;        // percentage change, positive = up
  trendLabel?: string;
  icon?:       ReactNode;
  colour?:     'navy' | 'green' | 'orange' | 'purple';
  loading?:    boolean;
  onClick?:    () => void;
}

export function StatCard({
  title, value, subtitle, trend, trendLabel, icon,
  colour = 'navy', loading = false, onClick,
}: StatCardProps) {
  const colourMap = {
    navy:   { bg: '#1B2B5E', light: '#EEF1FA' },
    green:  { bg: '#2E7D32', light: '#E8F5E9' },
    orange: { bg: '#E65100', light: '#FFF3E0' },
    purple: { bg: '#7C3AED', light: '#F3E8FF' },
  };
  const c = colourMap[colour];

  const TrendIcon = trend === undefined ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColour = trend === undefined ? '' : trend > 0 ? '#2E7D32' : trend < 0 ? '#C62828' : '#757575';

  return (
    <div
      className={`bg-white rounded-xl p-5 shadow-sm border border-gray-100 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-200 rounded w-3/4" />
        </div>
      ) : (
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: c.bg }}>{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
            {trend !== undefined && TrendIcon && (
              <div className="flex items-center gap-1 mt-2">
                <TrendIcon size={13} style={{ color: trendColour }} />
                <span className="text-xs font-medium" style={{ color: trendColour }}>
                  {Math.abs(trend)}% {trendLabel}
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ background: c.light }}>
              <span style={{ color: c.bg }}>{icon}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PageHeader
// ─────────────────────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title:       string;
  subtitle?:   string;
  breadcrumbs?: { label: string; href?: string }[];
  action?:     ReactNode;
  icon?:       ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs, action, icon }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mt-0.5" style={{ background: '#EEF1FA' }}>
            <span style={{ color: COLOURS.navy }}>{icon}</span>
          </div>
        )}
        <div>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1 mb-1">
              {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-gray-300 text-xs">/</span>}
                  {crumb.href ? (
                    <a href={crumb.href} className="text-xs text-gray-400 hover:text-gray-600">{crumb.label}</a>
                  ) : (
                    <span className="text-xs text-gray-400">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
          <h1 className="text-xl font-bold" style={{ color: COLOURS.navy }}>{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Badge
// ─────────────────────────────────────────────────────────────────────────────

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'navy' | 'purple';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?:    'sm' | 'md';
  dot?:     boolean;
}

export function Badge({ children, variant = 'neutral', size = 'md', dot = false }: BadgeProps) {
  const styles: Record<BadgeVariant, string> = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-orange-100 text-orange-800',
    danger:  'bg-red-100 text-red-800',
    info:    'bg-blue-100 text-blue-800',
    neutral: 'bg-gray-100 text-gray-700',
    navy:    'bg-[#EEF1FA] text-[#1B2B5E]',
    purple:  'bg-purple-100 text-purple-800',
  };
  const dotColours: Record<BadgeVariant, string> = {
    success: 'bg-green-500', warning: 'bg-orange-500', danger: 'bg-red-500',
    info: 'bg-blue-500', neutral: 'bg-gray-400', navy: 'bg-[#1B2B5E]', purple: 'bg-purple-500',
  };
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full ${styles[variant]} ${sizeClass}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColours[variant]}`} />}
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DataTable
// ─────────────────────────────────────────────────────────────────────────────

export interface Column<T> {
  key:       keyof T | string;
  header:    string;
  render?:   (row: T) => ReactNode;
  sortable?: boolean;
  width?:    string;
}

interface DataTableProps<T extends { id?: number | string }> {
  columns:      Column<T>[];
  data:         T[];
  loading?:     boolean;
  emptyMessage?: string;
  searchable?:  boolean;
  searchPlaceholder?: string;
  pagination?:  { page: number; perPage: number; total: number; onPageChange: (p: number) => void };
  onRowClick?:  (row: T) => void;
  rowKey?:      (row: T, i: number) => string | number;
}

export function DataTable<T extends { id?: number | string }>({
  columns, data, loading = false, emptyMessage = 'Tiada data untuk dipaparkan.',
  searchable = false, searchPlaceholder = 'Cari...', pagination, onRowClick, rowKey,
}: DataTableProps<T>) {
  const [search, setSearch]       = useState('');
  const [sortKey, setSortKey]     = useState<string | null>(null);
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = searchable && search
    ? data.filter(row =>
        Object.values(row as object).some(v =>
          String(v ?? '').toLowerCase().includes(search.toLowerCase())
        )
      )
    : data;

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const av = String((a as any)[sortKey] ?? '');
        const bv = String((b as any)[sortKey] ?? '');
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      })
    : filtered;

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.perPage) : 1;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {searchable && (
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]/20 focus:border-[#1B2B5E]"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {columns.map(col => (
                <th
                  key={String(col.key)}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide ${col.sortable ? 'cursor-pointer hover:text-gray-700 select-none' : ''}`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === String(col.key) && (
                      sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <EmptyState message={emptyMessage} />
                </td>
              </tr>
            ) : (
              sorted.map((row, i) => (
                <tr
                  key={rowKey ? rowKey(row, i) : row.id ?? i}
                  className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map(col => (
                    <td key={String(col.key)} className="px-4 py-3 text-gray-700">
                      {col.render ? col.render(row) : String((row as any)[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Menunjukkan {((pagination.page - 1) * pagination.perPage) + 1}–{Math.min(pagination.page * pagination.perPage, pagination.total)} daripada {pagination.total} rekod
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = pagination.page <= 3 ? i + 1 : pagination.page - 2 + i;
              if (p < 1 || p > totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => pagination.onPageChange(p)}
                  className={`w-7 h-7 text-xs rounded font-medium ${p === pagination.page ? 'text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                  style={p === pagination.page ? { background: COLOURS.navy } : {}}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LoadingSpinner
// ─────────────────────────────────────────────────────────────────────────────

interface LoadingSpinnerProps {
  fullPage?: boolean;
  size?:     'sm' | 'md' | 'lg';
  label?:    string;
}

export function LoadingSpinner({ fullPage = false, size = 'md', label = 'Memuatkan...' }: LoadingSpinnerProps) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizeMap[size]} border-4 border-t-transparent rounded-full animate-spin`} style={{ borderColor: `${COLOURS.navy} transparent transparent transparent` }} />
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-12">{spinner}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  message?:  string;
  icon?:     ReactNode;
  action?:   ReactNode;
}

export function EmptyState({ message = 'Tiada data.', icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-gray-400">
      {icon ?? <InboxIcon size={40} className="text-gray-200" />}
      <p className="text-sm">{message}</p>
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────────────────────────────────────

interface ModalProps {
  open:       boolean;
  onClose:    () => void;
  title:      string;
  children:   ReactNode;
  footer?:    ReactNode;
  size?:      'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const sizeMap = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizeMap[size]} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold" style={{ color: COLOURS.navy }}>{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ConfirmDialog
// ─────────────────────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open:       boolean;
  onClose:    () => void;
  onConfirm:  () => void;
  title:      string;
  message:    string;
  confirmLabel?: string;
  cancelLabel?:  string;
  variant?:   'danger' | 'warning' | 'info';
  loading?:   boolean;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Sahkan', cancelLabel = 'Batal',
  variant = 'danger', loading = false,
}: ConfirmDialogProps) {
  const variantMap = {
    danger:  { icon: <AlertTriangle size={20} className="text-red-500" />, btnClass: 'bg-red-600 hover:bg-red-700 text-white' },
    warning: { icon: <AlertTriangle size={20} className="text-orange-500" />, btnClass: 'bg-orange-600 hover:bg-orange-700 text-white' },
    info:    { icon: <AlertTriangle size={20} className="text-blue-500" />, btnClass: 'bg-[#1B2B5E] hover:bg-[#152248] text-white' },
  };
  const v = variantMap[variant];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">{v.icon}</div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} disabled={loading} className={`px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 flex items-center gap-2 ${v.btnClass}`}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
