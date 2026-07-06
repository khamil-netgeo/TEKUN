<?php

namespace App\Modules\LaporanAnalitik\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Modules\LaporanAnalitik\Services\ReportBuilderService;

class ReportController extends Controller
{
    protected ReportBuilderService $reportBuilderService;

    public function __construct(ReportBuilderService $reportBuilderService)
    {
        $this->reportBuilderService = $reportBuilderService;
    }

    public function index(Request $request)
    {
        // If columns[] param is present, delegate to ReportBuilderController
        if ($request->has('columns')) {
            $builderController = app(ReportBuilderController::class);
            return $builderController->builder($request);
        }

        return response()->json([
            'success' => true,
            'data' => $this->reportBuilderService->getReports($request->all()),
        ]);
    }

    public function generate(Request $request)
    {
        $filters = $request->input('filters', []);
        $columns = $request->input('columns', []);
        $groupBy = $request->input('groupBy', 'Negeri');
        $sortBy = $request->input('sortBy', 'Jumlah');

        $data = $this->reportBuilderService->generateReport($filters, $columns, $groupBy, $sortBy);

        return response()->json([
            'success' => true,
            'message' => 'Laporan berjaya dijana.',
            'data' => $data,
        ]);
    }

    public function dashboard(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $this->reportBuilderService->getDashboardData($request->all()),
        ]);
    }

    public function schedule(Request $request)
    {
        $data = $this->reportBuilderService->scheduleReport($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Jadual laporan berjaya dikemaskini.',
            'data' => $data,
        ]);
    }

    // POC: GET /api/reports/predictive
    public function predictive(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $this->reportBuilderService->getPredictiveData($request->all()),
        ]);
    }
}