import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Download, Printer, CheckCircle, Mail } from 'lucide-react';
import { creditService } from '../services/creditService';
import toast from 'react-hot-toast';
import api from '@/services/api';

export default function OfferLetter() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (id) {
      generateLetter();
    }
  }, [id]);

  const generateLetter = async () => {
    try {
      setLoading(true);
      const data = await creditService.generateOfferLetter(id as string);
      setPdfUrl(data.pdf_url);
    } catch (error) {
      console.error('Error generating offer letter:', error);
      toast.error('Gagal menjana surat tawaran');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!id) return;
    try {
      setSendingEmail(true);
      await api.post(`/penilaian-kredit/${id}/send-offer-letter`);
      toast.success('Surat tawaran telah dihantar ke e-mel pemohon');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Gagal menghantar e-mel surat tawaran');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/penilaian-kredit')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Surat Tawaran Pembiayaan</h1>
          <p className="text-gray-500">Permohonan #{id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="font-bold text-navy-900 mb-1">Berjaya Dijana</h2>
            <p className="text-sm text-gray-500 mb-6">Dokumen sedia untuk dicetak atau dihantar</p>

            <div className="space-y-3">
              <button 
                className="w-full py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center justify-center gap-2"
                onClick={() => window.print()}
              >
                <Printer className="w-4 h-4" />
                Cetak Dokumen
              </button>
              
              <button 
                className="w-full py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center justify-center gap-2"
                onClick={() => {
                  if (pdfUrl) {
                    const link = document.createElement('a');
                    link.href = pdfUrl;
                    link.download = `Surat_Tawaran_${id}.pdf`;
                    link.click();
                  }
                }}
              >
                <Download className="w-4 h-4" />
                Muat Turun PDF
              </button>

              <button 
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="w-full py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Mail className="w-4 h-4" />
                {sendingEmail ? 'Menghantar...' : 'Hantar E-mel'}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-[800px] flex flex-col">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Pratonton Dokumen</span>
            </div>
            
            <div className="flex-1 bg-gray-100 p-8 overflow-auto flex justify-center">
              {loading ? (
                <div className="flex flex-col justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                  <p className="text-gray-500">Menjana dokumen PDF...</p>
                </div>
              ) : (
                <div className="bg-white w-full max-w-[21cm] min-h-[29.7cm] shadow-md p-12 relative">
                  {/* Mock PDF Content for POC */}
                  <div className="absolute top-12 right-12 text-right">
                    <p className="text-sm font-medium">Rujukan: TEKUN/{id}/2026</p>
                    <p className="text-sm">Tarikh: {new Date().toLocaleDateString('ms-MY')}</p>
                  </div>
                  
                  <div className="mt-16 mb-8">
                    <h1 className="text-xl font-bold text-center underline mb-8">SURAT TAWARAN PEMBIAYAAN TEKUN</h1>
                    
                    <div className="space-y-4 text-sm leading-relaxed">
                      <p>Tuan/Puan,</p>
                      <p className="font-bold">TAWARAN PEMBIAYAAN TEKUN NASIONAL</p>
                      <p>Dengan hormatnya perkara di atas adalah dirujuk.</p>
                      <p>2. Sukacita dimaklumkan bahawa TEKUN Nasional telah meluluskan permohonan pembiayaan tuan/puan tertakluk kepada terma dan syarat berikut:</p>
                      
                      <table className="w-full mt-4 mb-4 border-collapse">
                        <tbody>
                          <tr>
                            <td className="w-1/3 py-2 font-medium">Skim Pembiayaan</td>
                            <td className="py-2">: TEKUN Niaga</td>
                          </tr>
                          <tr>
                            <td className="w-1/3 py-2 font-medium">Amaun Diluluskan</td>
                            <td className="py-2 font-bold">: RM 50,000.00</td>
                          </tr>
                          <tr>
                            <td className="w-1/3 py-2 font-medium">Tempoh Pembiayaan</td>
                            <td className="py-2">: 60 Bulan</td>
                          </tr>
                          <tr>
                            <td className="w-1/3 py-2 font-medium">Kadar Keuntungan</td>
                            <td className="py-2">: 4.0% setahun (Kadar Rata)</td>
                          </tr>
                          <tr>
                            <td className="w-1/3 py-2 font-medium">Ansuran Bulanan</td>
                            <td className="py-2 font-bold">: RM 1,000.00</td>
                          </tr>
                        </tbody>
                      </table>
                      
                      <p>3. Sila tandatangan dokumen perjanjian ini dan kembalikan kepada pihak TEKUN Nasional dalam tempoh 14 hari dari tarikh surat ini dikeluarkan.</p>
                      <p>Sekian, terima kasih.</p>
                      <p className="mt-8 font-bold">"KEUSAHAWANAN DAN PERNIAGAAN SATU KERJAYA"</p>
                      <div className="mt-12">
                        <p>Pengurus Cawangan</p>
                        <p>TEKUN Nasional</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}