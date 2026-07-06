/**
 * Module 12 — Pentadbiran Sistem
 * System Configuration — real DB via /api/pentadbiran-sistem/system-configs
 */
import { useState, useEffect, useCallback } from 'react';
import { Settings, Save, RefreshCw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';

const NAVY = '#1B2B5E';
const GREEN = '#2E7D32';
const ORANGE = '#E65100';

interface Config {
  key: string;
  value: string;
  description?: string;
  group?: string;
}

export default function SystemConfig() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [edited, setEdited] = useState<Record<string, string>>({});

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/pentadbiran-sistem/system-configs');
      setConfigs(res.data.data ?? res.data);
    } catch {
      toast.error('Gagal memuatkan konfigurasi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const handleSave = async (key: string) => {
    setSaving(key);
    try {
      await api.put(`/pentadbiran-sistem/system-configs/${key}`, { value: edited[key] });
      toast.success('Konfigurasi disimpan');
      setEdited(e => { const n = { ...e }; delete n[key]; return n; });
      fetchConfigs();
    } catch {
      toast.error('Gagal menyimpan konfigurasi');
    } finally {
      setSaving(null);
    }
  };

  const groups = Array.from(new Set(configs.map(c => c.group ?? 'Umum')));

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: NAVY }}>
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: NAVY }}>Konfigurasi Sistem</h1>
          <p className="text-sm text-gray-500">Urus tetapan sistem SPPT</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-700">Perubahan konfigurasi akan berkuat kuasa serta-merta. Pastikan nilai yang dimasukkan adalah betul.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        groups.map(group => (
          <div key={group} className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b" style={{ background: NAVY }}>
              <h3 className="text-sm font-semibold text-white">{group}</h3>
            </div>
            <div className="divide-y">
              {configs.filter(c => (c.group ?? 'Umum') === group).map(c => (
                <div key={c.key} className="px-4 py-3 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{c.key}</div>
                    {c.description && <div className="text-xs text-gray-400 mt-0.5">{c.description}</div>}
                  </div>
                  <input
                    value={edited[c.key] ?? c.value}
                    onChange={e => setEdited(prev => ({ ...prev, [c.key]: e.target.value }))}
                    className="border rounded-lg px-3 py-1.5 text-sm w-64 focus:outline-none"
                  />
                  {edited[c.key] !== undefined && (
                    <button
                      onClick={() => handleSave(c.key)}
                      disabled={saving === c.key}
                      className="flex items-center gap-1 px-3 py-1.5 text-white rounded-lg text-sm"
                      style={{ background: GREEN }}
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saving === c.key ? 'Simpan...' : 'Simpan'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}