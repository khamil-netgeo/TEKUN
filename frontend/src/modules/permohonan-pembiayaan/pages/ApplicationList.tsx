import { toast, ToastContainer } from '@/components/ui/Toast';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, Search, Eye, FileText, Clock } from 'lucide-react';
import { PageHeader, StatCard, DataTable, LoadingSpinner } from '@/components/ui';
import type { Column } from '@/components/ui';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ms } from 'date-fns/locale';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://34.177.95.116:8000';

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

const STATUS_LABELS_BM: Record<string, string> = {
  draft:        'Draf',
  submitted:    'Dihantar',
  under_review: 'Dalam Semakan',
  approved:     'Diluluskan',
  rejected:     'Ditolak',
  disbursed:    'Dicairkan',
};

export default function ApplicationList() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isBM = i18n.language === 'ms';
  const token = localStorage.getItem('token') || '';

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
      const res = await axios.get(`${API_BASE}/api/applications?${params}`, { headers: { Authorization: `Bearer ${token}` } });
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
      setError(msg || (isBM ? 'Gagal memuatkan data' : 'Failed to load data'));
    } finally {
      setLoading(false);
    }
  }, [token, page, search, statusFilter, isBM]);

  useEffect(() => { loadApplications(); }, [loadApplications]);

  const columns = [
    { key: 'ref_no', label: isBM ? 'No. Rujukan' : 'Reference No.', render: (row: any) => <span className="font-mono text-xs font-semibold text-[#1B2B5E]">{row.ref_no}</span> },
    { key: 'applicant_name', label: isBM ? 'Nama Pemohon' : 'Applicant' },
    { key: 'scheme', label: isBM ? 'Skim' : 'Scheme', render: (row: any) => <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{row.scheme}</span> },
    { key: 'amount_requested', label: isBM ? 'Jumlah (RM)' : 'Amount (RM)', render: (row: any) => <span className="font-semibold">RM {Number(row.amount_requested).toLocaleString()}</span> },
    { key: 'status', label: 'Status', render: (row: any) => <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[row.status] || 'bg-gray-100 text-gray-700'}`}>{isBM ? (STATUS_LABELS_BM[row.status] || row.status) : row.status}</span> },
    { key: 'created_at', label: isBM ? 'Tarikh Mohon' : 'Applied Date', render: (row: any) => row.created_at ? format(new Date(row.created_at), 'dd MMM yyyy', { locale: isBM ? ms : undefined }) : '-' },
    { key: 'id', label: isBM ? 'Tindakan' : 'Actions', render: (row: any) => (
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(`/permohonan/${row.id}`)} className="p-1.5 text-gray-500 hover:text-[#1B2B5E] hover:bg-blue-50 rounded" title={isBM ? 'Lihat' : 'View'}><Eye className="w-4 h-4" /></button>
        <button onClick={() => navigate(`/permohonan/${row.id}/dokumen`)} className="p-1.5 text-gray-500 hover:text-[#E65100] hover:bg-orange-50 rounded" title={isBM ? 'Dokumen' : 'Documents'}><FileText className="w-4 h-4" /></button>
        <button onClick={() => navigate(`/permohonan/${row.id}/timeline`)} className="p-1.5 text-gray-500 hover:text-[#2E7D32] hover:bg-green-50 rounded" title={isBM ? 'Penjejak' : 'Timeline'}><Clock className="w-4 h-4" /></button>
      </div>
    )},
  ];

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <PageHeader
        title={isBM ? 'Permohonan Pembiayaan' : 'Financing Applications'}
        subtitle={isBM ? 'Senarai semua permohonan' : 'All applications list'}
        breadcrumbs={[{ label: isBM ? 'Permohonan' : 'Applications' }]}
        action={
          <button onClick={() => navigate('/permohonan/baru')} className="flex items-center gap-2 px-4 py-2 bg-[#1B2B5E] text-white rounded-lg text-sm font-medium hover:bg-blue-900">
            <Plus className="w-4 h-4" />{isBM ? 'Permohonan Baharu' : 'New Application'}
          </button>
        }
      />
      <ToastContainer />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-4">
        <StatCard title={isBM ? 'Jumlah Permohonan' : 'Total Applications'} value={stats.total} icon={<FileText className="w-5 h-5" />} />
        <StatCard title={isBM ? 'Dalam Proses' : 'In Progress'} value={stats.pending} icon={<Clock className="w-5 h-5" />} />
        <StatCard title={isBM ? 'Diluluskan' : 'Approved'} value={stats.approved} icon={<FileText className="w-5 h-5" />} />
        <StatCard title={isBM ? 'Ditolak' : 'Rejected'} value={stats.rejected} icon={<FileText className="w-5 h-5" />} />
      </div>
      <div className="px-6 pb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder={isBM ? 'Cari nama, no. rujukan...' : 'Search name, reference...'} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1B2B5E] bg-white" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2B5E] bg-white">
          <option value="">{isBM ? 'Semua Status' : 'All Status'}</option>
          {Object.entries(STATUS_LABELS_BM).map(([val, label]) => <option key={val} value={val}>{isBM ? label : val}</option>)}
        </select>
        <button onClick={loadApplications} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" />{isBM ? 'Muat Semula' : 'Refresh'}
        </button>
      </div>
      <div className="px-6 pb-6">
        {loading ? <LoadingSpinner /> : <DataTable columns={columns as unknown as Column<Record<string, unknown>>[]} data={applications as unknown as Record<string, unknown>[]} emptyMessage={isBM ? 'Tiada permohonan ditemui' : 'No applications found'} pagination={{ page, perPage: 10, total: totalPages * 10, onPageChange: setPage }} />}
      </div>
    </div>
  );
}
