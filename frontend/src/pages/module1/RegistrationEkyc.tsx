import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Phone, Mail, Eye, EyeOff, CheckCircle, AlertCircle, Camera, Upload } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';

type Step = 'personal' | 'ekyc' | 'liveness' | 'complete';

export default function RegistrationEkyc() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [lang, setLang] = useState<'bm' | 'en'>('bm');
  const [step, setStep] = useState<Step>('personal');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [ekycStatus, setEkycStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
  const [livenessStatus, setLivenessStatus] = useState<'idle' | 'detecting' | 'success'>('idle');
  const [form, setForm] = useState({
    fullName: '', ic: '', phone: '', email: '', password: '', confirmPassword: '',
    agreeTerms: false,
  });

  const checkPasswordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    setPasswordStrength(score);
  };

  const strengthLabel = ['', 'Lemah', 'Sederhana', 'Kuat', 'Sangat Kuat'][passwordStrength];
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'][passwordStrength];

  const simulateEkyc = () => {
    setEkycStatus('scanning');
    setTimeout(() => setEkycStatus('success'), 3000);
  };

  const simulateLiveness = () => {
    setLivenessStatus('detecting');
    setTimeout(() => setLivenessStatus('success'), 2500);
  };

  const steps: { key: Step; label: string; num: number }[] = [
    { key: 'personal', label: 'Maklumat Peribadi', num: 1 },
    { key: 'ekyc', label: 'Imbasan MyKad', num: 2 },
    { key: 'liveness', label: 'Pengesahan Wajah', num: 3 },
    { key: 'complete', label: 'Selesai', num: 4 },
  ];

  const currentStepIdx = steps.findIndex(s => s.key === step);

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader lang={lang} setLang={setLang} />

      <div className="max-w-2xl mx-auto px-4 pt-32 pb-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, idx) => (
            <div key={s.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                  idx < currentStepIdx ? 'bg-[#2E7D32] border-[#2E7D32] text-white' :
                  idx === currentStepIdx ? 'bg-[#1B2B5E] border-[#1B2B5E] text-white' :
                  'bg-white border-gray-300 text-gray-400'
                }`} style={{ fontFamily: 'Inter, sans-serif' }}>
                  {idx < currentStepIdx ? <CheckCircle size={18} /> : s.num}
                </div>
                <span className={`text-xs mt-1 font-medium text-center ${idx === currentStepIdx ? 'text-[#1B2B5E]' : 'text-gray-400'}`}
                  style={{ fontFamily: 'Inter, sans-serif' }}>
                  {s.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${idx < currentStepIdx ? 'bg-[#2E7D32]' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Personal Info */}
        {step === 'personal' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-[#1B2B5E] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Daftar Akaun Baharu
            </h2>
            <p className="text-gray-500 text-sm mb-6">Isikan maklumat peribadi anda untuk memulakan permohonan pembiayaan</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Nama Penuh (Seperti MyKad)</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E] focus:border-transparent"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    placeholder="Contoh: Ahmad bin Abdullah"
                    value={form.fullName}
                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">No. Kad Pengenalan</label>
                <input
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  placeholder="Contoh: 850101-14-5678"
                  value={form.ic}
                  onChange={e => setForm({ ...form, ic: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">No. Telefon</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                      placeholder="01X-XXXXXXX"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Emel</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                      placeholder="emel@contoh.com"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Kata Laluan</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    placeholder="Minimum 8 aksara"
                    value={form.password}
                    onChange={e => { setForm({ ...form, password: e.target.value }); checkPasswordStrength(e.target.value); }}
                  />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= passwordStrength ? strengthColor : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">Kekuatan: <span className="font-semibold">{strengthLabel}</span></span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Sahkan Kata Laluan</label>
                <input
                  type="password"
                  className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E] ${
                    form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-400' : 'border-gray-200'
                  }`}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  placeholder="Ulang kata laluan"
                  value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                />
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Kata laluan tidak sepadan</p>
                )}
              </div>

              <div className="flex items-start gap-3">
                <input type="checkbox" id="terms" className="mt-1 accent-[#1B2B5E]"
                  checked={form.agreeTerms} onChange={e => setForm({ ...form, agreeTerms: e.target.checked })} />
                <label htmlFor="terms" className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Saya bersetuju dengan <span className="text-[#1B2B5E] font-semibold cursor-pointer">Terma & Syarat</span> dan{' '}
                  <span className="text-[#1B2B5E] font-semibold cursor-pointer">Dasar Privasi</span> TEKUN Nasional
                </label>
              </div>

              <button
                onClick={() => setStep('ekyc')}
                disabled={!form.fullName || !form.ic || !form.phone || !form.email || !form.agreeTerms}
                className="w-full py-3 bg-[#1B2B5E] text-white rounded-lg font-semibold text-sm hover:bg-[#152348] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Teruskan ke Pengesahan eKYC →
              </button>

              <p className="text-center text-sm text-gray-500">
                Sudah mempunyai akaun?{' '}
                <span onClick={() => navigate('/login')} className="text-[#1B2B5E] font-semibold cursor-pointer hover:underline">Log Masuk</span>
              </p>
            </div>
          </div>
        )}

        {/* Step 2: eKYC MyKad Scan */}
        {step === 'ekyc' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-[#1B2B5E] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Pengesahan eKYC — Imbasan MyKad
            </h2>
            <p className="text-gray-500 text-sm mb-6">Sila imbas MyKad anda untuk pengesahan identiti automatik</p>

            {/* AI Badge */}
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-6">
              <img src="/icons/icon-ai-brain.png" alt="AI" className="w-5 h-5" />
              <span className="text-xs font-semibold text-blue-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                Pengecaman Dokumen Automatik — Sistem SPPT
              </span>
            </div>

            {/* MyKad Upload Area */}
            <div className={`border-2 border-dashed rounded-xl p-8 text-center mb-6 transition-all ${
              ekycStatus === 'success' ? 'border-green-400 bg-green-50' :
              ekycStatus === 'scanning' ? 'border-blue-400 bg-blue-50' :
              'border-gray-300 bg-gray-50 hover:border-[#1B2B5E] cursor-pointer'
            }`} onClick={ekycStatus === 'idle' ? simulateEkyc : undefined}>
              {ekycStatus === 'idle' && (
                <>
                  <img src="/icons/icon-mykad.png" alt="MyKad" className="w-16 h-16 mx-auto mb-3 opacity-60"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <Upload size={32} className="mx-auto mb-3 text-gray-400" />
                  <p className="font-semibold text-gray-600 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Klik untuk muat naik atau imbas MyKad
                  </p>
                  <p className="text-xs text-gray-400">Format: JPG, PNG, PDF • Saiz maksimum: 5MB</p>
                </>
              )}
              {ekycStatus === 'scanning' && (
                <div className="py-4">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="font-semibold text-blue-700" style={{ fontFamily: 'Inter, sans-serif' }}>AI sedang mengimbas MyKad...</p>
                  <p className="text-xs text-blue-500 mt-1">Mengekstrak maklumat peribadi secara automatik</p>
                </div>
              )}
              {ekycStatus === 'success' && (
                <div className="py-4">
                  <CheckCircle size={40} className="mx-auto mb-3 text-green-500" />
                  <p className="font-bold text-green-700" style={{ fontFamily: 'Inter, sans-serif' }}>MyKad Berjaya Diimbas!</p>
                  <p className="text-xs text-green-600 mt-1">Data telah diekstrak dan disahkan</p>
                </div>
              )}
            </div>

            {/* Extracted Data Preview */}
            {ekycStatus === 'success' && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Data Diekstrak oleh AI</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: 'Nama Penuh', value: form.fullName || 'Ahmad bin Abdullah' },
                    { label: 'No. K/P', value: form.ic || '850101-14-5678' },
                    { label: 'Tarikh Lahir', value: '01 Januari 1985' },
                    { label: 'Jantina', value: 'Lelaki' },
                    { label: 'Warganegara', value: 'Malaysia' },
                    { label: 'Negeri', value: 'Selangor' },
                  ].map(item => (
                    <div key={item.label}>
                      <span className="text-gray-400 text-xs">{item.label}</span>
                      <p className="font-semibold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                  <CheckCircle size={14} className="text-green-500" />
                  <span className="text-xs text-green-600 font-medium">Tiada rekod muflis • Tiada rekod jenayah • Warganegara Malaysia</span>
                </div>
              </div>
            )}

            {/* API Integration Status */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { name: 'e-Syariah', status: ekycStatus === 'success' ? 'clear' : 'pending' },
                { name: 'Insolvensi', status: ekycStatus === 'success' ? 'clear' : 'pending' },
                { name: 'SSM', status: ekycStatus === 'success' ? 'clear' : 'pending' },
              ].map(api => (
                <div key={api.name} className={`rounded-lg p-3 text-center border ${
                  api.status === 'clear' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <p className="text-xs font-semibold text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>{api.name}</p>
                  <p className={`text-xs mt-1 font-bold ${api.status === 'clear' ? 'text-green-600' : 'text-gray-400'}`}>
                    {api.status === 'clear' ? '✓ Bersih' : '— Menunggu'}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('personal')} className="flex-1 py-3 border border-gray-300 text-gray-600 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                ← Kembali
              </button>
              <button
                onClick={() => setStep('liveness')}
                disabled={ekycStatus !== 'success'}
                className="flex-1 py-3 bg-[#1B2B5E] text-white rounded-lg font-semibold text-sm hover:bg-[#152348] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Teruskan ke Pengesahan Wajah →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Liveness Detection */}
        {step === 'liveness' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-[#1B2B5E] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Pengesahan Wajah — Liveness Detection
            </h2>
            <p className="text-gray-500 text-sm mb-6">Sistem AI akan mengesahkan bahawa anda adalah pemegang MyKad yang sah</p>

            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-6">
              <img src="/icons/icon-ai-brain.png" alt="AI" className="w-5 h-5" />
              <span className="text-xs font-semibold text-blue-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                AI Liveness Detection — Anti-Spoofing Technology
              </span>
            </div>

            {/* Camera Area */}
            <div className={`rounded-xl overflow-hidden mb-6 relative ${
              livenessStatus === 'success' ? 'border-4 border-green-400' : 'border-4 border-[#1B2B5E]'
            }`}>
              <div className="bg-gray-900 aspect-video flex items-center justify-center relative">
                <img src="/icons/icon-ekyc-face.png" alt="Face" className="w-40 h-40 object-contain opacity-80" />
                {livenessStatus === 'detecting' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="text-center text-white">
                      <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>Mengesan wajah...</p>
                    </div>
                  </div>
                )}
                {livenessStatus === 'success' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-900/40">
                    <div className="text-center text-white">
                      <CheckCircle size={48} className="mx-auto mb-2 text-green-400" />
                      <p className="font-bold text-green-300" style={{ fontFamily: 'Inter, sans-serif' }}>Wajah Disahkan!</p>
                    </div>
                  </div>
                )}
                {/* Corner brackets */}
                <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <h3 className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Arahan</h3>
              <ul className="space-y-1 text-sm text-blue-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                <li>• Pastikan wajah anda berada dalam bingkai kamera</li>
                <li>• Ikuti arahan: Senyum → Kedip → Pusing kiri → Pusing kanan</li>
                <li>• Pastikan pencahayaan mencukupi</li>
              </ul>
            </div>

            {livenessStatus === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-green-500" />
                  <span className="font-semibold text-green-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Pengesahan berjaya — Skor Keyakinan: 98.7%
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep('ekyc')} className="flex-1 py-3 border border-gray-300 text-gray-600 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                ← Kembali
              </button>
              {livenessStatus === 'idle' && (
                <button onClick={simulateLiveness} className="flex-1 py-3 bg-[#1B2B5E] text-white rounded-lg font-semibold text-sm hover:bg-[#152348] transition-colors flex items-center justify-center gap-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <Camera size={16} /> Mulakan Kamera
                </button>
              )}
              {livenessStatus === 'success' && (
                <button onClick={() => setStep('complete')} className="flex-1 py-3 bg-[#2E7D32] text-white rounded-lg font-semibold text-sm hover:bg-[#1B5E20] transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Selesaikan Pendaftaran →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-[#1B2B5E] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Pendaftaran Berjaya!
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Akaun anda telah didaftarkan. Kod TAC telah dihantar ke nombor telefon anda untuk pengesahan akhir.
            </p>

            <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
              <h3 className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Langkah Seterusnya</h3>
              <div className="space-y-2 text-sm text-blue-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Pengesahan eKYC selesai</div>
                <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Liveness detection lulus</div>
                <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 border-2 border-blue-400 rounded-full" /> Semak emel untuk pautan pengesahan</div>
                <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 border-2 border-blue-400 rounded-full" /> Log masuk dan mula permohonan</div>
              </div>
            </div>

            <button onClick={() => navigate('/login')} className="w-full py-3 bg-[#1B2B5E] text-white rounded-lg font-semibold text-sm hover:bg-[#152348] transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
              Log Masuk Sekarang →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
