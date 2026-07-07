import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { CheckCircle, Download, Send, Edit3, Sparkles, Clock, Shield, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { creditService } from '@/modules/penilaian-kredit/services/creditService';
import api from '@/services/api';

const AiBadge = () => (
  <div className="bg-[#F3E8FF] border border-[#D8B4FE] rounded-lg px-3 py-2 text-center">
    <div className="flex items-center gap-1 text-[#673AB7] justify-center">
      <Sparkles size={12} />
      <span className="text-xs font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>Dijana oleh AI SPPT</span>
    </div>
    <p className="text-xs text-[#673AB7] mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>Tiada pengetikan manual</p>
  </div>
);

export default function OfferLetter() {
  const location = useLocation();
  const params = useParams();
  const applicationRef = location.state?.ref || params.ref || 'demo';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offerData, setOfferData] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const fetchOfferLetter = async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await creditService.generateOfferLetter(applicationRef);
        setOfferData(response.data || response);
      } catch (err) {
        console.error('Failed to fetch offer letter:', err);
        setError(true);
        toast.error('Gagal menjana surat tawaran. Menggunakan data demo.');
      } finally {
        setLoading(false);
      }
    };

    fetchOfferLetter();
  }, [applicationRef]);

  const handleSend = async () => {
    setSending(true);
    try {
      await api.post('/credit-assessment/offer-letter/send', { application_ref: applicationRef });
      setSent(true);
      toast.success('Surat tawaran berjaya dihantar ke Modul 3');
    } catch (err) {
      console.error('Failed to send offer letter:', err);
      toast.error('Gagal menghantar surat tawaran');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-10 h-10 text-[#1B2B5E] animate-spin" />
        <p className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
          Menjana Surat Tawaran AI...
        </p>
      </div>
    );
  }

  const refNo = offerData?.reference_no || 'SPPT-TAWARAN-2026-00089';
  const date = offerData?.date || '03 Julai 2026';
  const name = offerData?.applicant_name || 'Siti Nurhaliza';
  const address1 = offerData?.address_1 || 'No. 123, Jalan Melati 5/12';
  const address2 = offerData?.address_2 || 'Taman Melati, 53000 Kuala Lumpur';
  const state = offerData?.state || 'W.P. Kuala Lumpur';
  const amount = offerData?.financing_amount || 'RM 25,000.00';
  const rate = offerData?.profit_rate || '4% setahun (Kadar Tetap)';
  const tenure = offerData?.financing_tenure || '36 bulan';
  const installment = offerData?.monthly_installment || 'RM 763.89';
  const startDate = offerData?.start_date || '01 September 2026';
  const endDate = offerData?.end_date || '01 Ogos 2029';

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-[#FFEBEE] text-[#C62828] rounded-xl px-6 py-4 flex items-center gap-3">
          <Shield size={22} />
          <div>
            <p className="font-bold text-base" style={{ fontFamily: 'Inter, sans-serif' }}>Mod Sandaran Aktif</p>
            <p className="text-sm opacity-90" style={{ fontFamily: 'Inter, sans-serif' }}>Gagal memuat turun data sebenar. Menunjukkan maklumat demo.</p>
          </div>
        </div>
      )}

      <div className="bg-[#2E7D32] text-white rounded-xl px-6 py-4 flex items-center gap-3">
        <CheckCircle size={22} />
        <div>
          <p className="font-bold text-base" style={{ fontFamily: 'Inter, sans-serif' }}>DILULUSKAN — Surat Tawaran Dijana Secara Automatik oleh AI</p>
          <p className="text-sm opacity-90" style={{ fontFamily: 'Inter, sans-serif' }}>Dijana: {date} | Oleh: Sistem AI SPPT</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-gray-800 px-4 py-2 flex items-center gap-3 text-white text-xs">
            <span>≡</span>
            <span>1 / 1</span>
            <span>—</span>
            <span>100%</span>
            <span>+</span>
            <div className="flex-1" />
            <Download size={14} className="cursor-pointer hover:opacity-75" />
            <span>🖨</span>
            <span>⋮</span>
          </div>

          <div className="flex-1 overflow-auto bg-gray-50 p-4">
            <div className="bg-white shadow-sm max-w-3xl mx-auto min-h-[800px]">
              {offerData?.html_content ? (
                <div 
                  className="p-8"
                  dangerouslySetInnerHTML={{ __html: offerData.html_content }}
                />
              ) : (
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-[#1B2B5E] rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xs text-center leading-tight">TEKUN<br/>NASIONAL</span>
                      </div>
                      <div>
                        <p className="font-bold text-[#1B2B5E] text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>TEKUN NASIONAL</p>
                        <p className="text-xs text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>Perbadanan Tabung Ekonomi Kumpulan Usaha Niaga</p>
                        <p className="text-xs text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>Tingkat 15, Menara TEKUN, No. 333, Jalan Ampang</p>
                        <p className="text-xs text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>50450 Kuala Lumpur | Tel: 03-2050 3000</p>
                      </div>
                    </div>
                    <AiBadge />
                  </div>

                  <div className="border-t border-gray-200 mb-6" />

                  <div className="text-right mb-6">
                    <p className="text-sm text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>Tarikh : {date}</p>
                    <p className="text-sm text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>Rujukan : {refNo}</p>
                  </div>

                  <div className="mb-6">
                    <p className="font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>{name}</p>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>{address1}</p>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>{address2}</p>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>{state}</p>
                  </div>

                  <p className="text-sm text-gray-700 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Tuan/Puan,</p>

                  <p className="font-bold text-gray-800 text-center mb-4 underline" style={{ fontFamily: 'Inter, sans-serif' }}>
                    SURAT TAWARAN PEMBIAYAAN TEKUN USAHAWAN
                  </p>

                  <p className="text-sm text-gray-700 mb-4 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Dengan segala hormatnya, sukacita dimaklumkan bahawa permohonan pembiayaan TEKUN Usahawan Tuan/Puan telah diluluskan. Butiran tawaran pembiayaan adalah seperti berikut:
                  </p>

                  <table className="w-full border border-gray-300 text-sm mb-4">
                    <tbody>
                      {[
                        ['Jumlah Pembiayaan', amount],
                        ['Kadar Keuntungan', rate],
                        ['Tempoh Pembiayaan', tenure],
                        ['Ansuran Bulanan', installment],
                        ['Tarikh Mula Bayaran', startDate],
                        ['Tarikh Akhir Bayaran', endDate],
                      ].map(([label, value]) => (
                        <tr key={label} className="border-b border-gray-200">
                          <td className="px-3 py-2 font-semibold text-gray-700 w-1/2 border-r border-gray-200" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</td>
                          <td className="px-3 py-2 text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <p className="text-xs text-gray-600 mb-6 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Tawaran ini adalah tertakluk kepada terma dan syarat pembiayaan TEKUN Usahawan yang telah ditetapkan. Tuan/Puan dikehendaki menandatangani Surat Akuan Terima Tawaran dan Perjanjian Pembiayaan serta mematuhi semua terma dan syarat yang berkaitan.
                  </p>

                  <p className="text-sm text-gray-700 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>Sekian, terima kasih.</p>

                  <div>
                    <div className="w-32 h-10 border-b border-gray-400 mb-1" />
                    <p className="font-bold text-gray-800 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>MOHD ZULKIFLI BIN ISMAIL</p>
                    <p className="text-xs text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>Pengurus Kanan, Bahagian Pembiayaan</p>
                    <p className="text-xs text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>TEKUN Nasional</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 text-sm mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Maklumat Surat Tawaran</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>Status</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>DRAF DALAMAN</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>Masa Penjanaan AI</span>
                <div className="flex items-center gap-1 text-[#2E7D32]">
                  <Clock size={12} />
                  <span className="text-xs font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>&lt; 3 saat</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>No. Rujukan</span>
                <span className="text-xs font-semibold text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>{refNo}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-bold text-[#673AB7] mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Maklumat Diisi Secara Automatik oleh AI</p>
              <div className="space-y-2">
                {[
                  { label: 'Nama Pemohon', value: name },
                  { label: 'Jumlah Pembiayaan', value: amount },
                  { label: 'Kadar Keuntungan', value: rate },
                  { label: 'Tempoh Pembiayaan', value: tenure },
                  { label: 'Ansuran Bulanan', value: installment },
                  { label: 'Tarikh Mula Bayaran', value: startDate },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>{item.label}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-gray-700 text-right max-w-[120px] truncate" title={item.value} style={{ fontFamily: 'Inter, sans-serif' }}>{item.value}</span>
                      <div className="w-5 h-5 bg-[#F3E8FF] rounded flex items-center justify-center flex-shrink-0">
                        <Sparkles size={10} className="text-[#673AB7]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 text-sm mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Tindakan Seterusnya</h3>
            <div className="bg-[#FFF3E0] border border-[#FFE0B2] rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <Shield size={14} className="text-[#E65100] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[#E65100]" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Surat tawaran ini akan dihantar ke Modul 3 (Pengeluaran Dana) untuk penghantaran kepada pemohon dan proses e-tandatangan.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <button className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                <Edit3 size={14} /> Semak &amp; Edit Surat
              </button>
              <button onClick={handleSend} disabled={sending || sent}
                className={`w-full py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${sent ? 'bg-[#2E7D32] text-white' : 'bg-[#1B2B5E] text-white hover:bg-[#152348]'} disabled:opacity-75`}
                style={{ fontFamily: 'Inter, sans-serif' }}>
                {sending ? (
                  <><Loader2 size={16} className="animate-spin" /> Menghantar...</>
                ) : sent ? (
                  <><CheckCircle size={16} /> Dihantar ke Modul 3</>
                ) : (
                  <><Send size={16} /> Hantar ke Modul 3</>
                )}
              </button>
              <button className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                <Download size={14} /> Muat Turun PDF
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-gray-400">
                <Shield size={12} />
                <span className="text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Dijana: {date} | Oleh: Sistem AI SPPT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}