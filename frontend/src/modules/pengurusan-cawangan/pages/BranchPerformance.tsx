import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import branchService, { PerformanceRankingResponse } from '../services/branchService';

export default function BranchPerformance() {
  const navigate = useNavigate();
  const [data, setData] = useState<PerformanceRankingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    setLoading(true);
    branchService.performance(period)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B2B5E]" /></div>;
  if (!data) return <div className="text-center py-12 text-red-600">Gagal memuatkan data prestasi.</div>;

  const chartData = data.branches.slice(0, 10).map(b => ({
    name: b.code,
    kutipan: Number(b.collection_rate.toFixed(1)),
    npl: Number(b.npl_ratio.toFixed(1)),
    sasaran: Number(b.target.toFixed(1)),
  }));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B5E]">Prestasi Cawangan</h1>
          <p className="text-gray-500 text-sm">Kedudukan dan perbandingan prestasi semua cawangan</p>
        </div>
        <div className="md:ml-auto flex items-center gap-3">
          <label className="text-sm text-gray-600">Tempoh:</label>
          <input
            type="month"
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]"
          />
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Jumlah Cawangan', value: data.total_branches, color: 'text-[#1B2B5E]' },
          { label: 'Purata Kadar Kutipan', value: `${data.avg_collection}%`, color: 'text-green-600' },
          { label: 'Purata Nisbah NPL', value: `${data.avg_npl}%`, color: 'text-red-500' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl shadow p-4 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Bar Chart - Top 10 */}
      <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-[#1B2B5E] mb-4">Kadar Kutipan — 10 Cawangan Teratas</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis domain={[80, 100]} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value: number) => `${value}%`} />
            <Legend />
            <ReferenceLine y={95} stroke="#1B2B5E" strokeDasharray="5 5" label={{ value: 'Sasaran 95%', position: 'right', fontSize: 11 }} />
            <Bar dataKey="kutipan" fill="#2E7D32" name="Kadar Kutipan %" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Ranking Table */}
      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#1B2B5E]">Kedudukan Semua Cawangan</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Cawangan</th>
                <th className="px-4 py-3 text-left">Negeri</th>
                <th className="px-4 py-3 text-right">Kadar Kutipan</th>
                <th className="px-4 py-3 text-right">Nisbah NPL</th>
                <th className="px-4 py-3 text-right">Kakitangan</th>
                <th className="px-4 py-3 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {data.branches.map((branch, idx) => (
                <tr key={branch.id} className={`border-b border-gray-50 ${idx < 3 ? 'bg-green-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                      #{branch.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-[#1B2B5E]">{branch.name}</td>
                  <td className="px-4 py-3 text-gray-500">{branch.state}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${branch.collection_rate >= 95 ? 'text-green-600' : branch.collection_rate >= 90 ? 'text-yellow-600' : 'text-red-500'}`}>
                      {branch.collection_rate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${branch.npl_ratio <= 4 ? 'text-green-600' : branch.npl_ratio <= 6 ? 'text-yellow-600' : 'text-red-500'}`}>
                      {branch.npl_ratio.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{branch.staff_count}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => navigate(`/pengurusan-cawangan/${branch.id}`)}
                      className="text-[#1B2B5E] hover:underline text-xs"
                    >
                      Butiran
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
