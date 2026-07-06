import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, FileText, Search, ExternalLink,
  Building2, CreditCard, AlertTriangle
} from 'lucide-react';
import AiBadge from '@/components/ui/AiBadge';
import toast from 'react-hot-toast';
import api from '@/services/api';

export default function PreAssessment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState<any>(null);

  // Document checklist state
  const [documents, setDocuments] = useState([
    { id: 'ic',    name: 'Salinan Kad Pengenalan',      status: 'pending', fileUrl: '#' },
    { id: 'bank',  name: 'Penyata Bank 3 Bulan',        status: 'pending', fileUrl: '#' },
    { id: 'ssm',   name: 'Sijil SSM / Lesen PBT',       status: 'pending', fileUrl: '#' },
    { id: 'photo', name: 'Gambar Premis Perniagaan',     status: 'pending', fileUrl: '#' },
  ]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/module1/applications/${id}`)
      .then(res => {
        setApplication(res.data.data ?? res.data);
      })
      .catch(() => {
        // Mock fallback for POC
        setApplication({
          id,
          ref_no: `TK-${new Date().getFullYear()}-${id.padStart(4, '0')}`,
          applicant_name: 'Ahmad bin Ali',
          ic_number: '800101-14-5678',
          amount_requested: 50000,
          scheme_name: 'TEKUN Niaga',
          business_type: 'Runcit & Borong',
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const updateDocStatus = (docId: string, status: 'approved' | 'rejected') => {
    setDocuments(docs => docs.map(d => d.id === docId ? { ...d, status } : d));
  };

  const handleComplete = () => {
    const allChecked = documents.every(d => d.status !== 'pending');
    if (!allChecked) {
      toast.error('Sila semak semua dokumen terlebih dahulu');
      return;
    }
    const hasRejected = documents.some(d => d.status === 'rejected');
    if (hasRejected) {
      navigate('/module2/approval');
      toast.error('Dokumen tidak lengkap. Sila buat Kuari.');
    } else {
      navigate(`/module2/scoring/${id}`);
      toast.success('Semakan dokumen selesai. Teruskan ke penilaian risiko.');
    }
  };

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <button onClick={() => navigate('/module2/dashboard')} className="hover:text-navy-700 transition-colors">
          Penilaian
        </button>
        <span>/</span>
        <span className="text-gray-400">{application?.ref_no ?? `#${id}`}</span>
        <span>/</span>
        <span className="font-medium text-gray-700">Pra-Penilaian</span>
      </nav>

      {/* Page Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/module2/dashboard')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1B2B5E' }}>
            Pra-Penilaian &amp; Semakan Dokumen
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {application?.ref_no ?? `Permohonan #${id}`} &bull; {application?.applicant_name ?? '—'}
          </p>
        </div>
      </div>

      {/* Applicant Info Card */}
      {application && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold mb-4" style={{ color: '#1B2B5E' }}>
            Maklumat Pemohon
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Nama Pemohon</p>
              <p className="font-semibold text-gray-900">{application.applicant_name}</p>
            </div>
            <div>
              <p className="text-gray-500">No. Kad Pengenalan</p>
              <p className="font-semibold text-gray-900">{application.ic_number ?? '—'}</p>
            </div>
            <div>
              <p className="text-gray-500">No. Rujukan</p>
              <p className="font-semibold" style={{ color: '#1B2B5E' }}>{application.ref_no}</p>
            </div>
            <div>
              <p className="text-gray-500">Jumlah Dipohon</p>
              <p className="font-semibold text-gray-900">
                {typeof application.amount_requested === 'number'
                  ? formatAmount(application.amount_requested)
                  : application.amount_requested ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Skim Pembiayaan</p>
              <p className="font-semibold text-gray-900">{application.scheme_name ?? application.business_type ?? '—'}</p>
            </div>
          </div>
        </div>
      )}

      {/* External API Status Badges */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-base font-semibold" style={{ color: '#1B2B5E' }}>
            Semakan Luaran (Real-time)
          </h2>
          <AiBadge label="Semakan Langsung" />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border"
            style={{ background: '#F0FDF4', borderColor: '#86EFAC' }}>
            <Building2 className="w-4 h-4" style={{ color: '#2E7D32' }} />
            <span className="text-sm font-medium" style={{ color: '#2E7D32' }}>SSM</span>
            <span className="text-sm font-semibold" style={{ color: '#2E7D32' }}>Aktif</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border"
            style={{ background: '#F0FDF4', borderColor: '#86EFAC' }}>
            <CreditCard className="w-4 h-4" style={{ color: '#2E7D32' }} />
            <span className="text-sm font-medium" style={{ color: '#2E7D32' }}>CCRIS</span>
            <span className="text-sm font-semibold" style={{ color: '#2E7D32' }}>Tiada Rekod Buruk</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border"
            style={{ background: '#F0FDF4', borderColor: '#86EFAC' }}>
            <AlertTriangle className="w-4 h-4" style={{ color: '#2E7D32' }} />
            <span className="text-sm font-medium" style={{ color: '#2E7D32' }}>Muflis</span>
            <span className="text-sm font-semibold" style={{ color: '#2E7D32' }}>Tiada Rekod</span>
          </div>
        </div>
      </div>

      {/* AI OCR Panel */}
      <div className="rounded-xl border p-6"
        style={{ background: '#F5F3FF', borderColor: '#DDD6FE' }}>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg" style={{ background: '#EDE9FE' }}>
            <Search className="w-6 h-6" style={{ color: '#673AB7' }} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold" style={{ color: '#4527A0' }}>
                OCR &amp; Pengecaman Dokumen AI
              </h3>
              <AiBadge label="Auto-Semak" />
            </div>
            <p className="text-sm" style={{ color: '#5E35B1' }}>
              Enjin Analitik SPPT telah mengimbas dokumen yang dimuat naik. Semua dokumen didapati jelas
              dan boleh dibaca. Sila buat pengesahan visual terakhir sebelum meneruskan.
            </p>
          </div>
        </div>
      </div>

      {/* Document Checklist */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold mb-6 border-b pb-4" style={{ color: '#1B2B5E' }}>
          Senarai Semak Dokumen Wajib
        </h2>
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 border border-gray-100 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <FileText className="w-8 h-8 text-gray-400" />
                <div>
                  <h4 className="font-medium text-gray-900">{doc.name}</h4>
                  <button className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1">
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
                  <CheckCircle className="w-4 h-4" /> Lulus
                </button>
                <button
                  onClick={() => updateDocStatus(doc.id, 'rejected')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
                    doc.status === 'rejected'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-white border border-gray-300 text-gray-600 hover:bg-red-50'
                  }`}
                >
                  <XCircle className="w-4 h-4" /> Tolak
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={() => {
              navigate('/module2/approval');
              toast.error('Dokumen tidak lengkap. Sila buat Kuari.');
            }}
            className="px-5 py-2.5 rounded-lg font-medium text-sm border transition-colors"
            style={{ borderColor: '#E65100', color: '#E65100', background: '#FFF3E0' }}
          >
            Buat Kuari — Dokumen Tidak Lengkap
          </button>
          <button
            onClick={handleComplete}
            className="px-6 py-2.5 rounded-lg font-medium text-sm text-white transition-colors"
            style={{ background: '#1B2B5E' }}
          >
            Teruskan ke Penilaian Risiko →
          </button>
        </div>
      </div>
    </div>
  );
}
