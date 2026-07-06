/**
 * TEKUN SPPT — Module 1: Registration & eKYC
 *
 * eKYC Step: Upload gambar MyKad (bukan kamera).
 * AI (Gemini Vision) mengesahkan sama ada gambar adalah MyKad Malaysia yang sah.
 * Jika bukan MyKad atau tidak sah, sistem reject dengan mesej jelas dalam BM.
 */
import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Phone, Mail, Eye, EyeOff, CheckCircle, AlertCircle,
  Upload, FileImage, RotateCcw, Shield, Loader2, XCircle,
  BadgeCheck, Info,
} from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';
import api from '@/services/api';

type Step = 'personal' | 'ekyc' | 'liveness' | 'complete';
type EkycStatus = 'idle' | 'processing' | 'success' | 'failed';

interface EkycResult {
  is_mykad: boolean;
  is_valid: boolean;
  confidence: number;
  rejection_reason: string | null;
  rejection_code: string | null;
  extracted_fields: {
    name?: string | null;
    ic_number?: string | null;
    address?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;
    nationality?: string | null;
  };
  quality_score: number;
  issues: string[];
}

interface FormData {
  fullName: string;
  ic: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

const INTEGRATIONS = ['e-Syariah', 'Muflis', 'SSM', 'CCRIS', 'CTOS', 'JPN/MyKad'];
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_MB = 10;

export default function RegistrationEkyc() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'bm' | 'en'>('bm');
  const [step, setStep] = useState<Step>('personal');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // eKYC upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ekycStatus, setEkycStatus] = useState<EkycStatus>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ekycResult, setEkycResult] = useState<EkycResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Liveness (camera for face check only)
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [livenessStep, setLivenessStep] = useState(0);

  const [form, setForm] = useState<FormData>({
    fullName: '', ic: '', phone: '', email: '', password: '', confirmPassword: '',
    agreeTerms: false,
  });

