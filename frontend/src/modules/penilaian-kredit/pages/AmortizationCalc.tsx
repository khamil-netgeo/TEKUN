// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calculator, FileText, Download, Printer } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { creditService, AmortizationSchedule } from '../services/creditService';
import toast from 'react-hot-toast';

export default function AmortizationCalc() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState<AmortizationSchedule | null>(null);
  
  // Form state
  const [amount, setAmount] = useState(50000);
  const [tenure, setTenure] = useState(60);
  const [rate, setRate] = useState(4.0);
  const [type, setType] = useState<'flat' | 'reducing'>('flat');

  useEffect(() => {
    if (id) {
      calculateSchedule();
    }
  }, [id]);

  const calculateSchedule = async () => {
    try {
      setLoading(true);
      const data = await creditService.getAmortization(id as string, amount, tenure, rate, type);
      setScheduleData(data);
    } catch (error) {
      console.error('Error calculating amortization:', error);
      toast.error('Gagal mengira jadual amortisasi');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    calculateSchedule();
  };

  const columns = [
    { header: 'Bulan', accessor: 'month' },
    { 
      header: 'Prinsipal (RM)', 
      accessor: 'principal',
      cell: (row: any) => new Intl.NumberFormat('ms-MY', { minimumFractionDigits: 2 }).format(row.principal)
    },
    { 
      header: 'Keuntungan (RM)', 
      accessor: 'interest',
      cell: (row: any) => new Intl.NumberFormat('ms-MY', { minimumFractionDigits: 2 }).format(row.interest)
    },
    { 
      header: 'Ansuran (RM)', 
      accessor: 'total',
      cell: (row: any) => <span className="font-medium text-navy-900">{new Intl.NumberFormat('ms-MY', { minimumFractionDigits: 2 }).format(row.total)}</span>
    },
    { 
      header: 'Baki (RM)', 
      accessor: 'balance',
      cell: (row: any) => new Intl.NumberFormat('ms-MY', { minimumFractionDigits: 2 }).format(row.balance)
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Kalkulator Jadual Amortisasi</h1>
          <p className="text-gray-500">Kira jadual pembayaran balik untuk Permohonan #{id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Calculator Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
              <Calculator className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-navy-900">Parameter Kiraan</h2>
            </div>
            
            <form onSubmit={handleCalculate} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amaun Pembiayaan (RM)</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  required
                  min="1000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tempoh (Bulan)</label>
                <select 
                  value={tenure}
                  onChange={(e) => setTenure(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  <option value="12">12 Bulan (1 Tahun)</option>
                  <option value="24">24 Bulan (2 Tahun)</option>
                  <option value="36">36 Bulan (3 Tahun)</option>
                  <option value="48">48 Bulan (4 Tahun)</option>
                  <option value="60">60 Bulan (5 Tahun)</option>
                  <option value="84">84 Bulan (7 Tahun)</option>
                  <option value="120">120 Bulan (10 Tahun)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kadar Keuntungan (%)</label>
                <input 
                  type="number" 
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kaedah Kiraan</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('flat')}
                    className={`py-2 px-3 border rounded-lg text-sm font-medium transition-colors ${
                      type === 'flat' 
                        ? 'bg-primary-50 border-primary-500 text-primary-700' 
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Kadar Rata (Flat)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('reducing')}
                    className={`py-2 px-3 border rounded-lg text-sm font-medium transition-colors ${
                      type === 'reducing' 
                        ? 'bg-primary-50 border-primary-500 text-primary-700' 
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Baki Berkurangan
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? 'Mengira...' : 'Kira Semula'}
              </button>
            </form>

            {scheduleData && (
              <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
                <h3 className="text-sm font-semibold text-navy-900 mb-3">Ringkasan</h3>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Ansuran Bulanan:</span>
                  <span className="font-bold text-lg text-primary-700">
                    RM {new Intl.NumberFormat('ms-MY', { minimumFractionDigits: 2 }).format(scheduleData.monthly_payment)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Jumlah Keuntungan:</span>
                  <span className="font-medium text-gray-900">
                    RM {new Intl.NumberFormat('ms-MY', { minimumFractionDigits: 2 }).format(scheduleData.total_interest)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Jumlah Keseluruhan:</span>
                  <span className="font-medium text-gray-900">
                    RM {new Intl.NumberFormat('ms-MY', { minimumFractionDigits: 2 }).format(scheduleData.total_payment)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Schedule Table */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-navy-900">Jadual Pembayaran</h2>
              
              <div className="flex gap-2">
                <button className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 tooltip-trigger" title="Cetak">
                  <Printer className="w-4 h-4" />
                </button>
                <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <Download className="w-4 h-4" />
                  Eksport PDF
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : scheduleData && scheduleData.schedule ? (
              <div className="overflow-auto max-h-[600px]">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                    <tr>
                      {columns.map((col, i) => (
                        <th key={i} className="px-6 py-3 font-semibold">{col.header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleData.schedule.map((row, i) => (
                      <tr key={i} className="bg-white border-b hover:bg-gray-50">
                        {columns.map((col, j) => (
                          <td key={j} className="px-6 py-3">
                            {col.cell ? col.cell(row) : row[col.accessor as keyof typeof row]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">
                Sila tekan butang Kira untuk menjana jadual amortisasi.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
