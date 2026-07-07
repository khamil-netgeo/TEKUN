import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Clock, Circle, AlertCircle, Bell, Download, MessageSquare, Loader2 } from 'lucide-react';
import api from '@/services/api';

type StepStatus = 'completed' | 'current' | 'pending' | 'rejected';

interface TimelineStep {
  id: number;
  title: string;
  titleEn?: string;
  description: string;
  date?: string;
  status: StepStatus;
  officer?: string;
  note?: string;
}

interface TimelineData {
  reference_no: string;
  applicant_name: string;
  scheme: string;
  amount: number;
  steps: TimelineStep[];
}

const todayDate = new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' });

const fallbackData: TimelineData = {
  reference_no: 'SPPT-2026-DEMO',
  applicant_name: 'Demo Usahawan',
  scheme: 'TEKUN Usahawan',
  amount: 35000,
  steps: [
    { id: 1, title: 'Permohonan Diterima', titleEn: 'Application Received', description: 'Permohonan anda telah berjaya dihantar dan diterima oleh sistem.', date: todayDate, status: 'completed', officer: 'Sistem Automatik' },
    { id: 2, title: 'Semakan Kelayakan Awalan', titleEn: 'Initial Eligibility Check', description: 'AI sedang menyemak kelayakan asas: umur, kewarganegaraan, rekod muflis, CCRIS.', date: todayDate, status: 'completed', officer: 'AI Engine SPPT', note: 'Lulus semua semakan awalan' },
    { id: 3, title: 'Semakan Dokumen', titleEn: 'Document Screening', description: 'Pegawai sedang menyemak kesempurnaan dokumen yang dimuat naik.', date: todayDate, status: 'completed', officer: 'Pegawai Cawangan', note: 'Semua dokumen lengkap dan sah' },
    { id: 4, title: 'Penilaian Kredit', titleEn: 'Credit Assessment', description: 'Analisis kredit sedang dijalankan oleh Pegawai Kredit.', date: todayDate, status: 'current', officer: 'Pegawai Kredit' },
    { id: 5, title: 'Kelulusan Pengurus', titleEn: 'Manager Approval', description: 'Menunggu kelulusan daripada Pengurus Cawangan.', status: 'pending' },
    { id: 6, title: 'Surat Tawaran', titleEn: 'Offer Letter', description: 'Surat tawaran pembiayaan akan dijana dan dihantar untuk ditandatangani.', status: 'pending' },
    { id: 7, title: 'Pengeluaran Dana', titleEn: 'Fund Disbursement', description: 'Dana pembiayaan akan dikreditkan ke akaun bank anda.', status: 'pending' },
  ]
};

const statusConfig = {
  completed: { icon: <CheckCircle size={20} className="text-white" />, bg: 'bg-[#2E7D32]', border: 'border-[#2E7D32]', label: 'Selesai', labelColor: 'text-[#2E7D32]' },
  current: { icon: <Clock size={20} className="text-white" />, bg: 'bg-[#E65100]', border: 'border-[#E65100]', label: 'Dalam Proses', labelColor: 'text-[#E65100]' },
  pending: { icon: <Circle size={20} className="text-gray-400" />, bg: 'bg-gray-200', border: 'border-gray-300', label: 'Menunggu', labelColor: 'text-gray-400' },
  rejected: { icon: <AlertCircle size={20} className="text-white" />, bg: 'bg-red-500', border: 'border-red-500', label: 'Ditolak', labelColor: 'text-red-500' },
};

