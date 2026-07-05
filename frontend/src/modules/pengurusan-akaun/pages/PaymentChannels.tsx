import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import AiBadge from '@/components/ui/AiBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ToastContainer } from '@/components/ui/Toast';
import { useTranslation } from 'react-i18next';
import {
  CreditCard, Smartphone, Building2, Globe, CheckCircle,
  Clock, AlertTriangle, ArrowLeft, ExternalLink
} from 'lucide-react';

interface PaymentChannel {
  id: string;
  name: string;
  type: 'online' | 'mobile' | 'counter' | 'auto_debit';
  description: string;
  processing_time: string;
  fee: string;
  available: boolean;
  icon_key?: string;
  instructions?: string[];
}

interface PaymentHistory {
  id: number;
  receipt_no: string;
  amount: number;
  payment_date: string;
  channel: string;
  status: string;
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  online:     <Globe className="w-6 h-6" />,
  mobile:     <Smartphone className="w-6 h-6" />,
  counter:    <Building2 className="w-6 h-6" />,
  auto_debit: <CreditCard className="w-6 h-6" />,
};

const CHANNEL_COLOURS: Record<string, string> = {
  online:     '#1B2B5E',
  mobile:     '#2E7D32',
  counter:    '#E65100',
  auto_debit: '#673AB7',
};

export default function PaymentChannels() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [channels, setChannels]         = useState<PaymentChannel[]>([]);
  const [history,  setHistory]          = useState<PaymentHistory[]>([]);
  const [loading,  setLoading]          = useState(true);
  const [error,    setError]            = useState<string | null>(null);
  const [selected, setSelected]         = useState<PaymentChannel | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/accounts/payment-channels'),
      id ? api.get(`/accounts/${id}/payment-history`) : Promise.resolve({ data: { data: [] } }),
    ])
      .then(([chRes, histRes]) => {
        setChannels(chRes.data?.data ?? chRes.data ?? []);
        setHistory(histRes.data?.data ?? histRes.data ?? []);
      })
      .catch(() => setError(t('payment.load_error', 'Gagal memuatkan saluran pembayaran')))
      .finally(() => setLoading(false));
  }, [id, t]);

  const activeChannels   = channels.filter(c => c.available);
  const inactiveChannels = channels.filter(c => !c.available);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />
      <PageHeader
        title={t('payment.channels_title', 'Saluran Pembayaran')}
        subtitle={id ? `${t('account.account_no', 'No. Akaun')}: ${id}` : undefined}
        breadcrumbs={[
          { label: t('nav.accounts', 'Akaun'), href: '/accounts' },
          { label: t('payment.channels_title', 'Saluran Pembayaran') },
        ]}
        action={
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1B2B5E]"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back', 'Kembali')}
          </button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* KPI Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            title={t('payment.total_channels', 'Jumlah Saluran')}
            value={String(channels.length)}
            icon={<CreditCard className="w-5 h-5" />}
            colour="navy"
          />
          <StatCard
            title={t('payment.active_channels', 'Saluran Aktif')}
            value={String(activeChannels.length)}
            icon={<CheckCircle className="w-5 h-5" />}
            colour="green"
          />
          <StatCard
            title={t('payment.total_payments', 'Jumlah Pembayaran')}
            value={String(history.length)}
            icon={<Clock className="w-5 h-5" />}
            colour="orange"
          />
          <StatCard
            title={t('payment.total_paid', 'Jumlah Dibayar')}
            value={`RM ${history.reduce((s, h) => s + Number(h.amount), 0).toLocaleString('ms-MY')}`}
            icon={<Globe className="w-5 h-5" />}
            colour="navy"
          />
        </div>

        {/* SPPT AI Recommendation */}
        <div className="bg-white rounded-xl border border-[#673AB7] p-5">
          <div className="flex items-center gap-2 mb-3">
            <AiBadge label="SPPT AI" variant="filled" />
            <span className="text-sm font-semibold text-[#673AB7]">
              {t('payment.ai_recommendation', 'Cadangan Saluran Terbaik — Enjin AI SPPT')}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {t('payment.ai_tip',
              'Berdasarkan rekod pembayaran anda, saluran FPX dan JomPAY disyorkan kerana memproses pembayaran dalam masa nyata dengan yuran terendah. Gunakan Auto Debit untuk mengelakkan tunggakan.'
            )}
          </p>
        </div>

        {/* Active Channels Grid */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {t('payment.available_channels', 'Saluran Tersedia')}
          </h3>
          {activeChannels.length === 0 ? (
            <p className="text-sm text-gray-400 italic">
              {t('payment.no_channels', 'Tiada saluran pembayaran tersedia')}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeChannels.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setSelected(selected?.id === ch.id ? null : ch)}
                  className={`bg-white rounded-xl border-2 p-5 text-left transition-all hover:shadow-md ${
                    selected?.id === ch.id
                      ? 'border-[#1B2B5E] shadow-md'
                      : 'border-gray-200'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-white"
                    style={{ background: CHANNEL_COLOURS[ch.type] ?? '#1B2B5E' }}
                  >
                    {CHANNEL_ICONS[ch.type] ?? <CreditCard className="w-5 h-5" />}
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">{ch.name}</h4>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{ch.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{ch.processing_time}</span>
                    <span className="font-medium text-[#1B2B5E]">{ch.fee}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Channel Instructions */}
        {selected && selected.instructions && selected.instructions.length > 0 && (
          <div className="bg-[#1B2B5E] rounded-xl p-6 text-white">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              {t('payment.how_to_pay', 'Cara Membayar via')} {selected.name}
            </h3>
            <ol className="space-y-2">
              {selected.instructions.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Payment History */}
        {history.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              {t('payment.history', 'Sejarah Pembayaran')}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {[
                      t('payment.receipt_no', 'No. Resit'),
                      t('payment.amount', 'Jumlah'),
                      t('payment.date', 'Tarikh'),
                      t('payment.channel', 'Saluran'),
                      t('common.status', 'Status'),
                    ].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-xs text-gray-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 10).map(p => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 px-3 font-mono text-xs">{p.receipt_no}</td>
                      <td className="py-2 px-3 font-semibold text-[#2E7D32]">
                        RM {Number(p.amount).toLocaleString('ms-MY')}
                      </td>
                      <td className="py-2 px-3 text-xs">{p.payment_date}</td>
                      <td className="py-2 px-3 text-xs capitalize">{p.channel}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.status === 'success' ? 'bg-green-100 text-green-700' :
                          p.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Inactive Channels */}
        {inactiveChannels.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-3">
              {t('payment.unavailable_channels', 'Saluran Tidak Tersedia')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {inactiveChannels.map(ch => (
                <div
                  key={ch.id}
                  className="bg-gray-50 rounded-xl border border-gray-200 p-4 opacity-60"
                >
                  <h4 className="text-sm font-medium text-gray-500">{ch.name}</h4>
                  <p className="text-xs text-gray-400 mt-1">{t('payment.unavailable', 'Tidak tersedia')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
