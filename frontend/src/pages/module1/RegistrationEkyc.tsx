import React, { useState, useRef, useCallback, useEffect, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Phone, Mail, Eye, EyeOff, CheckCircle, AlertCircle,
  Upload, FileImage, RotateCcw, Shield, Loader2, XCircle,
  BadgeCheck, Info, Building, Briefcase, Calendar, MapPin,
  Landmark, Banknote, Users, Hash, UserCheck, FileText,
  Trash2, ArrowLeft, PiggyBank,
} from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';
import api from '@/services/api';

// --- TYPE DEFINITIONS ---

type Step = 'personal' | 'ekyc' | 'business' | 'bank' | 'integrations' | 'complete';
type EkycStatus = 'idle' | 'processing' | 'success' | 'failed';
type CheckStatus = 'pending' | 'running' | 'success' | 'failed';

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

interface PersonalData {
  fullName: string;
  ic: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

interface BusinessData {
  businessName: string;
  ssmNumber: string;
  businessType: string;
  businessSector: string;
  startDate: string;
  businessAddress: string;
  state: string;
  monthlyIncome: string;
  employeeCount: string;
}

interface BankData {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  accountType: 'Semasa' | 'Simpanan' | '';
}

interface IntegrationStatus {
  insolvensi: CheckStatus;
  ccris: CheckStatus;
  ctos: CheckStatus;
  ssm: CheckStatus;
  esyariah: CheckStatus;
  jpn: CheckStatus;
}

// --- CONSTANTS ---

const STEPS: { id: Step; title: string }[] = [
  { id: 'personal', title: 'Maklumat Peribadi' },
  { id: 'ekyc', title: 'eKYC' },
  { id: 'business', title: 'Maklumat Perniagaan' },
  { id: 'bank', title: 'Maklumat Bank' },
  { id: 'integrations', title: 'Semakan Integrasi' },
  { id: 'complete', title: 'Selesai' },
];

const INTEGRATION_CHECKS: { id: keyof IntegrationStatus; name: string; agency: string }[] = [
  { id: 'insolvensi', name: 'Semakan Insolvensi', agency: 'Jabatan Insolvensi Malaysia' },
  { id: 'ccris', name: 'Semakan CCRIS', agency: 'Bank Negara Malaysia' },
  { id: 'ctos', name: 'Semakan CTOS', agency: 'CTOS Data Systems' },
  { id: 'ssm', name: 'Semakan SSM', agency: 'Suruhanjaya Syarikat Malaysia' },
  { id: 'esyariah', name: 'Semakan e-Syariah', agency: 'Jabatan Kehakiman Syariah Malaysia' },
  { id: 'jpn', name: 'Pengesahan JPN', agency: 'Jabatan Pendaftaran Negara' },
];

const ACCEPTED_MYKAD_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ACCEPTED_STATEMENT_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE_MB = 10;
const MAX_STATEMENT_SIZE_MB = 5;
const MAX_STATEMENT_FILES = 3;

// --- HELPER COMPONENTS ---

const StepIndicator = ({ currentStep }: { currentStep: Step }) => {
  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {STEPS.map((step, stepIdx) => (
          <li key={step.title} className={`relative ${stepIdx !== STEPS.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
            {stepIdx < currentStepIndex ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-green-600" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
              </>
            ) : stepIdx === currentStepIndex ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-green-600 bg-white" aria-current="step">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-600" aria-hidden="true" />
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white hover:border-gray-400">
                </div>
              </>
            )}
             <span className="absolute -bottom-6 text-center w-20 -left-6 text-xs font-medium text-gray-600">{step.title}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
};

// --- MAIN COMPONENT ---

export default function RegistrationEkyc() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'bm' | 'en'>('bm');
  const [step, setStep] = useState<Step>('personal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- State for each step ---

  // Step 1: Personal
  const [personalForm, setPersonalForm] = useState<PersonalData>({
    fullName: '', ic: '', phone: '', email: '', password: '', confirmPassword: '', agreeTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Step 2: eKYC
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ekycStatus, setEkycStatus] = useState<EkycStatus>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ekycResult, setEkycResult] = useState<EkycResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [livenessStep, setLivenessStep] = useState(0); // 0: upload, 1: camera

  // Step 3: Business
  const [businessForm, setBusinessForm] = useState<BusinessData>({
    businessName: '', ssmNumber: '', businessType: 'Milikan Tunggal', businessSector: 'Makanan & Minuman', startDate: '',
    businessAddress: '', state: 'Selangor', monthlyIncome: '', employeeCount: '',
  });

  // Step 4: Bank
  const [bankForm, setBankForm] = useState<BankData>({
    bankName: 'Maybank', accountNumber: '', accountHolderName: '', accountType: '',
  });
  const [bankStatements, setBankStatements] = useState<File[]>([]);
  const [bankFileError, setBankFileError] = useState<string | null>(null);

  // Step 5: Integrations
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus>({
    insolvensi: 'pending', ccris: 'pending', ctos: 'pending',
    ssm: 'pending', esyariah: 'pending', jpn: 'pending',
  });
  const [integrationsComplete, setIntegrationsComplete] = useState(false);

  // --- Handlers & Logic ---

  const handlePersonalChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setPersonalForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (name === 'password') checkPasswordStrength(value);
  };

  const checkPasswordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    setPasswordStrength(score);
  };

  const handlePersonalSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (personalForm.password !== personalForm.confirmPassword) {
      setError("Kata laluan dan pengesahan kata laluan tidak sepadan.");
      return;
    }
    if (!personalForm.agreeTerms) {
      setError("Anda mesti bersetuju dengan Terma dan Syarat.");
      return;
    }
    setError(null);
    setStep('ekyc');
  };

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      if (!ACCEPTED_MYKAD_TYPES.includes(file.type)) {
        setError(`Jenis fail tidak sah. Sila muat naik fail ${ACCEPTED_MYKAD_TYPES.join(', ')}.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`Saiz fail melebihi had ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }
      setError(null);
      setPreviewUrl(URL.createObjectURL(file));
      handleEkycUpload(file);
    }
  };

  const handleEkycUpload = async (file: File) => {
    setEkycStatus('processing');
    setEkycResult(null);
    try {
      // Demo fallback logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      const isMyKad = Math.random() > 0.1; // 90% chance of being a MyKad
      if (isMyKad) {
        const demoResult: EkycResult = {
          is_mykad: true,
          is_valid: true,
          confidence: 0.98,
          rejection_reason: null,
          rejection_code: null,
          extracted_fields: {
            name: personalForm.fullName || 'DEMO NAMA PENUH',
            ic_number: personalForm.ic || '900101-01-1234',
            address: '123, JALAN DEMO, TAMAN TEKUN, 50000 KUALA LUMPUR',
            date_of_birth: '1990-01-01',
            gender: 'LELAKI',
            nationality: 'WARGANEGARA',
          },
          quality_score: 0.95,
          issues: [],
        };
        setEkycResult(demoResult);
        setEkycStatus('success');
        // Auto-fill form if empty
        if (!personalForm.fullName && demoResult.extracted_fields.name) {
            setPersonalForm(prev => ({...prev, fullName: demoResult.extracted_fields.name!}));
        }
        if (!personalForm.ic && demoResult.extracted_fields.ic_number) {
            setPersonalForm(prev => ({...prev, ic: demoResult.extracted_fields.ic_number!}));
        }
      } else {
        const demoResult: EkycResult = {
          is_mykad: false,
          is_valid: false,
          confidence: 0.85,
          rejection_reason: 'Imej yang dimuat naik bukan MyKad Malaysia yang sah.',
          rejection_code: 'NOT_MYKAD',
          extracted_fields: {},
          quality_score: 0.5,
          issues: ['Gambar kabur', 'Bukan dokumen pengenalan'],
        };
        setEkycResult(demoResult);
        setEkycStatus('failed');
      }
    } catch (err) {
      setEkycStatus('failed');
      setEkycResult({
        is_mykad: false, is_valid: false, confidence: 0, rejection_reason: 'Gagal memproses imej. Sila cuba lagi.',
        rejection_code: 'PROCESSING_ERROR', extracted_fields: {}, quality_score: 0, issues: [],
      });
    }
  };

  const resetEkyc = () => {
    setEkycStatus('idle');
    setPreviewUrl(null);
    setEkycResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Tidak dapat mengakses kamera. Sila benarkan akses kamera dalam tetapan pelayar anda.");
      setLivenessStep(0);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (livenessStep === 1) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [livenessStep, startCamera, stopCamera]);

  const handleLivenessProceed = () => {
    setLivenessStep(1);
  };

  const advanceStep = (next: Step) => {
    setError(null);
    setCameraActive(false);
    setLivenessStep(0);
    stopCamera();
    setStep(next);
  };

  // --- Business & Bank Form Handlers ---

  const handleBusinessChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBusinessForm(prev => ({ ...prev, [name]: value }));
  };

  const handleBankChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBankForm(prev => ({ ...prev, [name]: value }));
  };

  const handleBankStatementDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleBankStatementFiles(e.dataTransfer.files);
  };

  const handleBankStatementSelect = (e: ChangeEvent<HTMLInputElement>) => {
    handleBankStatementFiles(e.target.files);
  };

  const handleBankStatementFiles = (files: FileList | null) => {
    setBankFileError(null);
    if (!files) return;

    const newFiles = Array.from(files);
    const totalFiles = bankStatements.length + newFiles.length;

    if (totalFiles > MAX_STATEMENT_FILES) {
      setBankFileError(`Anda hanya boleh memuat naik maksimum ${MAX_STATEMENT_FILES} fail.`);
      return;
    }

    const invalidFiles = newFiles.filter(file => 
      !ACCEPTED_STATEMENT_TYPES.includes(file.type) || file.size > MAX_STATEMENT_SIZE_MB * 1024 * 1024
    );

    if (invalidFiles.length > 0) {
      setBankFileError(`Satu atau lebih fail tidak sah (jenis atau saiz > ${MAX_STATEMENT_SIZE_MB}MB).`);
      return;
    }

    setBankStatements(prev => [...prev, ...newFiles]);
  };

  const removeBankStatement = (index: number) => {
    setBankStatements(prev => prev.filter((_, i) => i !== index));
  };

  // --- Integration Check Logic ---

  useEffect(() => {
    const runChecks = async () => {
      setIntegrationsComplete(false);
      const checks: (keyof IntegrationStatus)[] = ['insolvensi', 'ccris', 'ctos', 'ssm', 'esyariah', 'jpn'];
      
      setIntegrationStatus(prev => {
        const newState = { ...prev };
        checks.forEach(key => newState[key] = 'running');
        return newState;
      });

      let results: any = null;
      let apiError = false;

      try {
        const response = await api.get(`/integrations/check/${personalForm.ic}`);
        results = response.data;
      } catch (error) {
        apiError = true;
      }

      const getApiStatus = (key: keyof IntegrationStatus) => {
        if (!results) return null;
        if (key === 'insolvensi') return results.muflis?.status;
        return results[key]?.status;
      };

      const isSuccess = (status: string | undefined) => {
        if (!status) return false;
        const s = status.toLowerCase();
        return s === 'clear' || s === 'ok' || s === 'registered';
      };

      for (const check of checks) {
        // Keep the visual staggered animation
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
        
        if (apiError || !results) {
          setIntegrationStatus(prev => ({ ...prev, [check]: 'failed' }));
        } else {
          const status = getApiStatus(check);
          if (isSuccess(status)) {
            setIntegrationStatus(prev => ({ ...prev, [check]: 'success' }));
          } else {
            setIntegrationStatus(prev => ({ ...prev, [check]: 'failed' }));
          }
        }
      }
      setIntegrationsComplete(true);
    };

    if (step === 'integrations') {
      runChecks();
    }
  }, [step, personalForm.ic]);

  // --- Final Submission ---

  const handleFinalSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Register User
      await api.post('/auth/register', {
        name: personalForm.fullName,
        email: personalForm.email,
        phone: personalForm.phone,
        ic_no: personalForm.ic,
        password: personalForm.password,
        password_confirmation: personalForm.confirmPassword,
        role: 'usahawan'
      });

      // 2. Request OTP
      await api.post('/auth/otp/send', {
        identifier: personalForm.email,
        channel: 'email',
        purpose: 'registration'
      });

      // 3. Navigate to Verification
      navigate('/otp', { state: { email: personalForm.email, purpose: 'registration' } });
    } catch (err: any) {
      setError(err.response?.data?.message || "Pendaftaran gagal. Sila cuba sebentar lagi.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER FUNCTIONS FOR EACH STEP ---

  const renderPersonalForm = () => (
    <form onSubmit={handlePersonalSubmit} className="space-y-4">
      {/* Form fields... */}
      <div className="relative">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input type="text" name="fullName" placeholder="Nama Penuh (seperti dalam MyKad)" required className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-navy-400" value={personalForm.fullName} onChange={handlePersonalChange} />
      </div>
      <div className="relative">
        <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input type="text" name="ic" placeholder="No. MyKad (cth: 900101011234)" required pattern="\d{12}" title="Sila masukkan 12 digit nombor MyKad tanpa sengkang" className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-navy-400" value={personalForm.ic} onChange={handlePersonalChange} />
      </div>
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input type="tel" name="phone" placeholder="No. Telefon Bimbit (cth: 0123456789)" required className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-navy-400" value={personalForm.phone} onChange={handlePersonalChange} />
      </div>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input type="email" name="email" placeholder="Alamat E-mel" required className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-navy-400" value={personalForm.email} onChange={handlePersonalChange} />
      </div>
      <div className="relative">
        <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Kata Laluan" required className="w-full pl-4 pr-10 py-2 border rounded-md focus:ring-2 focus:ring-navy-400" value={personalForm.password} onChange={handlePersonalChange} />
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          {showPassword ? <EyeOff /> : <Eye />}
        </button>
      </div>
      {personalForm.password && (
        <div className="flex items-center space-x-2">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full ${['bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'][passwordStrength - 1] || ''}`} style={{ width: `${passwordStrength * 25}%` }}></div>
          </div>
          <span className="text-xs text-gray-500">{['Sangat Lemah', 'Lemah', 'Sederhana', 'Kuat'][passwordStrength - 1] || ''}</span>
        </div>
      )}
      <div className="relative">
        <input type={showPassword ? 'text' : 'password'} name="confirmPassword" placeholder="Sahkan Kata Laluan" required className="w-full pl-4 pr-10 py-2 border rounded-md focus:ring-2 focus:ring-navy-400" value={personalForm.confirmPassword} onChange={handlePersonalChange} />
      </div>
      <div className="flex items-start">
        <input id="agreeTerms" name="agreeTerms" type="checkbox" className="h-4 w-4 text-navy-600 border-gray-300 rounded mt-1" checked={personalForm.agreeTerms} onChange={handlePersonalChange} />
        <label htmlFor="agreeTerms" className="ml-2 block text-sm text-gray-900">
          Saya bersetuju dengan <a href="/terma-syarat" target="_blank" className="font-medium text-navy-600 hover:underline">Terma dan Syarat</a> serta <a href="/dasar-privasi" target="_blank" className="font-medium text-navy-600 hover:underline">Dasar Privasi</a> TEKUN Nasional.
        </label>
      </div>
      <button type="submit" className="w-full bg-navy-600 text-white py-2 px-4 rounded-md hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-500 disabled:bg-gray-400">
        Teruskan
      </button>
    </form>
  );

  const renderEkyc = () => (
    <div className="text-center">
      {livenessStep === 0 ? (
        <>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Langkah 2: Pengesahan Identiti (eKYC)</h3>
          <p className="text-gray-600 mb-6">Sila muat naik gambar MyKad (depan) anda yang jelas.</p>
          {ekycStatus === 'idle' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-12 cursor-pointer transition-colors ${dragOver ? 'border-navy-500 bg-navy-50' : 'border-gray-300 bg-gray-50'}`}
            >
              <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e.target.files)} accept={ACCEPTED_MYKAD_TYPES.join(',')} className="hidden" />
              <div className="flex flex-col items-center text-gray-500">
                <Upload className="w-12 h-12 mb-4" />
                <p className="font-semibold">Klik untuk muat naik atau seret dan lepas</p>
                <p className="text-sm">PNG, JPG, WEBP (MAX. {MAX_FILE_SIZE_MB}MB)</p>
              </div>
            </div>
          )}
          {ekycStatus === 'processing' && (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-gray-50">
              <Loader2 className="w-12 h-12 mb-4 animate-spin text-navy-600" />
              <p className="font-semibold text-navy-700">Menganalisis imej MyKad...</p>
              <p className="text-sm text-gray-500">Ini mungkin mengambil masa beberapa saat.</p>
            </div>
          )}
          {(ekycStatus === 'success' || ekycStatus === 'failed') && previewUrl && (
            <div>
              <img src={previewUrl} alt="MyKad Preview" className="max-w-full max-h-64 mx-auto rounded-lg shadow-md" />
              {ekycStatus === 'success' && ekycResult && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-left">
                  <div className="flex items-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                    <h4 className="font-semibold text-green-800">MyKad Berjaya Disahkan</h4>
                  </div>
                  <ul className="mt-2 text-sm text-green-700 list-disc list-inside">
                    <li>Nama: {ekycResult.extracted_fields.name}</li>
                    <li>No. MyKad: {ekycResult.extracted_fields.ic_number}</li>
                  </ul>
                </div>
              )}
              {ekycStatus === 'failed' && ekycResult && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                  <div className="flex items-center">
                    <XCircle className="w-6 h-6 text-red-600 mr-3" />
                    <h4 className="font-semibold text-red-800">Pengesahan Gagal</h4>
                  </div>
                  <p className="mt-2 text-sm text-red-700">{ekycResult.rejection_reason}</p>
                </div>
              )}
              <div className="mt-6 flex justify-center space-x-4">
                <button onClick={resetEkyc} className="flex items-center bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300">
                  <RotateCcw className="w-4 h-4 mr-2" /> Muat Naik Semula
                </button>
                {ekycStatus === 'success' && (
                  <button onClick={handleLivenessProceed} className="bg-navy-600 text-white py-2 px-4 rounded-md hover:bg-navy-700">
                    Teruskan ke Pengesahan Wajah
                  </button>
                )}
              </div>
              {/* DEMO MODE: Skip eKYC for POC testing */}
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700 mb-2">⚠️ <strong>Demo Mode:</strong> Untuk tujuan demonstrasi POC, anda boleh langkau pengesahan eKYC.</p>
                <button
                  onClick={() => advanceStep('business')}
                  className="w-full text-sm bg-amber-500 text-white py-2 px-4 rounded-md hover:bg-amber-600"
                >
                  Langkau eKYC (Demo Mode)
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Pengesahan Wajah</h3>
          <p className="text-gray-600 mb-6">Sila pastikan wajah anda berada di dalam bingkai dan ikut arahan.</p>
          <div className="relative w-full max-w-md mx-auto aspect-square bg-black rounded-lg overflow-hidden shadow-lg">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            {!cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden"></canvas>
          <div className="mt-6 flex justify-center space-x-4">
            <button onClick={() => setLivenessStep(0)} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300">
              Kembali
            </button>
            <button onClick={() => advanceStep('business')} className="bg-navy-600 text-white py-2 px-4 rounded-md hover:bg-navy-700">
              Selesai & Teruskan
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderBusinessForm = () => (
    <form onSubmit={(e) => { e.preventDefault(); advanceStep('bank'); }} className="space-y-4">
      <div className="relative">
        <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input type="text" name="businessName" placeholder="Nama Perniagaan" required className="w-full pl-10 pr-4 py-2 border rounded-md" value={businessForm.businessName} onChange={handleBusinessChange} />
      </div>
      <div className="relative">
        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input type="text" name="ssmNumber" placeholder="No. Pendaftaran SSM" required className="w-full pl-10 pr-4 py-2 border rounded-md" value={businessForm.ssmNumber} onChange={handleBusinessChange} />
      </div>
      <div className="relative">
        <select name="businessType" required className="w-full pl-4 pr-10 py-2 border rounded-md" value={businessForm.businessType} onChange={handleBusinessChange}>
          <option value="">Jenis Perniagaan</option>
          <option>Milikan Tunggal</option>
          <option>Perkongsian</option>
          <option>Syarikat Sendirian Berhad</option>
          <option>Koperasi</option>
        </select>
      </div>
      <div className="relative">
        <select name="businessSector" required className="w-full pl-4 pr-10 py-2 border rounded-md" value={businessForm.businessSector} onChange={handleBusinessChange}>
          <option value="">Sektor Perniagaan</option>
          <option>Makanan & Minuman</option>
          <option>Pertanian</option>
          <option>Perkhidmatan</option>
          <option>Pembuatan</option>
          <option>Runcit</option>
          <option>Lain-lain</option>
        </select>
      </div>
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input type="date" name="startDate" placeholder="Tarikh Mula Beroperasi" required className="w-full pl-10 pr-4 py-2 border rounded-md" value={businessForm.startDate} onChange={handleBusinessChange} />
      </div>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input type="text" name="businessAddress" placeholder="Alamat Perniagaan" required className="w-full pl-10 pr-4 py-2 border rounded-md" value={businessForm.businessAddress} onChange={handleBusinessChange} />
      </div>
      <div className="relative">
        <select name="state" required className="w-full pl-4 pr-10 py-2 border rounded-md" value={businessForm.state} onChange={handleBusinessChange}>
          <option value="">Negeri</option>
          {[ "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", "Perak", "Perlis", "Pulau Pinang", "Sabah", "Sarawak", "Selangor", "Terengganu", "W.P. Kuala Lumpur", "W.P. Labuan", "W.P. Putrajaya" ].map(n => <option key={n}>{n}</option>)}
        </select>
      </div>
      <div className="relative">
        <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input type="number" name="monthlyIncome" placeholder="Anggaran Pendapatan Bulanan (RM)" required className="w-full pl-10 pr-4 py-2 border rounded-md" value={businessForm.monthlyIncome} onChange={handleBusinessChange} />
      </div>
      <div className="relative">
        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input type="number" name="employeeCount" placeholder="Bilangan Pekerja" className="w-full pl-10 pr-4 py-2 border rounded-md" value={businessForm.employeeCount} onChange={handleBusinessChange} />
      </div>
      <div className="flex justify-between">
        <button type="button" onClick={() => setStep('ekyc')} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300">Kembali</button>
        <button type="submit" className="bg-navy-600 text-white py-2 px-4 rounded-md hover:bg-navy-700">Teruskan</button>
      </div>
    </form>
  );

  const renderBankForm = () => (
    <form onSubmit={(e) => { e.preventDefault(); setStep('integrations'); }} className="space-y-4">
      <div className="relative">
        <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <select name="bankName" required className="w-full pl-10 pr-4 py-2 border rounded-md" value={bankForm.bankName} onChange={handleBankChange}>
          <option value="">Nama Bank</option>
          {[ "Maybank", "CIMB Bank", "Public Bank", "RHB Bank", "AmBank", "Bank Islam", "Bank Muamalat", "BSN", "Lain-lain" ].map(b => <option key={b}>{b}</option>)}
        </select>
      </div>
      <div className="relative">
        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input type="text" name="accountNumber" placeholder="No. Akaun Bank" required className="w-full pl-10 pr-4 py-2 border rounded-md" value={bankForm.accountNumber} onChange={handleBankChange} />
      </div>
      <div className="relative">
        <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input type="text" name="accountHolderName" placeholder="Nama Pemilik Akaun" required className="w-full pl-10 pr-4 py-2 border rounded-md" value={bankForm.accountHolderName} onChange={handleBankChange} />
      </div>
      <div className="flex space-x-4">
        <label className="flex items-center">
          <input type="radio" name="accountType" value="Semasa" checked={bankForm.accountType === 'Semasa'} onChange={handleBankChange} className="form-radio" />
          <span className="ml-2">Akaun Semasa</span>
        </label>
        <label className="flex items-center">
          <input type="radio" name="accountType" value="Simpanan" checked={bankForm.accountType === 'Simpanan'} onChange={handleBankChange} className="form-radio" />
          <span className="ml-2">Akaun Simpanan</span>
        </label>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Penyata Bank 3 Bulan Terkini</label>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleBankStatementDrop}
          onClick={() => document.getElementById('bankStatementInput')?.click()}
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer bg-gray-50 hover:bg-gray-100"
        >
          <input id="bankStatementInput" type="file" multiple onChange={handleBankStatementSelect} accept={ACCEPTED_STATEMENT_TYPES.join(',')} className="hidden" />
          <FileText className="mx-auto h-10 w-10 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">Seret & lepas atau klik untuk muat naik</p>
          <p className="text-xs text-gray-500">PDF, PNG, JPG (Maks {MAX_STATEMENT_SIZE_MB}MB setiap fail, maks {MAX_STATEMENT_FILES} fail)</p>
        </div>
        {bankFileError && <p className="text-red-500 text-sm mt-1">{bankFileError}</p>}
        <div className="mt-2 space-y-2">
          {bankStatements.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 border rounded-md bg-white">
              <span className="text-sm truncate">{file.name}</span>
              <button type="button" onClick={() => removeBankStatement(index)} className="text-red-500 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between">
        <button type="button" onClick={() => setStep('business')} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300">Kembali</button>
        <button type="submit" className="bg-navy-600 text-white py-2 px-4 rounded-md hover:bg-navy-700">Teruskan</button>
      </div>
    </form>
  );

  const renderIntegrations = () => (
    <div className="text-center">
      <h3 className="text-xl font-semibold text-gray-800 mb-2">Semakan Latar Belakang Automatik</h3>
      <p className="text-gray-600 mb-6">Sistem sedang membuat semakan dengan agensi-agensi berkaitan. Sila tunggu.</p>
      <div className="space-y-3">
        {INTEGRATION_CHECKS.map(check => (
          <div key={check.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
            <div>
              <p className="font-medium text-gray-800">{check.name}</p>
              <p className="text-sm text-gray-500">{check.agency}</p>
            </div>
            {integrationStatus[check.id] === 'running' && <Loader2 className="h-5 w-5 text-navy-500 animate-spin" />}
            {integrationStatus[check.id] === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {integrationStatus[check.id] === 'failed' && <AlertCircle className="h-5 w-5 text-red-500" />}
          </div>
        ))}
      </div>
      {integrationsComplete && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
          <Info className="inline-block h-5 w-5 mr-2" />
          Semua semakan telah selesai. Walaupun terdapat amaran, anda masih boleh meneruskan permohonan. Pegawai kami akan menilainya.
        </div>
      )}
      <div className="mt-8 flex justify-between">
        <button type="button" onClick={() => setStep('bank')} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300">Kembali</button>
        <button
          onClick={() => setStep('complete')}
          disabled={!integrationsComplete}
          className="bg-navy-600 text-white py-2 px-4 rounded-md hover:bg-navy-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Teruskan
        </button>
      </div>
    </div>
  );

  const renderComplete = () => (
    <div className="text-center">
      <BadgeCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h3 className="text-2xl font-bold text-gray-800">Pendaftaran Hampir Selesai!</h3>
      <p className="text-gray-600 mt-2 mb-6">
        Maklumat anda telah disahkan. Langkah terakhir adalah untuk mengesahkan e-mel anda melalui pautan OTP yang akan kami hantar.
      </p>
      <button
        onClick={handleFinalSubmit}
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 flex items-center justify-center"
      >
        {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
        Teruskan ke Pengesahan OTP
      </button>
    </div>
  );

  const renderStepContent = () => {
    switch (step) {
      case 'personal': return renderPersonalForm();
      case 'ekyc': return renderEkyc();
      case 'business': return renderBusinessForm();
      case 'bank': return renderBankForm();
      case 'integrations': return renderIntegrations();
      case 'complete': return renderComplete();
      default: return <p>Langkah tidak sah.</p>;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <PublicHeader lang={lang} setLang={setLang} />
      <main className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 px-4 sm:px-0">
            <StepIndicator currentStep={step} />
          </div>
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
            {step !== 'personal' && step !== 'ekyc' && (
              <h2 className="text-2xl font-bold text-navy-800 mb-6 text-center">
                {STEPS.find(s => s.id === step)?.title}
              </h2>
            )}
            {step === 'personal' && (
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-navy-800">Cipta Akaun Usahawan</h1>
                <p className="text-gray-600 mt-2">Mulakan perjalanan anda bersama TEKUN Nasional.</p>
              </div>
            )}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Ralat!</strong>
                <span className="block sm:inline ml-2">{error}</span>
              </div>
            )}
            {renderStepContent()}
          </div>
        </div>
      </main>
    </div>
  );
}