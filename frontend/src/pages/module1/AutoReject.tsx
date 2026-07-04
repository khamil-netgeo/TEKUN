import { useNavigate } from 'react-router-dom';
import { XCircle, AlertTriangle, Phone, Mail, FileText, ChevronRight } from 'lucide-react';

const rejectReasons = [
  {
    code: 'AR-001',
    title: 'Rekod Muflis Aktif',
    description: 'Pemohon mempunyai rekod muflis aktif dalam pangkalan data Jabatan Insolvensi Malaysia.',
    source: 'Jabatan Insolvensi Malaysia',
    severity: 'critical',
  },
  {
    code: 'AR-002',
    title: 'Senarai Hitam CCRIS',
    description: 'Rekod kredit menunjukkan akaun tertunggak melebihi 6 bulan dalam sistem CCRIS BNM.',
    source: 'CCRIS / BNM',
    severity: 'critical',
  },
  {
    code: 'AR-003',
    title: 'Had Umur Tidak Layak',
    description: 'Pemohon berumur 68 tahun. Had umur maksimum untuk pembiayaan TEKUN adalah 65 tahun.',
    source: 'Semakan Sistem Dalaman',
    severity: 'warning',
  },
];

export default function AutoReject() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Red Header Banner */}
      <div className="bg-red-600 text-white py-6 px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <XCircle size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
              Permohonan Ditolak Secara Automatik
            </h1>
            <p className="text-red-100 text-sm mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              Sistem AI telah mengesan isu yang menghalang kelayakan pembiayaan
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* AI Badge */}
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
          <img src="/icons/icon-ai-brain.png" alt="AI" className="w-5 h-5" />
          <span className="text-sm font-semibold text-red-700" style={{ fontFamily: 'Inter, sans-serif' }}>
            Penolakan automatik oleh Enjin AI SPPT — Tiada campur tangan manusia diperlukan
          </span>
        </div>

        {/* Application Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">No. Rujukan</span>
              <p className="font-bold text-gray-800 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>SPPT-2026-00847</p>
            </div>
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Nama Pemohon</span>
              <p className="font-bold text-gray-800 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>Ahmad bin Abdullah</p>
            </div>
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Tarikh Semakan</span>
              <p className="font-bold text-gray-800 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>4 Julai 2026, 09:42</p>
            </div>
          </div>
        </div>

        {/* Reject Reasons */}
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
          Sebab-Sebab Penolakan
        </h2>
        <div className="space-y-4 mb-6">
          {rejectReasons.map(reason => (
            <div key={reason.code} className={`bg-white rounded-xl border-l-4 p-5 shadow-sm ${
              reason.severity === 'critical' ? 'border-l-red-500' : 'border-l-orange-400'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  reason.severity === 'critical' ? 'bg-red-100' : 'bg-orange-100'
                }`}>
                  {reason.severity === 'critical'
                    ? <XCircle size={16} className="text-red-500" />
                    : <AlertTriangle size={16} className="text-orange-500" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      reason.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`} style={{ fontFamily: 'Inter, sans-serif' }}>
                      {reason.code}
                    </span>
                    <h3 className="font-bold text-gray-800 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>{reason.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>{reason.description}</p>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">Sumber:</span>
                    <span className="text-xs font-semibold text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>{reason.source}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* What to Do Next */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
          <h3 className="font-bold text-blue-800 mb-3 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Langkah Seterusnya</h3>
          <div className="space-y-3">
            {[
              { icon: <FileText size={16} />, text: 'Hubungi Jabatan Insolvensi untuk pelepasan muflis (jika berkenaan)' },
              { icon: <Phone size={16} />, text: 'Hubungi TEKUN di 1-800-88-1234 untuk maklumat lanjut' },
              { icon: <Mail size={16} />, text: 'Emel salinan surat penolakan ke sppt@tekun.gov.my' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-blue-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                <div className="text-blue-500">{item.icon}</div>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* Appeal Option */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-800 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Rayuan Penolakan</h3>
              <p className="text-xs text-gray-500 mt-1">Jika anda percaya ini adalah kesilapan, anda boleh mengemukakan rayuan</p>
            </div>
            <button className="flex items-center gap-1 text-[#1B2B5E] font-semibold text-sm hover:underline" style={{ fontFamily: 'Inter, sans-serif' }}>
              Buat Rayuan <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => navigate('/')} className="flex-1 py-3 border border-gray-300 text-gray-600 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
            Kembali ke Laman Utama
          </button>
          <button onClick={() => navigate('/login')} className="flex-1 py-3 bg-[#1B2B5E] text-white rounded-lg font-semibold text-sm hover:bg-[#152348] transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
            Log Masuk →
          </button>
        </div>
      </div>
    </div>
  );
}
