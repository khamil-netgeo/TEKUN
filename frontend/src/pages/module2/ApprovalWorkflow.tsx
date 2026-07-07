import { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { CheckCircle, Clock, AlertCircle, ChevronRight, Sparkles, User, FileText, Send, X, Printer } from 'lucide-react';
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
  const s = map[status];
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.className}`} style={{ fontFamily: 'Inter, sans-serif' }}>{s.label}</span>;
};

export default function ApprovalWorkflow() {
  const { ref } = useParams<{ ref?: string }>();
  const location = useLocation();
  const applicant = location.state?.applicant;
  const appRef = ref ? decodeURIComponent(ref) : '';
  
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerData, setOfferData] = useState<any>(null);

  const handleApprove = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    setSubmitting(false);
    setSubmitted(true);
  };

  const handleGenerateOffer = async () => {
    setShowOfferModal(true);
    setOfferLoading(true);
    const referenceNo = appRef || applicant?.ref_no || 'SPPT-2026-07-00089';
    
    try {
      const data = await creditService.generateOfferLetter(referenceNo);
      setOfferData(data);
    } catch (error) {
      // Fallback demo data on error
      const amount = applicant?.amount_requested || 25000;
      setOfferData({
        ref_no: referenceNo,
        applicant_name: applicant?.applicant_name || 'Siti Nurhaliza',
        amount: amount,
        tenure: 36,
        html_content: `
          <div class="space-y-4 text-sm text-gray-700">
            <p>Merujuk kepada perkara di atas, sukacita dimaklumkan bahawa permohonan pembiayaan TEKUN anda telah <strong>DILULUSKAN</strong>.</p>
            <p>Butiran kelulusan pembiayaan adalah seperti berikut:</p>
            <ul class="list-disc pl-5 space-y-1 font-medium text-gray-900">
              <li>Jumlah Pembiayaan: RM ${amount.toLocaleString('ms-MY')}.00</li>
              <li>Tempoh Pembiayaan: 36 Bulan</li>
              <li>Kadar Keuntungan: 4% setahun</li>
            </ul>
            <p>Sila bawa dokumen pengenalan diri asal ke cawangan TEKUN berhampiran untuk urusan menandatangani perjanjian pembiayaan dalam tempoh 14 hari bekerja dari tarikh surat ini.</p>
            <br/>
            <p>Sekian, terima kasih.</p>
            <p class="font-bold">TEKUN Nasional</p>
          </div>
        `
      });
    } finally {
      setOfferLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B2B5E]" style={{ fontFamily: 'Inter, sans-serif' }}>Aliran Kerja Kelulusan</h1>
        {/* Applicant Info Banner */}
        {(applicant || appRef) && (
          <div className="mt-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-6 items-center">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">No. Permohonan</p>
              <p className="font-mono font-bold text-sm" style={{ color: '#1B2B5E' }}>{appRef || 'SPPT-2026-07-00089'}</p>
            </div>
            {applicant && (
              <>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Nama Pemohon</p>
                  <p className="font-semibold text-sm text-gray-900">{applicant.applicant_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Jumlah Dipohon</p>
                  <p className="font-semibold text-sm text-gray-900">RM {applicant.amount_requested?.toLocaleString('ms-MY') ?? '—'}</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
        <Sparkles size={18} className="text-[#673AB7] mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-[#673AB7]" style={{ fontFamily: 'Inter, sans-serif' }}>Cadangan AI — Kelulusan Automatik</p>
          <p className="text-xs text-purple-700 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>Berdasarkan skor kredit 78/100 (Gred A) dan semua semakan automatik lulus, sistem AI mengesyorkan kelulusan automatik pada had RM 25,000 dengan tempoh 36 bulan.</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-5" style={{ fontFamily: 'Inter, sans-serif' }}>Hierarki Kelulusan</h2>
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
                    step.status === 'approved' ? 'bg-[#2E7D32]' : step.status === 'pending' ? 'bg-[#E65100]' : 'bg-gray-300'
                  }`}>
                    {step.status === 'approved' ? <CheckCircle size={20} className="text-white" /> :
                     step.status === 'pending' ? <Clock size={20} className="text-white" /> :
                     <User size={20} className="text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-800 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>{step.title}</p>
                        <p className="text-xs text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>{step.name} · {step.limit}</p>
                      </div>
                      <StatusBadge status={step.status} />
                    </div>
                    {step.timestamp && <p className="text-xs text-gray-400 mt-1"><Clock size={10} className="inline mr-1" />{step.timestamp}</p>}
                    {step.comment && <p className="text-xs text-gray-600 mt-2 bg-white rounded-lg px-3 py-2 border border-gray-100">"{step.comment}"</p>}
                    {step.status === 'pending' && !submitted && (
                      <div className="mt-3 space-y-2">
                        <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Masukkan ulasan kelulusan..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none resize-none" rows={2} />
                        <div className="flex gap-2">
                          <button onClick={handleApprove} disabled={submitting} className="flex-1 py-2 bg-[#2E7D32] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-[#1B5E20] disabled:opacity-50">
                            {submitting ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={12} />} Luluskan
                          </button>
                          <button className="flex-1 py-2 bg-[#C62828] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1"><AlertCircle size={12} /> Tolak</button>
                          <button className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Send size={12} /> Kuari</button>
                        </div>
                      </div>
                    )}
                    {step.status === 'pending' && submitted && (
                      <div className="mt-2 flex items-center gap-2 text-[#2E7D32]"><CheckCircle size={14} /><span className="text-xs font-bold">Diluluskan — Surat Tawaran sedang dijana oleh AI...</span></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 text-sm mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Ringkasan Permohonan</h3>
            <div className="space-y-3">
              {[{label:'Pemohon',value:'Siti Nurhaliza'},{label:'Skim',value:'TEKUN Usahawan'},{label:'Jumlah Dipohon',value:'RM 25,000'},{label:'Skor Kredit',value:'78/100 (Gred A)'},{label:'Tempoh',value:'36 bulan'},{label:'Ansuran',value:'RM 763.89/bulan'}].map(item=>(
                <div key={item.label} className="flex justify-between">
                  <span className="text-xs text-gray-500">{item.label}</span>
                  <span className="text-xs font-bold text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 text-sm mb-3">Semakan Automatik</h3>
            <div className="space-y-2">
              {['Semakan Muflis','Semakan CCRIS','Semakan CTOS','Semakan SSM','Had DSR (≤40%)','Umur Layak'].map(c=>(
                <div key={c} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{c}</span>
                  <div className="flex items-center gap-1 text-[#2E7D32]"><CheckCircle size={12}/><span className="text-xs font-semibold">Lulus</span></div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={handleGenerateOffer} className="w-full py-3 bg-[#1B2B5E] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#152348]">
            <FileText size={16} /> Jana Surat Tawaran <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Offer Letter Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-[#1B2B5E]" style={{ fontFamily: 'Inter, sans-serif' }}>Surat Tawaran Pembiayaan</h2>
                {!offerLoading && offerData && (
                  <span className="px-2.5 py-1 bg-green-100 text-[#2E7D32] text-xs font-bold rounded-full flex items-center gap-1">
                    <CheckCircle size={14} /> Berjaya Dijana
                  </span>
                )}
              </div>
              <button onClick={() => setShowOfferModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {offerLoading ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                  <div className="w-10 h-10 border-4 border-purple-200 border-t-[#673AB7] rounded-full animate-spin"></div>
                  <p className="text-sm font-medium text-[#673AB7] flex items-center gap-2">
                    <Sparkles size={16} /> AI sedang menjana surat tawaran...
                  </p>
                </div>
              ) : offerData ? (
                <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
                  <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-6">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Rujukan</p>
                      <p className="font-mono font-bold text-sm text-[#1B2B5E]">{offerData.ref_no}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Pemohon</p>
                      <p className="font-bold text-sm text-gray-900">{offerData.applicant_name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Jumlah Tawaran</p>
                      <p className="font-bold text-lg text-[#2E7D32]">RM {offerData.amount?.toLocaleString('ms-MY')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tempoh</p>
                      <p className="font-bold text-lg text-gray-900">{offerData.tenure} Bulan</p>
                    </div>
                  </div>

                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: offerData.html_content }} />
                  
                  <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-2 text-[#673AB7] bg-purple-50 p-3 rounded-lg">
                    <Sparkles size={16} />
                    <span className="text-xs font-medium">Kandungan surat ini dijana secara automatik oleh AI TEKUN berdasarkan kelulusan sistem.</span>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="p-5 border-t border-gray-100 bg-white flex justify-end gap-3">
              <button onClick={() => setShowOfferModal(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">
                Tutup
              </button>
              <button onClick={() => window.print()} disabled={offerLoading} className="px-5 py-2.5 text-sm font-bold text-white bg-[#1B2B5E] rounded-xl hover:bg-[#152348] flex items-center gap-2 disabled:opacity-50">
                <Printer size={16} /> Cetak Surat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}