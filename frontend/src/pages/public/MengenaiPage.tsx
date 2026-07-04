import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Eye, Heart, MapPin, Users, TrendingUp, Award } from 'lucide-react';

const MILESTONES = [
  { year: '1998', title: 'Penubuhan TEKUN Nasional', desc: 'TEKUN Nasional ditubuhkan di bawah Kementerian Pembangunan Usahawan untuk menyediakan pembiayaan mikro kepada usahawan kecil.' },
  { year: '2002', title: 'Pengembangan Cawangan', desc: 'TEKUN mengembangkan rangkaian cawangan ke seluruh Malaysia, mencapai lebih 100 cawangan di setiap negeri.' },
  { year: '2010', title: 'Pencapaian 200,000 Usahawan', desc: 'TEKUN berjaya membantu lebih 200,000 usahawan Malaysia dengan jumlah pembiayaan melebihi RM1 bilion.' },
  { year: '2018', title: 'Digitalisasi Perkhidmatan', desc: 'TEKUN melancarkan portal dalam talian untuk memudahkan proses permohonan pembiayaan secara digital.' },
  { year: '2022', title: 'Pencapaian RM3 Bilion', desc: 'Jumlah kumulatif pembiayaan yang diagihkan melebihi RM3 bilion kepada lebih 350,000 usahawan.' },
  { year: '2026', title: 'SPPT — Sistem Pengurusan Digital', desc: 'Pelancaran Sistem Pengurusan Pembiayaan TEKUN (SPPT) — platform digital bersepadu untuk pengurusan pembiayaan end-to-end.' },
];

const STATES = [
  'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan',
  'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Sabah',
  'Sarawak', 'Selangor', 'Terengganu', 'WP Kuala Lumpur',
  'WP Labuan', 'WP Putrajaya',
];

export default function MengenaiPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-[#1B2B5E] text-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/70 hover:text-white text-sm mb-8 transition-colors"
          >
            <ArrowLeft size={16} /> Kembali ke Laman Utama
          </button>
          <div className="flex items-center gap-6 mb-8">
            <img src="/images/tekun-icon.png" alt="TEKUN" className="h-20 w-auto object-contain" />
            <div>
              <h1 className="text-4xl md:text-5xl font-bold">Mengenai TEKUN Nasional</h1>
              <p className="text-white/70 mt-2 text-lg">Tabung Ekonomi Kumpulan Usaha Niaga</p>
            </div>
          </div>
          <p className="text-white/80 text-lg leading-relaxed max-w-3xl">
            TEKUN Nasional ialah agensi di bawah Kementerian Pembangunan Usahawan dan Koperasi (KUSKOP) yang ditubuhkan pada tahun 1998 dengan misi untuk memperkasa usahawan kecil Malaysia melalui pembiayaan mikro yang mudah, pantas, dan berpatutan.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-slate-900 py-12">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: Users, value: '400,000+', label: 'Usahawan Dibantu' },
            { icon: TrendingUp, value: 'RM3.5B', label: 'Jumlah Pembiayaan' },
            { icon: MapPin, value: '198', label: 'Cawangan Seluruh Malaysia' },
            { icon: Award, value: '28 Tahun', label: 'Pengalaman Berkhidmat' },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="text-center">
              <Icon size={24} className="text-white/40 mx-auto mb-3" />
              <p className="text-3xl font-bold text-white">{value}</p>
              <p className="text-xs text-white/50 uppercase tracking-wider mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Visi, Misi, Nilai */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
            <div className="h-12 w-12 bg-[#1B2B5E] rounded-xl flex items-center justify-center mb-5">
              <Eye size={22} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">Visi</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Menjadi institusi pembiayaan mikro terkemuka yang memperkasa usahawan Malaysia ke arah kemakmuran dan kecemerlangan ekonomi negara.
            </p>
          </div>
          <div className="bg-green-50 rounded-2xl p-8 border border-green-100">
            <div className="h-12 w-12 bg-[#2E7D32] rounded-xl flex items-center justify-center mb-5">
              <Target size={22} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">Misi</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Menyediakan pembiayaan mikro yang mudah, pantas, dan berpatutan kepada usahawan kecil Malaysia bagi membantu mereka memulakan, mengembangkan, dan mengekalkan perniagaan yang berdaya maju.
            </p>
          </div>
          <div className="bg-orange-50 rounded-2xl p-8 border border-orange-100">
            <div className="h-12 w-12 bg-[#E65100] rounded-xl flex items-center justify-center mb-5">
              <Heart size={22} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">Nilai Teras</h3>
            <ul className="text-slate-600 text-sm space-y-2">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#E65100] shrink-0" /> Integriti & Amanah</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#E65100] shrink-0" /> Ketelusan & Keadilan</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#E65100] shrink-0" /> Inovasi & Kreativiti</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#E65100] shrink-0" /> Khidmat Pelanggan Cemerlang</li>
            </ul>
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-slate-900 mb-10 text-center">Sejarah & Pencapaian</h2>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200" />
            <div className="space-y-8">
              {MILESTONES.map((m, i) => (
                <div key={i} className="flex gap-8 items-start">
                  <div className="relative shrink-0">
                    <div className="h-16 w-16 rounded-full bg-[#1B2B5E] flex items-center justify-center text-white font-bold text-xs text-center leading-tight z-10 relative">
                      {m.year}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-5 flex-1 hover:shadow-md transition-shadow">
                    <h4 className="font-bold text-slate-900 mb-1">{m.title}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rangkaian Cawangan */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 text-center">Rangkaian Cawangan Seluruh Malaysia</h2>
          <p className="text-slate-500 text-center mb-10">TEKUN Nasional beroperasi di 198 cawangan merentasi semua negeri dan wilayah persekutuan.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {STATES.map((state) => (
              <div key={state} className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 hover:border-[#1B2B5E] hover:bg-blue-50 transition-colors">
                <MapPin size={14} className="text-[#1B2B5E] shrink-0" />
                <span className="text-sm font-medium text-slate-700">{state}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-[#1B2B5E] rounded-2xl p-10 text-center text-white">
          <h3 className="text-2xl font-bold">Sedia untuk bermula?</h3>
          <p className="text-white/70 mt-3">Mohon pembiayaan TEKUN hari ini dan mulakan perjalanan keusahawanan anda.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <button
              onClick={() => navigate('/mula-mohon')}
              className="bg-white text-[#1B2B5E] px-8 py-3.5 rounded-full font-bold hover:bg-slate-100 transition-colors"
            >
              Mohon Sekarang
            </button>
            <button
              onClick={() => navigate('/cara-mohon')}
              className="bg-white/15 border border-white/30 text-white px-8 py-3.5 rounded-full font-semibold hover:bg-white/25 transition-colors"
            >
              Cara Mohon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
