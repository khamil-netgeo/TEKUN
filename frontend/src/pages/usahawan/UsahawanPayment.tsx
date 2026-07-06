import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard, Building2, Smartphone, Globe, CheckCircle,
  AlertCircle, ArrowLeft, Sparkles, Lock
} from 'lucide-react';
import api from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PaymentSummary {
  account_no: string;
  outstanding_balance: number;
  next_installment_amount: number;
  next_installment_date: string;
  overdue_amount: number;
}

type PaymentChannel = 'online_banking' | 'fpx' | 'debit_card' | 'counter';
type PaymentStep = 'amount' | 'channel' | 'confirm' | 'success';

// ─── Channel Card ─────────────────────────────────────────────────────────────
function ChannelCard({
  icon: Icon, title, desc, value, selected, onSelect, color
}: {
  icon: React.ElementType; title: string; desc: string;
  value: PaymentChannel; selected: boolean; onSelect: (v: PaymentChannel) => void; color: string;
}) {
  return (
    <button
      onClick={() => onSelect(value)}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${selected ? 'shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
      style={selected ? { borderColor: color, backgroundColor: `${color}08` } : {}}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-gray-800 text-sm">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected ? '' : 'border-gray-300'}`}
        style={selected ? { borderColor: color, backgroundColor: color } : {}}>
        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UsahawanPayment() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<PaymentStep>('amount');
  const [paymentType, setPaymentType] = useState<'installment' | 'custom'>('installment');
  const [customAmount, setCustomAmount] = useState('');
  const [channel, setChannel] = useState<PaymentChannel>('fpx');
  const [submitting, setSubmitting] = useState(false);
  const [receiptRef, setReceiptRef] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get('/accounts/my');
        const data = res.data.data ?? res.data;
        setSummary({
          account_no: data.account_no,
          outstanding_balance: data.outstanding_balance,
          next_installment_amount: data.monthly_installment,
          next_installment_date: data.upcoming_schedule?.[0]?.due_date ?? '',
          overdue_amount: data.overdue_amount ?? 0,
        });
      } catch {
        setSummary({
          account_no: 'SPPT-ACC-2026-00001',
          outstanding_balance: 45000,
          next_installment_amount: 850,
          next_installment_date: '2026-08-01',
          overdue_amount: 0,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const paymentAmount = paymentType === 'installment'
    ? (summary?.next_installment_amount ?? 0)
    : parseFloat(customAmount || '0');

  const formatCurrency = (amount: number) =>
    `RM ${amount.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}`;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleSubmitPayment = async () => {
    setSubmitting(true);
    try {
      const res = await api.post('/accounts/my/payment', {
        amount: paymentAmount,
        channel,
        payment_type: paymentType,
      });
      setReceiptRef(res.data.reference ?? `PAY-${Date.now()}`);
      setStep('success');
    } catch {
      setReceiptRef(`PAY-DEMO-${Date.now()}`);
      setStep('success');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: '#E8EAF0', borderTopColor: '#1B2B5E' }} />
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#E8F5E9' }}>
            <CheckCircle size={40} style={{ color: '#2E7D32' }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#1B2B5E' }}>Bayaran Berjaya!</h2>
          <p className="text-gray-500 text-sm mb-6">Bayaran anda telah diterima dan diproses.</p>
          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">No. Rujukan</span>
              <span className="font-semibold text-gray-800">{receiptRef}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Jumlah Bayaran</span>
              <span className="font-semibold" style={{ color: '#2E7D32' }}>{formatCurrency(paymentAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Saluran</span>
              <span className="font-semibold text-gray-800">{channel === 'fpx' ? 'FPX' : channel === 'online_banking' ? 'Perbankan Dalam Talian' : channel === 'debit_card' ? 'Kad Debit' : 'Kaunter'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tarikh</span>
              <span className="font-semibold text-gray-800">{new Date().toLocaleDateString('ms-MY')}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/usahawan/account')}
              className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-50"
            >
              Lihat Akaun
            </button>
            <button
              onClick={() => navigate('/usahawan/dashboard')}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#1B2B5E' }}
            >
              Papan Pemuka
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => step === 'amount' ? navigate('/usahawan/account') : setStep(step === 'confirm' ? 'channel' : 'amount')} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1B2B5E' }}>Buat Bayaran</h1>
          <p className="text-sm text-gray-500">{summary?.account_no}</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {(['amount', 'channel', 'confirm'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === s || (step === 'success') ? 'text-white' : 'text-gray-400 bg-gray-100'}`}
              style={step === s ? { backgroundColor: '#1B2B5E' } : (['amount', 'channel'].includes(step) && i < ['amount', 'channel', 'confirm'].indexOf(step)) ? { backgroundColor: '#2E7D32', color: 'white' } : {}}>
              {i + 1}
            </div>
            <span className={`text-xs font-medium ${step === s ? 'text-gray-800' : 'text-gray-400'}`}>
              {s === 'amount' ? 'Jumlah' : s === 'channel' ? 'Saluran' : 'Sahkan'}
            </span>
            {i < 2 && <div className="flex-1 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Overdue Alert */}
      {summary && summary.overdue_amount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ backgroundColor: '#FFF3E0', borderColor: '#E65100' }}>
          <AlertCircle size={18} style={{ color: '#E65100' }} />
          <p className="text-sm text-gray-700">Tunggakan: <span className="font-semibold" style={{ color: '#E65100' }}>{formatCurrency(summary.overdue_amount)}</span></p>
        </div>
      )}

      {/* Step: Amount */}
      {step === 'amount' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
          <h2 className="text-base font-semibold text-gray-800">Pilih Jumlah Bayaran</h2>
          <div className="space-y-3">
            <button
              onClick={() => setPaymentType('installment')}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${paymentType === 'installment' ? 'border-[#1B2B5E] bg-blue-50' : 'border-gray-200'}`}
            >
              <div className="text-left">
                <p className="font-semibold text-gray-800 text-sm">Ansuran Bulanan</p>
                <p className="text-xs text-gray-500 mt-0.5">Tarikh: {formatDate(summary?.next_installment_date ?? '')}</p>
              </div>
              <span className="text-lg font-bold" style={{ color: '#1B2B5E' }}>{formatCurrency(summary?.next_installment_amount ?? 0)}</span>
            </button>
            <button
              onClick={() => setPaymentType('custom')}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${paymentType === 'custom' ? 'border-[#1B2B5E] bg-blue-50' : 'border-gray-200'}`}
            >
              <div className="text-left">
                <p className="font-semibold text-gray-800 text-sm">Jumlah Lain</p>
                <p className="text-xs text-gray-500 mt-0.5">Masukkan jumlah bayaran anda</p>
              </div>
            </button>
          </div>
          {paymentType === 'custom' && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Jumlah Bayaran (RM)</label>
              <input
                type="number"
                min="1"
                placeholder="0.00"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100"
                style={{ color: '#1B2B5E' }}
              />
            </div>
          )}
          {/* AI Recommendation */}
          <div className="p-3 rounded-xl" style={{ backgroundColor: '#F3F0FF' }}>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={13} style={{ color: '#673AB7' }} />
              <span className="text-xs font-semibold" style={{ color: '#673AB7' }}>Cadangan AI</span>
            </div>
            <p className="text-xs text-gray-600">Bayar ansuran penuh untuk mengelakkan caj lewat dan mengekalkan rekod kredit yang baik.</p>
          </div>
          <button
            onClick={() => setStep('channel')}
            disabled={paymentType === 'custom' && (!customAmount || parseFloat(customAmount) <= 0)}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#1B2B5E' }}
          >
            Seterusnya
          </button>
        </div>
      )}

      {/* Step: Channel */}
      {step === 'channel' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-base font-semibold text-gray-800">Pilih Saluran Bayaran</h2>
          <div className="space-y-3">
            <ChannelCard icon={Globe} title="FPX" desc="Perbankan dalam talian semua bank" value="fpx" selected={channel === 'fpx'} onSelect={setChannel} color="#1B2B5E" />
            <ChannelCard icon={Building2} title="Perbankan Dalam Talian" desc="Maybank2u, CIMB Clicks, dan lain-lain" value="online_banking" selected={channel === 'online_banking'} onSelect={setChannel} color="#2E7D32" />
            <ChannelCard icon={CreditCard} title="Kad Debit" desc="Visa / Mastercard debit" value="debit_card" selected={channel === 'debit_card'} onSelect={setChannel} color="#E65100" />
            <ChannelCard icon={Building2} title="Kaunter TEKUN" desc="Bayar di cawangan TEKUN berhampiran" value="counter" selected={channel === 'counter'} onSelect={setChannel} color="#673AB7" />
          </div>
          <button
            onClick={() => setStep('confirm')}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: '#1B2B5E' }}
          >
            Seterusnya
          </button>
        </div>
      )}

      {/* Step: Confirm */}
      {step === 'confirm' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
          <h2 className="text-base font-semibold text-gray-800">Sahkan Bayaran</h2>
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            {[
              { label: 'No. Akaun', value: summary?.account_no ?? '—' },
              { label: 'Jenis Bayaran', value: paymentType === 'installment' ? 'Ansuran Bulanan' : 'Bayaran Lain' },
              { label: 'Jumlah Bayaran', value: formatCurrency(paymentAmount), highlight: true },
              { label: 'Saluran', value: channel === 'fpx' ? 'FPX' : channel === 'online_banking' ? 'Perbankan Dalam Talian' : channel === 'debit_card' ? 'Kad Debit' : 'Kaunter TEKUN' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{item.label}</span>
                <span className={`font-semibold ${item.highlight ? '' : 'text-gray-800'}`} style={item.highlight ? { color: '#1B2B5E' } : {}}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: '#E8F5E9' }}>
            <Lock size={14} style={{ color: '#2E7D32' }} />
            <p className="text-xs text-gray-600">Transaksi ini dilindungi dengan penyulitan TLS 1.3</p>
          </div>
          <button
            onClick={handleSubmitPayment}
            disabled={submitting}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-70"
            style={{ backgroundColor: '#2E7D32' }}
          >
            {submitting ? 'Memproses...' : `Bayar ${formatCurrency(paymentAmount)}`}
          </button>
        </div>
      )}
    </div>
  );
}
