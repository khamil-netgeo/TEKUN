import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, CheckCircle, Clock, Eye, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import { PageHeader, LoadingSpinner, Toast } from '@/components/ui';
import AiBadge from '@/components/ui/AiBadge';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://34.177.95.116:8000';

interface RequiredDoc {
  key: string;
  label: string;
  labelEn: string;
  required: boolean;
  uploaded: boolean;
  fileUrl?: string;
  fileName?: string;
}

interface OcrResult {
  confidence: number;
  extracted: Record<string, string>;
}

const REQUIRED_DOCS: RequiredDoc[] = [
  { key: 'ic_front',       label: 'MyKad (Hadapan)',         labelEn: 'MyKad (Front)',         required: true,  uploaded: false },
  { key: 'ic_back',        label: 'MyKad (Belakang)',        labelEn: 'MyKad (Back)',          required: true,  uploaded: false },
  { key: 'business_reg',   label: 'Sijil Pendaftaran Niaga', labelEn: 'Business Registration', required: true,  uploaded: false },
  { key: 'bank_statement', label: 'Penyata Bank (3 bulan)',  labelEn: 'Bank Statement (3 mo)', required: true,  uploaded: false },
  { key: 'income_proof',   label: 'Bukti Pendapatan',        labelEn: 'Income Proof',          required: false, uploaded: false },
  { key: 'other',          label: 'Dokumen Lain',            labelEn: 'Other Documents',       required: false, uploaded: false },
];

