import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, CheckCircle, FileText, Download, Sparkles } from 'lucide-react';
import api from '@/services/api';

const REJECTION_REASONS = [
  'Profil risiko kredit tidak memenuhi syarat minimum TEKUN Nasional',
  'Nisbah Beban Hutang (DSR) melebihi had yang ditetapkan (>60%)',
  'Rekod CCRIS/CTOS menunjukkan tunggakan yang belum diselesaikan',
  'Pendapatan bulanan tidak mencukupi untuk menanggung ansuran',
  'Perniagaan beroperasi kurang dari tempoh minimum yang diperlukan',
  'Dokumen sokongan tidak lengkap atau tidak sah',
  'Pemohon mempunyai rekod muflis yang belum diselesaikan',
  'Jumlah pembiayaan melebihi had kelayakan berdasarkan pendapatan',
];

export default function RejectionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rejectionResult, setRejectionResult] = useState<{
    rejection_letter_url: string;
    rejection_letter_bm: string;
    rejected_at: string;
  } | null>(null);

  const toggleReason = (reason: string) => {
    setSelectedReasons(prev =>
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
    );
  };

  const handleSubmit = async () => {
    if (selectedReasons.length === 0) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/applications/${id}/reject`, {
        reasons: selectedReasons,
        comments,
      });
      setRejectionResult(res.data);
      setSubmitted(true);
    } catch {
      // Mock success
      const mockLetter = `TEKUN NASIONAL BERHAD
Surat Makluman Keputusan Permohonan Pembiayaan

Tarikh: ${new Date().toLocaleDateString('ms-MY', { day: '2-digit', month: 'long', year: 'numeric' })}
No. Rujukan: SPPT-2026-07-APP${id?.padStart(5, '0')}

Kepada,
Pemohon,

Dengan hormatnya perkara di atas adalah dirujuk.

Setelah meneliti permohonan pembiayaan anda, kami dengan hormatnya memaklumkan bahawa permohonan anda TIDAK DAPAT DILULUSKAN atas sebab-sebab berikut:

${selectedReasons.map((r, i) => `   ${i + 1}. ${r}`).join('\n')}

${comments ? `Nota Tambahan: ${comments}\n` : ''}
Anda boleh mengemukakan semula permohonan setelah keadaan kewangan anda bertambah baik.

Yang menjalankan amanah,
Bahagian Penilaian Kredit
TEKUN Nasional Berhad`;

      setRejectionResult({
        rejection_letter_url: '#',
        rejection_letter_bm: mockLetter,
        rejected_at: new Date().toISOString(),
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted && rejectionResult) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/penilaian-kredit')} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-xl font-bold" style={{ color: '#1B2B5E', fontFamily: 'Inter, sans-serif' }}>
            Permohonan Ditolak
          </h1>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-800">Permohonan telah ditolak</p>
            <p className="text-red-700 text-sm mt-1">
              Surat penolakan telah dijana secara automatik oleh AI SPPT.
              Ditolak pada: {new Date(rejectionResult.rejected_at).toLocaleString('ms-MY')}
            </p>
          </div>
        </div>

        {/* Letter Preview */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gray-800 px-4 py-2 flex items-center gap-3 text-white text-xs">
            <FileText size={14} />
            <span>Surat Penolakan — APP-{id?.padStart(5, '0')}.pdf</span>
            <div className="flex-1" />
            <a href={rejectionResult.rejection_letter_url} className="flex items-center gap-1 hover:opacity-75">
              <Download size={14} /> Muat Turun
            </a>
          </div>
          <div className="p-8 bg-white font-mono text-sm whitespace-pre-wrap text-gray-700 leading-relaxed border-l-4 border-red-200">
            {rejectionResult.rejection_letter_bm}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/penilaian-kredit')}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
            style={{ background: '#1B2B5E' }}
          >
            Kembali ke Dashboard
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
            Tolak Permohonan
          </h1>
          <p className="text-sm text-gray-500">No. Permohonan: APP-{id?.padStart(5, '0')}</p>
        </div>
        <span className="ml-auto text-xs px-2 py-1 rounded-full text-white font-bold" style={{ background: '#7C3AED' }}>
          AI Surat Penolakan
        </span>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-700">
          <strong>Amaran:</strong> Tindakan ini akan menolak permohonan secara kekal.
          AI akan menjana surat penolakan dalam Bahasa Malaysia secara automatik.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          {/* Reason Selection */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Sebab-Sebab Penolakan
            </h2>
            <div className="space-y-3">
              {REJECTION_REASONS.map((reason, i) => (
                <div
                  key={i}
                  onClick={() => toggleReason(reason)}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedReasons.includes(reason)
                      ? 'border-red-400 bg-red-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    selectedReasons.includes(reason) ? 'bg-red-500' : 'border-2 border-gray-300'
                  }`}>
                    {selectedReasons.includes(reason) && <CheckCircle size={12} className="text-white" />}
                  </div>
                  <span className="text-sm text-gray-700">{reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Comments */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
              Ulasan Tambahan (Pilihan)
            </h2>
            <textarea
              value={comments}
              onChange={e => setComments(e.target.value)}
              placeholder="Masukkan ulasan atau penjelasan tambahan untuk rekod..."
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
              rows={4}
            />
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* AI Letter Preview */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-purple-600" />
              <h3 className="font-bold text-gray-800 text-sm">Surat AI (BM)</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 leading-relaxed">
              {selectedReasons.length > 0 ? (
                <>
                  <p className="font-bold mb-2">TEKUN NASIONAL BERHAD</p>
                  <p className="mb-2">Permohonan anda tidak dapat diluluskan atas sebab-sebab berikut:</p>
                  {selectedReasons.map((r, i) => (
                    <p key={i} className="mb-1">{i + 1}. {r}</p>
                  ))}
                </>
              ) : (
                <p className="text-gray-400 italic">Pilih sebab penolakan untuk pratonton surat AI...</p>
              )}
            </div>
          </div>

          {/* Summary */}
          {selectedReasons.length > 0 && (
            <div className="bg-red-50 rounded-xl border border-red-200 p-4">
              <p className="text-sm font-bold text-red-800 mb-2">Ringkasan Penolakan</p>
              <p className="text-xs text-red-700">{selectedReasons.length} sebab dipilih</p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={selectedReasons.length === 0 || submitting}
            className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: '#C62828' }}
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <AlertCircle size={16} />
            )}
            Sahkan Penolakan & Jana Surat
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
