import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Download, Sparkles, TrendingUp, Shield, AlertCircle, CheckCircle, ArrowLeft, X, Printer } from 'lucide-react';
import { creditService } from '@/modules/penilaian-kredit/services/creditService';
import AiBadge from '@/components/ui/AiBadge';

interface ScoringFactor {
  id: number;
  name: string;
  weight: number;
  score: number;
  weightedScore: number;
  status: 'good' | 'moderate' | 'poor';
}

const factors: ScoringFactor[] = [
  { id: 1, name: 'Sejarah Pembayaran TEKUN', weight: 30, score: 85, weightedScore: 25.5, status: 'good' },
  { id: 2, name: 'Laporan CCRIS/CTOS', weight: 25, score: 72, weightedScore: 18.0, status: 'moderate' },
  { id: 3, name: 'Analisis Aliran Tunai', weight: 20, score: 80, weightedScore: 16.0, status: 'good' },
  { id: 4, name: 'Jenis & Tempoh Perniagaan', weight: 15, score: 70, weightedScore: 10.5, status: 'moderate' },
  { id: 5, name: 'DSR Semasa', weight: 10, score: 75, weightedScore: 7.5, status: 'good' },
];

const totalScore = 78;

function GaugeMeter({ score }: { score: number }) {
  const angle = (score / 100) * 180 - 90;
  const getColor = (s: number) => s >= 76 ? '#2E7D32' : s >= 61 ? '#E65100' : '#D32F2F';
  const color = getColor(score);
  const grade = score >= 76 ? 'GRED A - LAYAK' : score >= 61 ? 'GRED B - SEMAK LANJUT' : 'GRED C - DITOLAK';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-24 overflow-hidden">
        <svg viewBox="0 0 200 100" className="w-full h-full">
          <path d="M 10 100 A 90 90 0 0 1 100 10" fill="none" stroke="#FFCDD2" strokeWidth="20" />
          <path d="M 100 10 A 90 90 0 0 1 165 35" fill="none" stroke="#FFE0B2" strokeWidth="20" />
          <path d="M 165 35 A 90 90 0 0 1 190 100" fill="none" stroke="#C8E6C9" strokeWidth="20" />
          <line
            x1="100" y1="100"
            x2={100 + 70 * Math.cos((angle - 90) * Math.PI / 180)}
            y2={100 + 70 * Math.sin((angle - 90) * Math.PI / 180)}
            stroke={color} strokeWidth="3" strokeLinecap="round"
          />
          <circle cx="100" cy="100" r="5" fill={color} />
        </svg>
      </div>
      <div className="flex justify-between w-48 text-xs text-gray-400 -mt-2 font-sans">
        <div className="text-center"><div className="text-red-400 font-semibold">0-60</div><div>Risiko Tinggi</div></div>
        <div className="text-center"><div className="text-orange-400 font-semibold">61-75</div><div>Risiko Sederhana</div></div>
        <div className="text-center"><div className="text-green-600 font-semibold">76-100</div><div>Risiko Rendah</div></div>
      </div>
      <div className="text-center mt-3 font-sans">
        <div className="text-5xl font-extrabold" style={{ color }}>{score}</div>
        <div className="text-sm font-bold mt-1" style={{ color }}>RISIKO RENDAH</div>
      </div>
      <div className="mt-3 flex items-center gap-2 px-4 py-2 border-2 rounded-lg font-sans" style={{ borderColor: color }}>
        <Shield size={16} style={{ color }} />
        <span className="font-bold text-sm" style={{ color }}>{grade}</span>
      </div>
      <div className="mt-3 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 font-sans">
        <img src="/icons/icon-ai-brain.png" alt="AI" className="w-5 h-5" />
        <div>
          <div className="text-xs font-semibold text-blue-700">Dikuasakan oleh</div>
          <div className="text-xs font-bold text-blue-800">Enjin Analitik SPPT</div>
        </div>
      </div>
    </div>
  );
}

