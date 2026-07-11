<?php

namespace App\Modules\PenilaianKredit\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Module 2 — Offer Letter Service (AI-Powered)
 *
 * Generates Surat Tawaran (Offer Letter) using Gemini 3.1 Pro for personalised
 * letter body content, injected into a professional HTML template.
 *
 * Uses barryvdh/laravel-dompdf for PDF generation if available.
 */
class OfferLetterService
{
    /**
     * Generate AI-powered Surat Tawaran.
     * Returns array with html_content and pdf_url.
     */
    public function generate(string $appId, object $app, object $assessment): array
    {
        try {
            // 1. Generate personalised AI letter body via Gemini 3.1 Pro
            $aiBodyHtml = $this->generateAiLetterBody($app, $assessment);

            // 2. Build full HTML document with AI body injected
            $fullHtml = $this->buildOfferLetterHtml($appId, $app, $assessment, $aiBodyHtml);

            // 3. Save PDF to MinIO/S3
            $pdfUrl = $this->savePdf($fullHtml, "offer-letter-{$appId}.pdf", "offer-letters");

            return [
                'html_content' => $fullHtml,
                'pdf_url'      => $pdfUrl,
            ];
        } catch (\Exception $e) {
            Log::error("OfferLetterService::generate error for app {$appId}: " . $e->getMessage());
            // Fallback: generate static letter without AI body
            $fallbackHtml = $this->buildOfferLetterHtml($appId, $app, $assessment, $this->staticFallbackBody($app, $assessment));
            return [
                'html_content' => $fallbackHtml,
                'pdf_url'      => "/api/applications/{$appId}/offer-letter/download",
            ];
        }
    }

    /**
     * Generate Surat Penolakan PDF for rejected application.
     */
    public function generateRejectionPdf(string $appId, object $app, string $letterText): string
    {
        try {
            $html = $this->buildRejectionHtml($appId, $app, $letterText);
            return $this->savePdf($html, "rejection-letter-{$appId}.pdf", "rejection-letters");
        } catch (\Exception $e) {
            Log::error("OfferLetterService::generateRejectionPdf error: " . $e->getMessage());
            return "/api/applications/{$appId}/rejection-letter/download";
        }
    }

