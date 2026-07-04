<?php

namespace App\Modules\LaporanAnalitik\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\LaporanAnalitik\Models\GeneratedReport;
use App\Modules\LaporanAnalitik\Models\ReportTemplate;
use App\Modules\LaporanAnalitik\Services\AnalyticsService;
use App\Modules\LaporanAnalitik\Services\ReportExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Module 6 — Laporan & Analitik
 * Report Builder Controller
 *
 * Endpoints:
 *   GET  /api/reports/builder
 *   POST /api/reports/export
 *   GET  /api/reports/templates
 *   POST /api/reports/templates
 *   GET  /api/reports/history
 */
class ReportBuilderController extends Controller
{
    public function __construct(
        private AnalyticsService $analytics,
        private ReportExportService $exporter
    ) {}

    /**
     * GET /api/reports/builder?columns[]=X&from=Y&to=Z
     * Returns filtered report data for preview.
     */
    public function builder(Request $request): JsonResponse
    {
        $columns  = $request->query('columns', []);
        $dateFrom = $request->query('from');
        $dateTo   = $request->query('to');
        $filters  = $request->query('filters', []);

        if (is_string($columns)) {
            $columns = [$columns];
        }

        $result = $this->analytics->buildReport($columns, $dateFrom, $dateTo, $filters);

        return response()->json([
            'success' => true,
            'data'    => $result,
        ]);
    }

    /**
     * POST /api/reports/export
     * Generates a PDF and Excel export, returns download URLs.
     *
     * Body: { columns: [], from: "YYYY-MM-DD", to: "YYYY-MM-DD", report_name: "" }
     */
    public function export(Request $request): JsonResponse
    {
        $request->validate([
            'columns'     => 'nullable|array',
            'from'        => 'nullable|date',
            'to'          => 'nullable|date',
            'report_name' => 'nullable|string|max:255',
        ]);

        $columns    = $request->input('columns', []);
        $dateFrom   = $request->input('from');
        $dateTo     = $request->input('to');
        $reportName = $request->input('report_name', 'Laporan SPPT ' . now()->format('d/m/Y'));

        $reportData = $this->analytics->buildReport($columns, $dateFrom, $dateTo);

        $userId = Auth::id() ?? 1;
        $report = $this->exporter->createExport(
            $userId,
            $columns,
            $dateFrom,
            $dateTo,
            $reportData['data'],
            $reportName
        );

        return response()->json([
            'success'   => true,
            'message'   => 'Laporan berjaya dijana.',
            'data'      => [
                'report_ref'    => $report->report_ref,
                'report_name'   => $report->report_name,
                'total_records' => $report->total_records,
                'pdf_url'       => $report->pdf_url,
                'excel_url'     => $report->excel_url,
                'status'        => $report->status,
                'generated_at'  => $report->completed_at?->toISOString(),
            ],
        ], 201);
    }

    /**
     * GET /api/reports/templates
     * List saved report templates.
     */
    public function listTemplates(Request $request): JsonResponse
    {
        $templates = ReportTemplate::with('creator:id,name')
            ->latest()
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $templates,
        ]);
    }

    /**
     * POST /api/reports/templates
     * Save a report template.
     */
    public function saveTemplate(Request $request): JsonResponse
    {
        $request->validate([
            'name'               => 'required|string|max:255',
            'columns'            => 'nullable|array',
            'filters'            => 'nullable|array',
            'group_by'           => 'nullable|string',
            'sort_by'            => 'nullable|string',
            'is_scheduled'       => 'nullable|boolean',
            'schedule_frequency' => 'nullable|string|in:daily,weekly,monthly',
            'schedule_email'     => 'nullable|email',
        ]);

        $template = ReportTemplate::create([
            'created_by'         => Auth::id() ?? 1,
            'name'               => $request->input('name'),
            'report_type'        => 'ad-hoc',
            'columns'            => $request->input('columns', []),
            'filters'            => $request->input('filters', []),
            'group_by'           => $request->input('group_by'),
            'sort_by'            => $request->input('sort_by'),
            'sort_direction'     => $request->input('sort_direction', 'desc'),
            'is_scheduled'       => $request->boolean('is_scheduled'),
            'schedule_frequency' => $request->input('schedule_frequency'),
            'schedule_email'     => $request->input('schedule_email'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Templat laporan disimpan.',
            'data'    => $template,
        ], 201);
    }

    /**
     * GET /api/reports/history
     * List previously generated reports.
     */
    public function history(Request $request): JsonResponse
    {
        $reports = GeneratedReport::with('generator:id,name')
            ->latest()
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $reports,
        ]);
    }

    /**
     * GET /api/reports/{ref}/download
     * Simulate download — returns CSV content.
     */
    public function download(Request $request, string $ref): \Illuminate\Http\Response
    {
        $format = $request->query('format', 'csv');

        $reportData = $this->analytics->buildReport([], null, null);
        $csv = $this->exporter->generateCsvContent($reportData['data'], []);

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$ref}.csv\"",
        ]);
    }
}
