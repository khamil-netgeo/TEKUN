import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Search, ArrowLeft, Phone, Mail } from 'lucide-react';

interface FAQItem {
  q: string;
  a: string;
  category: string;
}

const FAQS: FAQItem[] = [
  // Umum
  {
    category: 'Umum',
    q: 'Apakah itu TEKUN Nasional?',
    a: 'TEKUN Nasional (Tabung Ekonomi Kumpulan Usaha Niaga) ialah sebuah agensi di bawah Kementerian Pembangunan Usahawan dan Koperasi (KUSKOP) yang ditubuhkan pada tahun 1998. Misi utama TEKUN adalah untuk menyediakan pembiayaan mikro kepada usahawan kecil Bumiputera dan bukan Bumiputera di seluruh Malaysia bagi membantu mereka memulakan atau mengembangkan perniagaan.',
  },
  {
    category: 'Umum',
    q: 'Siapakah yang layak memohon pembiayaan TEKUN?',
    a: 'Warganegara Malaysia yang berumur antara 18 hingga 60 tahun dan menjalankan atau merancang untuk menjalankan perniagaan kecil layak memohon. Pemohon mestilah tidak disenaraihitamkan oleh mana-mana institusi kewangan dan tidak muflis. Syarat terperinci berbeza mengikut skim pembiayaan yang dipilih.',
  },
  {
    category: 'Umum',
    q: 'Berapakah kadar keuntungan pembiayaan TEKUN?',
    a: 'Kadar keuntungan TEKUN adalah 4% setahun (flat rate) untuk semua skim pembiayaan. Kadar ini adalah tetap dan tidak berubah sepanjang tempoh pembiayaan, menjadikannya salah satu kadar terendah dalam pasaran pembiayaan mikro di Malaysia.',
  },
  {
    category: 'Umum',
    q: 'Berapa lamakah tempoh pembiayaan TEKUN?',
    a: 'Tempoh pembiayaan TEKUN adalah sehingga 5 tahun (60 bulan) bergantung kepada jumlah yang dipohon dan kemampuan bayaran balik pemohon. Pemohon boleh memilih tempoh yang sesuai semasa mengisi borang permohonan.',
  },
  // Skim Pembiayaan
  {
    category: 'Skim Pembiayaan',
    q: 'Apakah perbezaan antara TEKUN MICRO dan TEKUN USAHAWAN?',
    a: 'TEKUN MICRO sesuai untuk perniagaan baharu atau yang beroperasi kurang dari 2 tahun, dengan had pembiayaan sehingga RM10,000. TEKUN USAHAWAN pula untuk perniagaan yang telah beroperasi melebihi 2 tahun dengan rekod pembayaran yang baik, dengan had pembiayaan sehingga RM50,000.',
  },
  {
    category: 'Skim Pembiayaan',
    q: 'Apakah skim khas untuk usahawan wanita?',
    a: 'TEKUN WANITA adalah skim khas untuk usahawan wanita warganegara Malaysia berumur 18-60 tahun. Had pembiayaan adalah sehingga RM50,000 dengan kadar keuntungan 4% setahun. Skim ini direka untuk memperkasa wanita dalam bidang keusahawanan.',
  },
  {
    category: 'Skim Pembiayaan',
    q: 'Adakah terdapat skim khas untuk belia?',
    a: 'Ya, TEKUN BELIA adalah skim khas untuk usahawan muda berumur 18-40 tahun. Had pembiayaan adalah sehingga RM20,000. Skim ini bertujuan untuk menggalakkan belia Malaysia menceburi bidang keusahawanan.',
  },
  {
    category: 'Skim Pembiayaan',
    q: 'Bolehkah saya memohon lebih daripada satu skim pada masa yang sama?',
    a: 'Tidak. Pemohon hanya boleh mempunyai satu pembiayaan TEKUN yang aktif pada satu-satu masa. Walau bagaimanapun, anda boleh memohon skim yang berbeza setelah pembiayaan semasa diselesaikan sepenuhnya.',
  },
  // Proses Permohonan
  {
    category: 'Proses Permohonan',
    q: 'Bagaimana cara untuk memohon pembiayaan TEKUN secara dalam talian?',
    a: 'Anda boleh memohon melalui portal SPPT ini dengan langkah-langkah berikut: (1) Daftar akaun baharu dan lengkapkan pengesahan eKYC, (2) Pilih skim pembiayaan yang sesuai, (3) Isi borang permohonan dan muat naik dokumen sokongan, (4) Tunggu keputusan penilaian dalam masa 3-5 hari bekerja.',
  },
  {
    category: 'Proses Permohonan',
    q: 'Apakah dokumen yang diperlukan untuk permohonan?',
    a: 'Dokumen yang diperlukan termasuk: (1) Salinan MyKad, (2) Penyata bank 3 bulan terkini, (3) Sijil pendaftaran perniagaan (SSM) — jika ada, (4) Gambar premis perniagaan, (5) Dokumen sokongan lain bergantung kepada jenis perniagaan. Semua dokumen boleh dimuat naik secara digital dalam format PDF atau JPG.',
  },
  {
    category: 'Proses Permohonan',
    q: 'Berapa lamakah masa untuk mendapat keputusan permohonan?',
    a: 'Keputusan pra-penilaian biasanya dalam masa 3-5 hari bekerja selepas semua dokumen lengkap diterima. Proses kelulusan penuh boleh mengambil masa 7-14 hari bekerja bergantung kepada kompleksiti permohonan dan kesesakan semasa.',
  },
  {
    category: 'Proses Permohonan',
    q: 'Bolehkah saya menyemak status permohonan saya?',
    a: 'Ya, anda boleh menyemak status permohonan pada bila-bila masa melalui portal SPPT selepas log masuk ke akaun anda. Status akan dikemaskini secara masa nyata mengikut perkembangan penilaian permohonan anda.',
  },
  // Bayaran Balik
  {
    category: 'Bayaran Balik',
    q: 'Apakah kaedah bayaran balik yang tersedia?',
    a: 'TEKUN menyediakan pelbagai kaedah bayaran balik termasuk: (1) Potongan gaji automatik (bagi pekerja), (2) Pindahan bank dalam talian (FPX/IBG), (3) Bayaran tunai di kaunter cawangan TEKUN, (4) Bayaran melalui mesin ATM, (5) Bayaran melalui aplikasi perbankan mudah alih.',
  },
  {
    category: 'Bayaran Balik',
    q: 'Apakah yang berlaku jika saya terlepas bayaran?',
    a: 'Jika anda terlepas bayaran, sila hubungi cawangan TEKUN terdekat atau talian hotline 03-9059 8888 dengan segera. TEKUN menyediakan kemudahan penangguhan bayaran (moratorium) dalam situasi kewangan yang sukar, tertakluk kepada kelulusan. Bayaran lewat akan dikenakan caj ta\'widh (ganti rugi) mengikut kadar yang ditetapkan.',
  },
  {
    category: 'Bayaran Balik',
    q: 'Bolehkah saya membuat bayaran awal (early settlement)?',
    a: 'Ya, anda boleh membuat penyelesaian awal pada bila-bila masa tanpa penalti. Bayaran awal akan mengurangkan jumlah keuntungan yang perlu dibayar secara pro-rata. Sila hubungi cawangan TEKUN untuk mendapatkan penyata penyelesaian awal.',
  },
];