    /**
     * Call Gemini 3.1 Pro to generate personalised letter body paragraphs.
     * Returns HTML string (p, ul, li, strong tags only).
     */
    private function generateAiLetterBody(object $app, object $assessment): string
    {
        $apiKey = env('GEMINI_API_KEY');
        if (!$apiKey) {
            Log::warning("OfferLetterService: GEMINI_API_KEY not set, using static fallback.");
            return $this->staticFallbackBody($app, $assessment);
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key={$apiKey}";

        $name           = $app->applicant_name ?? 'Pemohon';
        $scheme         = $this->schemeLabel($app->scheme ?? '');
        $amountApproved = number_format((float)($assessment->amount_approved ?? $app->amount_requested ?? 0), 2);
        $tenure         = $assessment->tenure_approved ?? $app->tenure_months ?? 36;
        $profitRate     = $assessment->profit_rate ?? 4.0;
        $totalProfit    = (float)($assessment->amount_approved ?? $app->amount_requested ?? 0) * ($profitRate / 100) * ($tenure / 12);
        $totalPayable   = (float)($assessment->amount_approved ?? $app->amount_requested ?? 0) + $totalProfit;
        $monthly        = $tenure > 0 ? number_format(round($totalPayable / $tenure, 2), 2) : '0.00';
        $score          = $assessment->total_score ?? 0;
        $grade          = $score >= 76 ? 'A' : ($score >= 61 ? 'B' : 'C');

        $prompt = "Anda adalah Pegawai Kelulusan Kredit di TEKUN Nasional Berhad. "
            . "Sila hasilkan 3 hingga 4 perenggan isi kandungan Surat Tawaran Pembiayaan yang rasmi dan profesional dalam Bahasa Melayu.\n\n"
            . "Maklumat Pemohon:\n"
            . "- Nama: {$name}\n"
            . "- Skim Pembiayaan: {$scheme}\n"
            . "- Jumlah Pembiayaan Diluluskan: RM {$amountApproved}\n"
            . "- Tempoh Pembiayaan: {$tenure} bulan\n"
            . "- Kadar Keuntungan: {$profitRate}% setahun (Flat Rate)\n"
            . "- Ansuran Bulanan: RM {$monthly}\n"
            . "- Skor Kredit: {$score}/100 (Gred {$grade})\n\n"
            . "Arahan Penulisan:\n"
            . "1. Mulakan dengan ucapan tahniah kerana permohonan telah diluluskan.\n"
            . "2. Perenggan kedua: nyatakan butiran pembiayaan secara ringkas dan jelas.\n"
            . "3. Perenggan ketiga: nyatakan syarat-syarat am (terma perjanjian, tempoh sah tawaran 14 hari, prinsip Murabahah).\n"
            . "4. Perenggan keempat: penutup yang profesional, jemput pemohon untuk menghubungi cawangan terdekat.\n"
            . "5. PENTING: Output HANYA dalam format HTML menggunakan tag <p>, <ul>, <li>, <strong> sahaja. "
            . "JANGAN gunakan blok markdown, JANGAN sertakan tag <html>, <head>, atau <body>.";

        $response = Http::timeout(30)->post($url, [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => 0.3,
                'maxOutputTokens' => 800,
            ]
        ]);

        if ($response->failed()) {
            Log::warning("OfferLetterService: Gemini API call failed — " . $response->status() . ". Using static fallback.");
            return $this->staticFallbackBody($app, $assessment);
        }

        $data    = $response->json();
        $aiText  = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';

        // Clean up any markdown code blocks the model may have added
        $aiText = preg_replace('/```html\s*/i', '', $aiText);
        $aiText = preg_replace('/```\s*/', '', $aiText);

        return trim($aiText) ?: $this->staticFallbackBody($app, $assessment);
    }

    /**
     * Static fallback letter body (used when Gemini API is unavailable).
     */
    private function staticFallbackBody(object $app, object $assessment): string
    {
        $name           = $app->applicant_name ?? 'Pemohon';
        $scheme         = $this->schemeLabel($app->scheme ?? '');
        $amountApproved = number_format((float)($assessment->amount_approved ?? $app->amount_requested ?? 0), 2);
        $tenure         = $assessment->tenure_approved ?? $app->tenure_months ?? 36;
        $profitRate     = $assessment->profit_rate ?? 4.0;
        $totalProfit    = (float)($assessment->amount_approved ?? $app->amount_requested ?? 0) * ($profitRate / 100) * ($tenure / 12);
        $totalPayable   = (float)($assessment->amount_approved ?? $app->amount_requested ?? 0) + $totalProfit;
        $monthly        = $tenure > 0 ? number_format(round($totalPayable / $tenure, 2), 2) : '0.00';

        return "<p>Dengan hormatnya perkara di atas adalah dirujuk.</p>"
            . "<p>Sukacita dimaklumkan bahawa permohonan <strong>{$name}</strong> untuk skim <strong>{$scheme}</strong> "
            . "telah <strong>DILULUSKAN</strong> dengan jumlah pembiayaan sebanyak <strong>RM {$amountApproved}</strong> "
            . "bagi tempoh <strong>{$tenure} bulan</strong> pada kadar keuntungan <strong>{$profitRate}% setahun (Flat Rate)</strong> "
            . "dengan ansuran bulanan sebanyak <strong>RM {$monthly}</strong>.</p>"
            . "<p>Tawaran ini adalah tertakluk kepada Prinsip Murabahah (jual beli) mengikut Syariah dan sah selama "
            . "<strong>14 hari</strong> dari tarikh surat ini. Pemohon dikehendaki menandatangani Perjanjian Pembiayaan "
            . "dalam tempoh yang ditetapkan.</p>"
            . "<p>Untuk sebarang pertanyaan, sila hubungi cawangan TEKUN Nasional yang berdekatan. "
            . "Kami mengucapkan tahniah dan berharap pembiayaan ini dapat membantu perkembangan perniagaan anda.</p>";
    }

