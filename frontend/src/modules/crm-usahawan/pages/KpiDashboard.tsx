/**
 * Module 7 — CRM & Pemantauan Usahawan
 * KpiDashboard — Senarai usahawan dengan skor kesihatan SPPT AI, KPI, dan carian
 * Komponen wajib: PageHeader, StatCard, DataTable, AiBadge, LoadingSpinner, Toast
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Activity, AlertTriangle, TrendingUp,
  Search, Filter, Eye,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  PageHeader,
  StatCard,
  DataTable,
  LoadingSpinner,
  toast,
  ToastContainer,
  type Column,
  type PaginationProps,
} from '@/components/ui';
import { AiBadge, AiScoreRing } from '@/components/ai';
import {
  getEntrepreneurs,
  type EntrepreneurFilters,
} from '../services/entrepreneurService';
import type { Entrepreneur } from '../types';

// ── Colour helpers ────────────────────────────────────────────────────────────
const DISTRESS_CLASS: Record<string, string> = {
  Rendah:    'bg-green-100 text-green-800',
  Sederhana: 'bg-yellow-100 text-yellow-800',
  Tinggi:    'bg-orange-100 text-orange-800',
  Kritikal:  'bg-red-100 text-red-800',
};
const STATUS_CLASS: Record<string, string> = {
  Lancar:             'bg-green-100 text-green-800',
  'Perhatian Khusus': 'bg-yellow-100 text-yellow-800',
  'Tidak Lancar':     'bg-orange-100 text-orange-800',
  NPL:                'bg-red-100 text-red-800',
};
const PIE_COLORS = ['#2E7D32', '#E65100', '#C62828', '#9CA3AF'];

export default function KpiDashboard() {
  const navigate = useNavigate();

  // ── State ─────────────────────────────────────────────────────────────────
  const [entrepreneurs, setEntrepreneurs] = useState<Entrepreneur[]>([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState('');
  const [distressFilter, setDistressFilter] = useState('');
  const [page, setPage]                   = useState(1);
  const [total, setTotal]                 = useState(0);
  const PER_PAGE = 15;

  // ── Load data from real DB ────────────────────────────────────────────────
  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const filters: EntrepreneurFilters = {
        page: p,
        per_page: PER_PAGE,
        ...(search        && { search }),
        ...(statusFilter  && { financing_status: statusFilter }),
        ...(distressFilter && { distress_level: distressFilter }),
      };
      const res = await getEntrepreneurs(filters);
      setEntrepreneurs(res.data);
      setTotal(res.total);
      setPage(res.current_page);
    } catch {
      toast.error('Gagal memuatkan data usahawan dari pangkalan data.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, distressFilter]);

  useEffect(() => { load(1); }, [load]);

  // ── Derived stats (from current page) ────────────────────────────────────
  const avgScore      = entrepreneurs.length
    ? Math.round(entrepreneurs.reduce((s, e) => s + (e.health_score ?? 0), 0) / entrepreneurs.length)
    : 0;
  const criticalCount = entrepreneurs.filter(e =>
    e.distress_level === 'Kritikal' || e.distress_level === 'Tinggi',
  ).length;
  const lancarCount   = entrepreneurs.filter(e => e.financing_status === 'Lancar').length;

  // ── Pie chart data ────────────────────────────────────────────────────────
  const statusDist = [
    { name: 'Lancar',           value: entrepreneurs.filter(e => e.financing_status === 'Lancar').length },
    { name: 'Perhatian Khusus', value: entrepreneurs.filter(e => e.financing_status === 'Perhatian Khusus').length },
    { name: 'Tidak Lancar',     value: entrepreneurs.filter(e => e.financing_status === 'Tidak Lancar').length },
  ].filter(d => d.value > 0);

  const distressDist = [
    { name: 'Rendah',    value: entrepreneurs.filter(e => e.distress_level === 'Rendah').length },
    { name: 'Sederhana', value: entrepreneurs.filter(e => e.distress_level === 'Sederhana').length },
    { name: 'Tinggi',    value: entrepreneurs.filter(e => e.distress_level === 'Tinggi').length },
    { name: 'Kritikal',  value: entrepreneurs.filter(e => e.distress_level === 'Kritikal').length },
  ].filter(d => d.value > 0);

  // ── DataTable columns ─────────────────────────────────────────────────────
  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'ref_no',
      header: 'ID Usahawan',
      render: (row) => {
        const e = row as unknown as Entrepreneur;
        return <span className="font-mono text-xs text-[#1B2B5E] font-semibold">{e.ref_no}</span>;
      },
    },
    {
      key: 'name',
      header: 'Nama & Perniagaan',
      render: (row) => {
        const e = row as unknown as Entrepreneur;
        return (
          <div>
            <p className="font-medium text-gray-900 text-sm">{e.name}</p>
            <p className="text-xs text-gray-500">{e.skim ?? '—'} · {e.sector ?? '—'}</p>
          </div>
        );
      },
    },
    {
      key: 'financing_status',
      header: 'Status',
      render: (row) => {
        const e = row as unknown as Entrepreneur;
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASS[e.financing_status] ?? 'bg-gray-100 text-gray-600'}`}>
            {e.financing_status}
          </span>
        );
      },
    },
    {
      key: 'health_score',
      header: 'Skor Kesihatan',
      align: 'center',
      render: (row) => {
        const e = row as unknown as Entrepreneur;
        return (
          <div className="flex flex-col items-center gap-1">
            <AiScoreRing score={e.health_score ?? 0} size={44} />
            <AiBadge label="SPPT AI" size="sm" />
          </div>
        );
      },
    },
    {
      key: 'distress_level',
      header: 'Tahap Risiko',
      align: 'center',
      render: (row) => {
        const e = row as unknown as Entrepreneur;
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${DISTRESS_CLASS[e.distress_level ?? 'Rendah'] ?? 'bg-gray-100 text-gray-600'}`}>
            {e.distress_level ?? 'Rendah'}
          </span>
        );
      },
    },
    {
      key: 'outstanding_balance',
      header: 'Baki Tertunggak',
      align: 'right',
      render: (row) => {
        const e = row as unknown as Entrepreneur;
        return (
          <span className="text-sm font-medium" style={{ color: '#E65100' }}>
            RM {(e.outstanding_balance ?? 0).toLocaleString('ms-MY')}
          </span>
        );
      },
    },
    {
      key: 'id',
      header: 'Tindakan',
      align: 'center',
      render: (row) => {
        const e = row as unknown as Entrepreneur;
        return (
          <button
            onClick={(ev) => { ev.stopPropagation(); navigate(`/crm/usahawan/${e.ref_no}`); }}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg text-white"
            style={{ background: '#1B2B5E' }}
          >
            <Eye size={11} /> Profil
          </button>
        );
      },
    },
  ];

  const pagination: PaginationProps = {
    page,
    perPage: PER_PAGE,
    total,
    onPageChange: (p) => load(p),
  };

  return (
    <div className="space-y-6">
      <ToastContainer />

      {/* Page Header — mandatory component */}
      <PageHeader
        title="CRM & Pemantauan Usahawan"
        subtitle="Paparan KPI, skor kesihatan SPPT AI, dan pemantauan usahawan TEKUN Nasional"
        breadcrumbs={[{ label: 'Utama' }, { label: 'CRM' }]}
        icon={<Users size={20} className="text-white" />}
        action={
          <AiBadge label="SPPT AI Analytics" size="md" />
        }
      />

      {/* KPI Summary — StatCard mandatory components */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Jumlah Usahawan"
          value={total}
          subtitle="dalam sistem"
          icon={<Users size={18} />}
          colour="navy"
          loading={loading}
        />
        <StatCard
          title="Purata Skor Kesihatan"
          value={`${avgScore}/100`}
          subtitle="Dikira oleh SPPT AI"
          icon={<Activity size={18} />}
          colour="green"
          loading={loading}
        />
        <StatCard
          title="Berisiko Tinggi/Kritikal"
          value={criticalCount}
          subtitle="halaman semasa"
          icon={<AlertTriangle size={18} />}
          colour="orange"
          loading={loading}
        />
        <StatCard
          title="Status Lancar"
          value={lancarCount}
          subtitle="halaman semasa"
          icon={<TrendingUp size={18} />}
          colour="green"
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      {!loading && entrepreneurs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm" style={{ color: '#1B2B5E' }}>
                Taburan Status Pembiayaan
              </h3>
              <AiBadge label="Data Sebenar" size="sm" />
            </div>
            {statusDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={statusDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }: { name: string; percent?: number }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {statusDist.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-44 flex items-center justify-center text-gray-400 text-sm">Tiada data</div>
            )}
          </div>

          {/* Distress Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm" style={{ color: '#1B2B5E' }}>
                Taburan Tahap Risiko SPPT AI
              </h3>
              <AiBadge label="SPPT AI" size="sm" />
            </div>
            {distressDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={distressDist} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {distressDist.map((d, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-44 flex items-center justify-center text-gray-400 text-sm">Tiada data</div>
            )}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama, IC, ID usahawan, atau perniagaan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1B2B5E] focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2B5E]"
            >
              <option value="">Semua Status</option>
              <option value="Lancar">Lancar</option>
              <option value="Perhatian Khusus">Perhatian Khusus</option>
              <option value="Tidak Lancar">Tidak Lancar</option>
            </select>
            <select
              value={distressFilter}
              onChange={(e) => setDistressFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2B5E]"
            >
              <option value="">Semua Risiko</option>
              <option value="Rendah">Rendah</option>
              <option value="Sederhana">Sederhana</option>
              <option value="Tinggi">Tinggi</option>
              <option value="Kritikal">Kritikal</option>
            </select>
          </div>
        </div>
      </div>

      {/* DataTable — mandatory component */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <DataTable
          columns={columns}
          data={entrepreneurs as unknown as Record<string, unknown>[]}
          onRowClick={(row) => {
            const e = row as unknown as Entrepreneur;
            navigate(`/crm/usahawan/${e.ref_no}`);
          }}
          pagination={pagination}
          emptyMessage="Tiada usahawan dijumpai. Cuba ubah carian atau penapis."
          rowKey={(row) => (row as unknown as Entrepreneur).id}
        />
      )}
    </div>
  );
}
