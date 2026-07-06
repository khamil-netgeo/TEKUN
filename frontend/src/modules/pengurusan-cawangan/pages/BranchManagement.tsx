import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, Users, TrendingUp, AlertTriangle, Eye, RefreshCw, Search } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from '@/components/ui/Toast';
import branchService from '../services/branchService';
import type { Branch } from '../services/branchService';
import api from '@/services/api';

type BranchRow = Branch & Record<string, unknown>;

const BranchManagement: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [summary, setSummary] = useState({ total_branches: 0, total_staff: 0, avg_collection_rate: 0, avg_npl_ratio: 0 });
  const [meta, setMeta] = useState({ total: 0, per_page: 20, current_page: 1, last_page: 1 });
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [malaysianStates, setMalaysianStates] = useState<string[]>([]);

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await branchService.getBranches({ search: search || undefined, state: stateFilter || undefined, page, per_page: 20 });
      setBranches(res.data as BranchRow[]);
      setSummary(res.summary);
      setMeta(res.meta);
    } catch { toast.error(t('branch.management.error_loading')); }
    finally { setLoading(false); }
  }, [search, stateFilter, page, t]);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await api.get('/states');
        const data = response.data?.data || response.data;
        if (Array.isArray(data)) {
          setMalaysianStates(data.map((item: any) => typeof item === 'string' ? item : item.name));
        } else {
          throw new Error('Invalid format');
        }
      } catch (error) {
        setMalaysianStates(['Johor','Kedah','Kelantan','Melaka','Negeri Sembilan','Pahang','Perak','Perlis','Pulau Pinang','Sabah','Sarawak','Selangor','Terengganu','WP Kuala Lumpur','WP Labuan','WP Putrajaya']);
      }
    };
    fetchStates();
  }, []);

  const columns: Column<BranchRow>[] = [
    { key: 'performance_rank', header: '#', render: (row) => <span className="font-bold text-[#1B2B5E]">{(row.performance_rank as number | null) ?? '\u2014'}</span> },
    { key: 'name', header: t('branch.management.branch_name'), render: (row) => (<div><div className="font-semibold text-[#1B2B5E]">{row.name as string}</div><div className="text-xs text-gray-500">{row.code as string} \u00b7 {row.district as string}, {row.state as string}</div></div>) },
    { key: 'staff_count', header: t('branch.management.staff'), render: (row) => (<span className="inline-flex items-center gap-1"><Users size={14} className="text-gray-400" />{(row.staff_count as number) ?? 0}</span>) },
    { key: 'collection_rate', header: t('branch.management.collection_rate'), render: (row) => { const r = Number(row.collection_rate ?? 0); return <span className="font-semibold" style={{ color: r >= 95 ? '#2E7D32' : r >= 85 ? '#E65100' : '#C62828' }}>{r.toFixed(1)}%</span>; } },
    { key: 'npl_ratio', header: t('branch.management.npl_ratio'), render: (row) => { const n = Number(row.npl_ratio ?? 0); return <span className="font-semibold" style={{ color: n <= 3 ? '#2E7D32' : n <= 6 ? '#E65100' : '#C62828' }}>{n.toFixed(1)}%</span>; } },
    { key: 'is_active', header: t('branch.management.status'), render: (row) => (<span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: row.is_active ? '#E8F5E9' : '#FFEBEE', color: row.is_active ? '#2E7D32' : '#C62828' }}>{row.is_active ? t('branch.management.active') : t('branch.management.inactive')}</span>) },
    { key: 'actions', header: t('branch.management.actions'), render: (row) => (<div className="flex gap-2"><button onClick={(e) => { e.stopPropagation(); navigate(`/pengurusan-cawangan/${row.id as number}`); }} className="p-1.5 rounded hover:bg-blue-50 text-[#1B2B5E]" title={t('branch.management.view_details')}><Eye size={16} /></button><button onClick={(e) => { e.stopPropagation(); navigate(`/pengurusan-cawangan/${row.id as number}/staf`); }} className="p-1.5 rounded hover:bg-green-50 text-[#2E7D32]" title={t('branch.management.view_staff')}><Users size={16} /></button></div>) },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t('branch.management.title')}
        subtitle={t('branch.management.subtitle')}
        action={
          <div className="flex gap-2">
            <button onClick={() => navigate('/pengurusan-cawangan/prestasi')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#1B2B5E' }}>
              <TrendingUp size={16} /> {t('branch.management.performance_leaderboard')}
            </button>
            <button onClick={fetchBranches} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50" title={t('branch.management.refresh')}>
              <RefreshCw size={16} className="text-gray-500" />
            </button>
          </div>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('branch.management.total_branches')} value={summary.total_branches} icon={<Building2 size={20} />} colour="navy" />
        <StatCard title={t('branch.management.total_active_staff')} value={summary.total_staff} icon={<Users size={20} />} colour="green" />
        <StatCard title={t('branch.management.avg_collection_rate')} value={`${Number(summary.avg_collection_rate).toFixed(1)}%`} icon={<TrendingUp size={20} />} colour="green" />
        <StatCard title={t('branch.management.avg_npl_ratio')} value={`${Number(summary.avg_npl_ratio).toFixed(1)}%`} icon={<AlertTriangle size={20} />} colour="orange" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder={t('branch.management.search_placeholder')} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]/20" />
        </div>
        <select value={stateFilter} onChange={e => { setStateFilter(e.target.value); setPage(1); }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value="">{t('branch.management.all_states')}</option>
          {malaysianStates.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <DataTable columns={columns} data={branches} loading={loading} emptyMessage={t('branch.management.no_branches_found')} pagination={{ page: meta.current_page, perPage: meta.per_page, total: meta.total, onPageChange: setPage }} onRowClick={(row) => navigate(`/pengurusan-cawangan/${row.id as number}`)} />
    </div>
  );
};

export default BranchManagement;