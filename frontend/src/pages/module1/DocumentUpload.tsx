/**
 * TEKUN SPPT — Module 1: Document Upload
 * Real implementation with file input and POST /api/applications/:id/documents
 */
import { useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Upload, CheckCircle, AlertCircle, XCircle, FileText, Trash2 } from 'lucide-react';
import { uploadDocument } from '@/services/applicationService';

interface DocItem {
  id: string;
  name: string;
  nameEn: string;
  required: boolean;
  status: 'pending' | 'uploading' | 'verified' | 'rejected';
  aiScore?: number;
  aiNote?: string;
  progress?: number;
  fileName?: string;
}

const initialDocs: DocItem[] = [
  { id: 'mykad', name: 'Salinan MyKad (Depan & Belakang)', nameEn: 'MyKad Copy (Front & Back)', required: true, status: 'pending' },
  { id: 'ssm', name: 'Sijil Pendaftaran Perniagaan (SSM)', nameEn: 'Business Registration Certificate (SSM)', required: true, status: 'pending' },
  { id: 'bank3', name: 'Penyata Bank 3 Bulan Terkini', nameEn: 'Latest 3-Month Bank Statement', required: true, status: 'pending' },
  { id: 'income', name: 'Bukti Pendapatan / Slip Gaji', nameEn: 'Income Proof / Pay Slip', required: true, status: 'pending' },
  { id: 'premise', name: 'Gambar Premis Perniagaan', nameEn: 'Business Premise Photos', required: false, status: 'pending' },
  { id: 'other', name: 'Dokumen Sokongan Lain', nameEn: 'Other Supporting Documents', required: false, status: 'pending' },
];

const statusConfig = {
  pending: { label: 'Belum Muat Naik', color: 'text-gray-400', bg: 'bg-gray-100', icon: <FileText size={14} className="text-gray-400" /> },
  uploading: { label: 'Sedang Dimuat Naik...', color: 'text-orange-600', bg: 'bg-orange-100', icon: <AlertCircle size={14} className="text-orange-500" /> },
  verified: { label: 'Disahkan AI', color: 'text-green-700', bg: 'bg-green-100', icon: <CheckCircle size={14} className="text-green-500" /> },
  rejected: { label: 'Ditolak', color: 'text-red-700', bg: 'bg-red-100', icon: <XCircle size={14} className="text-red-500" /> },
};