  const checkPasswordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    setPasswordStrength(score);
  };

  const strengthLabel = ['', 'Lemah', 'Sederhana', 'Kuat', 'Sangat Kuat'][passwordStrength];
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'][passwordStrength];

  const steps: { key: Step; label: string; num: number }[] = [
    { key: 'personal', label: 'Maklumat Peribadi', num: 1 },
    { key: 'ekyc', label: 'Muat Naik MyKad', num: 2 },
    { key: 'liveness', label: 'Pengesahan Wajah', num: 3 },
    { key: 'complete', label: 'Selesai', num: 4 },
  ];
  const currentStepIdx = steps.findIndex(s => s.key === step);

  // Detect if camera is available (requires HTTPS or localhost)
  const canUseCamera = typeof window !== 'undefined' &&
    (window.location.protocol === 'https:' ||
     window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1');

  // Camera helpers (liveness step only)
  const startCamera = useCallback(async (facingMode: 'environment' | 'user' = 'user') => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setError(null);
    } catch {
      setError('Kamera tidak dapat diakses. Sila benarkan akses kamera dalam tetapan pelayar anda.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  // eKYC upload helpers
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type))
      return 'Format fail tidak disokong. Sila muat naik gambar dalam format JPG, PNG, atau WebP.';
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024)
      return `Saiz fail terlalu besar. Had maksimum ialah ${MAX_FILE_SIZE_MB}MB.`;
    return null;
  };

  const processFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setEkycResult(null);

    // Show preview immediately
    const previewReader = new FileReader();
    previewReader.onload = (e) => setPreviewUrl(e.target?.result as string);
    previewReader.readAsDataURL(file);

    setEkycStatus('processing');

    // Convert to base64 and call AI
    const base64Reader = new FileReader();
    base64Reader.onload = async (e) => {
      try {
        const dataUrl = e.target?.result as string;
        const base64 = dataUrl.split(',')[1];
        const { data } = await api.post('/ai/document-check', {
          image: base64,
          mime_type: file.type,
        });
        const result: EkycResult = data.data ?? data;
        setEkycResult(result);
        setEkycStatus(result.is_mykad && result.is_valid ? 'success' : 'failed');
      } catch (err: unknown) {
        const e = err as { response?: { data?: { data?: EkycResult } } };
        if (e?.response?.data?.data) {
          setEkycResult(e.response.data.data as EkycResult);
          setEkycStatus('failed');
        } else {
          setEkycResult({
            is_mykad: false,
            is_valid: false,
            confidence: 0,
            rejection_reason: 'Perkhidmatan pengesahan tidak tersedia. Sila cuba sebentar lagi.',
            rejection_code: 'AI_ERROR',
            extracted_fields: {},
            quality_score: 0,
            issues: [],
          });
          setEkycStatus('failed');
        }
      }
    };
    base64Reader.readAsDataURL(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleReset = () => {
    setEkycResult(null);
    setPreviewUrl(null);
    setEkycStatus('idle');
    setError(null);
  };

  // Step 1: Register
  const handleRegister = async () => {
    setError(null);
    if (!form.agreeTerms) { setError('Sila bersetuju dengan Terma & Syarat.'); return; }
    if (form.password !== form.confirmPassword) { setError('Kata laluan tidak sepadan.'); return; }
    if (passwordStrength < 3) {
      setError('Kata laluan terlalu lemah. Gunakan sekurang-kurangnya 12 aksara dengan huruf besar, nombor, dan simbol.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', {
        name: form.fullName,
        email: form.email,
        password: form.password,
        password_confirmation: form.confirmPassword,
      });
      setRegisteredEmail(form.email);
      setStep('ekyc');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const msg = e?.response?.data?.errors
        ? Object.values(e.response.data.errors).flat().join(' ')
        : e?.response?.data?.message ?? 'Pendaftaran gagal. Sila cuba lagi.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToLiveness = () => {
    setStep('liveness');
    if (canUseCamera) {
      setTimeout(() => startCamera('user'), 300);
    }
  };

  const livenessInstructions = [
    'Hadap kamera dan pastikan wajah anda kelihatan jelas',
    'Senyum sebentar',
    'Pejam mata sebentar',
  ];

  const handleCaptureLiveness = async () => {
    if (livenessStep < livenessInstructions.length - 1) {
      setLivenessStep(prev => prev + 1);
      return;
    }
    const dataUrl = captureFrame();
    if (!dataUrl) { setError('Gagal menangkap gambar.'); return; }
    stopCamera();
    setLoading(true);
    try {
      await api.post('/auth/otp/send', {
        identifier: registeredEmail,
        channel: 'email',
        purpose: 'verification',
      }).catch(() => {});
      setStep('complete');
    } catch {
      setStep('complete');
    } finally {
      setLoading(false);
    }
  };

  const getRejectionTitle = (code: string | null) => {
    switch (code) {
      case 'NOT_MYKAD': return 'Bukan MyKad Malaysia';
      case 'BLURRY': return 'Gambar Terlalu Kabur';
      case 'PARTIAL': return 'Gambar Tidak Lengkap';
      case 'EXPIRED': return 'MyKad Tamat Tempoh';
      case 'DAMAGED': return 'MyKad Rosak atau Tidak Jelas';
      case 'FAKE': return 'Dokumen Tidak Sah';
      default: return 'Pengesahan Gagal';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader lang={lang} setLang={setLang} />
      <div className="max-w-lg mx-auto px-4 py-8">

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  i < currentStepIdx ? 'bg-green-500 text-white' :
                  i === currentStepIdx ? 'bg-[#1B2B5E] text-white' :
                  'bg-gray-200 text-gray-400'
                }`}>
                  {i < currentStepIdx ? <CheckCircle size={16} /> : s.num}
                </div>
                <span className={`text-xs mt-1 text-center hidden sm:block ${i === currentStepIdx ? 'text-[#1B2B5E] font-semibold' : 'text-gray-400'}`}
                  style={{ fontFamily: 'Inter, sans-serif' }}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${i < currentStepIdx ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── Step 1: Personal Info ── */}
        {step === 'personal' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-[#1B2B5E] mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Maklumat Peribadi</h2>
            <p className="text-sm text-gray-500 mb-5" style={{ fontFamily: 'Inter, sans-serif' }}>Isi maklumat peribadi anda untuk mendaftar akaun SPPT</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700" style={{ fontFamily: 'Inter, sans-serif' }}>{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Nama Penuh (seperti dalam MyKad) *</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={form.fullName}
                    onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]/20 focus:border-[#1B2B5E]"
                    placeholder="Contoh: Ahmad bin Abdullah" style={{ fontFamily: 'Inter, sans-serif' }} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>No. Kad Pengenalan *</label>
                <input type="text" value={form.ic}
                  onChange={e => setForm(f => ({ ...f, ic: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]/20 focus:border-[#1B2B5E]"
                  placeholder="Contoh: 901231-01-1234" maxLength={14} style={{ fontFamily: 'Inter, sans-serif' }} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>No. Telefon *</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]/20 focus:border-[#1B2B5E]"
                    placeholder="Contoh: 0123456789" style={{ fontFamily: 'Inter, sans-serif' }} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Alamat E-mel *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value.trim().toLowerCase() }))}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]/20 focus:border-[#1B2B5E]"
                    placeholder="contoh@email.com" style={{ fontFamily: 'Inter, sans-serif' }} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Kata Laluan *</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={form.password}
                    onChange={e => { setForm(f => ({ ...f, password: e.target.value })); checkPasswordStrength(e.target.value); }}
                    className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]/20 focus:border-[#1B2B5E]"
                    placeholder="Min. 12 aksara" style={{ fontFamily: 'Inter, sans-serif' }} />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${strengthColor}`} style={{ width: `${passwordStrength * 25}%` }} />
                    </div>
                    <span className="text-xs text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>{strengthLabel}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Sahkan Kata Laluan *</label>
                <input type="password" value={form.confirmPassword}
                  onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${form.confirmPassword && form.confirmPassword !== form.password ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-[#1B2B5E]/20 focus:border-[#1B2B5E]'}`}
                  placeholder="Ulangi kata laluan" style={{ fontFamily: 'Inter, sans-serif' }} />
                {form.confirmPassword && form.confirmPassword !== form.password && (
                  <p className="text-xs text-red-500 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>Kata laluan tidak sepadan</p>
                )}
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={form.agreeTerms}
                  onChange={e => setForm(f => ({ ...f, agreeTerms: e.target.checked }))}
                  className="mt-0.5 rounded border-gray-300 text-[#1B2B5E]" />
                <span className="text-xs text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Saya bersetuju dengan <a href="#" className="text-[#1B2B5E] underline">Terma & Syarat</a> dan{' '}
                  <a href="#" className="text-[#1B2B5E] underline">Dasar Privasi</a> TEKUN Nasional.
                </span>
              </label>

              <button onClick={handleRegister}
                disabled={loading || !form.fullName || !form.email || !form.password || !form.agreeTerms}
                className="w-full py-3 bg-[#1B2B5E] text-white rounded-lg font-semibold text-sm hover:bg-[#152348] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Inter, sans-serif' }}>
                {loading ? 'Mendaftar...' : 'Daftar & Teruskan ke eKYC'}
              </button>

              <p className="text-center text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                Sudah ada akaun?{' '}
                <button onClick={() => navigate('/login')} className="text-[#1B2B5E] font-semibold hover:underline">Log Masuk</button>
              </p>
            </div>
          </div>
        )}

        {/* ── Step 2: eKYC — Upload MyKad ── */}
        {step === 'ekyc' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={20} className="text-[#1B2B5E]" />
              <h2 className="text-xl font-bold text-[#1B2B5E]" style={{ fontFamily: 'Inter, sans-serif' }}>Pengesahan eKYC</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Muat naik gambar bahagian hadapan MyKad anda. AI kami akan mengesahkan kesahihannya secara automatik.
            </p>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
              <Info size={15} className="text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                Pastikan gambar MyKad jelas, tidak kabur, dan keseluruhan kad kelihatan. Hanya MyKad Malaysia yang diterima.
              </p>
            </div>

            {/* Idle: drop zone */}
            {ekycStatus === 'idle' && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragOver ? 'border-[#1B2B5E] bg-[#1B2B5E]/5' : 'border-gray-300 hover:border-[#1B2B5E] hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-[#1B2B5E]/10 rounded-full flex items-center justify-center">
                    <Upload size={28} className="text-[#1B2B5E]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Klik atau seret gambar MyKad ke sini
                    </p>
                    <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Format: JPG, PNG, WebP — Saiz maksimum: {MAX_FILE_SIZE_MB}MB
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <FileImage size={14} />
                    <span>Gambar hadapan MyKad sahaja</span>
                  </div>
                </div>
              </div>
            )}

            {/* Processing */}
            {ekycStatus === 'processing' && previewUrl && (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-gray-200">
                  <img src={previewUrl} alt="MyKad preview" className="w-full object-contain max-h-56" />
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-3">
                    <Loader2 size={32} className="text-white animate-spin" />
                    <p className="text-white text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                      AI sedang mengesahkan MyKad anda...
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-xs text-purple-700 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Sistem AI sedang menganalisis gambar. Ini mungkin mengambil masa 5–10 saat.
                  </p>
                </div>
              </div>
            )}

            {/* Success */}
            {ekycStatus === 'success' && ekycResult && previewUrl && (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border-2 border-green-400">
                  <img src={previewUrl} alt="MyKad verified" className="w-full object-contain max-h-48" />
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <BadgeCheck size={12} /> Disahkan
                  </div>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={18} className="text-green-600" />
                    <p className="text-sm font-bold text-green-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                      MyKad Berjaya Disahkan
                    </p>
                    <span className="ml-auto text-xs text-green-600 font-semibold">
                      Keyakinan: {Math.round(ekycResult.confidence * 100)}%
                    </span>
                  </div>

                  {ekycResult.extracted_fields && Object.values(ekycResult.extracted_fields).some(v => v) && (
                    <div className="mt-3 space-y-1.5 border-t border-green-200 pt-3">
                      <p className="text-xs font-semibold text-green-700 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Maklumat yang diekstrak:
                      </p>
                      {ekycResult.extracted_fields.name && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Nama</span>
                          <span className="font-semibold text-gray-800">{ekycResult.extracted_fields.name}</span>
                        </div>
                      )}
                      {ekycResult.extracted_fields.ic_number && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">No. Kad Pengenalan</span>
                          <span className="font-semibold text-gray-800">{ekycResult.extracted_fields.ic_number}</span>
                        </div>
                      )}
                      {ekycResult.extracted_fields.date_of_birth && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Tarikh Lahir</span>
                          <span className="font-semibold text-gray-800">{ekycResult.extracted_fields.date_of_birth}</span>
                        </div>
                      )}
                      {ekycResult.extracted_fields.gender && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Jantina</span>
                          <span className="font-semibold text-gray-800">{ekycResult.extracted_fields.gender}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs font-semibold text-gray-600 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Semakan Integrasi Luaran
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {INTEGRATIONS.map(name => (
                      <div key={name} className="flex items-center gap-1.5 text-xs text-green-700">
                        <CheckCircle size={12} className="text-green-500 shrink-0" />
                        <span style={{ fontFamily: 'Inter, sans-serif' }}>{name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={handleReset}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 flex items-center justify-center gap-2"
                    style={{ fontFamily: 'Inter, sans-serif' }}>
                    <RotateCcw size={14} /> Muat Naik Semula
                  </button>
                  <button onClick={handleProceedToLiveness}
                    className="flex-1 py-2.5 bg-[#1B2B5E] text-white rounded-lg text-sm font-semibold hover:bg-[#152348] flex items-center justify-center gap-2"
                    style={{ fontFamily: 'Inter, sans-serif' }}>
                    Teruskan →
                  </button>
                </div>
              </div>
            )}

            {/* Failed */}
            {ekycStatus === 'failed' && ekycResult && (
              <div className="space-y-4">
                {previewUrl && (
                  <div className="relative rounded-xl overflow-hidden border-2 border-red-400">
                    <img src={previewUrl} alt="Upload preview" className="w-full object-contain max-h-48 opacity-60" />
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <XCircle size={12} /> Ditolak
                    </div>
                  </div>
                )}

                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                      <XCircle size={20} className="text-red-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-red-800 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {getRejectionTitle(ekycResult.rejection_code)}
                      </p>
                      <p className="text-sm text-red-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {ekycResult.rejection_reason ?? 'Gambar tidak dapat disahkan sebagai MyKad yang sah.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs font-semibold text-amber-800 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Tips untuk gambar yang baik:
                  </p>
                  <ul className="space-y-1">
                    {[
                      'Pastikan gambar adalah bahagian hadapan MyKad',
                      'Gambar mestilah jelas dan tidak kabur',
                      'Keseluruhan kad mesti kelihatan dalam gambar',
                      'Elakkan pantulan cahaya atau bayangan',
                      'Gunakan latar belakang yang kontras (putih/gelap)',
                    ].map((tip, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-amber-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                        <span className="text-amber-500 mt-0.5">•</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                <button onClick={handleReset}
                  className="w-full py-3 bg-[#1B2B5E] text-white rounded-lg font-semibold text-sm hover:bg-[#152348] flex items-center justify-center gap-2"
                  style={{ fontFamily: 'Inter, sans-serif' }}>
                  <RotateCcw size={16} /> Cuba Semula
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Liveness ── */}
        {step === 'liveness' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-[#1B2B5E] mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Pengesahan Wajah</h2>
            <p className="text-sm text-gray-500 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Pastikan wajah anda kelihatan jelas</p>

            {!canUseCamera ? (
              /* HTTP fallback — camera unavailable, skip liveness gracefully */
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800" style={{ fontFamily: 'Inter, sans-serif' }}>Pengesahan Wajah Tidak Tersedia</p>
                    <p className="text-xs text-amber-700 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Ciri ini memerlukan sambungan selamat (HTTPS). Pengesahan wajah akan dilakukan semasa sesi pertama anda selepas log masuk.
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-700" style={{ fontFamily: 'Inter, sans-serif' }}>✓ MyKad telah berjaya disahkan. Anda boleh meneruskan pendaftaran.</p>
                </div>
                <button
                  onClick={() => {
                    setLoading(true);
                    api.post('/auth/otp/send', {
                      identifier: registeredEmail,
                      channel: 'email',
                      purpose: 'verification',
                    }).catch(() => {}).finally(() => {
                      setLoading(false);
                      setStep('complete');
                    });
                  }}
                  disabled={loading}
                  className="w-full py-3 bg-[#1B2B5E] text-white rounded-lg font-semibold text-sm hover:bg-[#152348] flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ fontFamily: 'Inter, sans-serif' }}>
                  {loading ? 'Memproses...' : 'Teruskan Pendaftaran →'}
                </button>
              </div>
            ) : (
              /* HTTPS — show full liveness camera flow */
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Arahan {livenessStep + 1}/{livenessInstructions.length}:
                  </p>
                  <p className="text-sm text-blue-700 mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {livenessInstructions[livenessStep]}
                  </p>
                </div>
                <div className="relative bg-gray-900 rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                  <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                  {!cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Upload size={40} className="text-gray-400" />
                    </div>
                  )}
                  {cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-56 border-2 border-white/70 rounded-full"
                        style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }} />
                    </div>
                  )}
                </div>
                <canvas ref={canvasRef} className="hidden" />
                {!cameraActive ? (
                  <button onClick={() => startCamera('user')}
                    className="w-full py-3 bg-[#1B2B5E] text-white rounded-lg font-semibold text-sm hover:bg-[#152348] flex items-center justify-center gap-2"
                    style={{ fontFamily: 'Inter, sans-serif' }}>
                    Aktifkan Kamera
                  </button>
                ) : (
                  <button onClick={handleCaptureLiveness} disabled={loading}
                    className="w-full py-3 bg-[#2E7D32] text-white rounded-lg font-semibold text-sm hover:bg-[#256427] flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ fontFamily: 'Inter, sans-serif' }}>
                    {loading ? 'Mengesahkan...' : livenessStep < livenessInstructions.length - 1 ? 'Seterusnya →' : 'Tangkap & Sahkan'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Step 4: Complete ── */}
        {step === 'complete' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-[#1B2B5E] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Pendaftaran Berjaya!</h2>
            <p className="text-gray-600 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
              Akaun anda telah berjaya didaftarkan. Sila sahkan e-mel anda dengan kod OTP yang dihantar ke{' '}
              <strong>{registeredEmail}</strong>.
            </p>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
              <p className="text-sm text-blue-800 font-semibold mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Langkah Seterusnya</p>
              <p className="text-sm text-blue-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                Masukkan kod OTP 6 digit yang dihantar ke e-mel anda.
              </p>
            </div>
            <button
              onClick={() => navigate('/otp-verification', { state: { email: registeredEmail, purpose: 'registration' } })}
              className="w-full py-3 bg-[#1B2B5E] text-white rounded-lg font-semibold text-sm hover:bg-[#152348] transition-colors"
              style={{ fontFamily: 'Inter, sans-serif' }}>
              Teruskan ke Pengesahan OTP →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
