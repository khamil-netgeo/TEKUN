import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, Loader2, CheckCircle, AlertCircle, X, Lightbulb, Plus } from 'lucide-react';
import api from '@/services/api';
import PageHeader from '@/components/ui/PageHeader';
import AiBadge from '@/components/ui/AiBadge';

interface MoratoriumForm {
  account_no: string;
  reason: string;
  duration_months: number;
  supporting_document: File | null;
}

const UsahawanMoratorium: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<MoratoriumForm>({
    account_no: 'ACC-2026-00123', // Pre-filled for demo
    reason: '',
    duration_months: 3,
    supporting_document: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setForm((prev) => ({ ...prev, supporting_document: e.target.files![0] }));
    }
  };

  const simulateAiAnalysis = () => {
    setAiAnalysis("AI sedang menganalisis kelayakan anda berdasarkan rekod pembayaran dan alasan yang diberikan...");
    setTimeout(() => {
      setAiAnalysis("Berdasarkan rekod pembayaran anda yang konsisten, permohonan moratorium ini mempunyai kebarangkalian tinggi (85%) untuk diluluskan.");
    }, 1500);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      // const response = await api.post('/api/usahawan/moratorium', form);
      setIsSuccess(true);
    } catch (err: any) {
      setError('Ralat menghantar permohonan. Sila cuba lagi.');
      console.error('Failed to submit moratorium:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Permohonan Berjaya Dihantar</h2>
          <p className="text-gray-600 mb-6">
            Permohonan moratorium anda untuk akaun {form.account_no} telah berjaya dihantar dan sedang diproses. 
            Anda akan dimaklumkan mengenai status permohonan dalam masa 3-5 hari bekerja.
          </p>
          <button
            onClick={() => navigate('/usahawan/dashboard')}
            className="px-6 py-2 rounded-md text-white font-medium transition-colors"
            style={{ backgroundColor: '#1B2B5E' }}
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <PageHeader
          title="Permohonan Moratorium"
          description="Mohon penangguhan bayaran ansuran pembiayaan anda."
        />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Akaun Pembiayaan</label>
              <input
                type="text"
                name="account_no"
                value={form.account_no}
                disabled
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tempoh Moratorium (Bulan)</label>
              <select
                name="duration_months"
                value={form.duration_months}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-navy-500 focus:border-navy-500"
                required
              >
                <option value={1}>1 Bulan</option>
                <option value={3}>3 Bulan</option>
                <option value={6}>6 Bulan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sebab Permohonan</label>
              <textarea
                name="reason"
                value={form.reason}
                onChange={handleInputChange}
                onBlur={simulateAiAnalysis}
                rows={4}
                placeholder="Sila nyatakan sebab permohonan moratorium anda secara terperinci..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-navy-500 focus:border-navy-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dokumen Sokongan (Pilihan)</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-navy-600 hover:text-navy-500 focus-within:outline-none">
                      <span style={{ color: '#1B2B5E' }}>Muat naik fail</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                    </label>
                    <p className="pl-1">atau seret dan lepas</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF, PNG, JPG sehingga 10MB</p>
                </div>
              </div>
              {form.supporting_document && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  {form.supporting_document.name}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !form.reason}
                className="flex items-center gap-2 px-6 py-2 rounded-md text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: '#1B2B5E' }}
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                Hantar Permohonan
              </button>
            </div>
          </form>
        </div>

        {/* AI Assistant Panel */}
        <div className="lg:col-span-1">
          <div className="bg-purple-50 p-6 rounded-lg border border-purple-200 sticky top-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-purple-600" /> Bantuan AI <AiBadge />
            </h3>
            
            {aiAnalysis ? (
              <div className="space-y-4">
                <p className="text-sm text-purple-800 leading-relaxed">
                  {aiAnalysis}
                </p>
                <div className="bg-white p-3 rounded-md border border-purple-100 text-sm text-gray-600">
                  <strong>Tip:</strong> Sertakan dokumen sokongan seperti penyata bank terkini untuk mempercepatkan proses kelulusan.
                </div>
              </div>
            ) : (
              <p className="text-sm text-purple-700">
                Lengkapkan borang di sebelah. AI akan menganalisis alasan anda dan memberikan panduan untuk meningkatkan peluang kelulusan.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsahawanMoratorium;