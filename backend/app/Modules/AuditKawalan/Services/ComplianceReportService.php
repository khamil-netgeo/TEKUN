<?php

namespace App\Modules\AuditKawalan\Services;

use App\Models\AuditTrail;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Module 11 — Compliance Report Service
 *
 * Generates BNM (Bank Negara Malaysia) format audit compliance reports
 * as PDF or CSV, stores them in MinIO, and returns a signed URL.
 */
class ComplianceReportService
{
    /**
     * Generate a compliance report.
     *
     * @param  string  $from     Start date (Y-m-d)
     * @param  string  $to       End date (Y-m-d)
     * @param  array   $modules  Module filter (empty = all modules)
     * @param  string  $format   'pdf' or 'csv'
     * @param  User    $user     The requesting user
     * @return array  { report_id, pdf_url, from, to, total_records, generated_at }
     */
    public function generate(
        string $from,
        string $to,
        array $modules,
        string $format,
        User $user,
    ): array {
        $reportId = 'RPT-' . strtoupper(Str::random(8)) . '-' . now()->format('Ymd');

        // Fetch audit logs for the period
        $query = AuditTrail::with(['user:id,name,email'])
            ->whereBetween(\DB::raw('DATE(created_at)'), [$from, $to])
            ->orderBy('created_at', 'desc');

        if (!empty($modules)) {
            $query->whereIn('module', $modules);
        }

        $logs = $query->get();

        if ($format === 'csv') {
            return $this->generateCsv($reportId, $logs, $from, $to, $user);
        }

        return $this->generatePdf($reportId, $logs, $from, $to, $user);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PDF Generation
    // ─────────────────────────────────────────────────────────────────────────

    private function generatePdf(
        string $reportId,
        $logs,
        string $from,
        string $to,
        User $user,
    ): array {
        // Summary statistics
        $stats = [
            'total'    => $logs->count(),
            'by_action' => $logs->groupBy('action')->map->count(),
            'by_module' => $logs->groupBy('module')->map->count(),
            'critical'  => $logs->filter(fn ($l) => in_array($l->action, [
                'delete', 'role_change', 'mass_export', 'login_failed',
            ]))->count(),
        ];

        $html = $this->buildPdfHtml($reportId, $logs, $stats, $from, $to, $user);

        // Generate PDF using DomPDF
        $pdf = Pdf::loadHTML($html)
            ->setPaper('a4', 'landscape')
            ->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled'      => false,
                'defaultFont'          => 'DejaVu Sans',
            ]);

        $filename = "audit-reports/{$reportId}.pdf";
        $content  = $pdf->output();

        // Store in MinIO
        Storage::disk('s3')->put($filename, $content, 'private');
        $url = Storage::disk('s3')->temporaryUrl($filename, now()->addHours(24));

