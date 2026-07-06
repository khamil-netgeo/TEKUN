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
import { creditService } from '../services/creditService';
import toast from 'react-hot-toast';

export default function CreditDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
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
      toast.error('Gagal memuatkan statistik papan pemuka');
    } finally {
      setStatsLoading(false);
    }
  };

  const columns = [
    { 
      header: 'No. Rujukan', 
      key: 'ref_no',
      render: (row: any) => <span className="font-medium text-navy-900">{row.ref_no}</span>
    },
    { header: 'Nama Pemohon', key: 'applicant_name' },
    { 
      header: 'Amaun (RM)', 
      key: 'amount_requested',
      render: (row: any) => new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(row.amount_requested)
    },
    { 
      header: 'Tarikh Mohon', 
      key: 'created_at',
      render: (row: any) => new Date(row.created_at).toLocaleDateString('ms-MY')
    },
    {
      header: 'Tindakan',
      key: 'id',
      render: (row: any) => (
        <button 
          onClick={() => navigate(`/penilaian-kredit/pre-assessment/${row.id}`)}
          className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-800"
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
        <AiBadge>Dikuasakan oleh SPPT AI</AiBadge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Tugasan Baharu" 
          value={applications.length.toString()} 
          icon={<FileText className="w-5 h-5 text-blue-600" />} 
          trend={12}
        />
        <StatCard 
          title="Sedang Dinilai" 
          value={stats?.processing_count?.toString() || '0'} 
          icon={<Clock className="w-5 h-5 text-orange-600" />} 
        />
        <StatCard 
          title="Selesai (Hari Ini)" 
          value={stats?.completed_today_count?.toString() || '0'} 
          icon={<CheckCircle className="w-5 h-5 text-green-600" />} 
        />
        <StatCard 
          title="Kes Sempadan (Borderline)" 
          value={stats?.borderline_count?.toString() || '0'} 
          icon={<AlertTriangle className="w-5 h-5 text-yellow-600" />}
        />
      </div>

      {/* Grade Distribution */}
      {stats?.grade_distribution && Object.keys(stats.grade_distribution).length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#1B2B5E] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              Taburan Gred Kredit
            </h2>
            <AiBadge>Analisis SPPT AI</AiBadge>
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
            {/* LoadingSpinner component missing import, using fallback */}
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={filteredApplications} 
            pagination={{
              page: 1,
              perPage: 10,
              total: filteredApplications.length,
              onPageChange: () => {}
            }}
          />
        )}
      </div>
      
      <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Activity className="w-6 h-6 text-purple-700" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-purple-900">Prioriti AI</h3>
              <AiBadge label="Dikuasakan oleh AI" />
            </div>
            <p className="text-sm text-purple-800 mb-3">
              Sistem AI mencadangkan anda memberi tumpuan kepada {stats?.borderline_count || 0} permohonan "Borderline" yang memerlukan semakan manual yang teliti hari ini.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}