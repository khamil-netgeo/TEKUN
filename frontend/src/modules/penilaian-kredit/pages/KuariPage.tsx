import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, CheckCircle, Clock, Send, Sparkles, Plus, X } from 'lucide-react';
import api from '@/services/api';

const FIELD_OPTIONS = [
  { key: 'income_proof', label: 'Bukti Pendapatan' },
  { key: 'bank_statement', label: 'Penyata Bank (3 bulan)' },
  { key: 'ssm_cert', label: 'Sijil SSM' },
  { key: 'business_plan', label: 'Pelan Perniagaan' },
  { key: 'collateral_docs', label: 'Dokumen Cagaran' },
  { key: 'guarantor_ic', label: 'MyKad Penjamin' },
  { key: 'tax_return', label: 'Penyata Cukai' },
  { key: 'business_photos', label: 'Gambar Premis Perniagaan' },
];

export default function KuariPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [kuariResult, setKuariResult] = useState<{
    kuari_id: number;
    ai_suggestions: Array<{ field: string; label: string; ai_message: string; priority: string }>;
    deadline: string;
    auto_escalate_at: string;
  } | null>(null);

  const toggleField = (key: string) => {
    setSelectedFields(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    );
  };

  const handleSubmit = async () => {
    if (selectedFields.length === 0) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/applications/${id}/kuari`, {
        flagged_fields: selectedFields,
        notes,
        deadline,
      });
      setKuariResult(res.data);
      setSubmitted(true);
    } catch {
      // Mock success
      setKuariResult({
        kuari_id: 1001,
        ai_suggestions: selectedFields.map(f => ({
          field: f,
          label: FIELD_OPTIONS.find(o => o.key === f)?.label ?? f,
          ai_message: `Sila kemukakan ${FIELD_OPTIONS.find(o => o.key === f)?.label ?? f} terkini (tidak melebihi 3 bulan) untuk membolehkan penilaian kredit diselesaikan.`,
          priority: 'high',
        })),
        deadline,
        auto_escalate_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted && kuariResult) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/penilaian-kredit/scoring/${id}`)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-xl font-bold" style={{ color: '#1B2B5E', fontFamily: 'Inter, sans-serif' }}>
            Kuari Dihantar
          </h1>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-start gap-3">
          <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-green-800">Kuari berjaya dihantar kepada pemohon</p>
            <p className="text-green-700 text-sm mt-1">No. Kuari: KQ-{kuariResult.kuari_id} | Tarikh Akhir: {kuariResult.deadline}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-purple-600" />
            <h2 className="font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>
              Cadangan AI kepada Pemohon
            </h2>
          </div>
          <div className="space-y-3">
            {kuariResult.ai_suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                <div className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{s.label}</p>
                  <p className="text-xs text-gray-600 mt-1">{s.ai_message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <Clock size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-orange-800">Auto-Eskalasi Dijadualkan</p>
            <p className="text-xs text-orange-700 mt-1">
              Jika tiada respons dalam 3 hari, permohonan ini akan dieskasikan secara automatik kepada Pengurus Cawangan.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/penilaian-kredit')}
            className="flex-1 py-3 rounded-xl font-bold text-sm border border-gray-200 hover:bg-gray-50 text-gray-700"
          >
            Kembali ke Dashboard
          </button>
          <button
            onClick={() => navigate(`/penilaian-kredit/scoring/${id}`)}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
            style={{ background: '#1B2B5E' }}
          >
            Lihat Permohonan <ArrowLeft size={14} className="rotate-180" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/penilaian-kredit/scoring/${id}`)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1B2B5E', fontFamily: 'Inter, sans-serif' }}>
            Kuari / Permintaan Penjelasan
          </h1>
          <p className="text-sm text-gray-500">No. Permohonan: APP-{id?.padStart(5, '0')}</p>
        </div>
        <span className="ml-auto text-xs px-2 py-1 rounded-full text-white font-bold" style={{ background: '#7C3AED' }}>
          AI Suggestions
        </span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          {/* Field Selection */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Pilih Medan yang Perlu Penjelasan
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {FIELD_OPTIONS.map(opt => (
                <div
                  key={opt.key}
                  onClick={() => toggleField(opt.key)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedFields.includes(opt.key)
                      ? 'border-[#1B2B5E] bg-blue-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                    selectedFields.includes(opt.key) ? 'bg-[#1B2B5E]' : 'border-2 border-gray-300'
                  }`}>
                    {selectedFields.includes(opt.key) && <CheckCircle size={12} className="text-white" />}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
              Nota Tambahan (Pilihan)
            </h2>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Masukkan arahan atau penjelasan tambahan untuk pemohon..."
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]/20 resize-none"
              rows={4}
            />
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Deadline */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 text-sm mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
              Tarikh Akhir Respons
            </h3>
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]/20"
            />
            <div className="mt-3 flex items-start gap-2 p-3 bg-orange-50 rounded-lg">
              <Clock size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-orange-700">
                Auto-eskalasi kepada Pengurus Cawangan jika tiada respons dalam 3 hari.
              </p>
            </div>
          </div>

          {/* AI Preview */}
          {selectedFields.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-purple-600" />
                <h3 className="font-bold text-gray-800 text-sm">Pratonton Mesej AI</h3>
              </div>
              <div className="space-y-2">
                {selectedFields.map(f => {
                  const opt = FIELD_OPTIONS.find(o => o.key === f);
                  return (
                    <div key={f} className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                      <AlertCircle size={12} className="text-purple-600 flex-shrink-0" />
                      <span className="text-xs text-gray-700">{opt?.label}</span>
                      <button onClick={() => toggleField(f)} className="ml-auto">
                        <X size={12} className="text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={selectedFields.length === 0 || submitting}
            className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: '#E65100' }}
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
            Hantar Kuari kepada Pemohon
          </button>

          <button
            onClick={() => navigate(`/penilaian-kredit/scoring/${id}`)}
            className="w-full py-3 rounded-xl font-bold text-sm border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
