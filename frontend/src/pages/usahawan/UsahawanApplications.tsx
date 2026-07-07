import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, FileText, LoaderCircle } from 'lucide-react';
import api from '@/services/api';

// Note: useAuthStore is not needed as the API handles filtering via 'mine=true'
// which uses the authentication token from the api service instance.

// --- Type Definition ---
interface Application {
  id: string;
  referenceNumber: string;
  schemeName: string;
  amount: number;
  submissionDate: string; // ISO 8601 format
  status: 'Dalam Semakan' | 'Diluluskan' | 'Ditolak';
}

// --- Demo Data for Fallback ---
const demoApplications: Application[] = [
  {
    id: 'demo-1',
    referenceNumber: 'TEKUN/DEMO/2024/001',
    schemeName: 'Skim Pembiayaan TEKUN Niaga',
    amount: 20000,
    submissionDate: '2024-05-15T09:30:00Z',
    status: 'Diluluskan',
  },
  {
    id: 'demo-2',
    referenceNumber: 'TEKUN/DEMO/2024/002',
    schemeName: 'Skim Pembiayaan Kontrak-i',
    amount: 50000,
    submissionDate: '2024-06-01T14:00:00Z',
    status: 'Dalam Semakan',
  },
];

// --- Helper Functions ---
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const getStatusBadgeClass = (status: Application['status']): string => {
  switch (status) {
    case 'Diluluskan':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'Dalam Semakan':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'Ditolak':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

// --- Main Component ---
const UsahawanApplications: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');

  const statusOptions: string[] = ['Semua', 'Dalam Semakan', 'Diluluskan', 'Ditolak'];

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<Application[]>('/api/applications?mine=true');
        setApplications(response.data);
      } catch (err) {
        console.error("Gagal memuatkan data permohonan:", err);
        setError("Tidak dapat memuatkan data permohonan. Memaparkan data demo.");
        setApplications(demoApplications); // Fallback to demo data
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const filteredApplications = useMemo(() => {
    return applications
      .filter(app => {
        if (statusFilter === 'Semua') return true;
        return app.status === statusFilter;
      })
      .filter(app => {
        return app.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase());
      });
  }, [applications, searchTerm, statusFilter]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-20">
          <LoaderCircle className="animate-spin h-12 w-12 text-navy-600" />
          <p className="mt-4 text-lg text-gray-600">Memuatkan Permohonan...</p>
        </div>
      );
    }

    if (applications.length === 0 && !loading && !error) {
      return (
        <div className="text-center py-20 px-4 bg-white rounded-lg shadow-sm border">
          <FileText className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-xl font-semibold text-gray-800">Tiada Permohonan Ditemui</h3>
          <p className="mt-2 text-base text-gray-500">Anda belum membuat sebarang permohonan.</p>
          <button
            onClick={() => navigate('/module1/new')}
            className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Plus className="-ml-1 mr-3 h-5 w-5" />
            Mohon Sekarang
          </button>
        </div>
      );
    }

    if (filteredApplications.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-sm border">
                Tiada permohonan yang sepadan dengan carian atau tapisan anda.
            </div>
        );
    }

    return (
      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {filteredApplications.map((app) => (
          <div key={app.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col">
            <div className="p-5 flex-grow">
              <div className="flex justify-between items-start mb-3">
                <p className="text-sm font-medium text-gray-500">
                  No. Rujukan: <span className="text-navy-700 font-semibold">{app.referenceNumber}</span>
                </p>
                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStatusBadgeClass(app.status)}`}>
                  {app.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-navy-900 mb-1">{app.schemeName}</h3>
              <p className="text-2xl font-light text-gray-800 mb-4">{formatCurrency(app.amount)}</p>
              <p className="text-sm text-gray-500">
                Tarikh Hantar: {formatDate(app.submissionDate)}
              </p>
            </div>
            <div className="border-t border-gray-200 bg-gray-50 px-5 py-3">
              <button
                onClick={() => navigate(`/module1/timeline/${app.id}`)}
                className="w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-navy-600 hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-500"
              >
                Lihat Status
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-4 sm:mb-0">
            Permohonan Saya
          </h1>
          <button
            onClick={() => navigate('/module1/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Permohonan Baharu
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="search" className="sr-only">Cari No. Rujukan</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                  placeholder="Cari No. Rujukan..."
                />
              </div>
            </div>
            <div className="md:col-span-1">
              <div className="flex items-center h-full bg-gray-100 rounded-md p-1">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`w-full text-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                      statusFilter === status
                        ? 'bg-navy-600 text-white shadow'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded-md" role="alert">
            <p>{error}</p>
          </div>
        )}

        {renderContent()}
      </div>
    </div>
  );
};

export default UsahawanApplications;