export default function ApplicationTimeline() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';
  const location = useLocation();
  const params = useParams();
  
  const applicationId = location.state?.applicationId || params.id;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TimelineData | null>(null);

  useEffect(() => {
    const fetchTimeline = async () => {
      if (!applicationId) {
        setData(fallbackData);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/api/applications/${applicationId}/timeline`);
        if (response.data && response.data.data) {
          setData(response.data.data);
        } else {
          setData(fallbackData);
        }
      } catch (error) {
        console.error("Failed to fetch timeline, falling back to demo data", error);
        setData(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [applicationId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-8 h-8 text-[#1B2B5E] animate-spin" />
        <p className="text-sm text-gray-500 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
          Memuatkan garis masa permohonan...
        </p>
      </div>
    );
  }

  if (!data) return null;

  const currentStep = data.steps.find(s => s.status === 'current');
  const completedCount = data.steps.filter(s => s.status === 'completed').length;
  const progress = data.steps.length > 0 ? Math.round((completedCount / data.steps.length) * 100) : 0;
  
  const formattedAmount = new Intl.NumberFormat('ms-MY', { 
    style: 'currency', 
    currency: 'MYR',
    minimumFractionDigits: 0
  }).format(data.amount);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B5E]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Penjejak Status Permohonan
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            No. Rujukan: <span className="font-semibold text-gray-700">{data.reference_no}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50" style={{ fontFamily: 'Inter, sans-serif' }}>
            <Bell size={16} /> Notifikasi
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1B2B5E] text-white rounded-lg text-sm font-medium hover:bg-[#152348]" style={{ fontFamily: 'Inter, sans-serif' }}>
            <Download size={16} /> Muat Turun
          </button>
        </div>
      </div>

      {/* Demo Data Banner */}
      {!applicationId && (
        <div className="bg-[#E65100] text-white px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-center shadow-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
          Data Demonstrasi — Masukkan ID permohonan untuk data sebenar
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Skim Pembiayaan', value: data.scheme, sub: 'Perniagaan Mikro', color: 'text-[#1B2B5E]' },
          { label: 'Jumlah Dipohon', value: formattedAmount, sub: 'Tempoh: 5 Tahun', color: 'text-[#1B2B5E]' },
          { label: 'Kemajuan', value: `${progress}%`, sub: `${completedCount} / ${data.steps.length} langkah`, color: 'text-[#2E7D32]' },
          { label: 'Anggaran Siap', value: '7 Julai 2026', sub: '3 hari bekerja lagi', color: 'text-[#E65100]' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>{card.label}</p>
            <p className={`text-xl font-bold mt-1 ${card.color}`} style={{ fontFamily: 'Inter, sans-serif' }}>{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>Kemajuan Keseluruhan</span>
          <span className="text-sm font-bold text-[#2E7D32]" style={{ fontFamily: 'Inter, sans-serif' }}>{progress}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div className="bg-[#2E7D32] h-3 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        {currentStep && (
          <div className="flex items-center gap-2 mt-3">
            <div className="w-2 h-2 bg-[#E65100] rounded-full animate-pulse" />
            <span className="text-xs text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
              Peringkat semasa: <span className="font-semibold text-[#E65100]">{isEn && currentStep.titleEn ? currentStep.titleEn : currentStep.title}</span>
              {currentStep.officer && ` — ${currentStep.officer}`}
            </span>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
          Sejarah Proses Permohonan
        </h2>
        <div className="relative">
          {data.steps.map((step, idx) => {
            const config = statusConfig[step.status] || statusConfig.pending;
            return (
              <div key={step.id} className="flex gap-4 mb-6 last:mb-0">
                {/* Icon + Line */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                    {config.icon}
                  </div>
                  {idx < data.steps.length - 1 && (
                    <div className={`w-0.5 flex-1 mt-2 ${step.status === 'completed' ? 'bg-[#2E7D32]' : 'bg-gray-200'}`} style={{ minHeight: '24px' }} />
                  )}
                </div>

                {/* Content */}
                <div className={`flex-1 pb-6 ${idx === data.steps.length - 1 ? 'pb-0' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`font-bold text-sm ${step.status === 'pending' ? 'text-gray-400' : 'text-gray-800'}`}
                          style={{ fontFamily: 'Inter, sans-serif' }}>
                          {isEn && step.titleEn ? step.titleEn : step.title}
                        </h3>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          step.status === 'completed' ? 'bg-green-100 text-green-700' :
                          step.status === 'current' ? 'bg-orange-100 text-orange-700' :
                          step.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-400'
                        }`} style={{ fontFamily: 'Inter, sans-serif' }}>
                          {config.label}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${step.status === 'pending' ? 'text-gray-300' : 'text-gray-500'}`}
                        style={{ fontFamily: 'Inter, sans-serif' }}>
                        {step.description}
                      </p>
                      {step.note && (
                        <div className="flex items-center gap-1 mt-1">
                          <CheckCircle size={12} className="text-green-500" />
                          <span className="text-xs text-green-600 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>{step.note}</span>
                        </div>
                      )}
                      {step.officer && (
                        <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                          Diproses oleh: <span className="font-semibold">{step.officer}</span>
                        </p>
                      )}
                    </div>
                    {step.date && (
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-4" style={{ fontFamily: 'Inter, sans-serif' }}>{step.date}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat with Officer */}
      <div className="bg-[#1B2B5E] rounded-xl p-5 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Ada soalan tentang permohonan anda?</h3>
          <p className="text-blue-200 text-xs mt-1">Hubungi Pegawai Kredit atau guna Pembantu AI TEKUN</p>
        </div>
        <button className="flex items-center gap-2 bg-white text-[#1B2B5E] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
          <MessageSquare size={16} /> Sembang Sekarang
        </button>
      </div>
    </div>
  );
}