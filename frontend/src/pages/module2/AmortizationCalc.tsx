import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Calculator } from 'lucide-react';

interface AmortRow {
  bulan: number;
  ansuranBulanan: number;
  bayaranPokok: number;
  bayaranKadar: number;
  bakinPokok: number;
}

function calcAmortization(principal: number, annualRate: number, months: number): AmortRow[] {
  const rows: AmortRow[] = [];
  const monthlyRate = annualRate / 100 / 12;
  const monthly = monthlyRate > 0
    ? (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
    : principal / months;
  let balance = principal;
  for (let i = 1; i <= months; i++) {
    const interest = balance * monthlyRate;
    const principalPay = monthly - interest;
    balance = Math.max(0, balance - principalPay);
    rows.push({
      bulan: i,
      ansuranBulanan: Math.round(monthly * 100) / 100,
      bayaranPokok: Math.round(principalPay * 100) / 100,
      bayaranKadar: Math.round(interest * 100) / 100,
      bakinPokok: Math.round(balance * 100) / 100,
    });
  }
  return rows;
}

export default function AmortizationCalc() {
  const [principal, setPrincipal] = useState(25000);
  const [rate, setRate] = useState(4);
  const [months, setMonths] = useState(36);

  const rows = useMemo(() => calcAmortization(principal, rate, months), [principal, rate, months]);
  const monthly = rows[0]?.ansuranBulanan || 0;
  const totalPayment = monthly * months;
  const totalInterest = totalPayment - principal;

  // Chart data — show every 6 months
  const chartData = rows.filter((_, i) => i % 6 === 0 || i === rows.length - 1).map(r => ({
    name: `Bln ${r.bulan}`,
    Pokok: r.bayaranPokok,
    Kadar: r.bayaranKadar,
    Baki: r.bakinPokok,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B5E]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Jadual Amortisasi Pembiayaan
          </h1>
          <p className="text-gray-500 text-sm mt-1">Pengiraan ansuran bulanan dan jadual bayaran balik</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#1B2B5E] text-white rounded-lg text-sm font-semibold hover:bg-[#152348]" style={{ fontFamily: 'Inter, sans-serif' }}>
          <Download size={16} /> Muat Turun PDF
        </button>
      </div>

      {/* Input Panel */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator size={18} className="text-[#1B2B5E]" />
          <h2 className="font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>Parameter Pembiayaan</h2>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Jumlah Pembiayaan (RM)
            </label>
            <input type="number" value={principal} onChange={e => setPrincipal(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-[#1B2B5E] focus:outline-none focus:border-[#1B2B5E]"
              style={{ fontFamily: 'Inter, sans-serif' }} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Kadar Keuntungan (% setahun)
            </label>
            <input type="number" step="0.1" value={rate} onChange={e => setRate(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-[#1B2B5E] focus:outline-none focus:border-[#1B2B5E]"
              style={{ fontFamily: 'Inter, sans-serif' }} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Tempoh Pembiayaan (Bulan)
            </label>
            <select value={months} onChange={e => setMonths(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-[#1B2B5E] focus:outline-none focus:border-[#1B2B5E]"
              style={{ fontFamily: 'Inter, sans-serif' }}>
              {[12, 24, 36, 48, 60].map(m => <option key={m} value={m}>{m} bulan ({m/12} tahun)</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Ansuran Bulanan', value: `RM ${monthly.toFixed(2)}`, color: 'text-[#1B2B5E]' },
          { label: 'Jumlah Bayaran', value: `RM ${totalPayment.toFixed(2)}`, color: 'text-[#1B2B5E]' },
          { label: 'Jumlah Kadar', value: `RM ${totalInterest.toFixed(2)}`, color: 'text-[#E65100]' },
          { label: 'Tempoh', value: `${months} bulan`, color: 'text-[#2E7D32]' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>{c.label}</p>
            <p className={`text-xl font-bold mt-1 ${c.color}`} style={{ fontFamily: 'Inter, sans-serif' }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-800 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Graf Amortisasi</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Inter, sans-serif' }} />
            <YAxis tick={{ fontSize: 11, fontFamily: 'Inter, sans-serif' }} />
            <Tooltip formatter={(v) => `RM ${Number(v).toFixed(2)}`} contentStyle={{ fontFamily: 'Inter, sans-serif', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontFamily: 'Inter, sans-serif', fontSize: 12 }} />
            <Bar dataKey="Pokok" fill="#1B2B5E" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Kadar" fill="#E65100" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Amortization Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>Jadual Bayaran Bulanan</h2>
        </div>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {['Bulan', 'Ansuran (RM)', 'Bayaran Pokok (RM)', 'Bayaran Kadar (RM)', 'Baki Pokok (RM)'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(r => (
                <tr key={r.bulan} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-semibold text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>{r.bulan}</td>
                  <td className="px-4 py-2.5 font-bold text-[#1B2B5E]" style={{ fontFamily: 'Inter, sans-serif' }}>{r.ansuranBulanan.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>{r.bayaranPokok.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-[#E65100]" style={{ fontFamily: 'Inter, sans-serif' }}>{r.bayaranKadar.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-[#2E7D32] font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>{r.bakinPokok.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
