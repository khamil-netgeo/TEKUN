import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, CheckCircle, AlertTriangle, Clock, 
  Search, Filter, Eye, Activity
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
  const [applications, setApplications] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    fetchApplications();
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
          <Activity className="w-4 h-4" />
          Mula Penilaian
        </button>
      )
    }
  ];

  const filteredApps = applications.filter(app => 
    app.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.ref_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Papan Pemuka Pegawai Kredit</h1>
          <p className="text-gray-500">Urus dan nilai permohonan pembiayaan yang ditugaskan</p>
        </div>
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
          value="15" 
          icon={<Clock className="w-5 h-5 text-orange-600" />} 
        />
        <StatCard 
          title="Selesai (Hari Ini)" 
          value="8" 
          icon={<CheckCircle className="w-5 h-5 text-green-600" />} 
        />
        <StatCard 
          title="Kes Sempadan (Borderline)" 
          value="3" 
          icon={<AlertTriangle className="w-5 h-5 text-yellow-600" />}
        />
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-navy-900">Peti Masuk Tugasan (Inbox)</h2>
          
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari nama atau no. rujukan..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none w-64"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              Tapis
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={filteredApps} 
            pagination={{
              page: 1,
              perPage: 10,
              total: filteredApps.length,
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
              Sistem AI mencadangkan anda memberi tumpuan kepada 3 permohonan "Borderline" yang memerlukan semakan manual yang teliti hari ini.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
