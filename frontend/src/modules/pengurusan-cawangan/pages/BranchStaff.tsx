/**
 * TEKUN SPPT — Module 8: Pengurusan Cawangan
 * Sub-module 8.2: Pengurusan Kakitangan (Staff Management)
 *
 * Features:
 * - Staff list per branch with role, workload metrics
 * - RBAC: Branch Manager sees own branch staff only
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Users, Mail, Briefcase, Calendar, FileText, RefreshCw } from 'lucide-react';
import { getBranchStaff, type BranchStaff as BranchStaffType } from '../services/branchService';
import toast from 'react-hot-toast';

const ROLE_COLORS: Record<string, string> = {
  'branch_officer':  'bg-blue-100 text-blue-800',
  'branch_manager':  'bg-purple-100 text-purple-800',
  'credit_officer':  'bg-orange-100 text-orange-800',
  'executive':       'bg-green-100 text-green-800',
  'system_admin':    'bg-red-100 text-red-800',
};

export default function BranchStaff() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [data, setData] = useState<{ branch: { id: number; code: string; name: string }; staff: BranchStaffType[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getBranchStaff(Number(id))
      .then(res => setData(res))
      .catch(() => toast.error('Gagal memuatkan senarai kakitangan.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1B2B5E' }}>
            {t('module8.staffManagement')}
          </h1>
          {data && (
            <p className="text-sm text-gray-500">
              <span className="font-mono text-blue-600">{data.branch.code}</span> · {data.branch.name}
            </p>
          )}
        </div>
      </div>

      {/* ── Summary ───────────────────────────────────────────────────────── */}
      {data && (
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="p-2 rounded-lg" style={{ background: '#1B2B5E15' }}>
            <Users className="w-6 h-6" style={{ color: '#1B2B5E' }} />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{t('module8.totalStaff')}</p>
            <p className="text-2xl font-bold" style={{ color: '#1B2B5E' }}>{data.total}</p>
          </div>
        </div>
      )}

      {/* ── Staff Table ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-sm" style={{ color: '#1B2B5E' }}>{t('module8.staffList')}</h2>
        </div>

        {!data || data.staff.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Tiada kakitangan ditemui untuk cawangan ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['#', 'Nama', 'Emel', 'Peranan', 'Permohonan Aktif', 'Tarikh Mula'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.staff.map((staff, idx) => (
                  <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#1B2B5E' }}>
                          {staff.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-900">{staff.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <Mail className="w-3 h-3" />
                        {staff.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[staff.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        {staff.role_label || staff.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-gray-400" />
                        <span className={`font-semibold ${staff.active_applications > 10 ? 'text-orange-600' : 'text-gray-700'}`}>
                          {staff.active_applications}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <Calendar className="w-3 h-3" />
                        {staff.joined_at}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
