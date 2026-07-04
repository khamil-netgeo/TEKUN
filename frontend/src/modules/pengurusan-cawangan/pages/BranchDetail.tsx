import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import branchService, { BranchDetailResponse } from '../services/branchService';
import { useTranslation } from 'react-i18next';

export default function BranchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [data, setData] = useState<BranchDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    branchService.detail(Number(id))
      .then(res => setData(res.data))
      .catch(() => setError('Gagal memuatkan maklumat cawangan.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B2B5E]" /></div>;
  if (error || !data) return <div className="text-center py-12 text-red-600">{error || 'Cawangan tidak dijumpai.'}</div>;

  const { branch, performance } = data;
  const chartData = [...performance].reverse().map(p => ({
    period: p.period,
    kutipan: Number(p.collection_rate.toFixed(1)),
    npl: Number(p.npl_ratio.toFixed(1)),
    sasaran: Number(p.target_collection_rate.toFixed(1)),
  }));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-[#1B2B5E] hover:underline text-sm">← Kembali</button>
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B5E]">{branch.name}</h1>
          <p className="text-gray-500 text-sm">{branch.code} · {branch.district}, {branch.state}</p>
        </div>
        <span className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold ${branch.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {branch.is_active ? 'Aktif' : 'Tidak Aktif'}
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Kadar Kutipan', value: `${branch.collection_rate}%`, color: 'text-green-600' },
          { label: 'Nisbah NPL', value: `${branch.npl_ratio}%`, color: 'text-red-500' },
          { label: 'Jumlah Kakitangan', value: branch.staff_count, color: 'text-[#1B2B5E]' },
          { label: 'Kedudukan Prestasi', value: branch.performance_rank ? `#${branch.performance_rank}` : 'N/A', color: 'text-[#E65100]' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl shadow p-4 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Branch Info */}
      <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-[#1B2B5E] mb-4">Maklumat Cawangan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Alamat:</span> <span className="ml-2 font-medium">{branch.address}</span></div>
          <div><span className="text-gray-500">Telefon:</span> <span className="ml-2 font-medium">{branch.phone}</span></div>
          <div><span className="text-gray-500">E-mel:</span> <span className="ml-2 font-medium">{branch.email}</span></div>
          <div><span className="text-gray-500">Sasaran Kutipan:</span> <span className="ml-2 font-medium">{branch.target_collection_rate}%</span></div>
        </div>
      </div>

      {/* Performance Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-[#1B2B5E] mb-4">Sejarah Prestasi (6 Bulan)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis domain={[80, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Legend />
              <Area type="monotone" dataKey="kutipan" stroke="#2E7D32" fill="#2E7D3220" name="Kadar Kutipan %" />
              <Area type="monotone" dataKey="sasaran" stroke="#1B2B5E" fill="none" strokeDasharray="5 5" name="Sasaran %" />
              <Area type="monotone" dataKey="npl" stroke="#E65100" fill="#E6510020" name="NPL %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate(`/pengurusan-cawangan/${id}/kakitangan`)}
          className="bg-[#1B2B5E] text-white px-6 py-2 rounded-lg hover:bg-[#162347] transition-colors"
        >
          Lihat Kakitangan
        </button>
      </div>
    </div>
  );
}