        return [
            'report_id'     => $reportId,
            'pdf_url'       => $url,
            'from'          => $from,
            'to'            => $to,
            'total_records' => $logs->count(),
            'format'        => 'pdf',
            'generated_at'  => now()->toISOString(),
            'generated_by'  => $user->name,
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CSV Generation
    // ─────────────────────────────────────────────────────────────────────────

    private function generateCsv(
        string $reportId,
        $logs,
        string $from,
        string $to,
        User $user,
    ): array {
        $lines   = [];
        $lines[] = implode(',', [
            'ID', 'Tarikh/Masa', 'Pengguna', 'E-mel', 'Tindakan',
            'Modul', 'Rekod ID', 'IP Address', 'Keterangan',
        ]);

        foreach ($logs as $log) {
            $lines[] = implode(',', [
                $log->id,
                '"' . $log->created_at?->format('d/m/Y H:i:s') . '"',
                '"' . ($log->user?->name ?? 'System') . '"',
                '"' . ($log->user?->email ?? '') . '"',
                '"' . $log->action . '"',
                '"' . $log->module . '"',
                '"' . ($log->auditable_id ?? '') . '"',
                '"' . ($log->ip_address ?? '') . '"',
                '"' . ($log->description ?? '') . '"',
            ]);
        }

        $filename = "audit-reports/{$reportId}.csv";
        Storage::disk('s3')->put($filename, implode("\n", $lines), 'private');
        $url = Storage::disk('s3')->temporaryUrl($filename, now()->addHours(24));

        return [
            'report_id'     => $reportId,
            'pdf_url'       => $url,
            'from'          => $from,
            'to'            => $to,
            'total_records' => $logs->count(),
            'format'        => 'csv',
            'generated_at'  => now()->toISOString(),
            'generated_by'  => $user->name,
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BNM-format PDF HTML template
    // ─────────────────────────────────────────────────────────────────────────

    private function buildPdfHtml(
        string $reportId,
        $logs,
        array $stats,
        string $from,
        string $to,
        User $user,
    ): string {
        $fromFmt      = \Carbon\Carbon::parse($from)->format('d/m/Y');
        $toFmt        = \Carbon\Carbon::parse($to)->format('d/m/Y');
        $generatedAt  = now()->format('d/m/Y H:i:s');
        $totalRecords = $stats['total'];
        $critical     = $stats['critical'];

        // Build action summary rows
        $actionRows = '';
        foreach ($stats['by_action'] as $action => $count) {
            $actionRows .= "<tr><td>{$action}</td><td>{$count}</td></tr>";
        }

        // Build log table rows (limit to 500 for PDF performance)
        $logRows = '';
        foreach ($logs->take(500) as $log) {
            $time     = $log->created_at?->format('d/m/Y H:i');
            $userName = htmlspecialchars($log->user?->name ?? 'System');
            $action   = htmlspecialchars(strtoupper($log->action));
            $module   = htmlspecialchars($log->module ?? '');
            $recordId = htmlspecialchars($log->auditable_id ?? '');
            $ip       = htmlspecialchars($log->ip_address ?? '');
            $desc     = htmlspecialchars($log->description ?? '');

            $severity = match (strtolower($log->action)) {
                'delete', 'role_change', 'mass_export' => 'color:#C62828;font-weight:bold',
                'approve', 'reject', 'login_failed'    => 'color:#E65100;font-weight:bold',
                default                                 => 'color:#1B2B5E',
            };

            $logRows .= "
                <tr>
                    <td>{$time}</td>
                    <td>{$userName}</td>
                    <td style='{$severity}'>{$action}</td>
                    <td>{$module}</td>
                    <td>{$recordId}</td>
                    <td>{$ip}</td>
                    <td style='font-size:9px'>{$desc}</td>
                </tr>";
        }

        $truncNote = $logs->count() > 500
            ? '<p style="color:#E65100;font-size:10px">* Laporan menunjukkan 500 rekod pertama sahaja. Gunakan format CSV untuk eksport penuh.</p>'
            : '';

        return <<<HTML
<!DOCTYPE html>
<html lang="ms">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #222; margin: 0; padding: 0; }
  .header { background: #1B2B5E; color: white; padding: 16px 20px; }
  .header h1 { margin: 0; font-size: 16px; }
  .header p  { margin: 4px 0 0; font-size: 10px; opacity: 0.85; }
  .meta-table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  .meta-table td { padding: 4px 8px; font-size: 10px; }
  .meta-table .label { font-weight: bold; color: #1B2B5E; width: 160px; }
  .section-title { background: #E8EAF6; color: #1B2B5E; font-weight: bold;
                   padding: 6px 10px; font-size: 11px; margin: 12px 0 6px; }
  .summary-grid { display: table; width: 100%; border-collapse: collapse; }
  .summary-cell { display: table-cell; width: 25%; text-align: center;
                  border: 1px solid #ddd; padding: 8px; }
  .summary-num  { font-size: 20px; font-weight: bold; color: #1B2B5E; }
  .summary-lbl  { font-size: 9px; color: #666; }
  table.data { width: 100%; border-collapse: collapse; margin-top: 6px; }
  table.data th { background: #1B2B5E; color: white; padding: 5px 6px; font-size: 9px; text-align: left; }
  table.data td { padding: 4px 6px; border-bottom: 1px solid #eee; font-size: 9px; }
  table.data tr:nth-child(even) { background: #F5F5F5; }
  .footer { margin-top: 20px; border-top: 1px solid #ddd; padding-top: 8px;
            font-size: 9px; color: #999; text-align: center; }
  .badge-critical { color: #C62828; font-weight: bold; }
  .badge-high     { color: #E65100; font-weight: bold; }
</style>
</head>
<body>
<div class="header">
  <h1>TEKUN Nasional — Laporan Jejak Audit &amp; Pematuhan</h1>
  <p>Sistem Pengurusan Pembiayaan TEKUN (SPPT) &nbsp;|&nbsp; Format BNM &nbsp;|&nbsp; SULIT</p>
</div>

<table class="meta-table">
  <tr><td class="label">ID Laporan</td><td>{$reportId}</td>
      <td class="label">Dijana Oleh</td><td>{$user->name} ({$user->email})</td></tr>
  <tr><td class="label">Tempoh Laporan</td><td>{$fromFmt} — {$toFmt}</td>
      <td class="label">Tarikh/Masa Jana</td><td>{$generatedAt}</td></tr>
</table>

<div class="section-title">Ringkasan Eksekutif</div>
<div class="summary-grid">
  <div class="summary-cell"><div class="summary-num">{$totalRecords}</div><div class="summary-lbl">Jumlah Log</div></div>
  <div class="summary-cell"><div class="summary-num badge-critical">{$critical}</div><div class="summary-lbl">Tindakan Kritikal</div></div>
  <div class="summary-cell"><div class="summary-num">{$stats['by_action']->count()}</div><div class="summary-lbl">Jenis Tindakan</div></div>
  <div class="summary-cell"><div class="summary-num">{$stats['by_module']->count()}</div><div class="summary-lbl">Modul Terlibat</div></div>
</div>

<div class="section-title">Pecahan Mengikut Tindakan</div>
<table class="data" style="width:40%">
  <tr><th>Tindakan</th><th>Bilangan</th></tr>
  {$actionRows}
</table>

<div class="section-title">Log Terperinci</div>
{$truncNote}
<table class="data">
  <tr>
    <th>Tarikh/Masa</th>
    <th>Pengguna</th>
    <th>Tindakan</th>
    <th>Modul</th>
    <th>ID Rekod</th>
    <th>IP Address</th>
    <th>Keterangan</th>
  </tr>
  {$logRows}
</table>

<div class="footer">
  Laporan ini dijana secara automatik oleh SPPT. Untuk pertanyaan, hubungi Bahagian IT TEKUN Nasional.
  &nbsp;|&nbsp; Rujukan: {$reportId} &nbsp;|&nbsp; {$generatedAt}
</div>
</body>
</html>
HTML;
    }
}
