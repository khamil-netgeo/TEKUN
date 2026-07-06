import { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, AlertCircle, ChevronRight, Sparkles, User, FileText, Send, Loader2, Printer, X, Bot } from 'lucide-react';
import toast from 'react-hot-toast';
import { creditService } from '@/modules/penilaian-kredit/services/creditService';

type ApprovalLevel = 'pegawai' | 'pengurus' | 'kredit' | 'eksekutif';

interface ApprovalStep {
  id: ApprovalLevel;
  title: string;
  name: string;
  status: 'approved' | 'pending' | 'waiting';
  timestamp?: string;
  comment?: string;
  limit: string;
}

const steps: ApprovalStep[] = [
  { id: 'pegawai', title: 'Pegawai Cawangan', name: 'Ahmad Faizal', status: 'approved', timestamp: '03/07/2026 09:15', comment: 'Dokumen lengkap, layak untuk penilaian lanjut.', limit: 'Sehingga RM 5,000' },
  { id: 'pengurus', title: 'Pengurus Cawangan', name: 'Noraini Binti Hassan', status: 'approved', timestamp: '03/07/2026 11:30', comment: 'Skor kredit memuaskan. Disokong untuk kelulusan.', limit: 'Sehingga RM 15,000' },
  { id: 'kredit', title: 'Pegawai Kredit', name: 'Mohd Rizal', status: 'pending', limit: 'Sehingga RM 50,000' },
  { id: 'eksekutif', title: 'Eksekutif Pembiayaan', name: "Dato' Azman", status: 'waiting', limit: 'Melebihi RM 50,000' },
];

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; className: string }> = {
    approved: { label: 'Diluluskan', className: 'bg-green-100 text-green-700' },
    pending: { label: 'Menunggu Tindakan', className: 'bg-orange-100 text-orange-700' },
    waiting: { label: 'Belum Sampai', className: 'bg-gray-100 text-gray-500' },
  };
  const s = map[status] ?? { label: status, className: 'bg-gray-100 text-gray-500' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.className}`}>
      {s.label}
    </span>
  );
};

export default function ApprovalWorkflow() {
  const { ref } = useParams<{ ref?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const applicant = location.state?.applicant;
  const appId = ref ? decodeURIComponent(ref) : '';

  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Offer Letter AI states
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [letterHtml, setLetterHtml] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleApprove = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    setSubmitting(false);
    setSubmitted(true);
    toast.success('Kelulusan berjaya direkodkan.');
  };

  const handleGenerateLetter = async () => {
    if (!appId) {
      toast.error('ID permohonan tidak dijumpai.');
      return;
    }

    setGeneratingLetter(true);
    try {
      const response = await creditService.generateOfferLetter(appId);
      if (response?.html_content) {
        setLetterHtml(response.html_content);
        setShowModal(true);
        toast.success(response.message || 'Surat tawaran berjaya dijana oleh AI!');
      } else {
        toast.error('Gagal mendapatkan kandungan surat tawaran.');
      }
    } catch (error: any) {
      const msg = error?.message || error?.response?.data?.message || 'Ralat ketika menjana surat tawaran AI.';
      toast.error(msg);
    } finally {
      setGeneratingLetter(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Derive display values — use real applicant data if available, else show from appId
  const displayName = applicant?.applicant_name ?? '—';
  const displayScheme = applicant?.scheme ?? '—';
  const displayAmount = applicant?.amount_requested
    ? `RM ${Number(applicant.amount_requested).toLocaleString('ms-MY')}`
    : '—';
  const displayScore = applicant?.ai_score ? `${applicant.ai_score}/100` : '—';

  return (
    <>
      {/* Main Page (hidden when printing) */}
      <div className="space-y-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B5E]">Aliran Kerja Kelulusan</h1>

          {/* Applicant Info Banner */}
          {(applicant || appId) && (
            <div className="mt-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-6 items-center">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">No. Permohonan</p>
                <p className="font-mono font-bold text-sm text-[#1B2B5E]">{appId || '—'}</p>
              </div>
              {applicant && (
                <>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Nama Pemohon</p>
                    <p className="font-semibold text-sm text-gray-900">{displayName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Jumlah Dipohon</p>
                    <p className="font-semibold text-sm text-gray-900">{displayAmount}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* AI Recommendation Banner */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
          <Sparkles size={18} className="text-purple-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-purple-800">Cadangan AI — Kelulusan Automatik</p>
            <p className="text-xs text-purple-700 mt-1">
              Berdasarkan skor kredit {displayScore} dan semua semakan automatik lulus, sistem AI mengesyorkan
              kelulusan automatik pada had {displayAmount} dengan tempoh 36 bulan.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Approval Hierarchy */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-5">Hierarki Kelulusan</h2>
            <div className="space-y-4">
              {steps.map((step, idx) => (
                <div key={step.id} className="relative">
                  {idx < steps.length - 1 && (
                    <div className={`absolute left-5 top-12 w-0.5 h-8 ${step.status === 'approved' ? 'bg-green-300' : 'bg-gray-200'}`} />
                  )}
                  <div className={`flex items-start gap-4 p-4 rounded-xl border ${
                    step.status === 'approved' ? 'border-green-100 bg-green-50' :
                    step.status === 'pending' ? 'border-orange-200 bg-orange-50' : 'border-gray-100 bg-gray-50'
                  }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step.status === 'approved' ? 'bg-green-500' :
                      step.status === 'pending' ? 'bg-orange-500' : 'bg-gray-300'
                    }`}>
                      {step.status === 'approved' ? <CheckCircle size={20} className="text-white" /> :
                       step.status === 'pending' ? <Clock size={20} className="text-white" /> :
                       <User size={20} className="text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{step.title}</p>
                          <p className="text-xs text-gray-500">{step.name} · {step.limit}</p>
                        </div>
                        <StatusBadge status={step.status} />
                      </div>
                      {step.timestamp && (
                        <p className="text-xs text-gray-400 mt-1">
                          <Clock size={10} className="inline mr-1" />{step.timestamp}
                        </p>
                      )}
                      {step.comment && (
                        <p className="text-xs text-gray-600 mt-2 bg-white rounded-lg px-3 py-2 border border-gray-100">
                          "{step.comment}"
                        </p>
                      )}
                      {step.status === 'pending' && !submitted && (
                        <div className="mt-3 space-y-2">
                          <textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            placeholder="Masukkan ulasan kelulusan..."
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none resize-none"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleApprove}
                              disabled={submitting}
                              className="flex-1 py-2 bg-[#2E7D32] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-[#1B5E20] disabled:opacity-50"
                            >
                              {submitting
                                ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <CheckCircle size={12} />}
                              Luluskan
                            </button>
                            <button className="flex-1 py-2 bg-red-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                              <AlertCircle size={12} /> Tolak
                            </button>
                            <button className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                              <Send size={12} /> Kuari
                            </button>
                          </div>
                        </div>
                      )}
                      {step.status === 'pending' && submitted && (
                        <div className="mt-2 flex items-center gap-2 text-green-600">
                          <CheckCircle size={14} />
                          <span className="text-xs font-bold">Diluluskan — Sila jana Surat Tawaran di bawah.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-4">
            {/* Application Summary */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-800 text-sm mb-4">Ringkasan Permohonan</h3>
              <div className="space-y-3">
                {[
                  { label: 'Pemohon', value: displayName },
                  { label: 'Skim', value: displayScheme },
                  { label: 'Jumlah Dipohon', value: displayAmount },
                  { label: 'Skor Kredit', value: displayScore },
                  { label: 'No. Permohonan', value: appId || '—' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between">
                    <span className="text-xs text-gray-500">{item.label}</span>
                    <span className="text-xs font-bold text-gray-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Auto Checks */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-800 text-sm mb-3">Semakan Automatik</h3>
              <div className="space-y-2">
                {['Semakan Muflis', 'Semakan CCRIS', 'Semakan CTOS', 'Semakan SSM', 'Had DSR (≤40%)', 'Umur Layak'].map(c => (
                  <div key={c} className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{c}</span>
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle size={12} />
                      <span className="text-xs font-semibold">Lulus</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Jana Surat Tawaran Button */}
            <button
              onClick={handleGenerateLetter}
              disabled={generatingLetter}
              className="w-full py-3 bg-[#1B2B5E] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#152348] disabled:opacity-70 transition-colors"
            >
              {generatingLetter ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Enjin AI sedang menyediakan surat...
                </>
              ) : (
                <>
                  <FileText size={16} />
                  Jana Surat Tawaran
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Offer Letter Modal */}
      {showModal && letterHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-transparent print:block print:inset-auto print:z-auto">
          <div className="bg-white w-full max-w-4xl max-h-[92vh] flex flex-col rounded-xl shadow-2xl overflow-hidden print:max-w-full print:max-h-full print:shadow-none print:rounded-none">

            {/* Modal Header — hidden on print */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50 print:hidden flex-shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-[#1B2B5E]">Pratonton Surat Tawaran</h3>
                <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-[#673AB7]">
                  <Bot size={12} className="mr-1" />
                  Dijana oleh Gemini 3.1 Pro
                </span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded"
                aria-label="Tutup modal"
              >
                <X size={22} />
              </button>
            </div>

            {/* Letter Content — scrollable, full page on print */}
            <div className="flex-1 overflow-y-auto bg-gray-200 p-6 print:bg-white print:p-0 print:overflow-visible">
              <div
                className="bg-white mx-auto shadow-md min-h-[1056px] w-full max-w-[816px] print:shadow-none print:min-h-0 print:max-w-full"
                dangerouslySetInnerHTML={{ __html: letterHtml }}
              />
            </div>

            {/* Modal Footer — hidden on print */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 print:hidden flex-shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors text-sm"
              >
                Tutup
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-4 py-2 bg-[#E65100] text-white rounded-lg hover:bg-orange-700 font-medium transition-colors text-sm"
              >
                <Printer size={16} className="mr-2" />
                Cetak / Muat Turun PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print-only: render letter directly without modal chrome */}
      {letterHtml && (
        <div
          className="hidden print:block"
          dangerouslySetInnerHTML={{ __html: letterHtml }}
        />
      )}
    </>
  );
}