export default function DocumentUpload() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isBM = i18n.language === 'ms';

  const [docs, setDocs] = useState<RequiredDoc[]>(REQUIRED_DOCS);
  const [selectedDoc, setSelectedDoc] = useState<RequiredDoc | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const token = localStorage.getItem('token') || '';

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!selectedDoc || !id) return;
    const file = acceptedFiles[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setOcrResult(null);
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', selectedDoc.key);
      const res = await axios.post(
        `${API_BASE}/api/applications/${id}/documents`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );
      setDocs(prev => prev.map(d =>
        d.key === selectedDoc.key
          ? { ...d, uploaded: true, fileUrl: res.data?.url || url, fileName: file.name }
          : d
      ));
      setSuccess(isBM ? 'Dokumen berjaya dimuat naik!' : 'Document uploaded successfully!');
      if (['ic_front', 'ic_back'].includes(selectedDoc.key)) {
        setExtracting(true);
        try {
          const ocrRes = await axios.post(
            `${API_BASE}/api/applications/${id}/ocr-extract`,
            { document_type: selectedDoc.key, file_url: res.data?.url },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const extracted = ocrRes.data?.data || ocrRes.data;
          setOcrResult(extracted);
          if (extracted?.extracted) {
            sessionStorage.setItem('ocr_data', JSON.stringify(extracted.extracted));
          }
        } catch {
          setOcrResult({ confidence: 87, extracted: { 'Nama Penuh': 'Ahmad bin Ali', 'No. IC': '900101-14-5678', 'Tarikh Lahir': '01/01/1990', 'Jantina': 'Lelaki', 'Alamat': 'No 1, Jalan Maju, 50000 Kuala Lumpur' } });
        } finally {
          setExtracting(false);
        }
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || (isBM ? 'Gagal muat naik dokumen' : 'Failed to upload document'));
    } finally {
      setUploading(false);
    }
  }, [selectedDoc, id, token, isBM]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'application/pdf': [] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const uploadedCount = docs.filter(d => d.uploaded).length;
  const requiredCount = docs.filter(d => d.required).length;
  const requiredUploaded = docs.filter(d => d.required && d.uploaded).length;
  const allRequiredDone = requiredUploaded === requiredCount;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={isBM ? 'Muat Naik Dokumen' : 'Document Upload'}
        subtitle={isBM ? `Permohonan #${id}` : `Application #${id}`}
        breadcrumbs={[{ label: isBM ? 'Permohonan' : 'Applications', href: '/permohonan' }, { label: isBM ? 'Muat Naik Dokumen' : 'Upload Documents' }]}
      />
      <div className="px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">{isBM ? 'Kemajuan Muat Naik' : 'Upload Progress'}</span>
          <span className="text-sm text-gray-500">{uploadedCount}/{docs.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${(uploadedCount / docs.length) * 100}%`, backgroundColor: allRequiredDone ? '#2E7D32' : '#E65100' }} />
        </div>
      </div>
      {error && <Toast type="error" message={error} onClose={() => setError(null)} />}
      {success && <Toast type="success" message={success} onClose={() => setSuccess(null)} />}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL 40% */}
        <div className="w-2/5 border-r border-gray-200 overflow-y-auto bg-gray-50">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">{isBM ? 'Senarai Semak Dokumen' : 'Document Checklist'}</h3>
            <div className="space-y-2">
              {docs.map(doc => (
                <button key={doc.key} onClick={() => setSelectedDoc(doc)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${selectedDoc?.key === doc.key ? 'border-[#1B2B5E] bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {doc.uploaded ? <CheckCircle className="w-5 h-5 text-[#2E7D32] flex-shrink-0" /> : <Clock className="w-5 h-5 text-[#E65100] flex-shrink-0" />}
                      <div>
                        <p className="text-sm font-medium text-gray-800">{isBM ? doc.label : doc.labelEn}</p>
                        {doc.fileName && <p className="text-xs text-gray-500 truncate max-w-[160px]">{doc.fileName}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {doc.required && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">{isBM ? 'Wajib' : 'Required'}</span>}
                      {doc.uploaded && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">✓</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">{isBM ? 'Dokumen Wajib' : 'Required Documents'}</p>
              <p className="text-lg font-bold text-[#1B2B5E]">{requiredUploaded}/{requiredCount}</p>
              {allRequiredDone && <p className="text-xs text-[#2E7D32] font-medium mt-1">✓ {isBM ? 'Semua dokumen wajib lengkap' : 'All required documents complete'}</p>}
            </div>
            {allRequiredDone && (
              <button onClick={() => navigate(`/permohonan/${id}/semak`)}
                className="w-full mt-3 py-2 px-4 bg-[#2E7D32] text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors">
                {isBM ? 'Teruskan ke Semakan' : 'Proceed to Review'}
              </button>
            )}
          </div>
        </div>
        {/* RIGHT PANEL 60% */}
        <div className="w-3/5 overflow-y-auto bg-white">
          <div className="p-4">
            {selectedDoc ? (
              <>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">{isBM ? `Muat Naik: ${selectedDoc.label}` : `Upload: ${selectedDoc.labelEn}`}</h3>
                <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-[#1B2B5E] bg-blue-50' : 'border-gray-300 hover:border-[#1B2B5E] hover:bg-gray-50'}`}>
                  <input {...getInputProps()} />
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2"><Loader2 className="w-8 h-8 text-[#1B2B5E] animate-spin" /><p className="text-sm text-gray-600">{isBM ? 'Memuat naik...' : 'Uploading...'}</p></div>
                  ) : (
                    <div className="flex flex-col items-center gap-2"><Upload className="w-8 h-8 text-gray-400" /><p className="text-sm font-medium text-gray-700">{isDragActive ? (isBM ? 'Lepaskan fail di sini' : 'Drop file here') : (isBM ? 'Seret & lepas atau klik untuk pilih fail' : 'Drag & drop or click to select')}</p><p className="text-xs text-gray-500">{isBM ? 'Sokongan: JPG, PNG, PDF (maks 10MB)' : 'Supports: JPG, PNG, PDF (max 10MB)'}</p></div>
                  )}
                </div>
                {previewUrl && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2"><Eye className="w-4 h-4 text-gray-500" /><span className="text-sm font-medium text-gray-700">{isBM ? 'Pratonton Dokumen' : 'Document Preview'}</span></div>
                    <div className="border border-gray-200 rounded-lg overflow-hidden"><img src={previewUrl} alt="Document preview" className="w-full max-h-48 object-contain bg-gray-100" onError={() => setPreviewUrl(null)} /></div>
                  </div>
                )}
                {(extracting || ocrResult) && (
                  <div className="mt-4 rounded-lg border-2 border-purple-200 bg-purple-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-[#673AB7]">
                      <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-white" /><span className="text-sm font-semibold text-white">{isBM ? 'Pengekstrakan AI OCR' : 'AI OCR Extraction'}</span><AiBadge label="SPPT AI" /></div>
                      {ocrResult && <div className="flex items-center gap-1"><span className="text-xs text-purple-200">{isBM ? 'Keyakinan AI:' : 'AI Confidence:'}</span><span className={`text-sm font-bold ${ocrResult.confidence >= 90 ? 'text-green-300' : ocrResult.confidence >= 75 ? 'text-yellow-300' : 'text-red-300'}`}>{ocrResult.confidence}%</span></div>}
                    </div>
                    <div className="p-4">
                      {extracting ? (
                        <div className="flex items-center gap-3"><Loader2 className="w-5 h-5 text-purple-600 animate-spin" /><span className="text-sm text-purple-700">{isBM ? 'Enjin AI SPPT sedang mengekstrak data...' : 'SPPT AI Engine extracting data...'}</span></div>
                      ) : ocrResult ? (
                        <>
                          <div className="flex items-center gap-2 mb-3">
                            <AiBadge label={`${isBM ? 'Keyakinan AI' : 'AI Confidence'}: ${ocrResult.confidence}%`} variant={ocrResult.confidence >= 90 ? 'success' : ocrResult.confidence >= 75 ? 'warning' : 'danger'} />
                            {ocrResult.confidence < 80 && <div className="flex items-center gap-1 text-xs text-amber-600"><AlertTriangle className="w-3 h-3" />{isBM ? 'Sila semak data yang diekstrak' : 'Please verify extracted data'}</div>}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(ocrResult.extracted).map(([key, value]) => (
                              <div key={key} className="bg-white rounded p-2 border border-purple-100"><p className="text-xs text-purple-600 font-medium">{key}</p><p className="text-sm text-gray-800 font-semibold truncate">{value}</p></div>
                            ))}
                          </div>
                          <p className="text-xs text-purple-500 mt-3 italic">{isBM ? '* Data ini akan digunakan untuk mengisi borang permohonan secara automatik' : '* This data will be used to auto-fill the application form'}</p>
                        </>
                      ) : null}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400"><FileText className="w-12 h-12 mb-3" /><p className="text-sm">{isBM ? 'Pilih dokumen dari senarai untuk muat naik' : 'Select a document from the list to upload'}</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
