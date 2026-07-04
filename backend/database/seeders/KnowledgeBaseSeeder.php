<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Services\AiService;

class KnowledgeBaseSeeder extends Seeder
{
    public function run(): void
    {
        $ai = new AiService();

        $chunks = [
            // SKIM PEMBIAYAAN
            ['category'=>'skim_pembiayaan','title'=>'TEKUN Micro','language'=>'ms','content'=>'TEKUN Micro adalah skim pembiayaan untuk usahawan mikro yang baru memulakan perniagaan. Jumlah pembiayaan maksimum adalah RM 10,000. Kadar keuntungan adalah 4% setahun (kadar rata). Tempoh pembiayaan maksimum adalah 5 tahun. Pemohon mestilah warganegara Malaysia berumur 18 hingga 60 tahun. Perniagaan mestilah berdaftar dengan SSM atau pihak berkuasa tempatan.'],
            ['category'=>'skim_pembiayaan','title'=>'TEKUN Usahawan','language'=>'ms','content'=>'TEKUN Usahawan adalah skim pembiayaan untuk usahawan yang ingin mengembangkan perniagaan sedia ada. Jumlah pembiayaan maksimum adalah RM 50,000. Kadar keuntungan adalah 4% setahun. Tempoh pembiayaan maksimum adalah 5 tahun. Pemohon mestilah mempunyai rekod perniagaan sekurang-kurangnya 6 bulan.'],
            ['category'=>'skim_pembiayaan','title'=>'TEKUN Wanita','language'=>'ms','content'=>'TEKUN Wanita adalah skim pembiayaan khas untuk usahawan wanita. Jumlah pembiayaan maksimum adalah RM 30,000. Kadar keuntungan adalah 4% setahun. Tempoh pembiayaan maksimum adalah 5 tahun. Skim ini direka untuk memperkasa usahawan wanita Bumiputera.'],
            ['category'=>'skim_pembiayaan','title'=>'TEKUN Belia','language'=>'ms','content'=>'TEKUN Belia adalah skim pembiayaan untuk usahawan muda berumur 18 hingga 35 tahun. Jumlah pembiayaan maksimum adalah RM 20,000. Kadar keuntungan adalah 4% setahun. Tempoh pembiayaan maksimum adalah 5 tahun.'],
            ['category'=>'skim_pembiayaan','title'=>'Perbandingan Skim TEKUN','language'=>'ms','content'=>'Perbandingan skim: TEKUN Micro RM10,000 (perniagaan baru), TEKUN Usahawan RM50,000 (perniagaan sedia ada), TEKUN Wanita RM30,000 (khas wanita), TEKUN Belia RM20,000 (belia 18-35 tahun). Semua skim: kadar 4% setahun, tempoh maksimum 5 tahun, berasaskan prinsip Islam Murabahah.'],
            ['category'=>'skim_pembiayaan','title'=>'Prinsip Islam Murabahah','language'=>'ms','content'=>'Semua pembiayaan TEKUN berasaskan prinsip Islam Murabahah. Kadar keuntungan 4% setahun (bukan faedah). Ta\'widh 1% setahun atas baki tertunggak mengikut garis panduan BNM. Disahkan patuh Syariah oleh Jawatankuasa Syariah TEKUN Nasional.'],
            ['category'=>'skim_pembiayaan','title'=>'TEKUN Schemes Overview','language'=>'en','content'=>'TEKUN Nasional offers 4 financing schemes: TEKUN Micro (up to RM10,000 for new businesses), TEKUN Usahawan (up to RM50,000 for existing businesses), TEKUN Wanita (up to RM30,000 for women entrepreneurs), TEKUN Belia (up to RM20,000 for youth aged 18-35). All schemes: 4% profit rate per annum, maximum 5-year tenure, Shariah-compliant (Murabahah).'],
            ['category'=>'skim_pembiayaan','title'=>'Pengiraan Ansuran Bulanan','language'=>'ms','content'=>'Cara mengira ansuran: (Jumlah Pembiayaan + Jumlah Pembiayaan x 4% x Tempoh Tahun) dibahagi Bilangan Bulan. Contoh: RM10,000 untuk 3 tahun = RM10,000 + RM1,200 = RM11,200 / 36 = RM311.11 sebulan. Ansuran tetap sepanjang tempoh pembiayaan.'],
            // SYARAT KELAYAKAN
            ['category'=>'syarat_kelayakan','title'=>'Syarat Umum Kelayakan','language'=>'ms','content'=>'Syarat kelayakan TEKUN: (1) Warganegara Malaysia. (2) Berumur 18-60 tahun. (3) Perniagaan berdaftar SSM. (4) Tidak muflis (disahkan Jabatan Insolvensi). (5) Tidak disenaraihitam. (6) Nisbah komitmen tidak melebihi 60% pendapatan bersih.'],
            ['category'=>'syarat_kelayakan','title'=>'Semakan CCRIS dan CTOS','language'=>'ms','content'=>'TEKUN menyemak rekod kredit melalui CCRIS dan CTOS. Tunggakan melebihi 3 bulan boleh menyebabkan penolakan. Pemohon muflis tidak layak sehingga mendapat pelepasan mahkamah.'],
            ['category'=>'syarat_kelayakan','title'=>'Auto-Reject Rules','language'=>'ms','content'=>'Penolakan automatik jika: umur bawah 18 atau melebihi 60 tahun, disahkan muflis, disenaraihitam, nisbah komitmen melebihi 60%, atau perniagaan dalam sektor yang tidak dibenarkan (perjudian, arak).'],
            ['category'=>'syarat_kelayakan','title'=>'Dokumen Diperlukan','language'=>'ms','content'=>'Dokumen permohonan TEKUN: (1) Salinan MyKad. (2) Penyata bank 3 bulan terkini. (3) Sijil SSM. (4) Gambar premis perniagaan. (5) Surat sokongan (jika ada). Boleh dimuat naik secara digital melalui portal SPPT.'],
            ['category'=>'syarat_kelayakan','title'=>'Eligibility (English)','language'=>'en','content'=>'TEKUN eligibility: Malaysian citizen, age 18-60, registered business, not bankrupt, not blacklisted, financing commitment ratio not exceeding 60% of net income. Applications failing any criteria are automatically rejected.'],
            ['category'=>'syarat_kelayakan','title'=>'Syarat Penjamin','language'=>'ms','content'=>'Penjamin diperlukan untuk pembiayaan melebihi RM20,000. Penjamin mestilah warganegara Malaysia dengan pendapatan tetap dan rekod kredit baik. Pembiayaan di bawah RM20,000 adalah tanpa cagaran (collateral-free).'],
            // PROSES PERMOHONAN
            ['category'=>'proses_permohonan','title'=>'Langkah-Langkah Permohonan','language'=>'ms','content'=>'Proses permohonan TEKUN: (1) Daftar akaun di portal SPPT. (2) Lengkapkan borang dalam talian. (3) Muat naik dokumen. (4) Semakan kelayakan automatik. (5) Penilaian kredit pegawai (3-5 hari). (6) Keputusan melalui SMS/e-mel. (7) Surat tawaran untuk ditandatangani. (8) Pengeluaran dana ke akaun bank.'],
            ['category'=>'proses_permohonan','title'=>'Tempoh Pemprosesan','language'=>'ms','content'=>'Tempoh pemprosesan: Semakan automatik serta-merta. Penilaian kredit 3-5 hari bekerja. Kelulusan pengurus 1-2 hari. Pengeluaran surat tawaran 1 hari. Pengeluaran dana 1-2 hari. Jumlah keseluruhan: 7-14 hari bekerja.'],
            ['category'=>'proses_permohonan','title'=>'Semakan Status Permohonan','language'=>'ms','content'=>'Semak status permohonan melalui: portal SPPT, aplikasi mudah alih TEKUN, cawangan TEKUN, atau hotline 1-800-88-3900. Status: Diterima, Dalam Semakan, Dalam Penilaian Kredit, Lulus, Tolak, atau Kuari.'],
            ['category'=>'proses_permohonan','title'=>'Application Process (English)','language'=>'en','content'=>'TEKUN application process: Register on SPPT portal, complete online form, upload documents, automatic eligibility check, credit officer evaluation (3-5 days), decision via SMS/email, offer letter signing, fund disbursement. Total: 7-14 working days.'],
            ['category'=>'proses_permohonan','title'=>'eKYC MyKad Verification','language'=>'ms','content'=>'eKYC TEKUN menggunakan AI untuk mengesahkan identiti. Imbas MyKad menggunakan kamera. Sistem AI mengekstrak nama, IC, alamat, tarikh lahir secara automatik. Pengesahan liveness (wajah hidup) diperlukan. Proses mengambil masa kurang 2 minit.'],
            ['category'=>'proses_permohonan','title'=>'Permohonan Melalui Cawangan','language'=>'ms','content'=>'Pemohon boleh membuat permohonan melalui pegawai cawangan TEKUN. Pegawai akan membantu mengisi borang dan mengimbas dokumen. Waktu operasi: Isnin-Jumaat 8:00 pagi - 5:00 petang. Buat temujanji terlebih dahulu untuk mengelakkan menunggu.'],
            // FAQ
            ['category'=>'faq','title'=>'Bolehkah saya memohon lebih dari satu skim?','language'=>'ms','content'=>'Pemohon hanya boleh mempunyai satu pembiayaan TEKUN aktif pada satu masa. Setelah diselesaikan, boleh memohon baharu. Pemohon dengan rekod baik boleh memohon peningkatan had semasa tempoh sedia ada.'],
            ['category'=>'faq','title'=>'Apa yang berlaku jika lewat bayar?','language'=>'ms','content'=>'Jika lewat bayar: (1) Notifikasi peringatan SMS/e-mel. (2) Ta\'widh 1% setahun atas baki tertunggak. (3) Selepas 30 hari: Notis Pertama. (4) Selepas 60 hari: Notis Kedua. (5) Selepas 90 hari: akaun NPL. Hubungi TEKUN segera jika menghadapi kesukaran kewangan.'],
            ['category'=>'faq','title'=>'Apakah Ta\'widh?','language'=>'ms','content'=>'Ta\'widh adalah pampasan lewat bayar mengikut prinsip Islam dan garis panduan BNM. Kadar 1% setahun atas baki tertunggak. Formula: Baki Tertunggak x 1% x (Hari Lewat / 365). Disahkan patuh Syariah. Bukan denda tetapi pampasan atas kerugian sebenar TEKUN.'],
            ['category'=>'faq','title'=>'Bolehkah saya memohon moratorium?','language'=>'ms','content'=>'Moratorium boleh dipohon untuk: bencana alam, kehilangan pekerjaan, masalah kesihatan serius. Tempoh 1-6 bulan. Ansuran ditangguhkan tetapi keuntungan terus dikira. Perlu dokumen sokongan dan kelulusan pengurus cawangan.'],
            ['category'=>'faq','title'=>'Cara membuat bayaran','language'=>'ms','content'=>'Cara bayar ansuran TEKUN: (1) FPX melalui portal SPPT atau aplikasi. (2) DuitNow QR. (3) JomPAY. (4) Pindahan bank terus. (5) Tunai di kaunter cawangan. (6) ATM JomPAY. Dikreditkan dalam 1-2 hari bekerja.'],
            ['category'=>'faq','title'=>'Apa yang perlu dilakukan jika ditolak?','language'=>'ms','content'=>'Jika ditolak: (1) Semak sebab penolakan di portal SPPT. (2) Boleh mohon semula selepas 3 bulan. (3) Hubungi cawangan untuk nasihat. (4) Pertimbangkan skim yang lebih kecil. (5) Pastikan rekod CCRIS/CTOS baik sebelum mohon semula.'],
            ['category'=>'faq','title'=>'Missed payment (English)','language'=>'en','content'=>'If you miss a TEKUN payment: reminder notifications via SMS/email, Ta\'widh charged at 1% per annum on outstanding balance, First Notice after 30 days, Second Notice after 60 days, NPL classification after 90 days. Contact TEKUN immediately if facing financial difficulties.'],
            ['category'=>'faq','title'=>'Berapa lama untuk mendapat keputusan?','language'=>'ms','content'=>'Masa keputusan bergantung kepada kelengkapan dokumen. Dokumen lengkap: 7-14 hari bekerja. Dokumen tidak lengkap: notifikasi Kuari akan dihantar dan masa dilanjutkan. Semak status dalam talian melalui portal SPPT atau aplikasi mudah alih.'],
            ['category'=>'faq','title'=>'Adakah perlu cagaran?','language'=>'ms','content'=>'Pembiayaan TEKUN adalah tanpa cagaran untuk kebanyakan skim. Penjamin diperlukan untuk pembiayaan melebihi RM20,000. Penjamin mestilah warganegara Malaysia dengan pendapatan tetap dan rekod kredit baik.'],
            ['category'=>'faq','title'=>'Bagaimana jika saya ingin membayar awal?','language'=>'ms','content'=>'Peminjam boleh membuat pembayaran awal (early settlement) pada bila-bila masa. Tiada penalti untuk pembayaran awal. Keuntungan akan dikira semula berdasarkan baki sebenar. Hubungi cawangan TEKUN atau portal SPPT untuk mendapatkan penyata penyelesaian awal.'],
            // DASAR & PERATURAN
            ['category'=>'dasar_peraturan','title'=>'Pematuhan Syariah TEKUN','language'=>'ms','content'=>'Semua produk TEKUN mematuhi prinsip Islam diluluskan Jawatankuasa Syariah TEKUN Nasional. Kontrak Murabahah (jual beli). Kadar keuntungan 4% setahun (bukan faedah). Ta\'widh dibenarkan sebagai pampasan kerugian sebenar. Tiada faedah berganda.'],
            ['category'=>'dasar_peraturan','title'=>'Garis Panduan BNM untuk Ta\'widh','language'=>'ms','content'=>'Ta\'widh mengikut Garis Panduan BNM untuk Institusi Kewangan Islam. Kadar maksimum 1% setahun atas baki tertunggak. Hanya dikenakan atas jumlah benar-benar tertunggak. TEKUN boleh mengurangkan atau menghapuskan Ta\'widh atas budi bicara pengurus.'],
            ['category'=>'dasar_peraturan','title'=>'Privasi dan Keselamatan Data','language'=>'ms','content'=>'TEKUN mematuhi Akta Perlindungan Data Peribadi 2010 (PDPA). Maklumat hanya untuk penilaian pembiayaan dan pengurusan akaun. Data tidak dikongsi pihak ketiga tanpa kebenaran kecuali untuk pengesahan (CCRIS, CTOS, Jabatan Insolvensi). Sistem SPPT menggunakan enkripsi SSL/TLS.'],
            ['category'=>'dasar_peraturan','title'=>'Penstrukturan Semula Pembiayaan','language'=>'ms','content'=>'Peminjam kesukaran kewangan boleh mohon penstrukturan semula. Pilihan: pemanjangan tempoh, pengurangan ansuran, moratorium, penghapusan sebahagian Ta\'widh. Perlu dokumen sokongan dan kelulusan cawangan TEKUN.'],
            ['category'=>'dasar_peraturan','title'=>'Klasifikasi NPL TEKUN','language'=>'ms','content'=>'Klasifikasi akaun: (1) Lancar: tiada tunggakan. (2) Perhatian Khusus: tunggakan 1-89 hari. (3) Tidak Lancar (NPL): tunggakan 90 hari atau lebih. Akaun NPL dirujuk unit pengurusan hutang. Tindakan undang-undang boleh diambil selepas notis muktamad.'],
        ];

        $this->command->info('Seeding knowledge base with ' . count($chunks) . ' chunks...');

        DB::table('knowledge_base')->truncate();

        foreach ($chunks as $i => $chunk) {
            $this->command->info("  [" . ($i+1) . "/" . count($chunks) . "] Embedding: {$chunk['title']}");
            $embedding = $ai->generateEmbedding($chunk['content']);

            if (!empty($embedding)) {
                $vectorStr = '[' . implode(',', $embedding) . ']';
                DB::statement(
                    "INSERT INTO knowledge_base (category, title, content, language, source, metadata, embedding, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?::vector, NOW(), NOW())",
                    [$chunk['category'], $chunk['title'], $chunk['content'], $chunk['language'],
                     'KnowledgeBaseSeeder v1.0', json_encode(['seeded'=>true]), $vectorStr]
                );
            } else {
                DB::table('knowledge_base')->insert([
                    'category'=>$chunk['category'], 'title'=>$chunk['title'],
                    'content'=>$chunk['content'], 'language'=>$chunk['language'],
                    'source'=>'KnowledgeBaseSeeder v1.0', 'metadata'=>json_encode(['seeded'=>true]),
                    'created_at'=>now(), 'updated_at'=>now(),
                ]);
                $this->command->warn("  Embedding failed for: {$chunk['title']} — stored without vector");
            }
            usleep(200000); // 200ms delay to avoid rate limiting
        }

        $count = DB::table('knowledge_base')->count();
        $this->command->info("Knowledge base seeded. Total chunks: {$count}");
    }
}
