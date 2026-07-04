/**
 * TEKUN SPPT — Module 8: Pengurusan Cawangan
 * Sub-module 8.1: Butiran Cawangan (Branch Detail)
 *
 * Features:
 * - Full branch info with contact details
 * - 6-month performance chart
 * - Edit branch info (RBAC: manager own branch, admin all)
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Building2, Phone, Mail, MapPin, User,
  TrendingUp, TrendingDown, Edit2, Save, X, RefreshCw,
  Users, FileText, Wallet
} from 'lucide-react';
import {
  getBranch, updateBranch,
  type Branch, type UpdateBranchPayload
} from '../services/branchService';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

function statusColor(status: string) {
  const map: Record<string, string> = {
    'Cemerlang': 'bg-green-100 text-green-800',
    'Baik': 'bg-blue-100 text-blue-800',
    'Sederhana': 'bg-yellow-100 text-yellow-800',
    'Lemah': 'bg-red-100 text-red-800',
    'Sihat': 'bg-green-100 text-green-800',
    'Kritikal': 'bg-red-100 text-red-800',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}

export default function BranchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UpdateBranchPayload>({});

  const isManager = user?.role === 'branch_manager' || user?.role === 'Pengurus Cawangan';
  const isAdmin = user?.role === 'system_admin' || user?.role === 'Pentadbir Sistem';
  const canEdit = isAdmin || (isManager && branch?.code === user?.branch_code);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getBranch(Number(id))
      .then(res => {
        setBranch(res.data);
        setForm({
          phone: res.data.phone ?? '',
          email: res.data.email ?? '',
          address: res.data.address ?? '',
          manager_name: res.data.manager_name ?? '',
          manager_email: res.data.manager_email ?? '',
        });
      })
      .catch(() => toast.error('Gagal memuatkan butiran cawangan.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!id || !branch) return;
    setSaving(true);
    try {
      const res = await updateBranch(Number(id), form);
      setBranch(res.data);
      setEditing(false);
      toast.success(t('module8.updateSuccess'));
    } catch {
      toast.error(t('module8.updateError'));
    } finally {
      setSaving(false);
    }
  };

  // Prepare chart data from performance_history
  const chartData = (branch?.performance_history ?? [])
    .slice()
    .reverse()
    .map(p => ({
      period: p.period,
      target: p.target_amount / 1000,
      actual: p.actual_amount / 1000,
      collection: p.collection_rate,
      npl: p.npl_ratio,
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="p-6 text-center text-gray-400">
        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Cawangan tidak ditemui.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline text-sm">Kembali</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1B2B5E' }}>{branch.name}</h1>
            <p className="text-sm text-gray-500">
              <span className="font-mono text-blue-600">{branch.code}</span> · {branch.state} · {branch.district}
            </p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {branch.performance_status && (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(branch.performance_status)}`}>
              {branch.performance_status}
            </span>
          )}
          {canEdit && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold"
              style={{ background: '#1B2B5E' }}
            >
              <Edit2 className="w-4 h-4" />
              {t('module8.editBranch')}
            </button>
          )}
          {editing && (
            <>
              <button onClick={() => setEditing(false)} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <X className="w-4 h-4" /> Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold"
                style={{ background: '#2E7D32' }}
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('module8.staffCount'), value: branch.staff_count, icon: Users, color: '#1B2B5E' },
          { label: t('module8.activeAccounts'), value: branch.active_accounts, icon: FileText, color: '#2E7D32' },
          { label: t('module8.collectionRate'), value: `${branch.collection_rate}%`, icon: TrendingUp, color: '#E65100' },
          { label: t('module8.nplRatio'), value: `${branch.npl_ratio}%`, icon: TrendingDown, color: '#C62828' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg" style={{ background: kpi.color + '15' }}>
              <kpi.icon className="w-6 h-6" style={{ color: kpi.color }} />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{kpi.label}</p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: kpi.color }}>{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Branch Info ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-sm" style={{ color: '#1B2B5E' }}>Maklumat Cawangan</h2>

          {editing ? (
            <div className="space-y-3">
              {[
                { key: 'address', label: 'Alamat', type: 'text' },
                { key: 'phone', label: 'Telefon', type: 'text' },
                { key: 'email', label: 'Emel', type: 'email' },
                { key: 'manager_name', label: 'Nama Pengurus', type: 'text' },
                { key: 'manager_email', label: 'Emel Pengurus', type: 'email' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-xs text-gray-500 font-semibold">{field.label}</label>
                  <input
                    type={field.type}
                    value={(form as Record<string, string>)[field.key] ?? ''}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">{branch.address ?? '—'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600">{branch.phone ?? '—'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600">{branch.email ?? '—'}</span>
              </div>
              <hr />
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800">{branch.manager_name ?? '—'}</p>
                  <p className="text-xs text-gray-400">{branch.manager_email ?? ''}</p>
                </div>
              </div>
              <div className="pt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Sasaran Bulanan</span>
                  <span>RM {branch.monthly_target.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Pencapaian</span>
                  <span className="font-semibold" style={{ color: '#2E7D32' }}>RM {branch.monthly_actual.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (branch.monthly_actual / Math.max(1, branch.monthly_target)) * 100)}%`,
                      background: '#2E7D32'
                    }}
                  />
                </div>
                <p className="text-xs text-right text-gray-500 mt-1">
                  {((branch.monthly_actual / Math.max(1, branch.monthly_target)) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => navigate(`/dashboard/module8/branches/${branch.id}/staff`)}
            className="w-full flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            <Users className="w-4 h-4" />
            {t('module8.viewStaff')} ({branch.staff_count})
          </button>
        </div>

        {/* ── Performance Chart ────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm p-5 lg:col-span-2">
          <h2 className="font-semibold text-sm mb-4" style={{ color: '#1B2B5E' }}>
            {t('module8.performanceHistory')} (6 Bulan)
          </h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v, n) => { const val = Number(v ?? 0); const name = String(n ?? ''); return name.includes('target') || name.includes('actual') ? [`RM ${(val * 1000).toLocaleString()}`, name] as [string, string] : [`${val}%`, name] as [string, string]; }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="target" stroke="#94A3B8" strokeDasharray="5 5" name="Sasaran (RM'000)" dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="actual" stroke="#1B2B5E" strokeWidth={2} name="Pencapaian (RM'000)" />
                <Line yAxisId="right" type="monotone" dataKey="collection" stroke="#2E7D32" strokeWidth={2} name="Kadar Kutipan %" />
                <Line yAxisId="right" type="monotone" dataKey="npl" stroke="#C62828" strokeWidth={2} name="NPL %" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              Tiada data prestasi.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
