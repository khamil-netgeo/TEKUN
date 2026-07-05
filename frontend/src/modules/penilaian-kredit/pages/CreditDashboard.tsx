import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  FileText, CheckCircle, AlertTriangle, Clock,
  Search, Filter, Eye, Activity, TrendingUp
} from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import DataTable from '@/components/ui/DataTable';
import AiBadge from '@/components/ui/AiBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { creditService } from '../services/creditService';
import type { DashboardStats } from '../services/creditService';
import toast from 'react-hot-toast';

export default function CreditDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await creditService.getPendingApplications();
      setApplications(data.data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Gagal memuatkan senarai permohonan');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const data = await creditService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const columns = [
    {
      header: 'No. Rujukan',
      key: 'ref_no',
      render: (row: any) => <span className="font-medium text-[#1B2B5E]">{row.ref_no}</span>
    },
    { header: 'Nama Pemohon', key: 'applicant_name' },
    {
      header: 'Amaun (RM)',
      key: 'amount_requested',
      render: (row: any) => new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(row.amount_requested)
    },
    {
      header: 'Skim',
      key: 'scheme',
      render: (row: any) => (
        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
          {row.scheme || '—'}
        </span>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (row: any) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          row.status === 'pending_assessment' ? 'bg-orange-50 text-orange-700' :
          row.status === 'approved' ? 'bg-green-50 text-green-700' :
          'bg-red-50 text-red-700'
        }`}>
          {row.status === 'pending_assessment' ? 'Menunggu Penilaian' :
           row.status === 'approved' ? 'Diluluskan' : row.status}
        </span>
      )
    },
    {
      header: 'Tindakan',
      key: 'id',
      render: (row: any) => (
        <button
          onClick={() => navigate(`/penilaian-kredit/scoring/${row.id}`)}
          className="flex items-center gap-1 px-3 py-1.5 bg-[#1B2B5E] text-white rounded-lg text-xs font-medium hover:bg-blue-900 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          Nilai
        </button>
      )
    },
  ];

  const filteredApplications = applications.filter(app =>
    app.applicant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.ref_no?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B5E]">Papan Pemuka Penilaian Kredit</h1>
          <p className="text-gray-500 text-sm mt-1">Urus dan nilai permohonan pembiayaan yang ditugaskan</p>
        </div>
        <AiBadge label="Dikuasakan oleh SPPT AI" />
      </div>

      {/* KPI Stats — from real DB */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Menunggu Penilaian"
            value={(stats?.pending_assessment ?? applications.length).toString()}
            icon={<FileText className="w-5 h-5 text-blue-600" />}
            trend={12}
          />
          <StatCard
            title="Purata Skor Kredit"
            value={stats?.avg_score ? stats.avg_score.toFixed(1) : '—'}
            icon={<Activity className="w-5 h-5 text-purple-600" />}
          />
          <StatCard
            title="Diluluskan Hari Ini"
            value={(stats?.approved_today ?? 0).toString()}
            icon={<CheckCircle className="w-5 h-5 text-green-600" />}
          />
          <StatCard
            title="Kes Sempadan (Borderline)"
            value={(stats?.borderline_cases ?? 0).toString()}
            icon={<AlertTriangle className="w-5 h-5 text-orange-600" />}
          />
        </div>
      )}

      {/* Grade Distribution */}
      {stats?.grade_distribution && Object.keys(stats.grade_distribution).length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#1B2B5E] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              Taburan Gred Kredit
            </h2>
            <AiBadge label="Analisis SPPT AI" />
          </div>
          <div className="flex gap-3 flex-wrap">
            {Object.entries(stats.grade_distribution).map(([grade, count]) => (
              <div key={grade} className={`flex-1 min-w-[80px] text-center p-3 rounded-lg border ${
                grade === 'A' ? 'bg-green-50 border-green-200' :
                grade === 'B' ? 'bg-blue-50 border-blue-200' :
                grade === 'C' ? 'bg-orange-50 border-orange-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className={`text-2xl font-bold ${
                  grade === 'A' ? 'text-green-700' :
                  grade === 'B' ? 'text-blue-700' :
                  grade === 'C' ? 'text-orange-700' :
                  'text-red-700'
                }`}>{count as number}</div>
                <div className="text-xs text-gray-500 mt-1">Gred {grade}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Applications Table */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-base font-semibold text-[#1B2B5E]">Peti Masuk Tugasan (Inbox)</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama atau no. rujukan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-64"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              Tapis
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredApplications}
            emptyMessage="Tiada permohonan menunggu penilaian"
          />
        )}
      </div>
    </div>
  );
}
