import { useState } from 'react';
import { ChevronRight, Download, Sparkles, TrendingUp, Shield, AlertCircle, CheckCircle } from 'lucide-react';

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
        {/* Gauge background arcs */}
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
      {/* Score labels */}
      <div className="flex justify-between w-48 text-xs text-gray-400 -mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="text-center"><div className="text-red-400 font-semibold">0-60</div><div>Risiko Tinggi</div></div>
        <div className="text-center"><div className="text-orange-400 font-semibold">61-75</div><div>Risiko Sederhana</div></div>
        <div className="text-center"><div className="text-green-600 font-semibold">76-100</div><div>Risiko Rendah</div></div>
      </div>
      {/* Score display */}
      <div className="text-center mt-3">
        <div className="text-5xl font-extrabold" style={{ color, fontFamily: 'Inter, sans-serif' }}>{score}</div>
        <div className="text-sm font-bold mt-1" style={{ color, fontFamily: 'Inter, sans-serif' }}>RISIKO RENDAH</div>
      </div>
      {/* Grade Badge */}
      <div className="mt-3 flex items-center gap-2 px-4 py-2 border-2 rounded-lg" style={{ borderColor: color }}>
        <Shield size={16} style={{ color }} />
        <span className="font-bold text-sm" style={{ color, fontFamily: 'Inter, sans-serif' }}>{grade}</span>
      </div>
      {/* AI Engine Badge */}
      <div className="mt-3 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
        <img src="/icons/icon-ai-brain.png" alt="AI" className="w-5 h-5" />
        <div>
          <div className="text-xs font-semibold text-blue-700" style={{ fontFamily: 'Inter, sans-serif' }}>Dikuasakan oleh</div>
          <div className="text-xs font-bold text-blue-800" style={{ fontFamily: 'Inter, sans-serif' }}>Enjin Analitik SPPT</div>
        </div>
      </div>
    </div>
  );
}

export default function CreditScoring() {
  const [generating, setGenerating] = useState(false);
  const [aiNarrative, setAiNarrative] = useState<string | null>(null);

  const generateNarrative = async () => {
    setGenerating(true);
    // Simulate AI narrative generation
    await new Promise(r => setTimeout(r, 2000));
    setAiNarrative(
      'Berdasarkan analisis komprehensif, pemohon Siti Nurhaliza menunjukkan profil risiko yang BAIK dengan skor kredit 78/100. ' +
      'Sejarah pembayaran TEKUN yang cemerlang (85/100) dan aliran tunai positif (80/100) menjadi faktor utama. ' +
      'Laporan CCRIS/CTOS menunjukkan rekod yang memuaskan walaupun terdapat satu akaun yang perlu dipantau. ' +
      'DSR semasa pada paras 35% adalah dalam had yang ditetapkan (≤40%). ' +
      'Disyorkan untuk kelulusan dengan had pembiayaan RM 25,000 - RM 30,000 pada tempoh 36-48 bulan.'
    );
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
        <span>Penilaian</span><ChevronRight size={14} /><span>SPPT-2026-07-00089</span><ChevronRight size={14} />
        <span className="text-gray-700 font-semibold">Skor Kredit</span>
      </div>

      {/* Applicant Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-purple-600">SN</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>Siti Nurhaliza</h2>
            <p className="text-sm text-gray-500">No. IC: 850412-14-5678 | SPPT-2026-07-00089</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Jumlah Dipohon</p>
            <p className="text-2xl font-bold text-[#1B2B5E]" style={{ fontFamily: 'Inter, sans-serif' }}>RM 25,000</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Skim Pembiayaan</p>
            <p className="text-lg font-bold text-red-600" style={{ fontFamily: 'Inter, sans-serif' }}>TEKUN Usahawan</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Gauge */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-bold text-gray-800 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Skor Risiko Kredit AI</h3>
            <AlertCircle size={14} className="text-gray-400" />
          </div>
          <GaugeMeter score={totalScore} />
        </div>

        {/* Middle: Factors Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-bold text-gray-800 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Faktor Penilaian</h3>
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
                    <span className="text-xs font-medium text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>{f.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">{f.weight}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${f.status === 'good' ? 'bg-[#2E7D32]' : f.status === 'moderate' ? 'bg-[#E65100]' : 'bg-red-500'}`}
                      style={{ width: `${f.score}%` }} />
                  </div>
                  <span className={`text-xs font-bold w-14 text-right ${f.status === 'good' ? 'text-[#2E7D32]' : f.status === 'moderate' ? 'text-[#E65100]' : 'text-red-500'}`}
                    style={{ fontFamily: 'Inter, sans-serif' }}>
                    {f.score}/100
                  </span>
                  <span className="text-xs text-gray-500 w-8 text-right" style={{ fontFamily: 'Inter, sans-serif' }}>{f.weightedScore}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>JUMLAH BERWAJARAN</span>
            <span className="text-lg font-extrabold text-[#2E7D32]" style={{ fontFamily: 'Inter, sans-serif' }}>{totalScore}/100</span>
          </div>
        </div>

        {/* Right: AI Recommendation */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-purple-700 px-5 py-4 flex items-center gap-2">
            <Sparkles size={18} className="text-white" />
            <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Cadangan AI</h3>
          </div>
          <div className="p-5 space-y-4">
            {aiNarrative ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={14} className="text-green-500" />
                  <span className="text-xs font-bold text-green-700">Naratif AI Dijana</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{aiNarrative}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                Berdasarkan analisis komprehensif, pemohon menunjukkan profil risiko yang{' '}
                <span className="font-bold text-[#2E7D32]">BAIK</span>. Disyorkan untuk kelulusan dengan syarat standard.
              </p>
            )}

            <div className="space-y-3">
              {[
                { label: 'Had Pembiayaan Disyorkan', value: 'RM 25,000 - RM 30,000', color: 'text-[#1B2B5E]', icon: '💰' },
                { label: 'Tempoh Disyorkan', value: '36-48 bulan', color: 'text-[#1B2B5E]', icon: '📅' },
                { label: 'Kadar Keuntungan', value: '4% setahun (Flat Rate)', color: 'text-[#1B2B5E]', icon: '%' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-xs text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>{item.label}</span>
                  <span className={`text-sm font-bold ${item.color}`} style={{ fontFamily: 'Inter, sans-serif' }}>{item.value}</span>
                </div>
              ))}
            </div>

            <button className="w-full py-3 bg-[#2E7D32] text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1B5E20] transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
              <CheckCircle size={16} /> Teruskan ke Kelulusan <ChevronRight size={16} />
            </button>

            <button onClick={generateNarrative} disabled={generating}
              className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 disabled:opacity-50 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
              {generating ? (
                <><div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> Menjana...</>
              ) : (
                <><Download size={16} /> Laporan AI Lengkap</>
              )}
            </button>

            <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} className="text-purple-600" />
                <span className="text-xs font-bold text-purple-700" style={{ fontFamily: 'Inter, sans-serif' }}>Penjelasan (Explainability)</span>
              </div>
              <p className="text-xs text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                Faktor utama: Sejarah pembayaran baik (30%) dan aliran tunai positif (20%)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
