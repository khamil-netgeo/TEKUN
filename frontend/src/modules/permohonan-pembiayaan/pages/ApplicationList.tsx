import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, Search, Eye, FileText, Clock } from 'lucide-react';
import { PageHeader, StatCard, DataTable, LoadingSpinner, Toast } from '@/components/ui';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ms } from 'date-fns/locale';
import api from '@/services/api';

interface Application {
  id: number;
  ref_no: string;
  applicant_name: string;
  scheme: string;
  amount_requested: number;
  status: string;
  created_at: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

const STATUS_COLORS: Record<string, string> = {
  draft:        'bg-gray-100 text-gray-700',
  submitted:    'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  approved:     'bg-green-100 text-green-700',
  rejected:     'bg-red-100 text-red-700',
  disbursed:    'bg-purple-100 text-purple-700',
};

const STATUSES = [
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'disbursed',
];

export default function ApplicationList() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isBM = i18n.language === 'ms';

  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: '15', ...(search && { search }), ...(statusFilter && { status: statusFilter }) });
      const res = await api.get(`/api/applications?${params}`);
      const data = res.data?.data || res.data?.applications || [];
      const meta = res.data?.meta || res.data?.pagination || {};
      setApplications(Array.isArray(data) ? data : []);
      setTotalPages(meta.last_page || meta.total_pages || 1);
      const all = Array.isArray(data) ? data : [];
      setStats({
        total:    meta.total || all.length,
        pending:  all.filter((a: Application) => ['submitted', 'under_review'].includes(a.status)).length,
        approved: all.filter((a: Application) => a.status === 'approved').length,
        rejected: all.filter((a: Application) => a.status === 'rejected').length,
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || t('applicationList.errorLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, t]);

  useEffect(() => { loadApplications(); }, [loadApplications]);

  const columns = [
    { key: 'ref_no', label: t('applicationList.refNo'), render: (val: string) => <span className="font-mono text-xs font-semibold text-[#1B2B5E]">{val}</span> },
    { key: 'applicant_name', label: t('applicationList.applicantName') },
    { key: 'scheme', label: t('applicationList.scheme'), render: (val: string) => <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{val}</span> },
    { key: 'amount_requested', label: t('applicationList.amount'), render: (val: number) => <span className="font-semibold">RM {Number(val).toLocaleString()}</span> },
    { key: 'status', label: t('applicationList.statusLabel'), render: (val: string) => <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[val] || 'bg-gray-100 text-gray-700'}`}>{t(`applicationList.status.${val}`)}</span> },
    { key: 'created_at', label: t('applicationList.appliedDate'), render: (val: string) => val ? format(new Date(val), 'dd MMM yyyy', { locale: isBM ? ms : undefined }) : '-' },
    { key: 'id', label: t('applicationList.actions'), render: (val: number) => (
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(`/permohonan/${val}`)} className="p-1.5 text-gray-500 hover:text-[#1B2B5E] hover:bg-blue-50 rounded" title={t('applicationList.view')}><Eye className="w-4 h-4" /></button>
        <button onClick={() => navigate(`/permohonan/${val}/dokumen`)} className="p-1.5 text-gray-500 hover:text-[#E65100] hover:bg-orange-50 rounded" title={t('applicationList.documents')}><FileText className="w-4 h-4" /></button>
        <button onClick={() => navigate(`/permohonan/${val}/timeline`)} className="p-1.5 text-gray-500 hover:text-[#2E7D32] hover:bg-green-50 rounded" title={t('applicationList.timeline')}><Clock className="w-4 h-4" /></button>
      </div>
    )},
  ];

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <PageHeader
        title={t('applicationList.title')}
        subtitle={t('applicationList.subtitle')}
        breadcrumbs={[{ label: t('applicationList.breadcrumb') }]}
        action={
          <button onClick={() => navigate('/permohonan/baru')} className="flex items-center gap-2 px-4 py-2 bg-[#1B2B5E] text-white rounded-lg text-sm font-medium hover:bg-blue-900">
            <Plus className="w-4 h-4" />{t('applicationList.newApp')}
          </button>
        }
      />
      {error && <Toast type="error" message={error} onClose={() => setError(null)} />}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-4">
        <StatCard title={t('applicationList.totalApps')} value={stats.total} icon={<FileText className="w-5 h-5" />} color="navy" />
        <StatCard title={t('applicationList.inProgress')} value={stats.pending} icon={<Clock className="w-5 h-5" />} color="orange" />
        <StatCard title={t('applicationList.approved')} value={stats.approved} icon={<FileText className="w-5 h-5" />} color="green" />
        <StatCard title={t('applicationList.rejected')} value={stats.rejected} icon={<FileText className="w-5 h-5" />} color="red" />
      </div>
      <div className="px-6 pb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder={t('applicationList.searchPlaceholder')} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1B2B5E] bg-white" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2B5E] bg-white">
          <option value="">{t('applicationList.allStatus')}</option>
          {STATUSES.map(val => <option key={val} value={val}>{t(`applicationList.status.${val}`)}</option>)}
        </select>
        <button onClick={loadApplications} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" />{t('applicationList.refresh')}
        </button>
      </div>
      <div className="px-6 pb-6">
        {loading ? <LoadingSpinner /> : <DataTable columns={columns} data={applications} emptyMessage={t('applicationList.emptyMessage')} page={page} totalPages={totalPages} onPageChange={setPage} />}
      </div>
    </div>
  );
}