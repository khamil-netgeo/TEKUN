import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Sparkles, AlertTriangle, CheckCircle,
  FileText, ChevronRight, Shield, AlertCircle, TrendingUp, TrendingDown, Minus,
  Download
} from 'lucide-react';
import AiBadge from '@/components/ui/AiBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { creditService } from '@/modules/penilaian-kredit/services/creditService';
import type { CreditAssessment } from '@/modules/penilaian-kredit/services/creditService';
import toast from 'react-hot-toast';

/* ── Interfaces ──────────────────────────────────────────────────── */
interface AiReportData {
  score: number;
  grade: string;
  narrative_bm: string;
  risk_factors: string[];
  positive_factors: string[];
  suggested_amount: number;
  suggested_tenure_months: number;
  conditions: string[];
  explainability: string;
}

/* ── GaugeMeter (kept exactly as original) ───────────────────────── */
function GaugeMeter({ score }: { score: number }) {
  const angle = (score / 100) * 180 - 90;
  const getColor = (s: number) => s >= 76 ? '#2E7D32' : s >= 61 ? '#E65100' : '#D32F2F';
  const color = getColor(score);
  const grade = score >= 76 ? 'GRED A - LAYAK' : score >= 61 ? 'GRED B - SEMAK LANJUT' : 'GRED C - DITOLAK';
  const riskLabel = score >= 76 ? 'RISIKO RENDAH' : score >= 61 ? 'RISIKO SEDERHANA' : 'RISIKO TINGGI';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-24 overflow-hidden">
        <svg viewBox="0 0 200 100" className="w-full h-full">
          {/* Red zone 0-60 */}
          <path d="M 10 100 A 90 90 0 0 1 100 10" fill="none" stroke="#FFCDD2" strokeWidth="20" />
          {/* Orange zone 61-75 */}
          <path d="M 100 10 A 90 90 0 0 1 165 35" fill="none" stroke="#FFE0B2" strokeWidth="20" />
          {/* Green zone 76-100 */}
          <path d="M 165 35 A 90 90 0 0 1 190 100" fill="none" stroke="#C8E6C9" strokeWidth="20" />
          {/* Needle */}
          <line
            x1="100" y1="100"
            x2={100 + 70 * Math.cos((angle - 90) * Math.PI / 180)}
            y2={100 + 70 * Math.sin((angle - 90) * Math.PI / 180)}
            stroke={color} strokeWidth="3" strokeLinecap="round"
          />
          <circle cx="100" cy="100" r="5" fill={color} />
        </svg>
      </div>
      <div className="flex justify-between w-48 text-xs text-gray-400 -mt-2">
        <div className="text-center"><div className="text-red-400 font-semibold">0-60</div><div>Risiko Tinggi</div></div>
        <div className="text-center"><div className="text-orange-400 font-semibold">61-75</div><div>Risiko Sederhana</div></div>
        <div className="text-center"><div className="text-green-600 font-semibold">76-100</div><div>Risiko Rendah</div></div>
      </div>
      <div className="text-center mt-3">
        <div className="text-5xl font-extrabold" style={{ color }}>{score}</div>
        <div className="text-sm font-bold mt-1" style={{ color }}>{riskLabel}</div>
      </div>
      <div className="mt-3 flex items-center gap-2 px-4 py-2 border-2 rounded-lg" style={{ borderColor: color }}>
        <Shield size={16} style={{ color }} />
        <span className="font-bold text-sm" style={{ color }}>{grade}</span>
      </div>
      <div className="mt-3 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
        <div>
          <div className="text-xs font-semibold text-blue-700">Dikuasakan oleh</div>
          <div className="text-xs font-bold text-blue-800">Enjin Analitik SPPT</div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────── */
export default function CreditScoring() {
  const { ref } = useParams<{ ref: string }>(); // ref is now the numeric application ID
  const location = useLocation();
  const navigate = useNavigate();

  // Applicant data passed via navigation state from CreditDashboard
  const applicant = location.state?.applicant;

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<CreditAssessment | null>(null);
  const [aiReport, setAiReport] = useState<AiReportData | null>(null);
  const [generatingAi, setGeneratingAi] = useState(false);

  useEffect(() => {
    const fetchAssessment = async () => {
      if (!ref) return;
      try {
        setLoading(true);
        const data = await creditService.getCreditScore(ref);
        setAssessment(data);
      } catch (error) {
        console.error('Failed to fetch credit score:', error);
        toast.error('Gagal memuatkan data penilaian kredit');
      } finally {
        setLoading(false);
      }
    };
    fetchAssessment();
  }, [ref]);

  const generateNarrative = async () => {
    if (!ref) return;
    try {
      setGeneratingAi(true);
      toast.loading('Enjin AI sedang menganalisis data...', { id: 'ai-report' });
      const report = await creditService.generateAiReport(ref);
      setAiReport(report);
      toast.success('Laporan AI berjaya dijana', { id: 'ai-report' });
    } catch (error) {
      console.error('Failed to generate AI report:', error);
      toast.error('Gagal menjana laporan AI', { id: 'ai-report' });
    } finally {
      setGeneratingAi(false);
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
          onClick={() => navigate('/module2/dashboard')}
          className="px-4 py-2 bg-[#1B2B5E] text-white rounded-lg hover:bg-blue-900"
        >
          Kembali ke Papan Pemuka
        </button>
      </div>
    );
  }

  const scoreColor = assessment.score >= 76 ? '#2E7D32' : assessment.score >= 61 ? '#E65100' : '#C62828';

  /* Build explainability rows from API factors */
  const explainRows: Array<{ factor: string; value: string; impact: number; description: string }> = [];
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

  /* Derive applicant display info — prefer location.state, fallback to assessment */
  const applicantName = applicant?.applicant_name || 'Pemohon';
  const applicantIc = applicant?.ic_number || '-';
  const applicantAmount = applicant?.amount_requested || 0;
  const applicantScheme = applicant?.scheme || 'TEKUN Usahawan';
  const initials = applicantName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Back button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/module2/dashboard')}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          title="Kembali ke Dashboard"
        >
          <ArrowLeft size={16} className="text-gray-500" />
        </button>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <button onClick={() => navigate('/module2/dashboard')} className="hover:text-[#1B2B5E] transition-colors">Penilaian</button>
          <ChevronRight size={14} />
          <span>{applicant?.ref_no || `#${ref}`}</span>
          <ChevronRight size={14} />
          <span className="text-gray-700 font-semibold">Skor Kredit</span>
        </div>
      </div>

      {/* Applicant Header — dynamic from location.state */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-purple-600">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-800">{applicantName}</h2>
            <p className="text-sm text-gray-500">No. IC: {applicantIc} | {applicant?.ref_no || `#${ref}`}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Jumlah Dipohon</p>
            <p className="text-2xl font-bold text-[#1B2B5E]">RM {applicantAmount.toLocaleString('ms-MY')}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Skim Pembiayaan</p>
            <p className="text-lg font-bold text-[#E65100]">{applicantScheme}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Gauge — uses real assessment.score */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-bold text-gray-800 text-sm">Skor Risiko Kredit AI</h3>
            <AlertCircle size={14} className="text-gray-400" />
          </div>
          <GaugeMeter score={assessment.score} />
        </div>

        {/* Middle: Factors Table — uses real assessment.factors */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-bold text-gray-800 text-sm">Faktor Penilaian</h3>
            <AlertCircle size={14} className="text-gray-400" />
          </div>
          <div className="space-y-4">
            {(assessment.factors || []).map((f: any, idx: number) => {
              const fScore = f.score ?? 0;
              const fWeight = f.weight ?? 0;
              const fWeighted = Math.round((fScore * fWeight) / 100 * 10) / 10;
              const status = fScore >= 75 ? 'good' : fScore >= 55 ? 'moderate' : 'poor';
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#1B2B5E] flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{idx + 1}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-700">{f.name}</span>
                    </div>
                    <span className="text-xs text-gray-400">{fWeight}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${status === 'good' ? 'bg-[#2E7D32]' : status === 'moderate' ? 'bg-[#E65100]' : 'bg-red-500'}`}
                        style={{ width: `${fScore}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold w-14 text-right ${status === 'good' ? 'text-[#2E7D32]' : status === 'moderate' ? 'text-[#E65100]' : 'text-red-500'}`}>
                      {fScore}/100
                    </span>
                    <span className="text-xs text-gray-500 w-8 text-right">{fWeighted}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">JUMLAH BERWAJARAN</span>
            <span className="text-lg font-extrabold" style={{ color: scoreColor }}>{assessment.score}/100</span>
          </div>
        </div>

        {/* Right: AI Recommendation — purple theme, uses real data */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-2" style={{ background: '#673AB7' }}>
            <Sparkles size={18} className="text-white" />
            <h3 className="font-bold text-white text-sm">Cadangan AI</h3>
            <AiBadge label="Generatif AI" size="xs" />
          </div>
          <div className="p-5 space-y-4">
            {/* Recommendation badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
              assessment.recommendation === 'LULUS' ? 'bg-green-50 text-green-700 border border-green-200' :
              assessment.recommendation === 'MITIGASI' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
              'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {assessment.recommendation === 'LULUS' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
              {assessment.recommendation || 'SEMAK SEMULA'}
            </div>

            {/* AI Narrative from assessment */}
            {assessment.narrative && (
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                <p className="text-xs text-gray-700 leading-relaxed">{assessment.narrative}</p>
              </div>
            )}

            {/* AI Report result (after clicking Laporan AI Lengkap) */}
            {aiReport && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={14} className="text-green-500" />
                  <span className="text-xs font-bold text-green-700">Laporan AI Lengkap Dijana</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">{aiReport.narrative_bm}</p>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-green-100">
                  <div>
                    <p className="text-xs text-gray-500">Jumlah Disyorkan</p>
                    <p className="text-sm font-bold text-[#1B2B5E]">RM {(aiReport.suggested_amount || applicantAmount).toLocaleString('ms-MY')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tempoh Disyorkan</p>
                    <p className="text-sm font-bold text-[#1B2B5E]">{aiReport.suggested_tenure_months || 36} bulan</p>
                  </div>
                </div>
                {aiReport.conditions && aiReport.conditions.length > 0 && (
                  <div className="pt-2 border-t border-green-100">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Syarat Tambahan:</p>
                    <ul className="space-y-1">
                      {aiReport.conditions.map((c, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                          <span className="text-green-500 mt-0.5">•</span> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Static recommendation items (shown before AI report) */}
            {!aiReport && (
              <div className="space-y-3">
                {[
                  { label: 'Had Pembiayaan Disyorkan', value: `RM ${applicantAmount.toLocaleString('ms-MY')}`, icon: '💰' },
                  { label: 'Tempoh Disyorkan', value: '36-48 bulan', icon: '📅' },
                  { label: 'Kadar Keuntungan', value: '4% setahun (Flat Rate)', icon: '%' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-xs text-gray-500">{item.label}</span>
                    <span className="text-sm font-bold text-[#1B2B5E]">{item.value}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => navigate(`/module2/approval/${encodeURIComponent(applicant?.ref_no || ref || '')}`, { state: { applicant } })}
              className="w-full py-3 bg-[#2E7D32] text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1B5E20] transition-colors"
            >
              <CheckCircle size={16} /> Teruskan ke Kelulusan <ChevronRight size={16} />
            </button>

            {/* Laporan AI Lengkap button — calls real AI endpoint */}
            <button
              onClick={generateNarrative}
              disabled={generatingAi || !!aiReport}
              className="w-full py-2.5 border border-purple-200 text-purple-700 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-purple-50 disabled:opacity-50 transition-colors"
              style={{ background: aiReport ? '#F3E5F5' : undefined }}
            >
              {generatingAi ? (
                <><div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" /> Menjana Laporan AI...</>
              ) : aiReport ? (
                <><CheckCircle size={16} className="text-green-500" /> Laporan AI Dijana</>
              ) : (
                <><Download size={16} /> Laporan AI Lengkap</>
              )}
            </button>

            {/* Explainability */}
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} className="text-purple-600" />
                <span className="text-xs font-bold text-purple-700">Penjelasan (Explainability)</span>
                <AiBadge label="AI" size="xs" />
              </div>
              <p className="text-xs text-gray-600">
                {aiReport?.explainability || `Faktor utama: ${(assessment.factors || []).slice(0, 2).map((f: any) => f.name).join(' dan ') || 'Rekod kredit dan kapasiti pembayaran'}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Explainability Table */}
      {explainRows.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#1B2B5E]">Jadual Penentu Skor</h2>
              <AiBadge label="Generatif AI" />
            </div>
          </div>
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
                      {row.description && <p className="text-xs text-gray-400 font-normal mt-0.5">{row.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.value}</td>
                    <td className={`px-4 py-3 text-center font-bold ${getImpactColor(row.impact)}`}>
                      {row.impact > 0 ? `+${row.impact}` : row.impact}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full
                        ${row.impact > 0 ? 'bg-green-50 text-green-700' : row.impact < 0 ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                        {getImpactIcon(row.impact)}
                        {row.impact > 0 ? '↑ Positif' : row.impact < 0 ? '↓ Negatif' : '→ Neutral'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Narrative from assessment */}
      {assessment.narrative && (
        <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-700" />
              <h2 className="text-base font-semibold text-purple-900">Ulasan &amp; Naratif SPPT AI</h2>
            </div>
            <AiBadge label="Generatif SPPT AI" />
          </div>
          <div className="bg-white p-4 rounded-lg border border-purple-100 text-gray-700 leading-relaxed text-sm">
            {assessment.narrative}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={() => navigate(`/module2/amortization/${ref}`)}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2 text-sm"
        >
          <FileText className="w-4 h-4" />
          Jadual Amortisasi
        </button>
        <button
          onClick={() => navigate(`/module2/approval/${encodeURIComponent(applicant?.ref_no || ref || '')}`, { state: { applicant } })}
          className="px-5 py-2 bg-[#1B2B5E] text-white rounded-lg hover:bg-blue-900 font-medium flex items-center gap-2 text-sm"
        >
          Teruskan ke Kelulusan
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