const CATEGORIES = ['Semua', 'Umum', 'Skim Pembiayaan', 'Proses Permohonan', 'Bayaran Balik'];

export default function FAQPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const filtered = FAQS.filter((f) => {
    const matchCat = activeCategory === 'Semua' || f.category === activeCategory;
    const matchSearch = search === '' || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-[#1B2B5E] text-white">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/70 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft size={16} /> Kembali ke Laman Utama
          </button>
          <h1 className="text-3xl md:text-4xl font-bold">Soalan Lazim (FAQ)</h1>
          <p className="text-white/70 mt-3 text-lg">Jawapan kepada soalan-soalan yang kerap ditanya tentang pembiayaan TEKUN Nasional.</p>

          {/* Search */}
          <div className="relative mt-8 max-w-xl">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari soalan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-[#1B2B5E] text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-[#1B2B5E] hover:text-[#1B2B5E]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-lg font-medium">Tiada soalan dijumpai</p>
              <p className="text-sm mt-2">Cuba cari dengan kata kunci yang berbeza</p>
            </div>
          ) : (
            filtered.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-all duration-200 hover:border-slate-300 hover:shadow-sm"
              >
                <button
                  onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                  className="w-full flex items-start justify-between gap-4 px-6 py-5 text-left"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B2B5E] bg-blue-50 px-2 py-1 rounded-full shrink-0 mt-0.5">
                      {faq.category}
                    </span>
                    <span className="font-semibold text-slate-800 text-sm leading-relaxed">{faq.q}</span>
                  </div>
                  {openIdx === idx
                    ? <ChevronUp size={18} className="text-[#1B2B5E] shrink-0 mt-0.5" />
                    : <ChevronDown size={18} className="text-slate-400 shrink-0 mt-0.5" />
                  }
                </button>
                {openIdx === idx && (
                  <div className="px-6 pb-6 border-t border-slate-100">
                    <p className="text-sm text-slate-600 leading-relaxed pt-4">{faq.a}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Still have questions? */}
        <div className="mt-16 bg-[#1B2B5E] rounded-2xl p-8 text-center text-white">
          <h3 className="text-xl font-bold">Masih ada soalan?</h3>
          <p className="text-white/70 mt-2 text-sm">Hubungi kami melalui talian hotline atau emel untuk bantuan lanjut.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
            <a
              href="tel:0390598888"
              className="flex items-center gap-2 bg-white text-[#1B2B5E] px-6 py-3 rounded-full font-semibold text-sm hover:bg-slate-100 transition-colors"
            >
              <Phone size={16} /> 03-9059 8888
            </a>
            <a
              href="mailto:mailbox@tekun.gov.my"
              className="flex items-center gap-2 bg-white/15 border border-white/30 text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-white/25 transition-colors"
            >
              <Mail size={16} /> mailbox@tekun.gov.my
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
