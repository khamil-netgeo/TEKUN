import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Users } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from '@/components/ui/Toast';
import branchService from '../services/branchService';
import type { StaffMember, Branch } from '../services/branchService';

type StaffRow = StaffMember & Record<string, unknown>;

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  branch_manager: { bg: '#E8EAF6', text: '#3949AB' },
  branch_officer: { bg: '#E3F2FD', text: '#1565C0' },
  credit_officer: { bg: '#E8F5E9', text: '#2E7D32' },
  executive: { bg: '#FFF3E0', text: '#E65100' },
  system_admin: { bg: '#FCE4EC', text: '#C62828' },
};

const ROLE_LABELS: Record<string, string> = {
  branch_manager: 'Pengurus Cawangan',
  branch_officer: 'Pegawai Cawangan',
  credit_officer: 'Pegawai Kredit',
  executive: 'Eksekutif',
  system_admin: 'Pentadbir Sistem',
};

const BranchStaff: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [branchInfo, setBranchInfo] = useState<Branch | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchStaff = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await branchService.getBranchStaff(Number(id)) as any;
      setStaff((res.staff ?? []) as StaffRow[]);
      setBranchInfo(res.branch ?? null);
      setTotal(res.total ?? 0);
    } catch { toast.error('Gagal memuatkan senarai kakitangan.'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const filtered = staff.filter(s => {
    const name = (s.name as string).toLowerCase();
    const email = (s.email as string).toLowerCase();
    const role = s.role as string;
    const roleLabel = (ROLE_LABELS[role] || (s.role_label as string) || role).toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || email.includes(q) || roleLabel.includes(q);
  });

  const columns: Column<StaffRow>[] = [
    {
      key: 'name',
      header: 'Nama',
      render: (row) => (
        <div>
          <div className="font-semibold text-[#1B2B5E]">{row.name as string}</div>
          <div className="text-xs text-gray-400">{row.email as string}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Jawatan',
      render: (row) => {
        const role = row.role as string;
        const colors = ROLE_COLORS[role] ?? { bg: '#F5F5F5', text: '#616161' };
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: colors.bg, color: colors.text }}>
            {ROLE_LABELS[role] || (row.role_label as string) || role}
          </span>
        );
      },
    },
    {
      key: 'branch_code',
      header: 'Kod Cawangan',
      render: (row) => <span className="font-mono text-xs text-gray-500">{row.branch_code as string}</span>,
    },
    {
      key: 'created_at',
      header: 'Tarikh Daftar',
      render: (row) => (
        <span className="text-sm text-gray-500">
          {new Date(row.created_at as string).toLocaleDateString('ms-MY', { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={branchInfo ? `Kakitangan \u2014 ${branchInfo.name}` : 'Kakitangan Cawangan'}
        subtitle={branchInfo ? `${branchInfo.code} \u00b7 ${branchInfo.state}` : ''}
        action={
          <div className="flex gap-2 items-center">
            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold text-white" style={{ background: '#1B2B5E' }}>
              <Users size={14} /> {total} kakitangan
            </span>
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm transition-colors">
              <ArrowLeft size={16} /> Kembali
            </button>
          </div>
        }
      />
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Cari nama, e-mel atau jawatan..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]/20" />
        </div>
      </div>
      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="Tiada kakitangan dijumpai." />
    </div>
  );
};

export default BranchStaff;