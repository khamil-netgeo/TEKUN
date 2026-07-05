// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, FileText, Search, AlertCircle, ExternalLink } from 'lucide-react';
import { AiBadge } from '@/components/ui/AiBadge';
import toast from 'react-hot-toast';
import api from '@/services/api';

export default function PreAssessment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState<any>(null);

  // Document checklist state
  const [documents, setDocuments] = useState([
    { id: 'ic', name: 'Salinan Kad Pengenalan', status: 'pending', fileUrl: '#' },
    { id: 'bank', name: 'Penyata Bank 3 Bulan', status: 'pending', fileUrl: '#' },
    { id: 'ssm', name: 'Sijil SSM / Lesen PBT', status: 'pending', fileUrl: '#' },
    { id: 'photo', name: 'Gambar Premis Perniagaan', status: 'pending', fileUrl: '#' }
  ]);

  useEffect(() => {
    // In a real app, fetch application details
    // For POC, we'll mock the basic data
    setApplication({
      id,
      ref_no: `TK-${new Date().getFullYear()}-${id?.padStart(4, '0')}`,
      applicant_name: 'Ahmad bin Ali',
      amount_requested: 50000,
      business_type: 'Runcit & Borong'
    });
  }, [id]);

  const updateDocStatus = (id: string, status: 'approved' | 'rejected') => {
    setDocuments(docs => docs.map(d => d.id === id ? { ...d, status } : d));
  };

  const handleComplete = () => {
    const allChecked = documents.every(d => d.status !== 'pending');
    if (!allChecked) {
      toast.error('Sila semak semua dokumen terlebih dahulu');
      return;
    }

    const hasRejected = documents.some(d => d.status === 'rejected');
    if (hasRejected) {
      // Route to Kuari if documents are incomplete
      navigate(`/penilaian-kredit/approval/${id}`);
      toast.error('Dokumen tidak lengkap. Sila buat Kuari.');
    } else {
      // Proceed to AI Scoring
      navigate(`/penilaian-kredit/scoring/${id}`);
      toast.success('Semakan dokumen selesai. Teruskan ke penilaian risiko.');
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
          <h1 className="text-2xl font-bold text-navy-900">Pra-Penilaian & Semakan Dokumen</h1>
          <p className="text-gray-500">Permohonan #{id} • {application?.applicant_name}</p>
        </div>
      </div>

      <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Search className="w-6 h-6 text-purple-700" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-purple-900">OCR & Pengecaman Dokumen AI</h3>
              <AiBadge>Auto-Semak</AiBadge>
            </div>
            <p className="text-sm text-purple-800">
              Sistem AI telah mengimbas dokumen yang dimuat naik. Semua dokumen didapati jelas dan boleh dibaca. Sila buat pengesahan visual terakhir.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-navy-900 mb-6 border-b pb-4">Senarai Semak Dokumen Wajib</h2>
        
        <div className="space-y-4">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-4">
                <FileText className="w-8 h-8 text-gray-400" />
                <div>
                  <h4 className="font-medium text-gray-900">{doc.name}</h4>
                  <button className="text-sm text-primary-600 hover:underline flex items-center gap-1 mt-1">
                    Lihat Dokumen <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => updateDocStatus(doc.id, 'approved')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
                    doc.status === 'approved' 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-white border border-gray-300 text-gray-600 hover:bg-green-50'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" /> Lengkap
                </button>
                <button 
                  onClick={() => updateDocStatus(doc.id, 'rejected')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
                    doc.status === 'rejected' 
                      ? 'bg-red-100 text-red-700 border border-red-200' 
                      : 'bg-white border border-gray-300 text-gray-600 hover:bg-red-50'
                  }`}
                >
                  <XCircle className="w-4 h-4" /> Tidak Jelas / Salah
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleComplete}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            Sahkan & Teruskan ke Penilaian Risiko
          </button>
        </div>
      </div>
    </div>
  );
}
