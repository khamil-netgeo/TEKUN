<?php

namespace App\Modules\LaporanAnalitik\Services;

use App\Modules\LaporanAnalitik\Models\GeneratedReport;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ReportExportService
{
    /**
     * Generate a new report reference number.
     */
    public function generateRef(): string
    {
        return 'RPT-' . Carbon::now()->format('Ymd') . '-' . strtoupper(Str::random(6));
    }

    /**
     * Create a GeneratedReport record and simulate PDF/Excel generation.
     * In production, this would dispatch a queue job.
     */
    public function createExport(
        int $userId,
        array $columns,
        ?string $dateFrom,
        ?string $dateTo,
        array $data,
        string $reportName = 'Laporan SPPT'
    ): GeneratedReport {
        $ref = $this->generateRef();

        $report = GeneratedReport::create([
            'generated_by' => $userId,
            'report_ref'   => $ref,
            'report_name'  => $reportName,
            'report_type'  => 'ad-hoc',
            'columns'      => $columns,
            'filters'      => [],
            'date_from'    => $dateFrom,
            'date_to'      => $dateTo,
            'total_records'=> count($data),
            'status'       => 'completed',
            'pdf_url'      => "/api/reports/{$ref}/download?format=pdf",
            'excel_url'    => "/api/reports/{$ref}/download?format=excel",
            'completed_at' => Carbon::now(),
        ]);

        return $report;
    }

    /**
     * Generate a simple CSV/text representation for download.
     * In production, use dompdf for PDF and PhpSpreadsheet for Excel.
     */
    public function generateCsvContent(array $data, array $columns): string
    {
        if (empty($data)) return '';

        $headers = empty($columns) ? array_keys($data[0]) : $columns;
        $lines = [implode(',', $headers)];

        foreach ($data as $row) {
            $values = array_map(fn($col) => '"' . ($row[$col] ?? '') . '"', $headers);
            $lines[] = implode(',', $values);
        }

        return implode("\n", $lines);
    }
}
