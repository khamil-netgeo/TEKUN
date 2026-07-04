<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => [
                ['id' => 1, 'name' => 'Laporan Agihan Dana Bulanan', 'type' => 'standard', 'last_generated' => '2026-07-01'],
                ['id' => 2, 'name' => 'Laporan NPL Cawangan', 'type' => 'standard', 'last_generated' => '2026-07-01'],
                ['id' => 3, 'name' => 'Laporan Kutipan Bayaran', 'type' => 'ad-hoc', 'last_generated' => '2026-06-30'],
            ],
        ]);
    }

    public function generate(Request $request)
    {
        $filters = $request->input('filters', []);
        $columns = $request->input('columns', []);
        $groupBy = $request->input('groupBy', 'Negeri');
        $sortBy = $request->input('sortBy', 'Jumlah');

        return response()->json([
            'success' => true,
            'message' => 'Laporan berjaya dijana.',
            'data' => [
                'report_id' => 'RPT-' . now()->format('YmdHis'),
                'total_records' => 1248,
                'filters_applied' => count($filters),
                'columns' => $columns,
                'group_by' => $groupBy,
                'sort_by' => $sortBy,
                'generated_at' => now()->toISOString(),
                'download_url' => '/api/reports/download/RPT-' . now()->format('YmdHis'),
            ],
        ]);
    }

    public function dashboard(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'kpis' => [
                    'total_disbursed' => 4200000000,
                    'collection_rate' => 89.4,
                    'npl_ratio' => 1.8,
                    'new_applications' => 1247,
                    'approval_rate' => 73.2,
                ],
                'monthly_disbursement' => [
                    ['month' => 'Jan 2026', 'amount' => 280], ['month' => 'Feb 2026', 'amount' => 320],
                    ['month' => 'Mac 2026', 'amount' => 310], ['month' => 'Apr 2026', 'amount' => 350],
                    ['month' => 'Mei 2026', 'amount' => 370], ['month' => 'Jun 2026', 'amount' => 390],
                    ['month' => 'Jul 2026', 'amount' => 420],
                ],
                'portfolio_composition' => [
                    ['name' => 'Lancar', 'value' => 92.3, 'color' => '#2E7D32'],
                    ['name' => 'Perhatian Khusus', 'value' => 5.6, 'color' => '#F9A825'],
                    ['name' => 'Tidak Lancar', 'value' => 1.7, 'color' => '#E65100'],
                    ['name' => 'NPL', 'value' => 0.4, 'color' => '#C62828'],
                ],
                'top_branches' => [
                    ['name' => 'Cawangan KL Sentral', 'rate' => 94],
                    ['name' => 'Cawangan Johor Bahru', 'rate' => 92],
                    ['name' => 'Cawangan Pulau Pinang', 'rate' => 90],
                    ['name' => 'Cawangan Shah Alam', 'rate' => 88],
                    ['name' => 'Cawangan Ipoh', 'rate' => 86],
                ],
                'ai_insight' => 'Cawangan Kelantan menunjukkan peningkatan NPL 0.8% dalam 30 hari. Tindakan segera disyorkan.',
            ],
        ]);
    }

    public function schedule(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Jadual laporan berjaya dikemaskini.',
            'data' => [
                'schedule' => $request->input('schedule', 'weekly'),
                'email' => $request->input('email', ''),
                'next_run' => now()->next('Monday')->setTime(8, 0)->toISOString(),
            ],
        ]);
    }

    // POC: GET /api/reports/predictive
    public function predictive(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'forecast_period' => '3 bulan',
                'predicted_npl_q3' => 2.1,
                'predicted_collection_q3' => 87.8,
                'predicted_disbursement_q3' => 1250000000,
                'risk_alerts' => [
                    ['region' => 'Kelantan', 'risk' => 'high', 'npl_trend' => '+0.8%', 'action' => 'Tingkatkan kutipan'],
                    ['region' => 'Sabah', 'risk' => 'medium', 'npl_trend' => '+0.3%', 'action' => 'Pantau bulanan'],
                ],
                'ai_confidence' => 87.4,
                'model' => 'SPPT Predictive Analytics v1.0',
                'generated_at' => now()->toISOString(),
            ],
        ]);
    }
}
