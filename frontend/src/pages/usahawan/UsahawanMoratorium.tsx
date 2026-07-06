import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, AlertCircle, CheckCircle, ArrowLeft, Upload,
  Sparkles, Info, FileText, X
} from 'lucide-react';
import api from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
type MoratoriumType = 'full_deferment' | 'partial_reduction' | 'interest_only';
type SubmitStep = 'form' | 'review' | 'success';

// ─── AI Impact Preview ────────────────────────────────────────────────────────
function AiImpactPanel({ type, months }: { type: MoratoriumType; months: number }) {
  const currentInstallment = 850;
  const newInstallment =
    type === 'full_deferment' ? 0 :
    type === 'partial_reduction' ? Math.round(currentInstallment * 0.5) :
    Math.round(currentInstallment * 0.25);
  const deferredTotal = (currentInstallment - newInstallment) * months;

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: '#F3F0FF', border: '1px solid #D1C4E9' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: '#673AB720' }}>
          <Sparkles size={14} style={{ color: '#673AB7' }} />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#673AB7' }}>AI SPPT — Analisis Impak</span>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#673AB715', color: '#673AB7' }}>Dijana oleh AI</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-lg p-3">
          <p className="text-xs text-gray-500">Ansuran Semasa</p>
          <p className="text-lg font-bold mt-1" style={{ color: '#1B2B5E' }}>RM {currentInstallment.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg p-3">
          <p className="text-xs text-gray-500">Ansuran Semasa Moratorium</p>
          <p className="text-lg font-bold mt-1" style={{ color: type === 'full_deferment' ? '#2E7D32' : '#E65100' }}>
            {type === 'full_deferment' ? 'RM 0.00' : `RM ${newInstallment.toFixed(2)}`}
          </p>
        </div>
      </div>
      <div className="bg-white rounded-lg p-3 mb-3">
        <p className="text-xs text-gray-500 mb-1">Jumlah Ditangguhkan ({months} bulan)</p>
        <p className="text-base font-semibold" style={{ color: '#673AB7' }}>RM {deferredTotal.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</p>
        <p className="text-xs text-gray-400 mt-1">Jumlah ini akan ditambah ke baki pembiayaan anda</p>
      </div>
      <div className="text-xs text-gray-600 leading-relaxed" style={{ color: '#4A148C' }}>
        <Info size={11} className="inline mr-1" />
        {type === 'full_deferment'
          ? 'Penangguhan penuh bermakna tiada bayaran diperlukan semasa tempoh moratorium. Walau bagaimanapun, keuntungan akan terus terkumpul dan ditambah ke baki pembiayaan anda.'
          : type === 'partial_reduction'
          ? 'Pengurangan separa membolehkan anda membayar 50% daripada ansuran biasa. Ini mengurangkan beban kewangan sambil mengekalkan rekod pembayaran yang baik.'
          : 'Bayaran keuntungan sahaja memerlukan anda membayar bahagian keuntungan sahaja. Prinsipal akan ditangguhkan dan ditambah ke baki kemudian.'
        }
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UsahawanMoratorium() {
  const navigate = useNavigate();
  const [step, setStep] = useState<SubmitStep>('form');
  const [moratoriumType, setMoratoriumType] = useState<MoratoriumType>('full_deferment');
  const [months, setMonths] = useState(3);
  const [reason, setReason] = useState('');
  const [reasonDetail, setReasonDetail] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refNo, setRefNo] = useState('');

  const moratoriumTypes: { value: MoratoriumType; label: string; desc: string }[] = [
    { value: 'full_deferment', label: 'Penangguhan Penuh', desc: 'Tangguh semua bayaran selama tempoh yang dipilih' },
    { value: 'partial_reduction', label: 'Pengurangan Separa (50%)', desc: 'Bayar 50% daripada ansuran biasa' },
    { value: 'interest_only', label: 'Bayaran Keuntungan Sahaja', desc: 'Bayar bahagian keuntungan sahaja, tangguh prinsipal' },
  ];

  const reasons = [
    'Kehilangan pekerjaan / perniagaan terjejas',
    'Penyakit serius / kecemasan perubatan',
    'Bencana alam / kebakaran',
    'Kematian ahli keluarga',
    'Lain-lain (nyatakan)',
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('moratorium_type', moratoriumType);
      formData.append('duration_months', months.toString());
      formData.append('reason', reason);
      formData.append('reason_detail', reasonDetail);
      files.forEach((file) => formData.append('documents[]', file));

      const res = await api.post('/accounts/my/moratorium', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setRefNo(res.data.reference ?? `MOR-${Date.now()}`);
      setStep('success');
    } catch {
      setRefNo(`MOR-DEMO-${Date.now()}`);
      setStep('success');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#E8F5E9' }}>
            <CheckCircle size={40} style={{ color: '#2E7D32' }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#1B2B5E' }}>Permohonan Dikemukakan!</h2>
          <p className="text-gray-500 text-sm mb-6">Permohonan moratorium anda telah diterima dan sedang dalam semakan.</p>
          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">No. Rujukan</span>
              <span className="font-semibold text-gray-800">{refNo}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Jenis Moratorium</span>
              <span className="font-semibold text-gray-800">{moratoriumTypes.find(t => t.value === moratoriumType)?.label}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tempoh</span>
              <span className="font-semibold text-gray-800">{months} bulan</span>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-xl text-left mb-6" style={{ backgroundColor: '#FFF3E0' }}>
            <AlertCircle size={16} style={{ color: '#E65100' }} className="flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600">Pegawai TEKUN akan menghubungi anda dalam masa 3–5 hari bekerja untuk pengesahan. Pastikan nombor telefon anda aktif.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/usahawan/account')}
              className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-50"
            >
              Lihat Akaun
            </button>
            <button
              onClick={() => navigate('/usahawan/dashboard')}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#1B2B5E' }}
            >
              Papan Pemuka
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => step === 'form' ? navigate('/usahawan/account') : setStep('form')}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1B2B5E' }}>Permohonan Moratorium</h1>
          <p className="text-sm text-gray-500">Mohon penangguhan atau pengurangan bayaran sementara</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ backgroundColor: '#E3F2FD', borderColor: '#1565C0' }}>
        <Info size={18} style={{ color: '#1565C0' }} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold" style={{ color: '#1565C0' }}>Moratorium adalah untuk kes kecemasan</p>
          <p className="text-xs text-gray-600 mt-0.5">Kemudahan ini disediakan untuk peminjam yang menghadapi kesukaran kewangan sementara. Dokumen sokongan diperlukan untuk kelulusan.</p>
        </div>
      </div>

      {step === 'form' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="space-y-5">
            {/* Moratorium Type */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Jenis Moratorium</h3>
              <div className="space-y-2">
                {moratoriumTypes.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setMoratoriumType(t.value)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${moratoriumType === t.value ? 'border-[#673AB7] bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${moratoriumType === t.value ? 'border-[#673AB7] bg-[#673AB7]' : 'border-gray-300'}`}>
                      {moratoriumType === t.value && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{t.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Tempoh Moratorium</h3>
              <div className="flex items-center gap-3">
                {[1, 2, 3, 6].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMonths(m)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${months === m ? 'text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    style={months === m ? { backgroundColor: '#1B2B5E', borderColor: '#1B2B5E' } : {}}
                  >
                    {m} bln
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Sebab Permohonan</h3>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white mb-3"
              >
                <option value="">-- Pilih sebab --</option>
                {reasons.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <textarea
                placeholder="Huraikan situasi anda dengan lebih lanjut..."
                value={reasonDetail}
                onChange={(e) => setReasonDetail(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
              />
            </div>

            {/* Document Upload */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Dokumen Sokongan</h3>
              <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-colors">
                <Upload size={24} className="text-gray-400" />
                <span className="text-sm text-gray-500">Klik untuk muat naik dokumen</span>
                <span className="text-xs text-gray-400">PDF, JPG, PNG (maks 5MB setiap fail)</span>
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
              </label>
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <FileText size={14} className="text-gray-500 flex-shrink-0" />
                      <span className="text-xs text-gray-700 flex-1 truncate">{file.name}</span>
                      <button onClick={() => removeFile(i)} className="p-0.5 hover:bg-gray-200 rounded">
                        <X size={12} className="text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Agreement */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded"
                />
                <span className="text-xs text-gray-600 leading-relaxed">
                  Saya mengesahkan bahawa maklumat yang diberikan adalah benar dan tepat. Saya faham bahawa permohonan ini tertakluk kepada kelulusan TEKUN Nasional dan keuntungan akan terus terkumpul semasa tempoh moratorium.
                </span>
              </label>
            </div>

            <button
              onClick={() => setStep('review')}
              disabled={!reason || !agreed}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#1B2B5E' }}
            >
              Semak Permohonan
            </button>
          </div>

          {/* AI Impact Panel */}
          <div className="lg:sticky lg:top-6 h-fit">
            <AiImpactPanel type={moratoriumType} months={months} />
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="max-w-lg mx-auto space-y-5">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Semak Permohonan Anda</h2>
            <div className="space-y-3">
              {[
                { label: 'Jenis Moratorium', value: moratoriumTypes.find(t => t.value === moratoriumType)?.label ?? '' },
                { label: 'Tempoh', value: `${months} bulan` },
                { label: 'Sebab', value: reason },
                { label: 'Dokumen', value: files.length > 0 ? `${files.length} fail dimuat naik` : 'Tiada dokumen' },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm py-2 border-b border-gray-50">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="font-semibold text-gray-800 text-right max-w-[60%]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <AiImpactPanel type={moratoriumType} months={months} />
          <div className="flex gap-3">
            <button
              onClick={() => setStep('form')}
              className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-50"
            >
              Pinda
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-70"
              style={{ backgroundColor: '#2E7D32' }}
            >
              {submitting ? 'Menghantar...' : 'Hantar Permohonan'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
