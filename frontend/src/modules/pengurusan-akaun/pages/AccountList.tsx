/**
 * M4 — AccountList.tsx
 * Senarai semua akaun pembiayaan dengan carian, penapis, dan KPI cards.
 * Data diambil dari API Laravel → PostgreSQL (tiada hardcoded data).
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CreditCard, TrendingDown, AlertTriangle, CheckCircle, Search, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ToastContainer } from '@/components/ui/Toast';
import api from '@/services/api';

interface AccountRow extends Record<string, unknown> {
  id: number;
  account_no: string;
  applicant_name: string;
  scheme: string;
  financing_amount: number;
  outstanding_balance: number;
  monthly_installment: number;
  next_due_date: string | null;
  arrears_days: number;
  arrears_amount: number;
  classification: string;
}

interface AccountListMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

interface AccountListResponse {
  success: boolean;
  data: AccountRow[];
  meta: AccountListMeta;
}

interface KpiData {
  total: number;
  lancar: number;
  npl: number;
  total_outstanding: number;
}

const CLASSIFICATION_COLOURS: Record<string, string> = {
  lancar:   'bg-green-100 text-green-800',
  mampan:   'bg-yellow-100 text-yellow-800',
  substandard: 'bg-orange-100 text-orange-800',
  ragu:     'bg-red-100 text-red-800',
  rugi:     'bg-red-200 text-red-900',
};

export default function AccountList() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [accounts, setAccounts]   = useState<AccountRow[]>([]);
  const [meta,     setMeta]       = useState<AccountListMeta>({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
  const [kpi,      setKpi]        = useState<KpiData | null>(null);
  const [loading,  setLoading]    = useState(true);
  const [search,   setSearch]     = useState('');
  const [filter,   setFilter]     = useState('');
  const [page,     setPage]       = useState(1);

  const fetchAccounts = useCallback(() => {
    setLoading(true);
    const params: Record<string, string | number> = { page, per_page: 15 };
    if (search)  params.search = search;
    if (filter)  params.classification = filter;

    api.get<AccountListResponse>('/accounts', { params })
      .then(r => {
        const body = r.data;
        setAccounts(body.data ?? []);
        if (body.meta) setMeta(body.meta);

        // Compute KPI from returned data
        const rows: AccountRow[] = body.data ?? [];
        const nplClasses = ['substandard', 'ragu', 'rugi'];
        setKpi({
          total:             body.meta?.total ?? rows.length,
          lancar:            rows.filter(a => a.classification === 'lancar').length,
          npl:               rows.filter(a => nplClasses.includes(a.classification)).length,
          total_outstanding: rows.reduce((s, a) => s + Number(a.outstanding_balance), 0),
        });
      })
      .catch(() => {
        setAccounts([]);
      })
      .finally(() => setLoading(false));
  }, [page, search, filter]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const columns: Column<AccountRow>[] = [
    {
      key: 'account_no',
      header: t('account.account_no', 'No. Akaun'),
      render: row => (
        <span className="font-mono text-sm font-semibold text-[#1B2B5E]">
          {row.account_no}
        </span>
      ),
    },
    {
      key: 'applicant_name',
      header: t('account.applicant', 'Pemohon'),
      render: row => (
        <span className="font-medium text-gray-900">{row.applicant_name}</span>
      ),
    },
    {
      key: 'scheme',
      header: t('account.scheme', 'Skim'),
      render: row => (
        <span className="text-sm text-gray-600">{row.scheme ?? '—'}</span>
      ),
    },
    {
      key: 'financing_amount',
      header: t('account.financing_amount', 'Jumlah Pembiayaan'),
      align: 'right',
      render: row => (
        <span className="text-sm font-medium">
          RM {Number(row.financing_amount).toLocaleString('ms-MY', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'outstanding_balance',
      header: t('account.outstanding', 'Baki Tertunggak'),
      align: 'right',
      render: row => (
        <span className="text-sm font-medium text-[#E65100]">
          RM {Number(row.outstanding_balance).toLocaleString('ms-MY', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'arrears_days',
      header: t('account.arrears_days', 'Hari Tunggakan'),
      align: 'center',
      render: row => (
        <span className={`text-sm font-semibold ${Number(row.arrears_days) > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {row.arrears_days} {t('common.days', 'hari')}
        </span>
      ),
    },
    {
      key: 'classification',
      header: t('account.classification', 'Klasifikasi'),
      align: 'center',
      render: row => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${CLASSIFICATION_COLOURS[row.classification] ?? 'bg-gray-100 text-gray-700'}`}>
          {row.classification}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />
      <PageHeader
        title={t('account.list_title', 'Pengurusan Akaun')}
        subtitle={t('account.list_subtitle', 'Senarai semua akaun pembiayaan aktif')}
        breadcrumbs={[
          { label: t('nav.home', 'Utama'), href: '/dashboard' },
          { label: t('nav.accounts', 'Akaun') },
        ]}
        action={
          <button
            onClick={fetchAccounts}
            className="flex items-center gap-2 px-4 py-2 bg-[#1B2B5E] text-white rounded-lg text-sm hover:bg-[#162347] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {t('common.refresh', 'Muat Semula')}
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title={t('account.kpi_total', 'Jumlah Akaun')}
            value={kpi?.total ?? '—'}
            icon={<CreditCard className="w-5 h-5" />}
            colour="navy"
            loading={loading && !kpi}
          />
          <StatCard
            title={t('account.kpi_lancar', 'Akaun Lancar')}
            value={kpi?.lancar ?? '—'}
            icon={<CheckCircle className="w-5 h-5" />}
            colour="green"
            loading={loading && !kpi}
          />
          <StatCard
            title={t('account.kpi_npl', 'Akaun NPL')}
            value={kpi?.npl ?? '—'}
            icon={<AlertTriangle className="w-5 h-5" />}
            colour="orange"
            loading={loading && !kpi}
          />
          <StatCard
            title={t('account.kpi_outstanding', 'Jumlah Tertunggak')}
            value={kpi ? `RM ${(kpi.total_outstanding / 1000).toFixed(1)}K` : '—'}
            icon={<TrendingDown className="w-5 h-5" />}
            colour="orange"
            loading={loading && !kpi}
          />
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('account.search_placeholder', 'Cari no. akaun atau nama pemohon...')}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]/20"
            />
          </div>
          <select
            value={filter}
            onChange={e => { setFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]/20 bg-white"
          >
            <option value="">{t('account.all_classifications', 'Semua Klasifikasi')}</option>
            <option value="lancar">Lancar</option>
            <option value="mampan">Mampan</option>
            <option value="substandard">Substandard</option>
            <option value="ragu">Ragu</option>
            <option value="rugi">Rugi</option>
          </select>
        </div>

        {/* Data Table */}
        {loading && accounts.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={accounts}
            loading={loading}
            emptyMessage={t('account.no_accounts', 'Tiada akaun ditemui')}
            onRowClick={row => navigate(`/akaun/${row.id}`)}
            rowKey={(row) => row.id}
            pagination={{
              page: meta.current_page,
              perPage: meta.per_page,
              total: meta.total,
              onPageChange: (p) => setPage(p),
            }}
          />
        )}
      </div>
    </div>
  );
}
