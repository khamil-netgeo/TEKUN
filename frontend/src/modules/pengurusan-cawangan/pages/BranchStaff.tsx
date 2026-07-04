import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import branchService from '../services/branchService';
import type { BranchStaffResponse } from '../services/branchService';

const ROLE_LABELS: Record<string, string> = {
  branch_manager: 'Pengurus Cawangan',
  branch_officer: 'Pegawai Cawangan',
  credit_officer: 'Pegawai Kredit',
  executive: 'Eksekutif',
  system_admin: 'Pentadbir Sistem',
};

export default function BranchStaff() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<BranchStaffResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    branchService.staff(Number(id))
      .then(res => setData(res.data))
      .catch(() => setError('Gagal memuatkan senarai kakitangan.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B2B5E]" /></div>;
  if (error || !data) return <div className="text-center py-12 text-red-600">{error || 'Data tidak dijumpai.'}</div>;

  const filtered = data.staff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (ROLE_LABELS[s.role] || s.role).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-[#1B2B5E] hover:underline text-sm">← Kembali</button>
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B5E]">Kakitangan — {data.branch.name}</h1>
          <p className="text-gray-500 text-sm">{data.branch.code} · {data.branch.state}</p>
        </div>
        <span className="ml-auto bg-[#1B2B5E] text-white px-3 py-1 rounded-full text-sm font-semibold">
          {data.total} kakitangan
        </span>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
        <input
          type="text"
          placeholder="Cari nama, e-mel atau jawatan..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]"
        />
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#1B2B5E] text-white">
            <tr>
              <th className="px-4 py-3 text-left">Nama</th>
              <th className="px-4 py-3 text-left">E-mel</th>
              <th className="px-4 py-3 text-left">Jawatan</th>
              <th className="px-4 py-3 text-left">Tarikh Daftar</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">Tiada kakitangan dijumpai.</td></tr>
            ) : (
              filtered.map((staff, idx) => (
                <tr key={staff.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-medium text-[#1B2B5E]">{staff.name}</td>
                  <td className="px-4 py-3 text-gray-600">{staff.email}</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                      {ROLE_LABELS[staff.role] || staff.role_label || staff.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(staff.created_at).toLocaleDateString('ms-MY')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
