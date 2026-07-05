import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, HelpCircle, FileText, AlertTriangle } from 'lucide-react';
import { creditService } from '../services/creditService';
import toast from 'react-hot-toast';

export default function ApprovalWorkflow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | 'kuari' | null>(null);
  const [comments, setComments] = useState('');
  
  // Kuari specific state
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const handleSubmit = async () => {
    if (!action) return;
    
    try {
      setLoading(true);
      
      if (action === 'approve') {
        await creditService.approveApplication(id as string, comments);
        toast.success('Permohonan berjaya diluluskan');
        navigate('/penilaian-kredit');
      } else if (action === 'reject') {
        if (!comments) {
          toast.error('Sila nyatakan sebab penolakan');
          setLoading(false);
          return;
        }
        await creditService.rejectApplication(id as string, comments);
        toast.success('Permohonan telah ditolak');
        navigate('/penilaian-kredit');
      } else if (action === 'kuari') {
        if (selectedFields.length === 0 || !comments) {
          toast.error('Sila pilih medan dan masukkan nota kuari');
          setLoading(false);
          return;
        }
        await creditService.kuariApplication(id as string, selectedFields, comments);
        toast.success('Permohonan dikembalikan untuk kuari');
        navigate('/penilaian-kredit');
      }
    } catch (error) {
      console.error('Error processing application:', error);
      toast.error('Ralat semasa memproses permohonan');
    } finally {
      setLoading(false);
    }
  };

  const toggleField = (field: string) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter(f => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Keputusan Penilaian Kredit</h1>
          <p className="text-gray-500">Buat keputusan untuk Permohonan #{id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => setAction('approve')}
          className={`p-6 rounded-xl border-2 text-center transition-all ${
            action === 'approve' 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-200 bg-white hover:border-green-200 hover:bg-green-50/50'
          }`}
        >
          <CheckCircle className={`w-12 h-12 mx-auto mb-3 ${action === 'approve' ? 'text-green-600' : 'text-gray-400'}`} />
          <h3 className={`font-bold ${action === 'approve' ? 'text-green-800' : 'text-gray-700'}`}>Luluskan</h3>
          <p className="text-sm text-gray-500 mt-1">Teruskan ke peringkat seterusnya</p>
        </button>

        <button
          onClick={() => setAction('kuari')}
          className={`p-6 rounded-xl border-2 text-center transition-all ${
            action === 'kuari' 
              ? 'border-yellow-500 bg-yellow-50' 
              : 'border-gray-200 bg-white hover:border-yellow-200 hover:bg-yellow-50/50'
          }`}
        >
          <HelpCircle className={`w-12 h-12 mx-auto mb-3 ${action === 'kuari' ? 'text-yellow-600' : 'text-gray-400'}`} />
          <h3 className={`font-bold ${action === 'kuari' ? 'text-yellow-800' : 'text-gray-700'}`}>Kuari (Pencerahan)</h3>
          <p className="text-sm text-gray-500 mt-1">Kembalikan untuk maklumat lanjut</p>
        </button>

        <button
          onClick={() => setAction('reject')}
          className={`p-6 rounded-xl border-2 text-center transition-all ${
            action === 'reject' 
              ? 'border-red-500 bg-red-50' 
              : 'border-gray-200 bg-white hover:border-red-200 hover:bg-red-50/50'
          }`}
        >
          <XCircle className={`w-12 h-12 mx-auto mb-3 ${action === 'reject' ? 'text-red-600' : 'text-gray-400'}`} />
          <h3 className={`font-bold ${action === 'reject' ? 'text-red-800' : 'text-gray-700'}`}>Tolak</h3>
          <p className="text-sm text-gray-500 mt-1">Tolak permohonan ini</p>
        </button>
      </div>

      {action && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-lg font-semibold text-navy-900 mb-4">
            {action === 'approve' ? 'Ulasan Kelulusan' : 
             action === 'reject' ? 'Sebab Penolakan' : 'Butiran Kuari'}
          </h2>

          {action === 'kuari' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Medan yang Perlu Diperbetulkan</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Salinan Kad Pengenalan', 'Penyata Bank 3 Bulan', 'Lesen SSM', 'Gambar Premis', 'Sebut Harga', 'Borang C'].map((field) => (
                  <label key={field} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input 
                      type="checkbox" 
                      className="rounded text-primary-600 focus:ring-primary-500"
                      checked={selectedFields.includes(field)}
                      onChange={() => toggleField(field)}
                    />
                    <span className="text-sm">{field}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {action === 'approve' ? 'Ulasan Tambahan (Pilihan)' : 
               action === 'reject' ? 'Sebab Penolakan (Wajib)' : 'Nota Kuari (Wajib)'}
            </label>
            <textarea
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={
                action === 'approve' ? 'Masukkan ulasan sokongan anda di sini...' : 
                action === 'reject' ? 'Sila nyatakan sebab permohonan ditolak mengikut polisi TEKUN...' : 
                'Nyatakan dengan jelas apa yang perlu diperbetulkan atau dimuat naik semula...'
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
              required={action !== 'approve'}
            />
          </div>

          {action === 'reject' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800">Perhatian</h4>
                <p className="text-sm text-red-700 mt-1">
                  Surat penolakan rasmi akan dijana secara automatik berdasarkan sebab yang anda masukkan di atas dan dihantar kepada pemohon.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setAction(null)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Batal
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading || (action !== 'approve' && !comments) || (action === 'kuari' && selectedFields.length === 0)}
              className={`px-6 py-2 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 
                action === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Memproses...
                </>
              ) : (
                <>
                  {action === 'approve' ? <CheckCircle className="w-4 h-4" /> : 
                   action === 'reject' ? <XCircle className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
                  Sahkan Keputusan
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
