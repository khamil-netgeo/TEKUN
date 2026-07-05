/**
 * Module 12 — Pentadbiran Sistem
 * Page: Pengurusan Pengguna (12.1)
 *
 * Fixed per Orchestrator audit 2026-07-04:
 *  - Removed MOCK_USERS hardcoded array
 *  - Added useEffect to fetch /api/users (list + pagination)
 *  - Added useEffect to fetch /api/users/stats (KPI cards)
 *  - Form "Tambah Pengguna" calls POST /api/users
 *  - Butang "Gantung/Aktifkan" calls POST /api/users/{id}/suspend or /activate
 *  - Loading states with LoadingSpinner
 *  - Error handling with toast notifications
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Users, UserPlus, Search, RefreshCw, ShieldOff, ShieldCheck,
  Edit2, KeyRound, X, Save, ChevronLeft, ChevronRight,
} from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserRecord {
  id: number;
  name: string;
  email: string;
  phone_number?: string;
  branch?: string;
  branch_code?: string;
  state?: string;
  role?: string;
  role_label?: string;
  is_active: boolean;
  is_suspended: boolean;
  status: 'Aktif' | 'Digantung' | 'Tidak Aktif';
  last_login_at?: string;
  created_at?: string;
}

interface UserStats {
  total: number;
  active: number;
  suspended: number;
  inactive: number;
  new_this_month: number;
  by_role: { role: string; count: number }[];
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: string;
  phone_number: string;
  branch: string;
  state: string;
}

const EMPTY_FORM: UserForm = {
  name: '', email: '', password: '', role: '',
  phone_number: '', branch: '', state: '',
};

const SPATIE_ROLES = [
  'Pegawai Cawangan',
  'Pengurus Cawangan',
  'Pegawai Kredit',
  'Eksekutif',
  'Pentadbir Sistem',
];

const STATUS_STYLE: Record<string, string> = {
  'Aktif':       'bg-green-100 text-green-700',
  'Digantung':   'bg-red-100 text-red-700',
  'Tidak Aktif': 'bg-gray-100 text-gray-500',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function UserManagement() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [users, setUsers]           = useState<UserRecord[]>([]);
  const [stats, setStats]           = useState<UserStats | null>(null);
  const [meta, setMeta]             = useState<PaginationMeta>({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
  const [loading, setLoading]       = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editUser, setEditUser]     = useState<UserRecord | null>(null);
  const [form, setForm]             = useState<UserForm>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // ── Fetch Users ────────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: 15 };
      if (search)       params.search = search;
      if (roleFilter)   params.role   = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/users', { params });
      setUsers(res.data.data);
      setMeta(res.data.meta);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal memuatkan senarai pengguna.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  // ── Fetch Stats ────────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/users/stats');
      setStats(res.data.data);
    } catch {
      // Non-critical — stats failure shouldn't block the page
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ── Create User ────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password || !form.role) {
      toast.error('Nama, e-mel, kata laluan, dan peranan wajib diisi.');
      return;
    }
    if (form.password.length < 12) {
      toast.error('Kata laluan mestilah sekurang-kurangnya 12 aksara.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/users', form);
      toast.success('Pengguna berjaya dicipta.');
      setShowCreateModal(false);
      setForm(EMPTY_FORM);
      fetchUsers();
      fetchStats();
    } catch (err: unknown) {
      const errors = (err as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors;
      if (errors) {
        Object.values(errors).flat().forEach((e) => toast.error(e));
      } else {
        toast.error('Gagal mencipta pengguna.');
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Update User ────────────────────────────────────────────────────────────

  const handleUpdate = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await api.put(`/users/${editUser.id}`, {
        name:         form.name,
        email:        form.email,
        role:         form.role,
        phone_number: form.phone_number,
        branch:       form.branch,
        state:        form.state,
      });
      toast.success('Pengguna berjaya dikemaskini.');
      setEditUser(null);
      setForm(EMPTY_FORM);
      fetchUsers();
    } catch (err: unknown) {
      const errors = (err as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors;
      if (errors) {
        Object.values(errors).flat().forEach((e) => toast.error(e));
      } else {
        toast.error('Gagal mengemaskini pengguna.');
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Suspend / Activate ─────────────────────────────────────────────────────

  const handleSuspend = async (user: UserRecord) => {
    setActionLoading(user.id);
    try {
      await api.post(`/users/${user.id}/suspend`);
      toast.success(`Akaun ${user.name} telah digantung.`);
      fetchUsers();
      fetchStats();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal menggantung akaun.';
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async (user: UserRecord) => {
    setActionLoading(user.id);
    try {
      await api.post(`/users/${user.id}/activate`);
      toast.success(`Akaun ${user.name} telah diaktifkan.`);
      fetchUsers();
      fetchStats();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal mengaktifkan akaun.';
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Reset Password ─────────────────────────────────────────────────────────

  const handleResetPassword = async (user: UserRecord) => {
    if (!window.confirm(`Tetapkan semula kata laluan untuk ${user.name}?`)) return;
    setActionLoading(user.id);
    try {
      const res = await api.post(`/users/${user.id}/reset-password`);
      const tempPw = res.data.temp_password;
      toast.success(`Kata laluan sementara: ${tempPw}`, { duration: 10000 });
    } catch {
      toast.error('Gagal menetapkan semula kata laluan.');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Open Edit Modal ────────────────────────────────────────────────────────

  const openEdit = (user: UserRecord) => {
    setEditUser(user);
    setForm({
      name:         user.name,
      email:        user.email,
      password:     '',
      role:         user.role ?? '',
      phone_number: user.phone_number ?? '',
      branch:       user.branch ?? '',
      state:        user.state ?? '',
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1B2B5E' }}>Pengurusan Pengguna</h1>
          <p className="text-sm text-gray-500 mt-1">Cipta, edit dan urus akaun pengguna sistem</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { fetchUsers(); fetchStats(); }}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          <button onClick={() => { setShowCreateModal(true); setForm(EMPTY_FORM); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold"
            style={{ background: '#1B2B5E' }}>
            <UserPlus className="w-4 h-4" /> Tambah Pengguna
          </button>
        </div>
      </div>

      {/* ── KPI Stats ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Jumlah Pengguna',  value: stats?.total,     icon: Users,        color: '#1B2B5E' },
          { label: 'Aktif',            value: stats?.active,    icon: ShieldCheck,  color: '#2E7D32' },
          { label: 'Digantung',        value: stats?.suspended, icon: ShieldOff,    color: '#C62828' },
          { label: 'Baharu Bulan Ini', value: stats?.new_this_month, icon: UserPlus, color: '#E65100' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              {statsLoading
                ? <div className="h-5 w-10 bg-gray-100 rounded animate-pulse mt-1" />
                : <p className="text-xl font-bold" style={{ color }}>{value ?? '—'}</p>
              }
            </div>
          </div>
        ))}
      </div>
      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari nama atau e-mel..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Semua Peranan</option>
            {SPATIE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="suspended">Digantung</option>
            <option value="inactive">Tidak Aktif</option>
          </select>
        </div>
      </div>

      {/* ── User Table ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="md" label="Memuatkan pengguna..." />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Tiada pengguna dijumpai.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Pengguna</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Peranan</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Cawangan</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Log Masuk Terakhir</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {user.role_label ?? user.role ?? 'Tiada Peranan'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{user.branch ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[user.status] ?? 'bg-gray-100 text-gray-500'}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {user.last_login_at
                          ? new Date(user.last_login_at).toLocaleString('ms-MY')
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit */}
                          <button
                            onClick={() => openEdit(user)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"
                            title="Edit pengguna"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => handleResetPassword(user)}
                            disabled={actionLoading === user.id}
                            className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 disabled:opacity-40"
                            title="Tetapkan semula kata laluan"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Suspend / Activate */}
                          {user.is_suspended ? (
                            <button
                              onClick={() => handleActivate(user)}
                              disabled={actionLoading === user.id}
                              className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 disabled:opacity-40"
                              title="Aktifkan semula"
                            >
                              {actionLoading === user.id
                                ? <div className="w-3.5 h-3.5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                                : <ShieldCheck className="w-3.5 h-3.5" />}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSuspend(user)}
                              disabled={actionLoading === user.id}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-40"
                              title="Gantung akaun"
                            >
                              {actionLoading === user.id
                                ? <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                : <ShieldOff className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta.last_page > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  Menunjukkan {((meta.current_page - 1) * meta.per_page) + 1}–{Math.min(meta.current_page * meta.per_page, meta.total)} daripada {meta.total} pengguna
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600">
                    {meta.current_page} / {meta.last_page}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                    disabled={page === meta.last_page}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Create User Modal ─────────────────────────────────────────────── */}
      {showCreateModal && (
        <UserFormModal
          title="Tambah Pengguna Baharu"
          form={form}
          setForm={setForm}
          onSave={handleCreate}
          onClose={() => { setShowCreateModal(false); setForm(EMPTY_FORM); }}
          saving={saving}
          showPassword
        />
      )}

      {/* ── Edit User Modal ───────────────────────────────────────────────── */}
      {editUser && (
        <UserFormModal
          title={`Edit: ${editUser.name}`}
          form={form}
          setForm={setForm}
          onSave={handleUpdate}
          onClose={() => { setEditUser(null); setForm(EMPTY_FORM); }}
          saving={saving}
          showPassword={false}
        />
      )}
    </div>
  );
}

// ── User Form Modal ────────────────────────────────────────────────────────────

interface UserFormModalProps {
  title: string;
  form: UserForm;
  setForm: React.Dispatch<React.SetStateAction<UserForm>>;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
  showPassword: boolean;
}

function UserFormModal({ title, form, setForm, onSave, onClose, saving, showPassword }: UserFormModalProps) {
  const field = (key: keyof UserForm, label: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold" style={{ color: '#1B2B5E' }}>{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {field('name',         'Nama Penuh *',          'text',     'Nama penuh...')}
          {field('email',        'E-mel *',               'email',    'nama@tekun.gov.my')}
          {showPassword && field('password', 'Kata Laluan * (min. 12 aksara)', 'password', 'Min. 12 aksara')}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Peranan *</label>
            <select
              value={form.role}
              onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">-- Pilih Peranan --</option>
              {['Pegawai Cawangan','Pengurus Cawangan','Pegawai Kredit','Eksekutif','Pentadbir Sistem'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          {field('phone_number', 'No. Telefon',           'tel',      '01X-XXXXXXX')}
          {field('branch',       'Cawangan',              'text',     'Nama cawangan...')}
          {field('state',        'Negeri',                'text',     'Negeri...')}
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
            Batal
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
            style={{ background: '#1B2B5E' }}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Menyimpan...' : 'Simpan Pengguna'}
          </button>
        </div>
      </div>
    </div>
  );
}
