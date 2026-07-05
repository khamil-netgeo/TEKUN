/**
 * Module 12 — Pentadbiran Sistem
 * Role Management — RBAC via /api/admin/roles
 */
import { useState, useEffect, useCallback } from 'react';
import { Shield, RefreshCw, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';

const NAVY = '#1B2B5E';

interface Role {
  id: number;
  name: string;
  guard_name: string;
  users_count?: number;
  permissions_count?: number;
}

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/roles');
      setRoles(res.data.data ?? res.data);
    } catch {
      toast.error('Gagal memuatkan peranan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: NAVY }}>
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: NAVY }}>Pengurusan Peranan</h1>
          <p className="text-sm text-gray-500">Urus peranan dan kebenaran akses RBAC</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map(r => (
            <div key={r.id} className="bg-white rounded-xl border shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{r.name}</h3>
              <p className="text-xs text-gray-400 mb-3">Guard: {r.guard_name}</p>
              <div className="flex gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {r.users_count ?? 0} pengguna
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  {r.permissions_count ?? 0} kebenaran
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
