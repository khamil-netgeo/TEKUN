/**
 * TEKUN SPPT — Module 1: OTP Verification
 * Real implementation: calls POST /api/auth/otp/verify and POST /api/auth/otp/send
 */
import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, RefreshCw, Phone, Mail, AlertCircle } from 'lucide-react';
import api from '@/services/api';

interface LocationState {
  email?: string;
  phone?: string;
  purpose?: string;
}

export default function OtpVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState) ?? {};
  const identifier = state.email || state.phone || '';
  const channel: 'email' | 'sms' = state.email ? 'email' : 'sms';
  const purpose = state.purpose || 'verification';

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputs.current[idx - 1]?.focus();
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(''));
      inputs.current[5]?.focus();
    }
  };

  const verify = async () => {
    const code = otp.join('');
    if (code.length < 6) return;
    setStatus('verifying');
    setErrorMsg('');
    try {
      await api.post('/auth/otp/verify', {
        identifier,
        channel,
        code,
        purpose,
      });
      setStatus('success');
      setTimeout(() => {
        if (purpose === 'registration') {
          navigate('/usahawan/dashboard', { replace: true });
        } else if (purpose === 'password_reset') {
          navigate('/reset-password', { state: { email: identifier, otp: code } });
        } else {
          navigate('/dashboard');
        }
      }, 2500);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(e?.response?.data?.message ?? 'Kod OTP tidak sah. Sila cuba semula.');
      setStatus('error');
    }
  };

  const resend = async () => {
    setCountdown(120);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    setStatus('idle');
    setErrorMsg('');
    inputs.current[0]?.focus();
    try {
      await api.post('/auth/otp/send', { identifier, channel, purpose });
    } catch {
      // Non-critical error, user can try again
    }
  };

  const mins = Math.floor(countdown / 60).toString().padStart(2, '0');
  const secs = (countdown % 60).toString().padStart(2, '0');
  const maskedIdentifier = channel === 'email'
    ? identifier.replace(/(.{2}).*(@.*)/, '$1***$2')
    : identifier.replace(/(\d{3})\d+(\d{4})/, '$1****$2');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#1B2B5E] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1B2B5E]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Pengesahan TAC / OTP
          </h1>
          <p className="text-gray-500 text-sm mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            Kod 6-digit telah dihantar ke {channel === 'email' ? 'e-mel' : 'nombor telefon'} anda
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            {channel === 'email' ? <Mail size={14} className="text-gray-400" /> : <Phone size={14} className="text-gray-400" />}
            <span className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
              {maskedIdentifier || (channel === 'email' ? 'e-mel anda' : 'telefon anda')}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* OTP Inputs */}
          <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={el => { inputs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none transition-all ${
                  status === 'error' ? 'border-red-400 bg-red-50 text-red-700' :
                  status === 'success' ? 'border-green-400 bg-green-50 text-green-700' :
                  digit ? 'border-[#1B2B5E] bg-[#1B2B5E]/5 text-[#1B2B5E]' :
                  'border-gray-200 focus:border-[#1B2B5E]'
                }`}
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            ))}
          </div>

          {/* Status Messages */}
          {status === 'success' && (
            <div className="flex items-center gap-2 justify-center mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle size={18} className="text-green-600" />
              <span className="text-sm font-semibold text-green-700 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
                {purpose === 'registration'
                  ? 'Akaun anda telah berjaya disahkan! Selamat datang ke portal Usahawan TEKUN.'
                  : 'Pengesahan berjaya! Mengalihkan...'}
              </span>
            </div>
          )}
          {status === 'error' && errorMsg && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700" style={{ fontFamily: 'Inter, sans-serif' }}>{errorMsg}</span>
            </div>
          )}

          {/* Verify Button */}
          <button
            onClick={verify}
            disabled={otp.join('').length < 6 || status === 'verifying' || status === 'success'}
            className="w-full py-3 bg-[#1B2B5E] text-white rounded-xl font-semibold text-sm hover:bg-[#152348] disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {status === 'verifying' ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Mengesahkan...
              </span>
            ) : 'Sahkan OTP'}
          </button>

          {/* Countdown / Resend */}
          <div className="text-center">
            {!canResend ? (
              <p className="text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                Hantar semula dalam{' '}
                <span className="font-bold text-[#1B2B5E]">{mins}:{secs}</span>
              </p>
            ) : (
              <button
                onClick={resend}
                className="flex items-center gap-2 mx-auto text-sm font-semibold text-[#1B2B5E] hover:underline"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <RefreshCw size={14} />
                Hantar Semula Kod OTP
              </button>
            )}
          </div>
        </div>

        {/* Back to login */}
        <p className="text-center text-sm text-gray-500 mt-4" style={{ fontFamily: 'Inter, sans-serif' }}>
          <button onClick={() => navigate('/login')} className="text-[#1B2B5E] font-semibold hover:underline">
            ← Kembali ke Log Masuk
          </button>
        </p>
      </div>
    </div>
  );
}