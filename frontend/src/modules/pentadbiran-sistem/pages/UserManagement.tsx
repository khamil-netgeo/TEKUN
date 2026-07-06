import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Search, Shield, Edit2, Ban, CheckCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  branch?: string;
  status: string;
  last_login_at?: string;
}

const STATUS_COLORS: Record<string, string> = {
  'active':   'bg-green-100 text-green-700',
  'inactive': 'bg-gray-100 text-gray-500',
  'suspended':'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  'active':   'Aktif',
  'inactive': 'Tidak Aktif',
  'suspended':'Digantung',
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('Semua');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', role: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await api.get('/roles');
      const data = res.data.data ?? res.data;
      setAvailableRoles(data.map((r: any) => r.name || r));
    } catch (error) {
      console.error('Failed to fetch roles', error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page };
      if (search) params.search = search;
      if (roleFilter !== 'Semua') params.role = roleFilter;

      const res = await api.get('/users', { params });
      setUsers(res.data.data ?? res.data);
      if (res.data.last_page) {
        setTotalPages(res.data.last_page);
      } else {
        setTotalPages(1);
      }
    } catch {
      toast.error('Gagal memuatkan senarai pengguna');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const filterRoles = ['Semua', ...availableRoles];

  const filtered = users;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editUser) {
        await api.put(`/users/${editUser.id}`, form);
        toast.success('Pengguna dikemaskini');
      } else {
        await api.post('/users', form);
        toast.success('Pengguna berjaya ditambah');
      }
      setShowForm(false);
      setEditUser(null);
      setForm({ name: '', email: '', role: '', password: '' });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Ralat semasa menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (u: User) => {
    const isSuspending = u.status === 'active';
    const actionText = isSuspending ? 'gantung' : 'aktifkan';
    
    if (!window.confirm(`Adakah anda pasti mahu ${actionText} pengguna ini?`)) return;
    try {
      if (isSuspending) {
        await api.post(`/users/${u.id}/suspend`);
        toast.success('Pengguna digantung');
      } else {
        await api.post(`/users/${u.id}/activate`);
        toast.success('Pengguna diaktifkan');
      }
      fetchUsers();
    } catch {
      toast.error(`Gagal ${actionText} pengguna`);
    }
  };

  const handleEdit = (u: User) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, role: u.role, password: '' });
    setShowForm(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-tekun-navy">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-tekun-navy">Pengurusan Pengguna</h1>
            <p className="text-sm text-gray-500">Urus akaun dan peranan pengguna sistem</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchUsers} className="flex items-center gap-1 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" /> Muat Semula
          </button>
          <button
            onClick={() => { setEditUser(null); setForm({ name: '', email: '', role: '', password: '' }); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium bg-tekun-green"
          >
            <Plus className="w-4 h-4" /> Tambah Pengguna
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Jumlah Pengguna', value: users.length, colorClass: 'text-tekun-navy' },
          { label: 'Aktif', value: users.filter(u => u.status === 'active').length, colorClass: 'text-tekun-green' },
          { label: 'Tidak Aktif', value: users.filter(u => u.status === 'inactive').length, colorClass: 'text-gray-500' },
          { label: 'Digantung', value: users.filter(u => u.status === 'suspended').length, colorClass: 'text-red-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border shadow-sm text-center">
            <div className={`text-2xl font-bold ${s.colorClass}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau emel..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            {filterRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Memuatkan...</span>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-white bg-tekun-navy">
                  <th className="px-4 py-3">Pengguna</th>
                  <th className="px-4 py-3">Peranan</th>
                  <th className="px-4 py-3">Cawangan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Log Masuk Terakhir</th>
                  <th className="px-4 py-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400">Tiada pengguna ditemui</td></tr>
                ) : filtered.map(u => (
                  <tr key={u.id} className="border-t hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{u.name}</div>
                      <div className="text-xs text-gray-400">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        <Shield className="w-3 h-3" />{u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.branch ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[u.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABELS[u.status] ?? u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {u.last_login_at ? new Date(u.last_login_at).toLocaleString('ms-MY') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(u)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(u)} 
                          className={`p-1.5 rounded ${u.status === 'active' ? 'hover:bg-red-50 text-red-600' : 'hover:bg-green-50 text-green-600'}`} 
                          title={u.status === 'active' ? 'Gantung' : 'Aktifkan'}
                        >
                          {u.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="p-4 border-t flex justify-between items-center text-sm">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Sebelumnya
                </button>
                <span className="text-gray-500">Muka {page} dari {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Seterusnya
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg text-tekun-navy">
                {editUser ? 'Kemaskini Pengguna' : 'Tambah Pengguna Baru'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Penuh</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Nama pengguna" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emel</label>
                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="emel@tekun.gov.my" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peranan</label>
                <select required value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">-- Pilih Peranan --</option>
                  {availableRoles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              {!editUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kata Laluan</label>
                  <input required type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Minimum 12 aksara" minLength={12} />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border rounded-lg text-sm hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-60 bg-tekun-green">
                  {submitting ? 'Menyimpan...' : editUser ? 'Kemaskini' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}