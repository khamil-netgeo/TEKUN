import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Shield, AlertTriangle, CheckCircle,
  Activity, FileText, ChevronRight, XCircle, TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import AiBadge from '@/components/ui/AiBadge';
import { creditService } from '../services/creditService';
import type { CreditAssessment } from '../services/creditService';
import toast from 'react-hot-toast';

export default function CreditScoring() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<CreditAssessment | null>(null);

  useEffect(() => {
    if (id) fetchScore();
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

  /* ── Semantic colour helpers ─────────────────────────────────────── */
  const getScoreColor = (score: number) => {
    if (score >= 60) return { stroke: '#2E7D32', text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' };
    if (score >= 40) return { stroke: '#E65100', text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' };
    return { stroke: '#C62828', text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-700 bg-green-50 border-green-200';
      case 'B': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'C': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'D': return 'text-red-700 bg-red-50 border-red-200';
      default:  return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImpactColor = (impact: number) => {
    if (impact > 0) return 'text-green-600';
    if (impact < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getImpactIcon = (impact: number) => {
    if (impact > 0) return <TrendingUp size={14} className="text-green-600" />;
    if (impact < 0) return <TrendingDown size={14} className="text-red-600" />;
    return <Minus size={14} className="text-gray-400" />;
  };

  const getImpactLabel = (impact: number) => {
    if (impact > 0) return '↑ Positif';
    if (impact < 0) return '↓ Negatif';
    return '→ Neutral';
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-4">
        <LoadingSpinner />
        <p className="text-gray-500 text-sm">Enjin AI SPPT sedang menganalisis data CCRIS, CTOS dan kewangan pemohon...</p>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#1B2B5E] mb-2">Penilaian Gagal</h2>
        <p className="text-gray-500 mb-6">Sistem tidak dapat menjana skor kredit untuk permohonan ini.</p>
        <button
          onClick={() => navigate('/penilaian-kredit')}
          className="px-4 py-2 bg-[#1B2B5E] text-white rounded-lg hover:bg-blue-900"
        >
          Kembali ke Papan Pemuka
        </button>
      </div>
    );
  }

  const scoreColor = getScoreColor(assessment.score);
  const circumference = 2 * Math.PI * 70; // r=70
  const dashOffset = circumference - (circumference * assessment.score) / 100;

  /* ── Build explainability rows from API factors ──────────────────── */
  const explainRows: Array<{ factor: string; value: string; impact: number; description: string }> = [];

  // From risk_factors (negative impact)
  if (Array.isArray(assessment.risk_factors)) {
    assessment.risk_factors.forEach((f: any) => {
      explainRows.push({
        factor: typeof f === 'string' ? f : (f.factor || f.name || ''),
        value: f.value || '—',
        impact: typeof f.impact === 'number' ? f.impact : -Math.abs(f.impact_score || 5),
        description: f.description || '',
      });
    });
  }

  // From positive_factors (positive impact)
  if (Array.isArray(assessment.positive_factors)) {
    assessment.positive_factors.forEach((f: any) => {
      explainRows.push({
        factor: typeof f === 'string' ? f : (f.factor || f.name || ''),
        value: f.value || '—',
        impact: typeof f.impact === 'number' ? f.impact : Math.abs(f.impact_score || 5),
        description: f.description || '',
      });
    });
  }

  // From generic factors array
  if (explainRows.length === 0 && Array.isArray(assessment.factors)) {
    assessment.factors.forEach((f: any) => {
      explainRows.push({
        factor: f.name || f.factor || '',
        value: f.score !== undefined ? `${f.score}/100` : (f.value || '—'),
        impact: f.impact !== undefined ? f.impact : (f.score >= 60 ? 5 : -5),
        description: f.description || '',
      });
    });
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/penilaian-kredit')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B5E]">Penilaian Risiko & Skor Kredit</h1>
          <p className="text-gray-500 text-sm">
            Permohonan #{id} • Dijana pada {new Date(assessment.generated_at).toLocaleString('ms-MY')}
          </p>
        </div>
        <div className="ml-auto">
          <AiBadge>Dikuasakan oleh SPPT AI</AiBadge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column: Gauge + Grade ─────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Gauge Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Skor Keseluruhan
            </h2>

            {/* SVG Gauge */}
            <div className="relative inline-flex items-center justify-center mb-4">
              <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 180 180">
                {/* Track */}
                <circle cx="90" cy="90" r="70" stroke="#E5E7EB" strokeWidth="14" fill="transparent" />
                {/* Score arc */}
                <circle
                  cx="90" cy="90" r="70"
                  stroke={scoreColor.stroke}
                  strokeWidth="14"
                  fill="transparent"
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
                {/* Threshold markers */}
                <circle cx="90" cy="90" r="70" stroke="#E65100" strokeWidth="2" fill="transparent"
                  strokeDasharray={`${circumference * 0.4} ${circumference * 0.6}`}
                  strokeDashoffset={circumference * 0.25}
                  opacity="0.4"
                />
                <circle cx="90" cy="90" r="70" stroke="#2E7D32" strokeWidth="2" fill="transparent"
                  strokeDasharray={`${circumference * 0.01} ${circumference * 0.99}`}
                  strokeDashoffset={-circumference * 0.35}
                  opacity="0.4"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className={`text-5xl font-bold ${scoreColor.text}`}>{assessment.score}</span>
                <span className="text-xs text-gray-400 mt-1">/ 100</span>
              </div>
            </div>

            {/* Score legend */}
            <div className="flex justify-center gap-3 text-xs mb-4">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>Rendah &lt;40</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>Sederhana 40–60</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>Tinggi &gt;60</span>
            </div>

            {/* Grade badge */}
            <div className={`py-3 px-4 rounded-lg border mb-4 ${getGradeColor(assessment.grade)}`}>
              <div className="text-2xl font-bold mb-0.5">Gred {assessment.grade}</div>
              <div className="text-sm font-medium">{assessment.grade_label}</div>
            </div>

            {/* Recommendation */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Syor Sistem AI</h3>
              {assessment.recommendation === 'LULUS' ? (
                <div className="flex items-center justify-center gap-2 text-green-700 bg-green-50 py-2.5 rounded-lg font-semibold text-sm">
                  <CheckCircle className="w-4 h-4" /> Syor Lulus
                </div>
              ) : assessment.recommendation === 'MITIGASI' ? (
                <div className="flex items-center justify-center gap-2 text-orange-700 bg-orange-50 py-2.5 rounded-lg font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4" /> Syor Mitigasi
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-red-700 bg-red-50 py-2.5 rounded-lg font-semibold text-sm">
                  <XCircle className="w-4 h-4" /> Syor Tolak
                </div>
              )}
            </div>
          </div>

          {/* Borderline warning */}
          {assessment.is_borderline && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-orange-800 text-sm">Kes Sempadan (Borderline)</h4>
                  <p className="text-xs text-orange-700 mt-1">
                    Skor berada dalam julat 45–55. Pertimbangkan mitigasi: kurangkan amaun, lanjutkan tempoh, atau dapatkan penjamin.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column ───────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-navy-900">Pecahan Faktor Risiko (5C)</h2>
              <AiBadge label="Analisis Algoritma" />
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

          {/* Explainability Table (WAJIB) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                <h2 className="text-base font-semibold text-[#1B2B5E]">Jadual Penentu Skor</h2>
              </div>
              <AiBadge label="Generatif AI" />
            </div>
            {explainRows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3 text-left font-semibold">Faktor</th>
                      <th className="px-4 py-3 text-left font-semibold">Nilai</th>
                      <th className="px-4 py-3 text-center font-semibold">Impak (mata)</th>
                      <th className="px-4 py-3 text-center font-semibold">Arah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {explainRows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {row.factor}
                          {row.description && (
                            <p className="text-xs text-gray-400 font-normal mt-0.5">{row.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{row.value}</td>
                        <td className={`px-4 py-3 text-center font-bold ${getImpactColor(row.impact)}`}>
                          {row.impact > 0 ? `+${row.impact}` : row.impact}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full
                            ${row.impact > 0 ? 'bg-green-50 text-green-700' : row.impact < 0 ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                            {getImpactIcon(row.impact)}
                            {getImpactLabel(row.impact)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">
                Tiada data faktor tersedia
              </div>
            )}
          </div>

          {/* AI Narrative */}
          <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-700" />
                <h2 className="text-base font-semibold text-purple-900">Ulasan & Naratif SPPT AI</h2>
              </div>
              <AiBadge>Generatif SPPT AI</AiBadge>
            </div>
            <div className="bg-white p-4 rounded-lg border border-purple-100 text-gray-700 leading-relaxed text-sm">
              {assessment.narrative || 'Tiada naratif tersedia.'}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => navigate(`/penilaian-kredit/amortization/${id}`)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2 text-sm"
            >
              <FileText className="w-4 h-4" />
              Jadual Amortisasi
            </button>
            <button
              onClick={() => navigate(`/penilaian-kredit/approval/${id}`)}
              className="px-5 py-2 bg-[#1B2B5E] text-white rounded-lg hover:bg-blue-900 font-medium flex items-center gap-2 text-sm"
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