    /**
     * Build the complete Surat Tawaran HTML document.
     */
    private function buildOfferLetterHtml(string $appId, object $app, object $assessment, string $aiBodyHtml): string
    {
        $date           = now()->locale('ms')->translatedFormat('d F Y');
        $refNo          = 'TKN/LULUS/' . date('Y') . '/' . str_pad($appId, 5, '0', STR_PAD_LEFT);
        $name           = strtoupper($app->applicant_name ?? 'PEMOHON');
        $ic             = $app->ic_number ?? 'XXXXXX-XX-XXXX';
        $address        = nl2br(htmlspecialchars($app->address ?? 'Alamat Pemohon'));
        $scheme         = $this->schemeLabel($app->scheme ?? '');
        $amountApproved = number_format((float)($assessment->amount_approved ?? $app->amount_requested ?? 0), 2);
        $tenure         = $assessment->tenure_approved ?? $app->tenure_months ?? 36;
        $profitRate     = $assessment->profit_rate ?? 4.0;
        $totalProfit    = (float)($assessment->amount_approved ?? $app->amount_requested ?? 0) * ($profitRate / 100) * ($tenure / 12);
        $totalPayable   = (float)($assessment->amount_approved ?? $app->amount_requested ?? 0) + $totalProfit;
        $monthly        = $tenure > 0 ? number_format(round($totalPayable / $tenure, 2), 2) : '0.00';
        $totalProfitFmt = number_format($totalProfit, 2);
        $totalPayableFmt = number_format($totalPayable, 2);

        return <<<HTML
<!DOCTYPE html>
<html lang="ms">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1B2B5E; margin: 0; padding: 40px; line-height: 1.7; }
  .header { border-bottom: 3px solid #1B2B5E; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-start; }
  .logo-block h1 { color: #1B2B5E; font-size: 20px; margin: 0 0 3px 0; font-weight: bold; letter-spacing: 1px; }
  .logo-block p { margin: 0; font-size: 10px; color: #555; }
  .ref-block { text-align: right; font-size: 11px; }
  .ref-block p { margin: 2px 0; }
  .recipient { margin-bottom: 25px; }
  .recipient p { margin: 2px 0; }
  .subject { font-size: 13px; font-weight: bold; text-decoration: underline; margin-bottom: 20px; color: #1B2B5E; }
  .ai-body { margin-bottom: 30px; text-align: justify; }
  .ai-body p { margin: 0 0 12px 0; }
  .section-title { background: #1B2B5E; color: white; padding: 6px 12px; font-weight: bold; margin: 20px 0 10px 0; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
  table td { padding: 7px 10px; border: 1px solid #ccc; }
  table td:first-child { font-weight: bold; width: 45%; background: #f0f4f8; }
  .highlight { background: #E8F5E9; border: 2px solid #2E7D32; padding: 12px 16px; margin: 15px 0; border-radius: 4px; }
  .highlight .amount { font-size: 22px; font-weight: bold; color: #2E7D32; }
  .conditions { background: #FFF3E0; border-left: 4px solid #E65100; padding: 10px 14px; margin: 15px 0; }
  .conditions ol { margin: 5px 0; padding-left: 20px; }
  .conditions li { margin-bottom: 5px; }
  .signature { margin-top: 45px; }
  .stamp { border: 3px solid #1B2B5E; display: inline-block; padding: 8px 20px; color: #1B2B5E; font-weight: bold; font-size: 14px; letter-spacing: 2px; transform: rotate(-5deg); margin: 10px 0; }
  .footer { margin-top: 30px; font-size: 9px; color: #888; border-top: 1px solid #ddd; padding-top: 10px; text-align: center; }
  .ai-badge { display: inline-block; background: #EDE7F6; color: #673AB7; font-size: 9px; font-weight: bold; padding: 2px 8px; border-radius: 10px; margin-left: 8px; }
  @media print {
    body { padding: 20px; }
    .ai-badge { display: none; }
  }
</style>
</head>
<body>

<div class="header">
  <div class="logo-block">
    <h1>TEKUN NASIONAL</h1>
    <p>Kementerian Pembangunan Usahawan dan Koperasi</p>
    <p>Sistem Pengurusan Pembiayaan TEKUN (SPPT)</p>
  </div>
  <div class="ref-block">
    <p><strong>No. Rujukan:</strong> {$refNo}</p>
    <p><strong>Tarikh:</strong> {$date}</p>
    <p><span class="ai-badge">✦ Dijana oleh Gemini 3.1 Pro</span></p>
  </div>
</div>

<div class="recipient">
  <p>Kepada,</p>
  <p><strong>{$name}</strong></p>
  <p>No. K/P: {$ic}</p>
  <p>{$address}</p>
</div>

<p>Tuan/Puan,</p>
<div class="subject">TAWARAN PEMBIAYAAN TEKUN NASIONAL — {$scheme}</div>

<div class="ai-body">
  {$aiBodyHtml}
</div>

<div class="highlight">
  <div style="font-size:11px; color:#555; margin-bottom:4px;">Jumlah Pembiayaan Diluluskan:</div>
  <div class="amount">RM {$amountApproved}</div>
</div>

<div class="section-title">BUTIRAN PEMBIAYAAN</div>
<table>
  <tr><td>Skim Pembiayaan</td><td>{$scheme}</td></tr>
  <tr><td>Jumlah Pembiayaan</td><td>RM {$amountApproved}</td></tr>
  <tr><td>Tempoh Pembiayaan</td><td>{$tenure} bulan</td></tr>
  <tr><td>Kadar Keuntungan (Flat)</td><td>{$profitRate}% setahun</td></tr>
  <tr><td>Ansuran Bulanan</td><td>RM {$monthly}</td></tr>
  <tr><td>Jumlah Keuntungan</td><td>RM {$totalProfitFmt}</td></tr>
  <tr><td>Jumlah Bayaran Balik</td><td>RM {$totalPayableFmt}</td></tr>
</table>

<div class="section-title">SYARAT-SYARAT TAWARAN</div>
<div class="conditions">
<ol>
  <li>Tawaran ini sah selama <strong>14 hari</strong> dari tarikh surat ini.</li>
  <li>Pemohon dikehendaki menandatangani Perjanjian Pembiayaan dalam tempoh yang ditetapkan.</li>
  <li>Pembiayaan ini adalah tertakluk kepada Prinsip Murabahah (jual beli) mengikut Syariah.</li>
  <li>Pembayaran ansuran bulanan hendaklah dibuat pada atau sebelum tarikh matang setiap bulan.</li>
  <li>Ta'widh (pampasan) akan dikenakan ke atas ansuran yang tertunggak mengikut kadar yang ditetapkan oleh BNM.</li>
  <li>TEKUN Nasional berhak membatalkan tawaran ini jika maklumat yang diberikan didapati tidak benar.</li>
</ol>
</div>

<div class="signature">
  <p>Sekian, terima kasih atas kepercayaan anda kepada TEKUN Nasional. Kami berharap pembiayaan ini dapat membantu perkembangan perniagaan anda.</p>
  <br>
  <p>Yang menjalankan amanah,</p>
  <br><br>
  <div class="stamp">DILULUSKAN</div>
  <br><br>
  <p>_______________________________<br>
  <strong>Pengurus Kelulusan Kredit</strong><br>
  Bahagian Operasi &amp; Pembiayaan<br>
  TEKUN Nasional Berhad</p>
</div>

<div class="footer">
  TEKUN Nasional Berhad | Tel: 03-XXXX XXXX | www.tekun.gov.my<br>
  Dokumen ini dijana secara automatik oleh Sistem Pengurusan Pembiayaan TEKUN (SPPT) v1.0 menggunakan Enjin AI Gemini 3.1 Pro
</div>

</body>
</html>
HTML;
    }

    /**
     * Build Surat Penolakan HTML template.
     */
    private function buildRejectionHtml(string $appId, object $app, string $letterText): string
    {
        $date  = now()->locale('ms')->translatedFormat('d F Y');
        $refNo = 'TKN/TOLAK/' . date('Y') . '/' . str_pad($appId, 5, '0', STR_PAD_LEFT);
        $name  = strtoupper($app->applicant_name ?? 'PEMOHON');
        $ic    = $app->ic_number ?? 'N/A';
        $letterHtml = nl2br(htmlspecialchars($letterText));

        return <<<HTML
<!DOCTYPE html>
<html lang="ms">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #333; margin: 40px; }
  .header { text-align: center; border-bottom: 3px solid #1B2B5E; padding-bottom: 15px; margin-bottom: 20px; }
  .logo { font-size: 22px; font-weight: bold; color: #1B2B5E; }
  h1 { color: #1B2B5E; font-size: 16px; margin: 5px 0; }
  .stamp { border: 3px solid #c62828; display: inline-block; padding: 8px 20px; color: #c62828; font-weight: bold; transform: rotate(-5deg); margin-top: 10px; font-size: 14px; letter-spacing: 2px; }
  .footer { margin-top: 30px; font-size: 9px; color: #888; border-top: 1px solid #ddd; padding-top: 10px; text-align: center; }
</style>
</head>
<body>
<div class="header">
  <div class="logo">TEKUN NASIONAL</div>
  <h1>TEKUN NASIONAL BERHAD</h1>
  <p>SURAT MAKLUMAN KEPUTUSAN PERMOHONAN PEMBIAYAAN</p>
</div>
<p><strong>No. Rujukan:</strong> {$refNo} &nbsp;&nbsp; <strong>Tarikh:</strong> {$date}</p>
<p>Kepada,<br><strong>{$name}</strong><br>No. K/P: {$ic}</p>
<div style="white-space: pre-wrap;">{$letterHtml}</div>
<br>
<div class="stamp">TIDAK DILULUSKAN</div>
<div class="footer">
  TEKUN Nasional Berhad | www.tekun.gov.my | Dijana oleh SPPT v1.0
</div>
</body>
</html>
HTML;
    }

    /**
     * Save HTML as PDF to MinIO/S3 storage.
     */
    private function savePdf(string $html, string $filename, string $folder): string
    {
        if (class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
            try {
                $pdf  = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html)->setPaper('A4', 'portrait');
                $path = "{$folder}/{$filename}";
                Storage::disk('s3')->put($path, $pdf->output(), 'public');
                return Storage::disk('s3')->url($path);
            } catch (\Exception $e) {
                Log::warning("OfferLetterService: dompdf error — " . $e->getMessage());
            }
        }

        // Fallback: store HTML file
        $htmlFilename = str_replace('.pdf', '.html', $filename);
        $path = "{$folder}/{$htmlFilename}";
        Storage::disk('s3')->put($path, $html, 'public');
        return Storage::disk('s3')->url($path);
    }

    /**
     * Get human-readable scheme label.
     */
    private function schemeLabel(string $scheme): string
    {
        return match ($scheme) {
            'tekun_micro'     => 'TEKUN Micro',
            'tekun_usahawan'  => 'TEKUN Usahawan',
            'tekun_wanita'    => 'TEKUN Wanita',
            'tekun_belia'     => 'TEKUN Belia',
            default           => $scheme ?: 'Pembiayaan TEKUN',
        };
    }
}
