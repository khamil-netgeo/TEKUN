import { useState, useEffect, useCallback } from 'react';
import { Brain, User, CheckCircle, AlertTriangle, HelpCircle, Save, RefreshCw, Clock, TrendingUp } from 'lucide-react';
import { AiBadge, PageHeader, StatCard, LoadingSpinner, toast } from '@/components/ui';
import api from '@/services/api';

// ── Types ──────────────────────────────────────────────────────────────────
interface PersonaConfig {
  persona_name: string;
  decision_style: string;
  focus_sectors: string[];
  experience_tier: string;
  risk_tolerance: string;
  ai_weight: number;
}

interface SkillProfile {
  id: number;
  user_id: number;
  skills_description: string;
  skill_tags: string[];
  specialisation: string | null;
  years_experience: number;
  approval_rate: number;
  total_decisions: number;
  persona_config: PersonaConfig | null;
  is_active: boolean;
  stats: {
    total_decisions: number;
    approval_rate: number;
    lulus_count: number;
    tolak_count: number;
    kuari_count: number;
  };
}

interface AiDecision {
  id: number;
  case_type: string;
  case_reference: string | null;
  context_summary: string;
  ai_recommendation: 'LULUS' | 'TOLAK' | 'KUARI';
  confidence_score: number;
  reasoning_bm: string;
  factors: Array<{ factor: string; weight: string; impact: string }>;
  created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const REC_COLOUR: Record<string, string> = {
  LULUS: '#2E7D32',
  TOLAK: '#C62828',
  KUARI: '#E65100',
};

const REC_ICON: Record<string, JSX.Element> = {
  LULUS: <CheckCircle size={14} />,
  TOLAK: <AlertTriangle size={14} />,
  KUARI: <HelpCircle size={14} />,
};

// ── Component ──────────────────────────────────────────────────────────────
export default function OfficerSkillProfile() {
  const [profile,     setProfile]     = useState<SkillProfile | null>(null);
  const [decisions,   setDecisions]   = useState<AiDecision[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [activeTab,   setActiveTab]   = useState<'profile' | 'assist' | 'history'>('profile');

  // Form state
  const [skillsDesc,    setSkillsDesc]    = useState('');
  const [specialisation, setSpecialisation] = useState('');
  const [yearsExp,      setYearsExp]      = useState(0);

  // Decision assist state
  const [caseType,    setCaseType]    = useState('permohonan_pembiayaan');
  const [caseRef,     setCaseRef]     = useState('');
  const [contextSumm, setContextSumm] = useState('');
  const [assisting,   setAssisting]   = useState(false);
  const [lastDecision, setLastDecision] = useState<Record<string, unknown> | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, historyRes] = await Promise.all([
        api.get('/officer-skills/me'),
        api.get('/officer-skills/history?per_page=10'),
      ]);

      const p = profileRes.data.data;
      if (p) {
        setProfile(p);
        setSkillsDesc(p.skills_description ?? '');
        setSpecialisation(p.specialisation ?? '');
        setYearsExp(p.years_experience ?? 0);
      }
      setDecisions(historyRes.data.data ?? []);
    } catch {
      toast.error('Gagal memuatkan profil kemahiran');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSaveProfile = async () => {
    if (!skillsDesc.trim()) { toast.error('Sila masukkan penerangan kemahiran'); return; }
    setSaving(true);
    try {
      const res = await api.post('/officer-skills', {
        skills_description: skillsDesc,
        specialisation,
        years_experience: yearsExp,
      });
      setProfile(res.data.data);
      toast.success('Profil kemahiran AI berjaya disimpan');
    } catch {
      toast.error('Gagal menyimpan profil kemahiran');
    } finally {
      setSaving(false);
    }
  };

  const handleDecisionAssist = async () => {
    if (!contextSumm.trim()) { toast.error('Sila masukkan ringkasan kes'); return; }
    setAssisting(true);
    setLastDecision(null);
    try {
      const res = await api.post('/ai/decision-assist', {
        case_type: caseType,
        case_reference: caseRef || undefined,
        context_summary: contextSumm,
      });
      setLastDecision(res.data.data);
      // Refresh history
      const historyRes = await api.get('/officer-skills/history?per_page=10');
      setDecisions(historyRes.data.data ?? []);
      toast.success('Keputusan AI berjaya dijana');
    } catch {
      toast.error('Gagal menjana keputusan AI');
    } finally {
      setAssisting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const persona = profile?.persona_config;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Profil Kemahiran AI Pegawai"
        subtitle="Peribadikan cara SPPT AI membuat keputusan berdasarkan pengalaman anda"
        icon={<User size={20} />}
        action={<AiBadge label="SPPT AI" variant="gradient" />}
      />

      {/* Stats Row */}
      {profile && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Jumlah Keputusan AI" value={profile.stats?.total_decisions ?? 0} subtitle="Keputusan dibantu AI" colour="navy" />
          <StatCard title="Kadar Kelulusan" value={`${profile.stats?.approval_rate ?? 0}%`} subtitle="Kes disyorkan LULUS" colour="green" />
          <StatCard title="Kes TOLAK" value={profile.stats?.tolak_count ?? 0} subtitle="Disyorkan ditolak" colour="orange" />
          <StatCard title="Kes KUARI" value={profile.stats?.kuari_count ?? 0} subtitle="Perlu semakan lanjut" colour="navy" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['profile', 'assist', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === tab ? 'bg-white shadow text-navy' : 'text-gray-500 hover:text-gray-700'}`}
            style={activeTab === tab ? { color: '#1B2B5E' } : {}}
          >
            {tab === 'profile' ? 'Profil Kemahiran' : tab === 'assist' ? 'Bantu Keputusan AI' : 'Sejarah Keputusan'}
          </button>
        ))}
      </div>

      {/* ── Tab: Profile ── */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-bold mb-4" style={{ color: '#1B2B5E' }}>Maklumat Kemahiran Anda</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Penerangan Kemahiran <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={skillsDesc}
                  onChange={e => setSkillsDesc(e.target.value)}
                  placeholder="Contoh: Saya mahir dalam kes pembiayaan pertanian dan mikro-perniagaan. Saya mengutamakan analisis aliran tunai dan sejarah pembayaran..."
                  className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300"
                  rows={5}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Pengkhususan</label>
                <input
                  type="text"
                  value={specialisation}
                  onChange={e => setSpecialisation(e.target.value)}
                  placeholder="Contoh: Pembiayaan Pertanian, Mikro-Perniagaan..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Tahun Pengalaman</label>
                <input
                  type="number"
                  value={yearsExp}
                  onChange={e => setYearsExp(Number(e.target.value))}
                  min={0}
                  max={50}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-white transition disabled:opacity-50"
                style={{ background: '#673AB7' }}
              >
                {saving ? <><RefreshCw size={14} className="animate-spin" /> Menyimpan...</> : <><Save size={14} /> Simpan Profil Kemahiran</>}
              </button>
            </div>
          </div>

          {/* AI Persona Display */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={18} style={{ color: '#673AB7' }} />
              <h3 className="text-sm font-bold" style={{ color: '#1B2B5E' }}>Persona AI Saya</h3>
              <AiBadge label="SPPT AI" size="xs" />
            </div>

            {!persona ? (
              <div className="text-center py-8">
                <Brain size={40} className="mx-auto mb-3 opacity-20" style={{ color: '#673AB7' }} />
                <p className="text-sm text-gray-400">Isi borang kemahiran untuk menjana Persona AI anda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Persona Name */}
                <div className="rounded-lg p-4" style={{ background: '#F3E8FF' }}>
                  <p className="text-xs text-gray-500 mb-1">Nama Persona</p>
                  <p className="text-base font-bold" style={{ color: '#673AB7' }}>{persona.persona_name}</p>
                </div>

                {/* Attributes Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Gaya Keputusan', value: persona.decision_style, colour: '#1B2B5E' },
                    { label: 'Tahap Pengalaman', value: persona.experience_tier, colour: '#2E7D32' },
                    { label: 'Toleransi Risiko', value: persona.risk_tolerance, colour: '#E65100' },
                    { label: 'Berat AI', value: `${Math.round((persona.ai_weight ?? 0) * 100)}%`, colour: '#673AB7' },
                  ].map(attr => (
                    <div key={attr.label} className="rounded-lg border border-gray-100 p-3">
                      <p className="text-xs text-gray-500 mb-1">{attr.label}</p>
                      <p className="text-sm font-bold capitalize" style={{ color: attr.colour }}>{attr.value}</p>
                    </div>
                  ))}
                </div>

                {/* Focus Sectors */}
                {Array.isArray(persona.focus_sectors) && persona.focus_sectors.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Sektor Fokus</p>
                    <div className="flex flex-wrap gap-2">
                      {persona.focus_sectors.filter(Boolean).map((sector, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-full font-semibold text-white" style={{ background: '#673AB7' }}>
                          {sector}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skill Tags */}
                {Array.isArray(profile?.skill_tags) && profile.skill_tags.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Tag Kemahiran</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.skill_tags.map((tag, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-400 italic">
                  AI akan meniru gaya keputusan ini apabila membantu kes anda.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Decision Assist ── */}
      {activeTab === 'assist' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={16} style={{ color: '#673AB7' }} />
              <h3 className="text-sm font-bold" style={{ color: '#1B2B5E' }}>Minta Bantuan Keputusan AI</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Jenis Kes</label>
                <select
                  value={caseType}
                  onChange={e => setCaseType(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
                >
                  <option value="permohonan_pembiayaan">Permohonan Pembiayaan</option>
                  <option value="semakan_kelayakan">Semakan Kelayakan</option>
                  <option value="penilaian_risiko">Penilaian Risiko</option>
                  <option value="pemulihan_hutang">Pemulihan Hutang</option>
                  <option value="lain_lain">Lain-lain</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Rujukan Kes (Pilihan)</label>
                <input
                  type="text"
                  value={caseRef}
                  onChange={e => setCaseRef(e.target.value)}
                  placeholder="Contoh: APP-2026-001234"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Ringkasan Konteks Kes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={contextSumm}
                  onChange={e => setContextSumm(e.target.value)}
                  placeholder="Contoh: Pemohon berumur 35 tahun, peniaga makanan di Kelantan. Memohon RM50,000 untuk kembangkan perniagaan. Sejarah pembayaran baik, tiada rekod NPL..."
                  className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300"
                  rows={6}
                />
              </div>

              <button
                onClick={handleDecisionAssist}
                disabled={assisting || !contextSumm.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-white transition disabled:opacity-50"
                style={{ background: '#673AB7' }}
              >
                {assisting ? (
                  <><RefreshCw size={14} className="animate-spin" /> AI sedang menganalisis...</>
                ) : (
                  <><Brain size={14} /> Minta Keputusan AI</>
                )}
              </button>
            </div>
          </div>

          {/* Decision Result */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={16} style={{ color: '#673AB7' }} />
              <h3 className="text-sm font-bold" style={{ color: '#1B2B5E' }}>Keputusan SPPT AI</h3>
              <AiBadge label="SPPT AI" size="xs" />
            </div>

            {assisting && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 animate-pulse" style={{ background: '#EDE9FE' }}>
                  <Brain size={24} style={{ color: '#673AB7' }} />
                </div>
                <p className="text-sm text-gray-500">AI sedang menganalisis kes...</p>
              </div>
            )}

            {!assisting && !lastDecision && (
              <div className="text-center py-12">
                <Brain size={40} className="mx-auto mb-3 opacity-20" style={{ color: '#673AB7' }} />
                <p className="text-sm text-gray-400">Isi borang dan klik "Minta Keputusan AI" untuk mendapatkan cadangan</p>
              </div>
            )}

            {!assisting && lastDecision && (
              <div className="space-y-4">
                {/* Recommendation Badge */}
                <div className="rounded-xl p-4 text-white" style={{ background: REC_COLOUR[lastDecision.recommendation as string] ?? '#1B2B5E' }}>
                  <div className="flex items-center gap-2 mb-1">
                    {REC_ICON[lastDecision.recommendation as string]}
                    <span className="text-lg font-bold">{lastDecision.recommendation as string}</span>
                  </div>
                  <p className="text-sm opacity-90">Keyakinan: {lastDecision.confidence_score as number}%</p>
                </div>

                {/* Reasoning */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Penjelasan AI</p>
                  <p className="text-sm text-gray-700">{lastDecision.reasoning_bm as string}</p>
                </div>

                {/* Factors */}
                {Array.isArray(lastDecision.factors) && (lastDecision.factors as Array<{ factor: string; weight: string; impact: string }>).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Faktor Utama</p>
                    <div className="space-y-2">
                      {(lastDecision.factors as Array<{ factor: string; weight: string; impact: string }>).map((f, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-gray-50">
                          <span className="text-gray-700">{f.factor}</span>
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${f.impact === 'POSITIF' ? 'text-green-600' : 'text-red-600'}`}>{f.impact}</span>
                            <span className="text-gray-400">{f.weight}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Officer Persona Match */}
                {lastDecision.officer_persona_match && (
                  <div className="rounded-lg p-3" style={{ background: '#F3E8FF' }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: '#673AB7' }}>Padanan Persona Pegawai</p>
                    <p className="text-xs text-gray-600">{lastDecision.officer_persona_match as string}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: History ── */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} style={{ color: '#1B2B5E' }} />
            <h3 className="text-sm font-bold" style={{ color: '#1B2B5E' }}>Sejarah Keputusan AI</h3>
          </div>

          {decisions.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp size={40} className="mx-auto mb-3 opacity-20" style={{ color: '#1B2B5E' }} />
              <p className="text-sm text-gray-400">Tiada sejarah keputusan AI lagi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {decisions.map(d => (
                <div key={d.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-bold text-white"
                        style={{ background: REC_COLOUR[d.ai_recommendation] ?? '#1B2B5E' }}
                      >
                        {REC_ICON[d.ai_recommendation]}
                        {d.ai_recommendation}
                      </span>
                      <span className="text-xs font-semibold text-gray-600">{d.case_type.replace(/_/g, ' ').toUpperCase()}</span>
                      {d.case_reference && (
                        <span className="text-xs text-gray-400">{d.case_reference}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{new Date(d.created_at).toLocaleDateString('ms-MY')}</p>
                      <p className="text-xs font-semibold" style={{ color: '#673AB7' }}>Keyakinan: {d.confidence_score}%</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{d.context_summary}</p>
                  {d.reasoning_bm && (
                    <p className="text-xs text-gray-500 mt-1 italic line-clamp-1">{d.reasoning_bm}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
