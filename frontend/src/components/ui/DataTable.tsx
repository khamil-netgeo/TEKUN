/**
 * Core Foundation — DataTable
 * Generic sortable/filterable table with pagination.
 * Used for listing records across all 12 modules.
 */
import React, { useState, type ReactNode } from 'react';
import {
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search, Inbox,
} from 'lucide-react';

export interface Column<T> {
  key:       keyof T | string;
  header:    string;
  render?:   (row: T, index: number) => ReactNode;
  sortable?: boolean;
  width?:    string;
  align?:    'left' | 'center' | 'right';
}

export interface PaginationProps {
  page:         number;
  perPage:      number;
  total:        number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns:            Column<T>[];
  data:               T[];
  loading?:           boolean;
  emptyMessage?:      string;
  searchable?:        boolean;
  searchPlaceholder?: string;
  pagination?:        PaginationProps;
  onRowClick?:        (row: T) => void;
  rowKey?:            (row: T, index: number) => string | number;
  striped?:           boolean;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'Tiada data untuk dipaparkan.',
  searchable = false,
  searchPlaceholder = 'Cari...',
  pagination,
  onRowClick,
  rowKey,
  striped = false,
}: DataTableProps<T>) {
  const [search, setSearch]   = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered =
    searchable && search.trim()
      ? data.filter(row =>
          Object.values(row).some(v =>
            String(v ?? '').toLowerCase().includes(search.toLowerCase()),
          ),
        )
      : data;

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const av = String(a[sortKey] ?? '');
        const bv = String(b[sortKey] ?? '');
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      })
    : filtered;

  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.perPage)
    : 1;

  const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Search bar */}
      {searchable && (
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]/20 focus:border-[#1B2B5E]"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {columns.map(col => (
                <th
                  key={String(col.key)}
                  className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide
                    ${alignClass[col.align ?? 'left']}
                    ${col.sortable ? 'cursor-pointer select-none hover:text-gray-700' : ''}`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === String(col.key) && (
                      sortDir === 'asc'
                        ? <ChevronUp size={12} />
                        : <ChevronDown size={12} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div
                        className="h-4 bg-gray-100 rounded animate-pulse"
                        style={{ width: `${50 + Math.random() * 40}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <Inbox size={40} className="text-gray-200" />
                    <p className="text-sm">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              sorted.map((row, i) => (
                <tr
                  key={rowKey ? rowKey(row, i) : (row.id as string | number) ?? i}
                  className={`transition-colors
                    ${onRowClick ? 'cursor-pointer' : ''}
                    ${striped && i % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}
                    hover:bg-blue-50/30`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map(col => (
                    <td
                      key={String(col.key)}
                      className={`px-4 py-3 text-gray-700 ${alignClass[col.align ?? 'left']}`}
                    >
                      {col.render
                        ? col.render(row, i)
                        : String(row[col.key as string] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Menunjukkan{' '}
            <strong>{(pagination.page - 1) * pagination.perPage + 1}</strong>–
            <strong>
              {Math.min(pagination.page * pagination.perPage, pagination.total)}
            </strong>{' '}
            daripada <strong>{pagination.total}</strong> rekod
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Halaman sebelum"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p =
                pagination.page <= 3
                  ? i + 1
                  : Math.min(pagination.page - 2 + i, totalPages - 4 + i);
              if (p < 1 || p > totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => pagination.onPageChange(p)}
                  className={`w-7 h-7 text-xs rounded font-medium transition-colors ${
                    p === pagination.page
                      ? 'text-white'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  style={p === pagination.page ? { background: '#1B2B5E' } : {}}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Halaman seterusnya"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
