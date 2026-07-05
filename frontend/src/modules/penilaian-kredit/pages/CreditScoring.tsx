import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Shield, AlertTriangle, CheckCircle, 
  Activity, FileText, Download, ChevronRight, XCircle
} from 'lucide-react';
import { AiBadge } from '@/components/ui/AiBadge';
import { creditService, CreditAssessment } from '../services/creditService';
import toast from 'react-hot-toast';

export default function CreditScoring() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<CreditAssessment | null>(null);
  
  useEffect(() => {
    if (id) {
      fetchScore();
    }
  }, [id]);

  const fetchScore = async () => {
    try {
      setLoading(true);
      const data = await creditService.getCreditScore(id as string);
      setAssessment(data);
    } catch (error) {
      console.error('Error fetching credit score:', error);
      toast.error('Gagal menjana skor kredit');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-500">Enjin AI sedang menganalisis data CCRIS, CTOS dan kewangan pemohon...</p>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-navy-900 mb-2">Penilaian Gagal</h2>
        <p className="text-gray-500 mb-6">Sistem tidak dapat menjana skor kredit untuk permohonan ini.</p>
        <button 
          onClick={() => navigate('/penilaian-kredit')}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Kembali ke Papan Pemuka
        </button>
      </div>
    );
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-50 border-green-200';
      case 'B': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'C': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'D': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
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
          <h1 className="text-2xl font-bold text-navy-900">Penilaian Risiko & Skor Kredit AI</h1>
          <p className="text-gray-500">Permohonan #{id} • Dijana pada {new Date(assessment.generated_at).toLocaleString('ms-MY')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Main Score */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Skor Keseluruhan</h2>
            
            <div className="relative inline-flex items-center justify-center mb-6">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
                <circle 
                  cx="80" cy="80" r="70" 
                  stroke="currentColor" 
                  strokeWidth="12" 
                  fill="transparent" 
                  strokeDasharray="440" 
                  strokeDashoffset={440 - (440 * assessment.score) / 100} 
                  className={assessment.score >= 70 ? 'text-green-500' : assessment.score >= 50 ? 'text-yellow-500' : 'text-red-500'} 
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-navy-900">{assessment.score}</span>
                <span className="text-sm text-gray-500">/ 100</span>
              </div>
            </div>
            
            <div className={`py-3 px-4 rounded-lg border mb-6 ${getGradeColor(assessment.grade)}`}>
              <div className="text-2xl font-bold mb-1">Gred {assessment.grade}</div>
              <div className="text-sm font-medium">{assessment.grade_label}</div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Syor Sistem AI</h3>
              {assessment.recommendation === 'LULUS' ? (
                <div className="flex items-center justify-center gap-2 text-green-700 bg-green-50 py-2 rounded-lg font-medium">
                  <CheckCircle className="w-5 h-5" />
                  Syor Lulus
                </div>
              ) : assessment.recommendation === 'MITIGASI' ? (
                <div className="flex items-center justify-center gap-2 text-yellow-700 bg-yellow-50 py-2 rounded-lg font-medium">
                  <AlertTriangle className="w-5 h-5" />
                  Syor Mitigasi
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-red-700 bg-red-50 py-2 rounded-lg font-medium">
                  <XCircle className="w-5 h-5" />
                  Syor Tolak
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Details & Narrative */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-navy-900">Pecahan Faktor Risiko (5C)</h2>
              <AiBadge>Analisis Algoritma</AiBadge>
            </div>
            
            <div className="space-y-5">
              {assessment.factors.map((factor, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">{factor.name} <span className="text-gray-400 text-sm font-normal">({factor.weight}%)</span></span>
                    <span className={`font-bold ${factor.score >= 80 ? 'text-green-600' : factor.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {factor.score}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${factor.score >= 80 ? 'bg-green-500' : factor.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                      style={{ width: `${factor.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-700" />
                <h2 className="text-lg font-semibold text-purple-900">Ulasan & Naratif AI</h2>
              </div>
              <AiBadge>Generatif AI</AiBadge>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-purple-100 text-gray-700 leading-relaxed">
              {assessment.narrative}
            </div>

            {assessment.is_borderline && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800">Amaran Kes Sempadan (Borderline)</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Skor pemohon berada dalam julat 45-55. Pertimbangkan pilihan mitigasi berikut:
                    </p>
                    <ul className="list-disc list-inside text-sm text-yellow-700 mt-2 ml-2 space-y-1">
                      <li>Kurangkan amaun pembiayaan sebanyak 20% untuk menurunkan DSR</li>
                      <li>Lanjutkan tempoh pembiayaan (tenure) untuk mengurangkan ansuran bulanan</li>
                      <li>Dapatkan penjamin atau cagaran tambahan</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button 
              onClick={() => navigate(`/penilaian-kredit/amortization/${id}`)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Kira Jadual Amortisasi
            </button>
            <button 
              onClick={() => navigate(`/penilaian-kredit/approval/${id}`)}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center gap-2"
            >
              Teruskan ke Kelulusan
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