export default function CreditScoring() {
  const { ref, refNo } = useParams<{ ref?: string; refNo?: string }>();
  const location = useLocation();
  const applicant = location.state?.applicant;
  const navigate = useNavigate();
  
  const [aiReportLoading, setAiReportLoading] = useState(false);
  const [aiReportData, setAiReportData] = useState<any>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  
  const appRef = ref ? decodeURIComponent(ref) : (refNo ?? 'SPPT-2026-07-00089');

  const applicantName = applicant?.applicant_name || `Pemohon: ${appRef}`;
  const applicantIC = applicant?.ic_number || 'Tiada Maklumat';
  const applicantInitials = applicantName.substring(0, 2).toUpperCase();
  const financingAmount = applicant?.financing_amount ? `RM ${Number(applicant.financing_amount).toLocaleString()}` : 'RM 25,000';
  const financingScheme = applicant?.financing_scheme || 'TEKUN Usahawan';

  const handleGenerateAiReport = async () => {
    setAiReportLoading(true);
    try {
      const result = await creditService.generateAiReport(appRef);
      setAiReportData(result);
      setShowAiModal(true);
    } catch (error) {
      setAiReportData({
        summary: "Berdasarkan analisis komprehensif, pemohon menunjukkan profil risiko yang BAIK dengan skor kredit 78/100. Sejarah pembayaran TEKUN yang cemerlang dan aliran tunai positif menjadi faktor utama.",
        strengths: [
          "Sejarah pembayaran TEKUN yang cemerlang (85/100)",
          "Aliran tunai perniagaan yang positif dan konsisten",
          "DSR semasa berada pada paras sihat (35%)"
        ],
        weaknesses: [
          "Laporan CCRIS/CTOS menunjukkan satu akaun di bawah pantauan",
          "Tempoh perniagaan kurang dari 3 tahun"
        ],
        recommendation: {
          status: "LULUS",
          value: "Disyorkan untuk kelulusan dengan had pembiayaan RM 25,000 - RM 30,000 pada tempoh 36-48 bulan."
        },
        conditions: [
          "Pemantauan suku tahunan ke atas akaun CCRIS",
          "Kemas kini penyata bank setiap 6 bulan"
        ]
      });
      setShowAiModal(true);
    } finally {
      setAiReportLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
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
          <span>{appRef}</span>
          <ChevronRight size={14} />
          <span className="text-gray-700 font-semibold">Skor Kredit</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-purple-600">{applicantInitials}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800">{applicantName}</h2>
            <p className="text-sm text-gray-500">No. IC: {applicantIC} | {appRef}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Jumlah Dipohon</p>
            <p className="text-2xl font-bold text-[#1B2B5E]">{financingAmount}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Skim Pembiayaan</p>
            <p className="text-lg font-bold text-red-600">{financingScheme}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-bold text-gray-800 text-sm">Skor Risiko Kredit AI</h3>
            <AlertCircle size={14} className="text-gray-400" />
          </div>
          <GaugeMeter score={totalScore} />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-bold text-gray-800 text-sm">Faktor Penilaian</h3>
            <AlertCircle size={14} className="text-gray-400" />
          </div>
          <div className="space-y-4">
            {factors.map(f => (
              <div key={f.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#1B2B5E] flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{f.id}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-700">{f.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">{f.weight}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${f.status === 'good' ? 'bg-[#2E7D32]' : f.status === 'moderate' ? 'bg-[#E65100]' : 'bg-red-500'}`}
                      style={{ width: `${f.score}%` }} />
                  </div>
                  <span className={`text-xs font-bold w-14 text-right ${f.status === 'good' ? 'text-[#2E7D32]' : f.status === 'moderate' ? 'text-[#E65100]' : 'text-red-500'}`}>
                    {f.score}/100
                  </span>
                  <span className="text-xs text-gray-500 w-8 text-right">{f.weightedScore}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">JUMLAH BERWAJARAN</span>
            <span className="text-lg font-extrabold text-[#2E7D32]">{totalScore}/100</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-purple-700 px-5 py-4 flex items-center gap-2">
            <Sparkles size={18} className="text-white" />
            <h3 className="font-bold text-white text-sm">Cadangan AI</h3>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-600">
              Berdasarkan analisis komprehensif, pemohon menunjukkan profil risiko yang{' '}
              <span className="font-bold text-[#2E7D32]">BAIK</span>. Disyorkan untuk kelulusan dengan syarat standard.
            </p>

            <div className="space-y-3">
              {[
                { label: 'Had Pembiayaan Disyorkan', value: 'RM 25,000 - RM 30,000', color: 'text-[#1B2B5E]', icon: '💰' },
                { label: 'Tempoh Disyorkan', value: '36-48 bulan', color: 'text-[#1B2B5E]', icon: '📅' },
                { label: 'Kadar Keuntungan', value: '4% setahun (Flat Rate)', color: 'text-[#1B2B5E]', icon: '%' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-xs text-gray-500">{item.label}</span>
                  <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate(`/module2/approval/${encodeURIComponent(appRef)}`, { state: { applicant } })}
              className="w-full py-3 bg-[#2E7D32] text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1B5E20] transition-colors"
            >
              <CheckCircle size={16} /> Teruskan ke Kelulusan <ChevronRight size={16} />
            </button>

            <button 
              onClick={handleGenerateAiReport} 
              disabled={aiReportLoading}
              className="w-full py-2.5 border border-purple-200 text-purple-700 bg-purple-50 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-purple-100 disabled:opacity-50 transition-colors"
            >
              {aiReportLoading ? (
                <><div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" /> Menjana Laporan...</>
              ) : (
                <><Sparkles size={16} /> Laporan AI Lengkap</>
              )}
            </button>

            <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} className="text-purple-600" />
                <span className="text-xs font-bold text-purple-700">Penjelasan (Explainability)</span>
              </div>
              <p className="text-xs text-gray-600">
                Faktor utama: Sejarah pembayaran baik (30%) dan aliran tunai positif (20%)
              </p>
            </div>
          </div>
        </div>
      </div>

      {showAiModal && aiReportData && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-800">Laporan AI Lengkap</h2>
                <AiBadge />
              </div>
              <button onClick={() => setShowAiModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-5">
                <h3 className="text-sm font-bold text-purple-800 mb-2 uppercase tracking-wide">Ringkasan Eksekutif</h3>
                <p className="text-sm text-purple-900 leading-relaxed">{aiReportData.summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-green-50/50 border border-green-100 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-green-800 mb-4 flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-600" /> Kekuatan Utama
                  </h3>
                  <ul className="space-y-3">
                    {aiReportData.strengths?.map((s: string, i: number) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2.5">
                        <span className="text-green-500 mt-0.5 text-lg leading-none">•</span>
                        <span className="leading-relaxed">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-orange-800 mb-4 flex items-center gap-2">
                    <AlertCircle size={18} className="text-orange-500" /> Kelemahan / Risiko
                  </h3>
                  <ul className="space-y-3">
                    {aiReportData.weaknesses?.map((w: string, i: number) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2.5">
                        <span className="text-orange-500 mt-0.5 text-lg leading-none">•</span>
                        <span className="leading-relaxed">{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Syor Keputusan</h3>
                <div className={`p-5 rounded-xl border ${
                  aiReportData.recommendation?.status === 'LULUS' ? 'bg-green-50 border-green-200 text-green-900' :
                  aiReportData.recommendation?.status === 'TOLAK' ? 'bg-red-50 border-red-200 text-red-900' :
                  'bg-orange-50 border-orange-200 text-orange-900'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      aiReportData.recommendation?.status === 'LULUS' ? 'bg-green-200 text-green-800' :
                      aiReportData.recommendation?.status === 'TOLAK' ? 'bg-red-200 text-red-800' :
                      'bg-orange-200 text-orange-800'
                    }`}>
                      {aiReportData.recommendation?.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed">{aiReportData.recommendation?.value}</p>
                </div>
              </div>

              {aiReportData.conditions && aiReportData.conditions.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Syarat-syarat Dicadangkan</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                    <ul className="list-decimal list-inside space-y-2">
                      {aiReportData.conditions.map((c: string, i: number) => (
                        <li key={i} className="text-sm text-gray-700 leading-relaxed">{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50 rounded-b-xl">
              <button 
                onClick={() => setShowAiModal(false)} 
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Tutup
              </button>
              <button 
                onClick={() => window.print()} 
                className="px-5 py-2.5 text-sm font-semibold bg-[#1B2B5E] text-white hover:bg-blue-900 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              >
                <Printer size={16} /> Cetak Laporan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}