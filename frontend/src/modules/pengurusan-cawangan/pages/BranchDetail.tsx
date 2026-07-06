import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { ArrowLeft, Users, TrendingUp, AlertTriangle, Trophy, Edit, Save, X } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from '@/components/ui/Toast';
import branchService from '../services/branchService';
import type { Branch, PerformanceRecord } from '../services/branchService';

const BranchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Branch>>({});

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await branchService.getBranchById(Number(id));
      const { branch, performance } = res.data as any;
      setBranch(branch);
      setPerformanceHistory(performance ?? []);
      setEditForm({ name: branch.name, address: branch.address, phone: branch.phone, email: branch.email, target_collection_rate: branch.target_collection_rate, monthly_target: branch.monthly_target });
    } catch { toast.error('Gagal memuatkan maklumat cawangan.'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const handleSave = async () => {
    if (!id || !branch) return;
    setSaving(true);
    try {
      await branchService.updateBranch(Number(id), editForm);
      toast.success('Maklumat cawangan berjaya dikemaskini.');
      setEditing(false);
      fetchDetail();
    } catch { toast.error('Gagal mengemaskini maklumat cawangan.'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (!branch) return <div className="flex items-center justify-center h-64 text-red-600">Cawangan tidak dijumpai.</div>;

  const chartData = [...performanceHistory].reverse().map(p => ({
    period: p.period,
    kutipan: Number(Number(p.collection_rate).toFixed(1)),
    npl: Number(Number(p.npl_ratio).toFixed(1)),
    sasaran: Number(Number(p.target_collection_rate).toFixed(1)),
    permohonan: p.applications_received,
    diluluskan: p.applications_approved,
  }));

  const collectionRate = Number(branch.collection_rate);
  const nplRatio = Number(branch.npl_ratio);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={branch.name}
        subtitle={`${branch.code} \u00b7 ${branch.district}, ${branch.state}`}
        action={
          <div className="flex gap-2 items-center">
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: branch.is_active ? '#E8F5E9' : '#FFEBEE', color: branch.is_active ? '#2E7D32' : '#C62828' }}>
              {branch.is_active ? 'Aktif' : 'Tidak Aktif'}
            </span>
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm transition-colors">
              <ArrowLeft size={16} /> Kembali
            </button>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#1B2B5E' }}>
                <Edit size={16} /> Kemaskini
              </button>
            ) : (
              <>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#2E7D32' }}>
                  <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button onClick={() => setEditing(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm">
                  <X size={16} /> Batal
                </button>
              </>
            )}
          </div>
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Kadar Kutipan" value={`${collectionRate.toFixed(1)}%`} icon={<TrendingUp size={20} />} colour={collectionRate >= 85 ? 'green' : 'orange'} />
        <StatCard title="Nisbah NPL" value={`${nplRatio.toFixed(1)}%`} icon={<AlertTriangle size={20} />} colour={nplRatio <= 5 ? 'green' : 'orange'} />
        <StatCard title="Jumlah Staf" value={branch.staff_count ?? 0} icon={<Users size={20} />} colour="navy" />
        <StatCard title="Kedudukan Prestasi" value={branch.performance_rank ? `#${branch.performance_rank}` : '\u2014'} icon={<Trophy size={20} />} colour="orange" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="font-bold text-[#1B2B5E] mb-4">Maklumat Cawangan</h2>
        {editing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {([
              { label: 'Nama Cawangan', key: 'name' },
              { label: 'Alamat', key: 'address' },
              { label: 'Telefon', key: 'phone' },
              { label: 'E-mel', key: 'email' },
              { label: 'Sasaran Kutipan (%)', key: 'target_collection_rate' },
              { label: 'Sasaran Bulanan (RM)', key: 'monthly_target' },
            ] as { label: string; key: keyof Branch }[]).map(field => (
              <div key={field.key}>
                <label className="block text-xs text-gray-500 mb-1">{field.label}</label>
                <input
                  type={['target_collection_rate', 'monthly_target'].includes(field.key) ? 'number' : 'text'}
                  value={String(editForm[field.key] ?? '')}
                  onChange={e => setEditForm(prev => ({ ...prev, [field.key]: ['target_collection_rate', 'monthly_target'].includes(field.key) ? Number(e.target.value) : e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]/20"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex gap-2"><span className="text-gray-500 min-w-[120px]">Alamat:</span><span className="font-medium">{branch.address}</span></div>
            <div className="flex gap-2"><span className="text-gray-500 min-w-[120px]">Telefon:</span><span className="font-medium">{branch.phone}</span></div>
            <div className="flex gap-2"><span className="text-gray-500 min-w-[120px]">E-mel:</span><span className="font-medium">{branch.email}</span></div>
            <div className="flex gap-2"><span className="text-gray-500 min-w-[120px]">Sasaran Kutipan:</span><span className="font-medium">{branch.target_collection_rate}%</span></div>
            <div className="flex gap-2"><span className="text-gray-500 min-w-[120px]">Sasaran Bulanan:</span><span className="font-medium">RM {Number(branch.monthly_target).toLocaleString('ms-MY')}</span></div>
            <div className="flex gap-2"><span className="text-gray-500 min-w-[120px]">Aktual Bulanan:</span><span className="font-medium">RM {Number(branch.monthly_actual).toLocaleString('ms-MY')}</span></div>
          </div>
        )}
      </div>
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-bold text-[#1B2B5E] mb-4">Sejarah Kadar Kutipan &amp; NPL</h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 105]} tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip formatter={(v: unknown) => [`${Number(v).toFixed(1)}%`]} />
                <Legend />
                <Area type="monotone" dataKey="kutipan" stroke="#2E7D32" fill="#2E7D3220" name="Kadar Kutipan %" />
                <Area type="monotone" dataKey="sasaran" stroke="#1B2B5E" fill="none" strokeDasharray="5 5" name="Sasaran %" />
                <Area type="monotone" dataKey="npl" stroke="#E65100" fill="#E6510020" name="NPL %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-bold text-[#1B2B5E] mb-4">Permohonan Bulanan</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="permohonan" fill="#1B2B5E" name="Diterima" radius={[3, 3, 0, 0]} />
                <Bar dataKey="diluluskan" fill="#2E7D32" name="Diluluskan" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      <div className="flex gap-3">
        <button onClick={() => navigate(`/pengurusan-cawangan/${id}/staf`)} className="flex items-center gap-2 px-6 py-2 rounded-lg text-white text-sm font-medium" style={{ background: '#1B2B5E' }}>
          <Users size={16} /> Lihat Kakitangan
        </button>
        <button onClick={() => navigate('/pengurusan-cawangan/prestasi')} className="flex items-center gap-2 px-6 py-2 rounded-lg text-white text-sm font-medium" style={{ background: '#E65100' }}>
          <Trophy size={16} /> Leaderboard Prestasi
        </button>
      </div>
    </div>
  );
};

export default BranchDetail;