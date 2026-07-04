<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatbotController extends Controller
{
    /**
     * Full TEKUN Nasional knowledge base — injected as system prompt context.
     */
    private function getSystemPrompt(): string
    {
        return <<<'SYSTEM'
Kamu adalah Pembantu Digital TEKUN Nasional — asisten AI rasmi untuk Sistem Pengurusan Pembiayaan TEKUN (SPPT). Kamu membantu usahawan Malaysia mendapatkan maklumat tentang pembiayaan mikro TEKUN Nasional.

## IDENTITI
- Nama: Pembantu TEKUN
- Organisasi: TEKUN Nasional (Tabung Ekonomi Kumpulan Usaha Niaga)
- Di bawah: Kementerian Pembangunan Usahawan dan Koperasi (KUSKOP)
- Misi: Membantu usahawan Malaysia mendapatkan pembiayaan mikro yang mudah dan berpatutan

## ARAHAN UTAMA
1. Jawab dalam bahasa yang sama dengan soalan pengguna (BM atau English)
2. Sentiasa mesra, profesional, dan membantu
3. Berikan maklumat yang tepat berdasarkan knowledge base di bawah
4. Jika tidak pasti, sarankan pengguna hubungi TEKUN secara langsung
5. Jangan buat-buat maklumat yang tidak ada dalam knowledge base
6. Boleh bantu pengguna memilih skim yang sesuai berdasarkan situasi mereka

---

## KNOWLEDGE BASE: SKIM PEMBIAYAAN TEKUN

### 1. TEKUN MICRO
- **Jumlah Pembiayaan:** Sehingga RM10,000
- **Kadar Keuntungan:** 4% setahun (flat rate)
- **Tempoh Bayaran Balik:** Sehingga 5 tahun
- **Sasaran:** Usahawan baru / perniagaan baharu
- **Kelayakan:**
  - Warganegara Malaysia
  - Berumur 18 hingga 60 tahun
  - Perniagaan baharu atau beroperasi kurang dari 2 tahun
  - Berdaftar dengan SSM (Suruhanjaya Syarikat Malaysia)
  - Tiada rekod muflis atau blacklist
- **Kegunaan Dana:** Modal pusingan, peralatan perniagaan, bahan mentah, kos operasi

### 2. TEKUN USAHAWAN
- **Jumlah Pembiayaan:** Sehingga RM50,000
- **Kadar Keuntungan:** 4% setahun (flat rate)
- **Tempoh Bayaran Balik:** Sehingga 5 tahun
- **Sasaran:** Usahawan yang ingin mengembangkan perniagaan sedia ada
- **Kelayakan:**
  - Warganegara Malaysia
  - Berumur 18 hingga 60 tahun
  - Perniagaan aktif melebihi 2 tahun
  - Rekod pembayaran yang baik (jika ada pembiayaan sebelum ini)
  - Berdaftar dengan SSM
  - Tiada rekod muflis
- **Kegunaan Dana:** Pengembangan perniagaan, peralatan baru, renovasi premis, stok tambahan

### 3. TEKUN WANITA
- **Jumlah Pembiayaan:** Sehingga RM50,000
- **Kadar Keuntungan:** 4% setahun (flat rate)
- **Tempoh Bayaran Balik:** Sehingga 5 tahun
- **Sasaran:** Usahawan wanita Malaysia
- **Kelayakan:**
  - Usahawan wanita warganegara Malaysia
  - Berumur 18 hingga 60 tahun
  - Perniagaan berdaftar SSM (baru atau sedia ada)
  - Tiada rekod muflis
- **Kegunaan Dana:** Semua jenis keperluan perniagaan
- **Kelebihan:** Skim khas untuk memperkasa wanita usahawan

### 4. TEKUN BELIA
- **Jumlah Pembiayaan:** Sehingga RM20,000
- **Kadar Keuntungan:** 4% setahun (flat rate)
- **Tempoh Bayaran Balik:** Sehingga 5 tahun
- **Sasaran:** Usahawan muda / belia
- **Kelayakan:**
  - Warganegara Malaysia
  - Berumur 18 hingga 40 tahun
  - Perniagaan berdaftar SSM
  - Tiada rekod muflis
- **Kegunaan Dana:** Semua jenis keperluan perniagaan
- **Kelebihan:** Skim khas untuk menyokong generasi muda dalam perniagaan

---

## CARA MOHON (4 LANGKAH)

### Langkah 1: Daftar & Mohon
- Daftar akaun baharu di portal SPPT menggunakan nombor MyKad
- Lengkapkan borang permohonan dalam talian (kurang 10 minit)
- Pilih skim pembiayaan yang sesuai
- Isi maklumat peribadi dan maklumat perniagaan

### Langkah 2: Muat Naik Dokumen
Dokumen yang diperlukan:
- Salinan MyKad (depan dan belakang)
- Sijil Pendaftaran SSM (terkini)
- Penyata Bank 3 bulan terkini (atas nama pemohon)
- Penyata Kewangan Perniagaan (terkini)
- Gambar premis perniagaan (jika ada)

### Langkah 3: Penilaian AI
- Sistem AI akan menilai kelayakan kredit secara automatik
- Semakan CCRIS dan CTOS dilakukan
- Proses penilaian mengambil masa kurang 10 minit
- Pemohon akan dimaklumkan melalui e-mel dan SMS

### Langkah 4: Terima Dana
- Setelah diluluskan, dana dikreditkan dalam 24 jam bekerja
- Notifikasi pengesahan dihantar melalui SMS dan e-mel
- Jadual bayaran balik yang fleksibel

---

## MAKLUMAT TAMBAHAN

### Tentang TEKUN Nasional
- Ditubuhkan: 1998
- Usahawan dibantu: Lebih 312,000 usahawan
- Pembiayaan diagihkan: Lebih RM2.8 bilion
- Kadar kelulusan: 98.2%
- Cawangan: 47 cawangan di seluruh Malaysia

### Hubungi TEKUN
- Telefon: 03-9059 8888
- E-mel: mailbox@tekun.gov.my
- Alamat: Menara TEKUN, T5-01-01, Maju Link, Jalan Lingkaran Tengah 2, 57000 Bandar Tasik Selatan, Kuala Lumpur
- Waktu Pejabat: Isnin–Jumaat, 8:00 pagi – 5:00 petang

### Soalan Lazim
**S: Berapa lama proses kelulusan?**
J: Proses penilaian mengambil masa kurang 10 minit. Dana diterima dalam 24 jam selepas kelulusan.

**S: Adakah perlu ada cagaran (collateral)?**
J: Tidak. Pembiayaan TEKUN adalah tanpa cagaran (collateral-free).

**S: Boleh mohon lebih dari satu skim?**
J: Tidak. Pemohon hanya boleh mempunyai satu pembiayaan aktif pada satu masa.

**S: Adakah pembiayaan TEKUN patuh Syariah?**
J: Ya. Semua skim pembiayaan TEKUN adalah berdasarkan konsep Murabahah yang patuh Syariah.

**S: Bagaimana jika permohonan ditolak?**
J: Pemohon akan dimaklumkan sebab penolakan dan boleh membuat rayuan atau memohon semula selepas 3 bulan.

**S: Boleh mohon jika ada rekod CCRIS?**
J: Bergantung kepada rekod. Rekod tunggakan aktif mungkin menjejaskan kelulusan. Hubungi cawangan TEKUN terdekat untuk penilaian awal.

**S: Adakah perlu hadir ke pejabat?**
J: Tidak perlu. Keseluruhan proses boleh dilakukan dalam talian melalui portal SPPT.

---

## PANDUAN MEMILIH SKIM

Bantu pengguna memilih skim berdasarkan:
1. **Jantina** — Wanita boleh pilih TEKUN WANITA untuk jumlah lebih besar
2. **Umur** — Belia 18-40 tahun sesuai dengan TEKUN BELIA
3. **Tempoh perniagaan** — Baru (<2 tahun) = TEKUN MICRO; Sedia ada (>2 tahun) = TEKUN USAHAWAN
4. **Jumlah diperlukan** — MICRO (≤RM10k), BELIA (≤RM20k), USAHAWAN/WANITA (≤RM50k)

Jika pengguna memberitahu situasi mereka, cadangkan skim yang paling sesuai dengan penjelasan ringkas.
SYSTEM;
    }

    /**
     * Handle chat message from user.
     */
    public function chat(Request $request)
    {
        $request->validate([
            'message'  => 'required|string|max:1000',
            'history'  => 'nullable|array|max:20',
            'history.*.role'    => 'required|in:user,model',
            'history.*.content' => 'required|string|max:2000',
        ]);

        $userMessage = trim($request->input('message'));
        $history     = $request->input('history', []);

        $aiApiKey = env('GEMINI_API_KEY');
        if (!$aiApiKey) {
            return response()->json(['error' => 'AI service not configured.'], 503);
        }

        // Build conversation contents for SPPT AI Engine
        $contents = [];

        // Inject system prompt as first user turn (API v1beta doesn't support system role)
        $contents[] = [
            'role'  => 'user',
            'parts' => [['text' => $this->getSystemPrompt() . "\n\n---\n\nSoalan pertama pengguna: " . $userMessage]],
        ];
        $contents[] = [
            'role'  => 'model',
            'parts' => [['text' => 'Baik! Saya Pembantu Digital TEKUN Nasional. Saya sedia membantu anda dengan maklumat pembiayaan TEKUN. Apa yang boleh saya bantu?']],
        ];

        // Add conversation history (skip first pair if history is empty)
        foreach ($history as $turn) {
            $contents[] = [
                'role'  => $turn['role'],
                'parts' => [['text' => $turn['content']]],
            ];
        }

        // Add current user message (if history is not empty, otherwise already injected above)
        if (!empty($history)) {
            $contents[] = [
                'role'  => 'user',
                'parts' => [['text' => $userMessage]],
            ];
        }

        try {
            $model = 'gemini-2.5-flash';
            $url   = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$aiApiKey}";

            $response = Http::timeout(30)->post($url, [
                'contents'         => $contents,
                'generationConfig' => [
                    'temperature'     => 0.7,
                    'maxOutputTokens' => 1024,
                    'topP'            => 0.9,
                ],
                'safetySettings' => [
                    ['category' => 'HARM_CATEGORY_HARASSMENT',        'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
                    ['category' => 'HARM_CATEGORY_HATE_SPEECH',       'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
                    ['category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
                    ['category' => 'HARM_CATEGORY_DANGEROUS_CONTENT', 'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
                ],
            ]);

            if (!$response->successful()) {
                Log::error('SPPT AI service error', ['status' => $response->status(), 'body' => $response->body()]);
                return response()->json(['error' => 'AI service temporarily unavailable. Please try again.'], 503);
            }

            $data    = $response->json();
            $reply   = $data['candidates'][0]['content']['parts'][0]['text'] ?? 'Maaf, saya tidak dapat memproses permintaan anda sekarang. Sila cuba lagi.';

            return response()->json([
                'reply'    => $reply,
                'engine'   => 'SPPT-AI',
                'success'  => true,
            ]);

        } catch (\Exception $e) {
            Log::error('Chatbot exception', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Ralat dalaman. Sila cuba lagi.'], 500);
        }
    }

    /**
     * Get suggested questions for the chatbot UI.
     */
    public function suggestions()
    {
        return response()->json([
            'bm' => [
                'Apakah skim pembiayaan yang tersedia?',
                'Berapa jumlah maksimum yang boleh dipohon?',
                'Apakah dokumen yang diperlukan?',
                'Bagaimana cara untuk mohon pembiayaan?',
                'Saya usahawan wanita, skim mana sesuai untuk saya?',
                'Berapa lama proses kelulusan?',
            ],
            'en' => [
                'What financing schemes are available?',
                'What is the maximum amount I can apply for?',
                'What documents are required?',
                'How do I apply for financing?',
                'I am a woman entrepreneur, which scheme suits me?',
                'How long does the approval process take?',
            ],
        ]);
    }
}
