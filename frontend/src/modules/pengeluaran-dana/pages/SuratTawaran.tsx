/**
 * Module 3 — Pengeluaran Dana
 * SuratTawaran.tsx — Official Financing Offer Letter
 *
 * Features:
 * - Real data from API (disbursement offer-letter endpoint)
 * - Header: TEKUN logo + official address + reference number
 * - Body: applicant name, amount, tenure, profit rate
 * - Amortization schedule (first 5 rows + totals)
 * - Footer: digital signature area + date
 * - "Jana PDF" button using jsPDF + html2canvas
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Download, ArrowLeft, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../../components/ui/PageHeader';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import disbursementService, { type OfferLetterData } from '../services/disbursementService';

export default function SuratTawaran() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const letterRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<OfferLetterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const fetchOfferLetter = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await disbursementService.getOfferLetterData(Number(id));
      setData(res.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Gagal memuatkan data surat tawaran.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOfferLetter();
  }, [fetchOfferLetter]);

  const handleGeneratePdf = async () => {
    if (!letterRef.current) return;
    setPdfLoading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).jsPDF;

      const canvas = await html2canvas(letterRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20;
      }

      const filename = `Surat_Tawaran_${data?.ref_no ?? 'TEKUN'}_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(filename);
      toast.success('PDF berjaya dijana dan dimuat turun.');
    } catch {
      toast.error('Gagal menjana PDF. Sila cuba lagi.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(amount);

  const today = new Date().toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 font-medium">{error ?? 'Data tidak dijumpai.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-[#1B2B5E] text-white rounded-lg text-sm hover:bg-blue-900"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Page Header (outside printable area) */}
      <div className="print:hidden mb-6">
        <PageHeader
          title="Surat Tawaran Pembiayaan"
          subtitle={`Rujukan: ${data.ref_no}`}
          breadcrumbs={[
            { label: 'Pengeluaran Dana', href: '/pengeluaran-dana' },
            { label: 'Surat Tawaran' },
          ]}
        />

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-[#1B2B5E] text-[#1B2B5E] rounded-lg text-sm hover:bg-blue-50 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Cetak
          </button>
          <button
            onClick={handleGeneratePdf}
            disabled={pdfLoading}
            className="flex items-center gap-2 px-5 py-2 bg-[#2E7D32] text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors disabled:opacity-60"
          >
            {pdfLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Menjana PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Jana PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Printable Letter ─────────────────────────────────────────────── */}
      <div
        ref={letterRef}
        className="bg-white max-w-3xl mx-auto shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none print:max-w-full"
        style={{ fontFamily: 'Times New Roman, serif' }}
      >
        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div className="border-b-4 border-[#1B2B5E] px-10 pt-8 pb-6">
          <div className="flex items-start justify-between">
            {/* Logo + Org Name */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#1B2B5E] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <div>
                <p className="text-[#1B2B5E] font-bold text-xl tracking-wide">TEKUN NASIONAL</p>
                <p className="text-gray-600 text-xs mt-0.5">Tabung Ekonomi Kumpulan Usaha Niaga</p>
                <p className="text-gray-500 text-xs">No. 2, Jalan Usahawan 6, Pusat Bandar Utama,</p>
                <p className="text-gray-500 text-xs">47800 Petaling Jaya, Selangor Darul Ehsan</p>
                <p className="text-gray-500 text-xs">Tel: 03-7660 2000  |  Faks: 03-7660 2100</p>
              </div>
            </div>
            {/* Reference + Date */}
            <div className="text-right text-sm">
              <p className="text-gray-500">Tarikh:</p>
              <p className="font-semibold text-gray-800">{today}</p>
              <p className="text-gray-500 mt-2">No. Rujukan:</p>
              <p className="font-bold text-[#1B2B5E]">{data.ref_no}</p>
            </div>
          </div>
        </div>

        {/* ── BODY ───────────────────────────────────────────────────────── */}
        <div className="px-10 py-8 space-y-6 text-sm text-gray-800 leading-relaxed">

          {/* Recipient */}
          <div>
            <p className="font-bold text-base">{data.applicant_name}</p>
            <p className="text-gray-600">{data.ic_no ? `No. K/P: ${data.ic_no}` : ''}</p>
            {data.address && <p className="text-gray-600 whitespace-pre-line">{data.address}</p>}
          </div>

          {/* Salutation */}
          <p>Tuan/Puan,</p>

          {/* Subject */}
          <div className="bg-gray-50 border-l-4 border-[#1B2B5E] px-4 py-3">
            <p className="font-bold text-[#1B2B5E] uppercase tracking-wide text-sm">
              SURAT TAWARAN PEMBIAYAAN TEKUN NASIONAL
            </p>
            <p className="text-gray-600 text-xs mt-1">
              Skim: {data.scheme ?? 'TEKUN Usahawan'}
            </p>
          </div>

          {/* Opening */}
          <p>
            Dengan hormatnya perkara di atas adalah dirujuk. Sukacita dimaklumkan bahawa permohonan
            pembiayaan tuan/puan telah diluluskan oleh TEKUN Nasional tertakluk kepada terma dan
            syarat berikut:
          </p>

          {/* Financing Details Table */}
          <div>
            <p className="font-bold text-[#1B2B5E] mb-3 uppercase text-xs tracking-widest">
              A. BUTIRAN PEMBIAYAAN
            </p>
            <table className="w-full border-collapse text-sm">
              <tbody>
                {[
                  ['Jumlah Pembiayaan', formatAmount(data.amount)],
                  ['Kadar Keuntungan', `${data.rate}% setahun (kadar tetap)`],
                  ['Tempoh Pembiayaan', `${data.tenure} bulan`],
                  ['Bayaran Bulanan', formatAmount(data.monthly)],
                  ['Jumlah Keuntungan', formatAmount(data.total_profit)],
                  ['Jumlah Perlu Dibayar', formatAmount(data.total_payable)],
                  ['Skim Pembiayaan', data.scheme ?? 'TEKUN Usahawan'],
                ].map(([label, value]) => (
                  <tr key={label} className="border border-gray-200">
                    <td className="px-4 py-2 bg-gray-50 font-medium w-1/2">{label}</td>
                    <td className="px-4 py-2 font-semibold text-[#1B2B5E]">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Amortization Schedule */}
          {data.schedule && data.schedule.length > 0 && (
            <div>
              <p className="font-bold text-[#1B2B5E] mb-3 uppercase text-xs tracking-widest">
                B. JADUAL AMORTISASI (RINGKASAN)
              </p>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-[#1B2B5E] text-white">
                    <th className="px-3 py-2 text-center">Bulan</th>
                    <th className="px-3 py-2 text-right">Bayaran Bulanan</th>
                    <th className="px-3 py-2 text-right">Prinsipal</th>
                    <th className="px-3 py-2 text-right">Keuntungan</th>
                    <th className="px-3 py-2 text-right">Baki</th>
                  </tr>
                </thead>
                <tbody>
                  {data.schedule.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-1.5 text-center border border-gray-200">{row.month}</td>
                      <td className="px-3 py-1.5 text-right border border-gray-200">
                        {formatAmount(row.payment)}
                      </td>
                      <td className="px-3 py-1.5 text-right border border-gray-200">
                        {formatAmount(row.principal)}
                      </td>
                      <td className="px-3 py-1.5 text-right border border-gray-200">
                        {formatAmount(row.profit)}
                      </td>
                      <td className="px-3 py-1.5 text-right border border-gray-200">
                        {formatAmount(row.balance)}
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-[#1B2B5E] text-white font-bold">
                    <td className="px-3 py-2 text-center border border-gray-300">JUMLAH</td>
                    <td className="px-3 py-2 text-right border border-gray-300">
                      {formatAmount(data.total_payable)}
                    </td>
                    <td className="px-3 py-2 text-right border border-gray-300">
                      {formatAmount(data.amount)}
                    </td>
                    <td className="px-3 py-2 text-right border border-gray-300">
                      {formatAmount(data.total_profit)}
                    </td>
                    <td className="px-3 py-2 text-right border border-gray-300">—</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-xs text-gray-500 mt-1 italic">
                * Jadual di atas menunjukkan {data.schedule.length} bulan pertama sahaja.
                Jadual penuh akan disertakan bersama perjanjian pembiayaan.
              </p>
            </div>
          )}

          {/* Terms */}
          <div>
            <p className="font-bold text-[#1B2B5E] mb-2 uppercase text-xs tracking-widest">
              C. TERMA DAN SYARAT
            </p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-gray-700">
              <li>Tawaran ini adalah sah selama <strong>14 hari</strong> dari tarikh surat ini.</li>
              <li>Pembiayaan ini adalah tertakluk kepada Prinsip Syariah (Murabahah/Bai' Bithaman Ajil).</li>
              <li>Peminjam dikehendaki menandatangani Perjanjian Pembiayaan sebelum pengeluaran dana.</li>
              <li>TEKUN Nasional berhak membatalkan tawaran ini jika maklumat yang diberikan didapati tidak benar.</li>
              <li>Bayaran balik hendaklah dibuat pada atau sebelum tarikh matang setiap bulan.</li>
            </ol>
          </div>

          {/* Closing */}
          <p>
            Tuan/Puan diharap dapat menghubungi pegawai kami untuk sebarang pertanyaan lanjut.
            Kami berharap pembiayaan ini dapat membantu perkembangan perniagaan tuan/puan.
          </p>

          <p>Sekian, terima kasih.</p>
        </div>

        {/* ── FOOTER / SIGNATURE ─────────────────────────────────────────── */}
        <div className="px-10 pb-10 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-end mt-6">
            {/* Authorised Signatory */}
            <div className="text-center">
              <div className="w-48 border-b-2 border-gray-400 mb-2 mx-auto" style={{ height: '60px' }}>
                {/* Digital signature space */}
                <div className="flex items-end justify-center h-full pb-1">
                  <span className="text-xs text-gray-400 italic">[ Tandatangan Digital ]</span>
                </div>
              </div>
              <p className="text-sm font-bold text-gray-800">PENGURUS BESAR</p>
              <p className="text-xs text-gray-600">TEKUN Nasional</p>
              <p className="text-xs text-gray-500">Tarikh: {today}</p>
            </div>

            {/* Official Stamp */}
            <div className="text-center">
              <div
                className="w-28 h-28 rounded-full border-4 border-[#1B2B5E] flex items-center justify-center mx-auto"
                style={{ borderStyle: 'dashed' }}
              >
                <div className="text-center">
                  <p className="text-[#1B2B5E] font-bold text-xs">COP</p>
                  <p className="text-[#1B2B5E] text-xs">RASMI</p>
                  <p className="text-[#1B2B5E] font-bold text-xs">TEKUN</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Cop Rasmi</p>
            </div>

            {/* Applicant Acknowledgement */}
            <div className="text-center">
              <div className="w-48 border-b-2 border-gray-400 mb-2 mx-auto" style={{ height: '60px' }}>
                <div className="flex items-end justify-center h-full pb-1">
                  <span className="text-xs text-gray-400 italic">[ Tandatangan Pemohon ]</span>
                </div>
              </div>
              <p className="text-sm font-bold text-gray-800">{data.applicant_name}</p>
              <p className="text-xs text-gray-600">Pemohon</p>
              <p className="text-xs text-gray-500">Tarikh: _______________</p>
            </div>
          </div>

          {/* Document Footer */}
          <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-400">
            <span>Dokumen ini dijana secara elektronik oleh SPPT TEKUN Nasional</span>
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {data.ref_no}
            </span>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #letter-print, #letter-print * { visibility: visible; }
          #letter-print { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}
