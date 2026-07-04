import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, XCircle, Eye, Trash2, FileText, Image } from 'lucide-react';

interface DocItem {
  id: string;
  name: string;
  nameEn: string;
  required: boolean;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
  aiScore?: number;
  aiNote?: string;
  file?: string;
}

const initialDocs: DocItem[] = [
  { id: 'mykad', name: 'Salinan MyKad (Depan & Belakang)', nameEn: 'MyKad Copy (Front & Back)', required: true, status: 'verified', aiScore: 98, aiNote: 'Dokumen sah dan terbaca dengan jelas' },
  { id: 'ssm', name: 'Sijil Pendaftaran Perniagaan (SSM)', nameEn: 'Business Registration Certificate (SSM)', required: true, status: 'verified', aiScore: 95, aiNote: 'Perniagaan aktif, tarikh sah' },
  { id: 'bank3', name: 'Penyata Bank 3 Bulan Terkini', nameEn: 'Latest 3-Month Bank Statement', required: true, status: 'uploaded', aiScore: 72, aiNote: 'Memerlukan semakan manual — beberapa transaksi tidak jelas' },
  { id: 'income', name: 'Bukti Pendapatan / Slip Gaji', nameEn: 'Income Proof / Pay Slip', required: true, status: 'pending' },
  { id: 'premise', name: 'Gambar Premis Perniagaan', nameEn: 'Business Premise Photos', required: false, status: 'pending' },
  { id: 'other', name: 'Dokumen Sokongan Lain', nameEn: 'Other Supporting Documents', required: false, status: 'pending' },
];

const statusConfig = {
  pending: { label: 'Belum Muat Naik', color: 'text-gray-400', bg: 'bg-gray-100', icon: <FileText size={14} className="text-gray-400" /> },
  uploaded: { label: 'Sedang Disemak AI', color: 'text-orange-600', bg: 'bg-orange-100', icon: <AlertCircle size={14} className="text-orange-500" /> },
  verified: { label: 'Disahkan AI', color: 'text-green-700', bg: 'bg-green-100', icon: <CheckCircle size={14} className="text-green-500" /> },
  rejected: { label: 'Ditolak', color: 'text-red-700', bg: 'bg-red-100', icon: <XCircle size={14} className="text-red-500" /> },
};

export default function DocumentUpload() {
  const [docs, setDocs] = useState<DocItem[]>(initialDocs);
  const [dragging, setDragging] = useState<string | null>(null);

  const handleUpload = (id: string) => {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, status: 'uploaded', aiScore: 85, aiNote: 'AI sedang menganalisis dokumen...' } : d));
    setTimeout(() => {
      setDocs(prev => prev.map(d => d.id === id ? { ...d, status: 'verified', aiScore: 91, aiNote: 'Dokumen sah dan lengkap' } : d));
    }, 2000);
  };

  const completedCount = docs.filter(d => d.status === 'verified').length;
  const requiredCount = docs.filter(d => d.required).length;
  const requiredDone = docs.filter(d => d.required && d.status === 'verified').length;
  const overallScore = Math.round(docs.filter(d => d.aiScore).reduce((sum, d) => sum + (d.aiScore || 0), 0) / docs.filter(d => d.aiScore).length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B5E]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Muat Naik Dokumen
          </h1>
          <p className="text-gray-500 text-sm mt-1">Sila muat naik semua dokumen yang diperlukan untuk permohonan anda</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <img src="/icons/icon-ai-brain.png" alt="AI" className="w-5 h-5" />
          <span className="text-xs font-semibold text-blue-700" style={{ fontFamily: 'Inter, sans-serif' }}>
            AI Document Intelligence Aktif
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Dokumen Wajib', value: `${requiredDone}/${requiredCount}`, color: 'text-[#1B2B5E]', sub: 'Selesai' },
          { label: 'Skor Kelengkapan AI', value: `${overallScore || 0}%`, color: 'text-[#2E7D32]', sub: 'Purata keyakinan' },
          { label: 'Disahkan', value: completedCount.toString(), color: 'text-[#2E7D32]', sub: 'Dokumen' },
          { label: 'Memerlukan Tindakan', value: docs.filter(d => d.status === 'pending' && d.required).length.toString(), color: 'text-[#E65100]', sub: 'Dokumen wajib' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`} style={{ fontFamily: 'Inter, sans-serif' }}>{card.value}</p>
            <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Document List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>Senarai Dokumen Diperlukan</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {docs.map(doc => {
            const config = statusConfig[doc.status];
            return (
              <div key={doc.id} className={`p-5 transition-colors ${dragging === doc.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                onDragOver={e => { e.preventDefault(); setDragging(doc.id); }}
                onDragLeave={() => setDragging(null)}
                onDrop={e => { e.preventDefault(); setDragging(null); handleUpload(doc.id); }}>
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                    {config.icon}
                  </div>

                  {/* Doc Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>{doc.name}</h3>
                      {doc.required && (
                        <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Wajib</span>
                      )}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}
                        style={{ fontFamily: 'Inter, sans-serif' }}>
                        {config.label}
                      </span>
                    </div>

                    {/* AI Score Bar */}
                    {doc.aiScore && (
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>Skor AI:</span>
                        <div className="flex-1 max-w-32 bg-gray-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${doc.aiScore >= 90 ? 'bg-green-500' : doc.aiScore >= 70 ? 'bg-orange-400' : 'bg-red-500'}`}
                            style={{ width: `${doc.aiScore}%` }} />
                        </div>
                        <span className={`text-xs font-bold ${doc.aiScore >= 90 ? 'text-green-600' : doc.aiScore >= 70 ? 'text-orange-600' : 'text-red-600'}`}
                          style={{ fontFamily: 'Inter, sans-serif' }}>
                          {doc.aiScore}%
                        </span>
                        {doc.aiNote && (
                          <span className="text-xs text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>— {doc.aiNote}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {doc.status !== 'pending' && (
                      <button className="p-2 text-gray-400 hover:text-[#1B2B5E] hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye size={16} />
                      </button>
                    )}
                    {doc.status !== 'pending' && (
                      <button onClick={() => setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'pending', aiScore: undefined, aiNote: undefined } : d))}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    )}
                    {doc.status === 'pending' && (
                      <button onClick={() => handleUpload(doc.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1B2B5E] text-white rounded-lg text-xs font-semibold hover:bg-[#152348] transition-colors"
                        style={{ fontFamily: 'Inter, sans-serif' }}>
                        <Upload size={14} /> Muat Naik
                      </button>
                    )}
                  </div>
                </div>

                {/* Drop Zone Hint */}
                {doc.status === 'pending' && (
                  <div className={`mt-3 border-2 border-dashed rounded-lg p-3 text-center text-xs text-gray-400 transition-colors ${
                    dragging === doc.id ? 'border-[#1B2B5E] bg-blue-50 text-[#1B2B5E]' : 'border-gray-200'
                  }`} style={{ fontFamily: 'Inter, sans-serif' }}>
                    <Image size={16} className="mx-auto mb-1 opacity-50" />
                    Seret & lepas fail di sini atau klik Muat Naik • JPG, PNG, PDF • Maks 5MB
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3">
        <button className="flex-1 py-3 border border-gray-300 text-gray-600 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
          Simpan Draf
        </button>
        <button
          disabled={requiredDone < requiredCount}
          className="flex-2 px-8 py-3 bg-[#2E7D32] text-white rounded-lg font-semibold text-sm hover:bg-[#1B5E20] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Hantar Permohonan →
        </button>
      </div>
    </div>
  );
}
