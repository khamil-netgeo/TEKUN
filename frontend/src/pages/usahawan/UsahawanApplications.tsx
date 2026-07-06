import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText, Plus, Search, ChevronRight, Clock, CheckCircle,
  XCircle, AlertCircle, RefreshCw, Eye
} from 'lucide-react';
import api from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Application {
  id: number;
  reference_no: string;
  scheme_type: string;
  amount_requested: number;
  status: string;
  status_label: string;
  submitted_at: string;
  updated_at: string;
  remarks?: string;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
    draft:        { bg: '#F3F4F6', text: '#6B7280', icon: Clock },
    submitted:    { bg: '#E3F2FD', text: '#1565C0', icon: Clock },
    under_review: { bg: '#FFF3E0', text: '#E65100', icon: RefreshCw },
    approved:     { bg: '#E8F5E9', text: '#2E7D32', icon: CheckCircle },
    rejected:     { bg: '#FFEBEE', text: '#C62828', icon: XCircle },
    disbursed:    { bg: '#E8F5E9', text: '#1B5E20', icon: CheckCircle },
  };
  const c = config[status] ?? config.draft;
  const Icon = c.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: c.bg, color: c.text }}>
      <Icon size={11} />
      {status === 'draft' ? 'Draf' :
       status === 'submitted' ? 'Dikemukakan' :
       status === 'under_review' ? 'Dalam Semakan' :
       status === 'approved' ? 'Diluluskan' :
       status === 'rejected' ? 'Ditolak' :
       status === 'disbursed' ? 'Dicairkan' : status}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UsahawanApplications() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const params: Record<string, string> = {};
        if (search) params.search = search;
        if (filterStatus) params.status = filterStatus;
        const res = await api.get('/usahawan/my-applications', { params });
        setApplications(res.data.data ?? res.data ?? []);
      } catch {
        // Demo fallback
        setApplications([
          {
            id: 1,
            reference_no: 'SPPT-2026-00001',
            scheme_type: 'Pembiayaan Mikro',
            amount_requested: 50000,
            status: 'under_review',
            status_label: 'Dalam Semakan',
            submitted_at: '2026-06-15T10:00:00Z',
            updated_at: '2026-07-01T14:30:00Z',
          },
          {
            id: 2,
            reference_no: 'SPPT-2025-00089',
            scheme_type: 'Pembiayaan Perniagaan',
            amount_requested: 30000,
            status: 'disbursed',
            status_label: 'Dicairkan',
            submitted_at: '2025-03-10T09:00:00Z',
            updated_at: '2025-04-01T11:00:00Z',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, [search, filterStatus]);

  const formatCurrency = (amount: number) =>
    `RM ${amount.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}`;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1B2B5E' }}>Permohonan Saya</h1>
          <p className="text-sm text-gray-500 mt-1">Semua permohonan pembiayaan anda</p>
        </div>
        <button
          onClick={() => navigate('/module1/new')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#1B2B5E' }}
        >
          <Plus size={16} />
          Permohonan Baru
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nombor rujukan atau skim..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
        >
          <option value="">Semua Status</option>
          <option value="draft">Draf</option>
          <option value="submitted">Dikemukakan</option>
          <option value="under_review">Dalam Semakan</option>
          <option value="approved">Diluluskan</option>
          <option value="rejected">Ditolak</option>
          <option value="disbursed">Dicairkan</option>
        </select>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 rounded-full border-4 animate-spin" style={{ borderColor: '#E8EAF0', borderTopColor: '#1B2B5E' }} />
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <FileText size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Tiada Permohonan</h3>
          <p className="text-sm text-gray-400 mb-6">Anda belum membuat sebarang permohonan pembiayaan.</p>
          <button
            onClick={() => navigate('/module1/new')}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: '#1B2B5E' }}
          >
            Mohon Sekarang
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EEF2FF' }}>
                    <FileText size={18} style={{ color: '#1B2B5E' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800">{app.reference_no}</span>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{app.scheme_type}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>Dikemukakan: {formatDate(app.submitted_at)}</span>
                      <span>Dikemaskini: {formatDate(app.updated_at)}</span>
                    </div>
                    {app.remarks && (
                      <div className="mt-2 p-2 rounded-lg text-xs text-gray-600" style={{ backgroundColor: '#FFF3E0' }}>
                        <AlertCircle size={11} className="inline mr-1" style={{ color: '#E65100' }} />
                        {app.remarks}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-lg font-bold" style={{ color: '#1B2B5E' }}>
                    {formatCurrency(app.amount_requested)}
                  </span>
                  <button
                    onClick={() => navigate(`/module1/timeline?id=${app.id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <Eye size={12} />
                    Lihat Status
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
