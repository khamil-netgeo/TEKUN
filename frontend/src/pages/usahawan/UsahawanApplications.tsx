import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import api from '@/services/api';
import PageHeader from '@/components/ui/PageHeader';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(amount);

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' });
};

interface Application {
  id: string;
  ref_no: string;
  applicant_name: string;
  scheme: string;
  amount_requested: number;
  status: 'Draf' | 'Dalam Penilaian' | 'Lulus' | 'Tolak';
  created_at: string;
}

const DEMO_APPLICATIONS_DATA: Application[] = [
  {
    id: '1',
    ref_no: 'SPPT-2026-07-00123',
    applicant_name: 'Demo Usahawan',
    scheme: 'Pembiayaan Mikro',
    amount_requested: 35000,
    status: 'Dalam Penilaian',
    created_at: '2026-07-15T10:00:00Z',
  },
  {
    id: '2',
    ref_no: 'SPPT-2026-06-00088',
    applicant_name: 'Demo Usahawan',
    scheme: 'Pembiayaan PKS',
    amount_requested: 120000,
    status: 'Lulus',
    created_at: '2026-06-20T14:30:00Z',
  },
  {
    id: '3',
    ref_no: 'SPPT-2026-05-00050',
    applicant_name: 'Demo Usahawan',
    scheme: 'Pembiayaan Permulaan',
    amount_requested: 15000,
    status: 'Tolak',
    created_at: '2026-05-01T09:15:00Z',
  },
  {
    id: '4',
    ref_no: 'SPPT-2026-04-00030',
    applicant_name: 'Demo Usahawan',
    scheme: 'Pembiayaan Mikro',
    amount_requested: 20000,
    status: 'Draf',
    created_at: '2026-04-10T11:00:00Z',
  },
];

const UsahawanApplications: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'Semua' | 'Draf' | 'Dalam Penilaian' | 'Lulus' | 'Tolak'>('Semua');

  useEffect(() => {
    const fetchApplications = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get('/api/applications/mine');
        setApplications(response.data.data);
      } catch (err: any) {
        if (err.response?.status === 401 || err.response?.status === 404) {
          console.warn('API /api/applications/mine failed, using demo fallback.', err);
          setApplications(DEMO_APPLICATIONS_DATA);
        } else {
          setError('Ralat memuatkan senarai permohonan.');
          console.error('Failed to fetch applications:', err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const getStatusColor = (status: Application['status']) => {
    switch (status) {
      case 'Draf': return 'bg-gray-100 text-gray-800';
      case 'Dalam Penilaian': return 'bg-blue-100 text-blue-800';
      case 'Lulus': return 'bg-green-100 text-green-800';
      case 'Tolak': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredApplications = useMemo(() => {
    let filtered = applications;

    if (filterStatus !== 'Semua') {
      filtered = filtered.filter(app => app.status === filterStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.ref_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.scheme.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [applications, filterStatus, searchTerm]);

  if (isLoading) {
    return (
      <div className="p-6">
        <PageHeader
          title="Permohonan Pembiayaan"
          description="Senarai permohonan pembiayaan anda."
          actions={
            <button
              onClick={() => navigate('/module1/new')}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-white font-medium"
              style={{ backgroundColor: '#1B2B5E' }}
            >
              <Plus className="w-5 h-5" /> Permohonan Baharu
            </button>
          }
        />
        <div className="text-center py-10">Memuatkan permohonan...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <PageHeader
          title="Permohonan Pembiayaan"
          description="Senarai permohonan pembiayaan anda."
          actions={
            <button
              onClick={() => navigate('/module1/new')}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-white font-medium"
              style={{ backgroundColor: '#1B2B5E' }}
            >
              <Plus className="w-5 h-5" /> Permohonan Baharu
            </button>
          }
        />
        <div className="text-center py-10 text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Permohonan Pembiayaan"
        description="Senarai permohonan pembiayaan anda."
        actions={
          <button
            onClick={() => navigate('/module1/new')}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-white font-medium"
            style={{ backgroundColor: '#1B2B5E' }}
          >
            <Plus className="w-5 h-5" /> Permohonan Baharu
          </button>
        }
      />

      <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <div className="relative w-full sm:w-1/3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari mengikut No. Rujukan..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-navy-500 focus:border-navy-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {['Semua', 'Draf', 'Dalam Penilaian', 'Lulus', 'Tolak'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filterStatus === status
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={filterStatus === status ? { backgroundColor: '#1B2B5E' } : {}}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {filteredApplications.length === 0 ? (
          <div className="text-center py-10 text-gray-600">Tiada permohonan ditemui.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApplications.map((app) => (
              <div key={app.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-lg text-gray-900">{app.ref_no}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{app.scheme}</p>
                  <p className="text-md font-medium text-gray-800 mb-3">{formatCurrency(app.amount_requested)}</p>
                  <p className="text-xs text-gray-500">Tarikh Permohonan: {formatDate(app.created_at)}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => navigate(`/module1/timeline/${app.id}`)}
                    className="w-full px-4 py-2 rounded-md text-white font-medium"
                    style={{ backgroundColor: '#1B2B5E' }}
                  >
                    Lihat Status
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsahawanApplications;