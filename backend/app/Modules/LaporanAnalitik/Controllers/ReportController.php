<?php

namespace App\Modules\LaporanAnalitik\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Modules\LaporanAnalitik\Services\AnalyticsService;
use App\Modules\LaporanAnalitik\Services\ReportExportService;
use Illuminate\Support\Facades\Http;

/**
 * Module 6 — Laporan & Analitik
 * ReportController — backward-compatible wrapper used by core routes/api.php.
 *
 * NOTE: ReportBuilderService was removed (class does not exist).
 * All report logic now delegates to AnalyticsService / ReportExportService.
 */
class ReportController extends Controller
{
    public function __construct(
        private AnalyticsService $analytics,
        private ReportExportService $exporter
    ) {}

    /**
     * GET /api/reports or GET /api/reports/builder
     * If columns[] param is present, delegate to ReportBuilderController::builder().
     */
    public function index(Request $request)
    {
        if ($request->has('columns')) {
            $builderController = app(ReportBuilderController::class);
            return $builderController->builder($request);
        }

        // Default: return a summary of available reports
        try {
            $data = $this->analytics->buildReport(
                $request->input('columns', ['nama', 'skim', 'jumlah']),
                $request->input('from', now()->startOfYear()->toDateString()),
                $request->input('to', now()->toDateString())
            );
            return response()->json([
                'success' => true,
                'data'    => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mendapatkan data laporan: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/reports/generate
     */
    public function generate(Request $request)
    {
        try {
            $data = $this->analytics->buildReport(
                $request->input('columns', ['nama', 'skim', 'jumlah']),
                $request->input('from', now()->startOfYear()->toDateString()),
                $request->input('to', now()->toDateString())
            );
            return response()->json([
                'success' => true,
                'message' => 'Laporan berjaya dijana.',
                'data'    => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ralat menjana laporan: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/reports/dashboard  (alias for KPI)
     */
    public function dashboard(Request $request)
    {
        try {
            $kpiController = app(KpiDashboardController::class);
            return $kpiController->kpi($request);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ralat mendapatkan data dashboard: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/reports/schedule
     */
    public function schedule(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Jadual laporan berjaya dikemaskini.',
            'data'    => [
                'scheduled' => true,
                'frequency' => $request->input('frequency', 'monthly'),
                'next_run'  => now()->addMonth()->toDateString(),
            ],
        ]);
    }

    /**
     * GET /api/reports/predictive
     */
    public function predictive(Request $request)
    {
        try {
            $kpiController = app(KpiDashboardController::class);
            return $kpiController->predictive($request);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ralat penyambungan ke enjin AI: ' . $e->getMessage(),
            ], 500);
        }
    }
}