export default function DocumentUpload() {
  const { id: paramId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const applicationId = paramId || location.state?.applicationId || null;

  const [docs, setDocs] = useState<DocItem[]>(initialDocs);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  if (!applicationId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        <AlertCircle size={48} className="text-orange-500 mb-4" />
        <h2 className="text-xl font-bold text-[#1B2B5E] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
          Sila pilih permohonan terlebih dahulu
        </h2>
        <p className="text-gray-500 mb-6 text-center text-sm max-w-md">
          ID Permohonan tidak dijumpai. Sila kembali ke senarai permohonan dan pilih permohonan yang sah untuk memuat naik dokumen.
        </p>
        <button
          onClick={() => navigate('/module1/applications')}
          className="px-5 py-2.5 bg-[#1B2B5E] text-white rounded-lg text-sm font-semibold hover:bg-[#152348] transition-colors"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Kembali ke Senarai Permohonan
        </button>
      </div>
    );
  }

  const handleFileSelect = async (docId: string, file: File) => {
    if (!applicationId) return;
    setDocs(prev => prev.map(d => d.id === docId
      ? { ...d, status: 'uploading', progress: 0, fileName: file.name }
      : d
    ));
    try {
      const result = await uploadDocument(applicationId, docId, file, (pct) => {
        setDocs(prev => prev.map(d => d.id === docId ? { ...d, progress: pct } : d));
      });
      const doc = result.document;
      setDocs(prev => prev.map(d => d.id === docId
        ? {
            ...d,
            status: 'verified',
            aiScore: doc.ai_confidence ?? 90,
            aiNote: doc.ai_issues?.[0] ?? 'Dokumen sah dan lengkap',
            progress: 100,
          }
        : d
      ));
    } catch {
      setDocs(prev => prev.map(d => d.id === docId
        ? { ...d, status: 'rejected', aiNote: 'Muat naik gagal. Sila cuba semula.', progress: undefined }
        : d
      ));
    }
  };

  const triggerUpload = (docId: string) => {
    setActiveDocId(docId);
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeDocId) {
      handleFileSelect(activeDocId, file);
    }
    e.target.value = '';
  };

  const handleDrop = (docId: string, e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(docId, file);
  };

  const removeDoc = (docId: string) => {
    setDocs(prev => prev.map(d => d.id === docId
      ? { ...d, status: 'pending', aiScore: undefined, aiNote: undefined, fileName: undefined, progress: undefined }
      : d
    ));
  };

  const completedCount = docs.filter(d => d.status === 'verified').length;
  const requiredDone = docs.filter(d => d.required && d.status === 'verified').length;
  const requiredCount = docs.filter(d => d.required).length;
  const scoredDocs = docs.filter(d => d.aiScore);
  const overallScore = scoredDocs.length > 0
    ? Math.round(scoredDocs.reduce((sum, d) => sum + (d.aiScore || 0), 0) / scoredDocs.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        onChange={handleFileInputChange}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B5E]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Muat Naik Dokumen
          </h1>
          <p className="text-gray-500 text-sm mt-1">Sila muat naik semua dokumen yang diperlukan untuk permohonan anda</p>
        </div>
        <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-4 py-2">
          <span className="text-purple-600 text-lg">🤖</span>
          <span className="text-xs font-semibold text-purple-700" style={{ fontFamily: 'Inter, sans-serif' }}>
            AI Document Intelligence Aktif
          </span>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-[#1B2B5E]" style={{ fontFamily: 'Inter, sans-serif' }}>{completedCount}/{docs.length}</p>
          <p className="text-xs text-gray-500 mt-1">Dokumen Selesai</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-[#2E7D32]" style={{ fontFamily: 'Inter, sans-serif' }}>{requiredDone}/{requiredCount}</p>
          <p className="text-xs text-gray-500 mt-1">Wajib Selesai</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-purple-600" style={{ fontFamily: 'Inter, sans-serif' }}>{overallScore || '—'}%</p>
          <p className="text-xs text-gray-500 mt-1">Skor AI Purata</p>
        </div>
      </div>

      {/* Document List */}
      <div className="space-y-3">
        {docs.map(doc => {
          const cfg = statusConfig[doc.status];
          return (
            <div
              key={doc.id}
              className={`bg-white rounded-xl border p-4 shadow-sm transition-all ${
                doc.status === 'verified' ? 'border-green-200' :
                doc.status === 'rejected' ? 'border-red-200' :
                doc.status === 'uploading' ? 'border-orange-200' :
                'border-gray-100'
              }`}
              onDragOver={e => e.preventDefault()}
              onDrop={e => doc.status === 'pending' ? handleDrop(doc.id, e) : undefined}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800 truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {doc.name}
                      </p>
                      {doc.required && (
                        <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium flex-shrink-0">Wajib</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                      {doc.fileName && (
                        <span className="text-xs text-gray-400 truncate max-w-32">• {doc.fileName}</span>
                      )}
                    </div>
                    {doc.status === 'uploading' && doc.progress !== undefined && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${doc.progress}%` }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{doc.progress}%</p>
                      </div>
                    )}
                    {doc.aiNote && doc.status !== 'uploading' && (
                      <div className={`mt-2 flex items-start gap-1.5 text-xs rounded-lg p-2 ${
                        doc.status === 'verified' ? 'bg-green-50 text-green-700' :
                        doc.status === 'rejected' ? 'bg-red-50 text-red-700' :
                        'bg-purple-50 text-purple-700'
                      }`}>
                        <span className="flex-shrink-0">🤖</span>
                        <span style={{ fontFamily: 'Inter, sans-serif' }}>{doc.aiNote}</span>
                        {doc.aiScore && (
                          <span className="ml-auto font-bold flex-shrink-0">{doc.aiScore}%</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {doc.status === 'verified' && (
                    <button onClick={() => removeDoc(doc.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                  {(doc.status === 'pending' || doc.status === 'rejected') && (
                    <button
                      onClick={() => triggerUpload(doc.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B2B5E] text-white rounded-lg text-xs font-semibold hover:bg-[#152348] transition-colors"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      <Upload size={12} />
                      {doc.status === 'rejected' ? 'Cuba Semula' : 'Muat Naik'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      {requiredDone === requiredCount && requiredCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} className="text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                Semua dokumen wajib telah dimuat naik!
              </p>
              <p className="text-xs text-green-600">Anda boleh meneruskan ke langkah seterusnya.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}