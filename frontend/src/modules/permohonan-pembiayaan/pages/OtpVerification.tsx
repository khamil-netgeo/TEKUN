import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, RefreshCw, Phone } from 'lucide-react';
import api from '@/services/api';

export default function OtpVerification() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
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

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputs.current[idx - 1]?.focus();
  };

  const verify = async () => {
    setStatus('verifying');
    try {
      await api.post('/auth/verify-otp', { otp: otp.join('') });
      setStatus('success');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      setStatus('error');
    }
  };

  const resend = () => {
    setCountdown(120);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    setStatus('idle');
    inputs.current[0]?.focus();
  };

  const mins = Math.floor(countdown / 60).toString().padStart(2, '0');
  const secs = (countdown % 60).toString().padStart(2, '0');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#1B2B5E] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <img src="/icons/icon-otp-shield.png" alt="OTP" className="w-14 h-14 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-[#1B2B5E]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Pengesahan TAC / OTP
          </h1>
          <p className="text-gray-500 text-sm mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            Kod 6-digit telah dihantar ke nombor telefon anda
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Phone size={14} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
              +60 1X-XXX X678
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* OTP Inputs */}
          <div className="flex gap-3 justify-center mb-6">
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
                className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none transition-all ${
                  status === 'error' ? 'border-red-400 bg-red-50 text-red-600' :
                  status === 'success' ? 'border-green-400 bg-green-50 text-green-600' :
                  digit ? 'border-[#1B2B5E] bg-blue-50 text-[#1B2B5E]' :
                  'border-gray-200 focus:border-[#1B2B5E]'
                }`}
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            ))}
          </div>

          {/* Status Messages */}
          {status === 'error' && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
              <span className="text-red-600 text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                Kod TAC tidak sah. Sila cuba semula.
              </span>
            </div>
          )}
          {status === 'success' && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-green-600 text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                Pengesahan berjaya! Mengalihkan...
              </span>
            </div>
          )}

          {/* Countdown */}
          <div className="text-center mb-6">
            {!canResend ? (
              <p className="text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                Kod tamat dalam{' '}
                <span className="font-bold text-[#1B2B5E]">{mins}:{secs}</span>
              </p>
            ) : (
              <button onClick={resend} className="flex items-center gap-2 text-sm text-[#1B2B5E] font-semibold mx-auto hover:underline" style={{ fontFamily: 'Inter, sans-serif' }}>
                <RefreshCw size={14} /> Hantar semula kod TAC
              </button>
            )}
          </div>

          {/* Verify Button */}
          <button
            onClick={verify}
            disabled={otp.join('').length !== 6 || status === 'verifying' || status === 'success'}
            className="w-full py-3 bg-[#1B2B5E] text-white rounded-lg font-semibold text-sm hover:bg-[#152348] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {status === 'verifying' ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Mengesahkan...
              </span>
            ) : 'Sahkan Kod TAC'}
          </button>

          <p className="text-center text-xs text-gray-400 mt-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            Tidak menerima kod? Semak folder spam atau hubungi{' '}
            <span className="text-[#1B2B5E] font-semibold">1-800-88-1234</span>
          </p>
        </div>
      </div>
    </div>
  );
}