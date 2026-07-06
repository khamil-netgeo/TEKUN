<?php

namespace App\Modules\LaporanAnalitik\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\LaporanAnalitik\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Module 6 — Laporan & Analitik
 * KPI Dashboard Controller
 *
 * Endpoints:
 *   GET /api/dashboard/kpi
 *   GET /api/dashboard/trends
 *   GET /api/dashboard/branch-performance
 *   GET /api/dashboard/predictive
 */
class KpiDashboardController extends Controller
{
    public function __construct(private AnalyticsService $analytics) {}

    /**
     * GET /api/dashboard/kpi
     * Returns top-level KPI metrics: total_portfolio, approval_rate, npl_ratio, disbursement_volume.
     */
    public function kpi(Request $request): JsonResponse
    {
        $data = $this->analytics->getKpiSnapshot();

        return response()->json([
            'success' => true,
            'data'    => [
                'total_portfolio'     => $data['total_portfolio'],
                'approval_rate'       => $data['approval_rate'],
                'npl_ratio'           => $data['npl_ratio'],
                'disbursement_volume' => $data['disbursement_volume'],
                'collection_rate'     => $data['collection_rate'],
                'total_applications'  => $data['total_applications'],
                'active_accounts'     => $data['active_accounts'],
                'as_of'               => $data['as_of'],
            ],
        ]);
    }

    /**
     * GET /api/dashboard/trends?period=monthly
     * Returns time-series data for charts.
     */
    public function trends(Request $request): JsonResponse
    {
        $period = $request->query('period', 'monthly');
        $data   = $this->analytics->getTrends($period);

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }

    /**
     * GET /api/dashboard/branch-performance
     * Returns ranked branch data with state heatmap.
     */
    public function branchPerformance(Request $request): JsonResponse
    {
        $data = $this->analytics->getBranchPerformance();

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }

    /**
     * GET /api/dashboard/predictive
     * Returns AI-powered 3-month forecast for NPL trend and disbursement pipeline.
     */
    public function predictive(Request $request): JsonResponse
    {
        $data = $this->analytics->getPredictiveAnalytics();

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }

    /**
     * GET /api/dashboard/portfolio-composition
     * Returns portfolio health breakdown.
     */
    public function portfolioComposition(Request $request): JsonResponse
    {
        $data = $this->analytics->getPortfolioComposition();

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }

    /**
     * GET /api/module6/dashboard
     * Full dashboard snapshot — combines KPI, trends, branch performance, and AI insights.
     * Added for Orchestrator compatibility (M6-001 hotfix).
     */
    public function fullDashboard(Request $request): JsonResponse
    {
        try {
            $kpi        = $this->analytics->getKpiSnapshot();
            $trends     = $this->analytics->getTrends('monthly');
            $branches   = $this->analytics->getBranchPerformance();
            $predictive = $this->analytics->getPredictiveAnalytics();
            $aiData     = $this->analytics->getAiInsights();

            return response()->json([
                'success' => true,
                'data'    => [
                    'kpi'          => [
                        'total_portfolio'     => $kpi['total_portfolio'],
                        'approval_rate'       => $kpi['approval_rate'],
                        'npl_ratio'           => $kpi['npl_ratio'],
                        'disbursement_volume' => $kpi['disbursement_volume'],
                        'collection_rate'     => $kpi['collection_rate'],
                        'total_applications'  => $kpi['total_applications'],
                        'active_accounts'     => $kpi['active_accounts'],
                    ],
                    'trends'       => $trends,
                    'branches'     => $branches,
                    'predictive'   => $predictive,
                    'ai_insights'  => $aiData['insights'] ?? $aiData,
                    'as_of'        => now()->toISOString(),
                    'model'        => $aiData['model'] ?? 'SPPT-AI v1.0',
                ],
            ]);
        } catch (\Throwable $e) {
            \Log::error('M6 fullDashboard error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Ralat memuat data dashboard.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * GET /api/dashboard/ai-insights
     * Returns AI-generated insights and alerts.
     */
    public function aiInsights(Request $request): JsonResponse
    {
        $data = $this->analytics->getAiInsights();

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }
}