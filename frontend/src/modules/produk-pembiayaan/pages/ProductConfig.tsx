import { useState, useEffect } from 'react';
import api from '@/services/api';

export function useProductList() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = () => {
    setLoading(true);
    api.get('/produk-pembiayaan')
      .then(res => setData(res.data?.data || res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return { data, loading, refetch: fetchProducts };
}

export function useProductActions() {
  const [loading, setLoading] = useState(false);

  const createProduct = async (data: any) => {
    setLoading(true);
    try {
      const res = await api.post('/produk-pembiayaan', data);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id: number | string, data: any) => {
    setLoading(true);
    try {
      const res = await api.put(`/produk-pembiayaan/${id}`, data);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  return { createProduct, updateProduct, loading };
}

export default function ProductConfig() {
  const { data: SCHEMES, loading, refetch } = useProductList();
  const { createProduct, updateProduct, loading: actionLoading } = useProductActions();
  const [selected, setSelected] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (SCHEMES.length > 0 && !selected && !isCreating) {
      setSelected(SCHEMES[0]);
    }
  }, [SCHEMES, selected, isCreating]);

  const handleEdit = () => {
    setFormData({
      name: selected.name,
      max: selected.max,
      rate: selected.rate,
      tenure: selected.tenure,
      status: selected.status,
      eligible: selected.eligible,
      color: selected.color
    });
    setEditing(true);
    setIsCreating(false);
  };

  const handleCreateNew = () => {
    setSelected(null);
    setFormData({
      name: '',
      max: 0,
      rate: 0,
      tenure: 0,
      status: 'Aktif',
      eligible: '',
      color: '#1B2B5E'
    });
    setEditing(true);
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (isCreating) {
      await createProduct(formData);
    } else if (selected) {
      await updateProduct(selected.id, formData);
    }
    setEditing(false);
    setIsCreating(false);
    refetch();
  };

  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  if (loading && SCHEMES.length === 0) {
    return <div className="p-4">Memuatkan...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="sppt-card flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1B2B5E' }}>Konfigurasi Produk Pembiayaan</h1>
          <p className="text-sm text-gray-500 mt-1">Urus skim pembiayaan, kadar keuntungan dan syarat kelayakan</p>
        </div>
        <button 
          onClick={handleCreateNew}
          className="px-4 py-2 rounded-lg text-white font-semibold text-sm" 
          style={{ background: '#1B2B5E' }}>
          + Tambah Skim Baharu
        </button>
      </div>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4 space-y-3">
          {SCHEMES.map((s: any) => (
            <div key={s.id} onClick={() => { setSelected(s); setEditing(false); setIsCreating(false); }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${selected?.id === s.id && !isCreating ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white hover:bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: s.color || '#1B2B5E' }}>T</div>
                <div>
                  <div className="font-bold text-sm">{s.name}</div>
                  <div className="text-xs text-gray-500">Maks: RM {(s.max || 0).toLocaleString()} • {s.rate}% p.a.</div>
                </div>
                <span className="ml-auto px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700">{s.status}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="col-span-8 sppt-card">
          {(selected || isCreating) && (
            <>
              <div className="flex items-center justify-between mb-4">
                {editing ? (
                  <input
                    value={formData.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Nama Produk"
                    className="w-1/2 p-2 border border-gray-300 rounded text-base font-bold"
                  />
                ) : (
                  <h2 className="font-bold text-base" style={{ color: '#1B2B5E' }}>{selected?.name}</h2>
                )}
                {!isCreating && (
                  <button onClick={() => { if (!editing) handleEdit(); else setEditing(false); }}
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-blue-500 text-blue-600 hover:bg-blue-50">
                    {editing ? 'Batal' : '✏️ Edit'}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Had Pembiayaan Maksimum', value: selected?.max || 0, key: 'max', display: `RM ${(selected?.max || 0).toLocaleString()}` },
                  { label: 'Kadar Keuntungan (% p.a.)', value: selected?.rate || 0, key: 'rate', display: `${selected?.rate || 0}%` },
                  { label: 'Tempoh Maksimum (bulan)', value: selected?.tenure || 0, key: 'tenure', display: `${selected?.tenure || 0} bulan` },
                  { label: 'Status', value: selected?.status || 'Aktif', key: 'status', display: selected?.status || 'Aktif' },
                ].map(field => (
                  <div key={field.key} className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">{field.label}</div>
                    {editing ? (
                      <input 
                        value={formData[field.key] !== undefined ? formData[field.key] : ''} 
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded text-sm font-semibold" 
                      />
                    ) : (
                      <div className="font-semibold text-sm">{field.display}</div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Syarat Kelayakan</div>
                {editing ? (
                  <textarea 
                    value={formData.eligible || ''} 
                    onChange={(e) => handleChange('eligible', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-sm" 
                    rows={2} 
                  />
                ) : (
                  <div className="text-sm">{selected?.eligible}</div>
                )}
              </div>
              {editing && (
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={handleSave}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-lg text-white font-semibold text-sm disabled:opacity-50" 
                    style={{ background: '#16A34A' }}>
                    {actionLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                  <button onClick={() => { setEditing(false); setIsCreating(false); }} className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold hover:bg-gray-50">
                    Batal
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}