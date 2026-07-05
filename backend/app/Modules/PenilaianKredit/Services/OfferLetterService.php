<?php

namespace App\Modules\PenilaianKredit\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

/**
 * Module 2 — Offer Letter & Rejection Letter PDF Service
 *
 * Generates Surat Tawaran (Offer Letter) and Surat Penolakan (Rejection Letter)
 * as PDF files stored in MinIO/S3.
 *
 * Uses barryvdh/laravel-dompdf for PDF generation.
 */
class OfferLetterService
{
    /**
     * Generate Surat Tawaran PDF for approved application.
     * Returns public URL of the generated PDF.
     */
    public function generate(string $appId, object $app, object $assessment): string
    {
        try {
            $html = $this->buildOfferLetterHtml($appId, $app, $assessment);
            return $this->savePdf($html, "offer-letter-{$appId}.pdf", "offer-letters");
        } catch (\Exception $e) {
            Log::error("OfferLetterService::generate error: " . $e->getMessage());
            return "/api/applications/{$appId}/offer-letter/download";
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
     * Build Surat Tawaran HTML template.
     */
    private function buildOfferLetterHtml(string $appId, object $app, object $assessment): string
    {
        $date           = now()->format('d F Y');
        $refNo          = $app->ref_no ?? "TEKUN/{$appId}/2026";
        $name           = $app->applicant_name ?? 'Pemohon';
        $ic             = $app->ic_number ?? 'N/A';
        $address        = $app->address ?? 'N/A';
        $scheme         = $app->scheme ?? 'Pembiayaan TEKUN';
        $amount         = number_format((float)($assessment->amount_approved ?? $app->amount_requested ?? 0), 2);
        $tenure         = $assessment->tenure_approved ?? 60;
        $rate           = $assessment->profit_rate ?? 4.0;
        $totalProfit    = (float)($assessment->amount_approved ?? 50000) * ($rate / 100) * ($tenure / 12);
        $totalPayable   = (float)($assessment->amount_approved ?? 50000) + $totalProfit;
        $monthly        = $tenure > 0 ? round($totalPayable / $tenure, 2) : 0;

        return <<<HTML
<!DOCTYPE html>
<html lang="ms">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #333; margin: 40px; }
  .header { text-align: center; border-bottom: 3px solid #1B2B5E; padding-bottom: 15px; margin-bottom: 20px; }
  .header h1 { color: #1B2B5E; font-size: 18px; margin: 0; }
  .header h2 { color: #2E7D32; font-size: 14px; margin: 5px 0 0 0; }
  .logo { font-size: 24px; font-weight: bold; color: #1B2B5E; }
  .ref-date { display: flex; justify-content: space-between; margin-bottom: 20px; }
  .section-title { background: #1B2B5E; color: white; padding: 5px 10px; font-weight: bold; margin: 15px 0 8px 0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
  table td { padding: 6px 10px; border: 1px solid #ddd; }
  table td:first-child { font-weight: bold; width: 40%; background: #f5f5f5; }
  .highlight { background: #E8F5E9; border: 2px solid #2E7D32; padding: 10px; margin: 15px 0; }
  .highlight .amount { font-size: 20px; font-weight: bold; color: #2E7D32; }
  .conditions { background: #FFF3E0; border-left: 4px solid #E65100; padding: 10px; margin: 15px 0; }
  .signature { margin-top: 40px; }
  .footer { margin-top: 30px; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; text-align: center; }
  .stamp { border: 3px solid #1B2B5E; display: inline-block; padding: 10px 20px; color: #1B2B5E; font-weight: bold; transform: rotate(-5deg); margin-top: 10px; }
</style>
</head>
<body>
<div class="header">
  <div class="logo">TEKUN NASIONAL</div>
  <h1>TEKUN NASIONAL BERHAD</h1>
  <h2>SURAT TAWARAN PEMBIAYAAN</h2>
</div>

<div class="ref-date">
  <div><strong>No. Rujukan:</strong> {$refNo}</div>
  <div><strong>Tarikh:</strong> {$date}</div>
</div>

<p>Kepada,<br>
<strong>{$name}</strong><br>
No. K/P: {$ic}<br>
{$address}</p>

<p>Dengan hormatnya perkara di atas adalah dirujuk.</p>

<p>Sukacita dimaklumkan bahawa permohonan anda untuk <strong>{$scheme}</strong> telah <strong style="color: #2E7D32;">DILULUSKAN</strong> dengan butiran seperti berikut:</p>

<div class="highlight">
  <div>Jumlah Pembiayaan Diluluskan:</div>
  <div class="amount">RM {$amount}</div>
</div>

<div class="section-title">BUTIRAN PEMBIAYAAN</div>
<table>
  <tr><td>Skim Pembiayaan</td><td>{$scheme}</td></tr>
  <tr><td>Jumlah Pembiayaan</td><td>RM {$amount}</td></tr>
  <tr><td>Tempoh Pembiayaan</td><td>{$tenure} bulan</td></tr>
  <tr><td>Kadar Keuntungan (Flat)</td><td>{$rate}% setahun</td></tr>
  <tr><td>Ansuran Bulanan</td><td>RM {$monthly}</td></tr>
  <tr><td>Jumlah Keuntungan</td><td>RM {$totalProfit}</td></tr>
  <tr><td>Jumlah Bayaran Balik</td><td>RM {$totalPayable}</td></tr>
</table>

<div class="section-title">SYARAT-SYARAT TAWARAN</div>
<div class="conditions">
<ol>
  <li>Tawaran ini sah selama <strong>14 hari</strong> dari tarikh surat ini.</li>
  <li>Pemohon dikehendaki menandatangani Perjanjian Pembiayaan dalam tempoh yang ditetapkan.</li>
  <li>Pembiayaan ini adalah tertakluk kepada Prinsip Murabahah (jual beli) mengikut Syariah.</li>
  <li>Pembayaran ansuran bulanan hendaklah dibuat pada atau sebelum tarikh matang setiap bulan.</li>
  <li>Ta'widh (pampasan) akan dikenakan ke atas ansuran yang tertunggak mengikut kadar yang ditetapkan oleh BNM.</li>
</ol>
</div>

<div class="signature">
  <p>Sekian, terima kasih atas kepercayaan anda kepada TEKUN Nasional.</p>
  <br><br>
  <p>Yang menjalankan amanah,</p>
  <div class="stamp">DILULUSKAN</div>
  <br><br>
  <p>_______________________________<br>
  <strong>Pengurus Kredit</strong><br>
  Bahagian Penilaian Kredit<br>
  TEKUN Nasional Berhad</p>
</div>

<div class="footer">
  TEKUN Nasional Berhad (No. Syarikat: 123456-X) | Tel: 03-XXXX XXXX | www.tekun.gov.my<br>
  Dokumen ini dijana secara automatik oleh Sistem Pengurusan Pembiayaan TEKUN (SPPT) v1.0
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
        $date  = now()->format('d F Y');
        $refNo = $app->ref_no ?? "TEKUN/{$appId}/2026";
        $name  = $app->applicant_name ?? 'Pemohon';
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
  .logo { font-size: 24px; font-weight: bold; color: #1B2B5E; }
  h1 { color: #1B2B5E; font-size: 18px; }
  .stamp { border: 3px solid #c62828; display: inline-block; padding: 10px 20px; color: #c62828; font-weight: bold; transform: rotate(-5deg); margin-top: 10px; font-size: 16px; }
  .footer { margin-top: 30px; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; text-align: center; }
</style>
</head>
<body>
<div class="header">
  <div class="logo">TEKUN NASIONAL</div>
  <h1>TEKUN NASIONAL BERHAD</h1>
  <p>SURAT MAKLUMAN KEPUTUSAN PERMOHONAN PEMBIAYAAN</p>
</div>
<p><strong>No. Rujukan:</strong> {$refNo} &nbsp;&nbsp; <strong>Tarikh:</strong> {$date}</p>
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
        // Use dompdf if available, otherwise store HTML as fallback
        if (class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
            $pdf  = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
            $path = "{$folder}/{$filename}";
            Storage::disk('s3')->put($path, $pdf->output(), 'public');
            return Storage::disk('s3')->url($path);
        }

        // Fallback: store HTML file
        $path = "{$folder}/" . str_replace('.pdf', '.html', $filename);
        Storage::disk('s3')->put($path, $html, 'public');
        return Storage::disk('s3')->url($path);
    }
}
