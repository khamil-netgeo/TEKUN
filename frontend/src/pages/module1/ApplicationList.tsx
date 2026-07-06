import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Download, Eye, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { getApplications, formatAmount, formatDate } from '@/services/applicationService';
import { STATUS_CONFIG, SCHEME_CONFIG } from '@/types/application';
import type { Application, ApplicationStatus, ApplicationListParams } from '@/types/application';

/**
 * TEKUN SPPT — ApplicationList (Module 1)
 * Fully integrated with real backend API.
 * RBAC-scoped: each role sees only their permitted data.
 */
export default function ApplicationList() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [schemeFilter, setSchemeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage]   = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [total, setTotal]               = useState(0);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: ApplicationListParams = {
        page: currentPage,
        per_page: 15,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter as ApplicationStatus : undefined,
        scheme: schemeFilter !== 'all' ? schemeFilter as any : undefined,
      };
      const res = await getApplications(params);
      setApplications(Array.isArray(res.data) ? res.data : []);
      setTotal(res.total ?? 0);
      setTotalPages(res.last_page ?? 1);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Ralat memuat senarai permohonan.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter, schemeFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchApplications, 300);
    return () => clearTimeout(timer);
  }, [fetchApplications]);

  const submitted = (applications ?? []).filter(a => a.status === 'submitted').length;
  const approved  = (applications ?? []).filter(a => a.status === 'approved').length;
  const rejected  = (applications ?? []).filter(a => a.status === 'rejected').length;

  const statCards = [
    { label: 'Jumlah Permohonan', value: total,     color: '#1B2B5E' },
    { label: 'Dalam Semakan',     value: submitted,  color: '#E65100' },
    { label: 'Diluluskan',        value: approved,   color: '#2E7D32' },
    { label: 'Ditolak',           value: rejected,   color: '#C62828' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1B2B5E', fontFamily: 'Inter, sans-serif' }}>
            Senarai Permohonan Pembiayaan
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
            Semua permohonan mengikut skop akses anda
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchApplications}
            className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
            style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Muat Semula
          </button>
          <button
            onClick={() => navigate('/module1/new')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#1B2B5E' }}
          >
            <Plus size={14} /> Permohonan Baharu
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
          <AlertCircle size={18} style={{ color: '#DC2626' }} />
          <p className="text-sm font-medium" style={{ color: '#DC2626' }}>{error}</p>
          <button onClick={fetchApplications} className="ml-auto text-xs underline" style={{ color: '#DC2626' }}>
            Cuba Semula
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map(c => (
          <div key={c.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs" style={{ color: '#9CA3AF' }}>{c.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: c.color }}>
              {loading ? '—' : c.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
          <input
            className="w-full pl-8 pr-3 py-2 text-xs border rounded-lg outline-none"
            style={{ borderColor: '#E5E7EB' }}
            placeholder="Cari nama pemohon, no. rujukan, atau no. K/P..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <select
          className="text-xs border rounded-lg px-3 py-2"
          style={{ borderColor: '#E5E7EB' }}
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
        >
          <option value="all">Semua Status</option>
          {(Object.keys(STATUS_CONFIG) as ApplicationStatus[]).map(k => (
            <option key={k} value={k}>{STATUS_CONFIG[k].label}</option>
          ))}
        </select>
        <select
          className="text-xs border rounded-lg px-3 py-2"
          style={{ borderColor: '#E5E7EB' }}
          value={schemeFilter}
          onChange={e => { setSchemeFilter(e.target.value); setCurrentPage(1); }}
        >
          <option value="all">Semua Skim</option>
          {(Object.keys(SCHEME_CONFIG) as Array<keyof typeof SCHEME_CONFIG>).map(k => (
            <option key={k} value={k}>{SCHEME_CONFIG[k].label}</option>
          ))}
        </select>
        <button className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg border" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
          <Download size={12} /> Eksport
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              {['No. Rujukan', 'Nama Pemohon', 'No. K/P', 'Skim', 'Jumlah', 'Status', 'Tarikh Hantar', 'Tindakan'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: '#6B7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center" style={{ color: '#9CA3AF' }}>
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Memuat data...</span>
                  </div>
                </td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center" style={{ color: '#9CA3AF' }}>
                  Tiada permohonan ditemui.
                </td>
              </tr>
            ) : (
              (applications ?? []).map(app => {
                const statusCfg = STATUS_CONFIG[app.status] ?? { label: app.status, bg: '#F3F4F6', text: '#6B7280' };
                const schemeCfg = SCHEME_CONFIG[app.scheme];
                return (
                  <tr key={app.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold" style={{ color: '#1B2B5E' }}>{app.ref_no}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: '#111827' }}>{app.full_name}</td>
                    <td className="px-4 py-3" style={{ color: '#6B7280' }}>{app.ic_no}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold text-white"
                        style={{ background: schemeCfg?.color ?? '#1B2B5E' }}>
                        {app.scheme_label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: '#111827' }}>
                      {formatAmount(app.amount_requested)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: statusCfg.bg, color: statusCfg.text }}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{formatDate(app.submitted_at)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/module1/application/${app.id}`)}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded border font-medium hover:bg-gray-50"
                        style={{ color: '#1B2B5E', borderColor: '#1B2B5E' }}
                      >
                        <Eye size={11} /> Lihat
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs" style={{ color: '#9CA3AF' }}>
          <span>Menunjukkan {applications.length} daripada {total.toLocaleString()} rekod</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="px-2 py-1 rounded border disabled:opacity-40" style={{ borderColor: '#E5E7EB' }}>‹</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)}
                className="px-2 py-1 rounded text-xs"
                style={currentPage === page
                  ? { background: '#1B2B5E', color: '#fff' }
                  : { border: '1px solid #E5E7EB', color: '#6B7280' }}>
                {page}
              </button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="px-2 py-1 rounded border disabled:opacity-40" style={{ borderColor: '#E5E7EB' }}>›</button>
          </div>
        </div>
      </div>
    </div>
  );
}
