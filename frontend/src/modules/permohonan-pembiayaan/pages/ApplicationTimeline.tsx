import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, Clock, XCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { PageHeader, LoadingSpinner } from '@/components/ui';
import AiBadge from '@/components/ui/AiBadge';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ms } from 'date-fns/locale';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://34.177.95.116:8000';

interface TimelineStage {
  stage: string;
  label: string;
  label_en: string;
  status: 'completed' | 'current' | 'pending' | 'rejected';
  timestamp?: string;
  actor?: string;
  notes?: string;
  ai_flag?: boolean;
  ai_note?: string;
}

interface ApplicationSummary {
  ref_no: string;
  applicant_name: string;
  amount_requested: number;
  created_at: string;
}

export default function ApplicationTimeline() {
  const { id } = useParams<{ id: string }>();
  const { i18n } = useTranslation();
  const isBM = i18n.language === 'ms';
  const token = localStorage.getItem('token') || '';

  const [stages, setStages] = useState<TimelineStage[]>([]);
  const [application, setApplication] = useState<ApplicationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [timelineRes, appRes] = await Promise.all([
          axios.get(`${API_BASE}/api/applications/${id}/timeline`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE}/api/applications/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const timelineData = timelineRes.data?.data || timelineRes.data?.timeline || timelineRes.data || [];
        setStages(Array.isArray(timelineData) ? timelineData : []);
        const appData = appRes.data?.application || appRes.data?.data || appRes.data;
        setApplication(appData);
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(msg || (isBM ? 'Gagal memuatkan data' : 'Failed to load data'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, token, isBM]);

  const getIcon = (status: TimelineStage['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-6 h-6 text-[#2E7D32]" />;
      case 'current':   return <Clock className="w-6 h-6 text-[#E65100] animate-pulse" />;
      case 'rejected':  return <XCircle className="w-6 h-6 text-[#C62828]" />;
      default:          return <AlertCircle className="w-6 h-6 text-gray-300" />;
    }
  };

  const getLineColor = (status: TimelineStage['status']) => {
    switch (status) {
      case 'completed': return 'bg-[#2E7D32]';
      case 'current':   return 'bg-[#E65100]';
      case 'rejected':  return 'bg-[#C62828]';
      default:          return 'bg-gray-200';
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <PageHeader
        title={isBM ? 'Penjejak Permohonan' : 'Application Tracker'}
        subtitle={application ? `${application.ref_no} - ${application.applicant_name}` : `#${id}`}
        breadcrumbs={[{ label: isBM ? 'Permohonan' : 'Applications', href: '/permohonan' }, { label: isBM ? 'Penjejak' : 'Tracker' }]}
      />
      <div className="p-6 max-w-3xl mx-auto w-full">
        {application && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><p className="text-xs text-gray-500">{isBM ? 'No. Rujukan' : 'Reference No.'}</p><p className="text-sm font-semibold text-[#1B2B5E]">{application.ref_no}</p></div>
              <div><p className="text-xs text-gray-500">{isBM ? 'Pemohon' : 'Applicant'}</p><p className="text-sm font-semibold text-gray-800">{application.applicant_name}</p></div>
              <div><p className="text-xs text-gray-500">{isBM ? 'Jumlah' : 'Amount'}</p><p className="text-sm font-semibold text-gray-800">RM {Number(application.amount_requested).toLocaleString()}</p></div>
              <div><p className="text-xs text-gray-500">{isBM ? 'Tarikh Mohon' : 'Applied Date'}</p><p className="text-sm font-semibold text-gray-800">{application.created_at ? format(new Date(application.created_at), 'dd MMM yyyy', { locale: isBM ? ms : undefined }) : '-'}</p></div>
            </div>
          </div>
        )}
        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-sm text-red-700">{error}</div>}
        {stages.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
            <Clock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p>{isBM ? 'Tiada data timeline' : 'No timeline data available'}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="relative">
              {stages.map((stage, index) => (
                <div key={stage.stage} className="flex gap-4 mb-6 last:mb-0">
                  <div className="flex flex-col items-center">
                    <div className="flex-shrink-0">{getIcon(stage.status)}</div>
                    {index < stages.length - 1 && <div className={`w-0.5 flex-1 mt-1 ${getLineColor(stage.status)}`} style={{ minHeight: '2rem' }} />}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`text-sm font-semibold ${stage.status === 'completed' ? 'text-[#2E7D32]' : stage.status === 'current' ? 'text-[#E65100]' : stage.status === 'rejected' ? 'text-[#C62828]' : 'text-gray-400'}`}>
                          {isBM ? stage.label : stage.label_en}
                        </p>
                        {stage.timestamp && <p className="text-xs text-gray-500 mt-0.5">{format(new Date(stage.timestamp), 'dd MMM yyyy, HH:mm', { locale: isBM ? ms : undefined })}{stage.actor && ` - ${stage.actor}`}</p>}
                        {stage.notes && <p className="text-xs text-gray-600 mt-1 bg-gray-50 px-2 py-1 rounded">{stage.notes}</p>}
                      </div>
                      {stage.status === 'current' && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">{isBM ? 'Semasa' : 'Current'}</span>}
                    </div>
                    {stage.ai_flag && stage.ai_note && (
                      <div className="mt-2 flex items-start gap-2 p-2 bg-purple-50 rounded-lg border border-purple-100">
                        <AiBadge label="SPPT AI" />
                        <p className="text-xs text-purple-700">{stage.ai_note}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {stages.some(s => s.status === 'current') && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
            <ChevronRight className="w-5 h-5 text-[#1B2B5E]" />
            <p className="text-sm text-[#1B2B5E]">{isBM ? 'Permohonan anda sedang diproses. Anda akan dimaklumkan melalui e-mel dan SMS apabila status berubah.' : 'Your application is being processed. You will be notified via email and SMS when the status changes.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
