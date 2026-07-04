<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EntrepreneurController extends Controller
{
    public function index(Request $request)
    {
        return response()->json([
            'data' => [
                ['id' => 'USH-001', 'name' => 'Ahmad Bin Mohd Ali', 'skim' => 'TEKUN Usahawan', 'status' => 'Lancar', 'health_score' => 82],
                ['id' => 'USH-002', 'name' => 'Siti Noraini Binti Hassan', 'skim' => 'TEKUN Wanita', 'status' => 'Perhatian Khusus', 'health_score' => 61],
                ['id' => 'USH-003', 'name' => 'Tan Wei Ming', 'skim' => 'TEKUN Usahawan', 'status' => 'Tidak Lancar', 'health_score' => 38],
            ],
            'total' => 3
        ]);
    }

    public function show($id)
    {
        return response()->json([
            'id' => $id,
            'name' => 'Ahmad Bin Mohd Ali',
            'skim' => 'TEKUN Usahawan',
            'amount' => 50000,
            'balance' => 30000,
            'status' => 'Lancar',
            'health_score' => 82,
            'ai_default_risk' => ['probability' => 0.12, 'risk_level' => 'Low', 'factors' => ['payment_history', 'business_revenue']],
            'kpi' => ['monthly_revenue' => 12500, 'employees' => 4, 'monthly_sales' => 28000]
        ]);
    }

    public function visits(Request $request)
    {
        return response()->json([
            'data' => [
                ['id' => 'LW-001', 'entrepreneur' => 'Ahmad Bin Mohd Ali', 'date' => '2026-07-10', 'status' => 'Dijadualkan'],
                ['id' => 'LW-002', 'entrepreneur' => 'Siti Noraini', 'date' => '2026-07-08', 'status' => 'Selesai'],
            ]
        ]);
    }

    public function generateVisitReport(Request $request, $id)
    {
        return response()->json([
            'report' => 'Laporan lawatan lapangan dijana oleh AI. Usahawan menunjukkan perkembangan positif dalam operasi perniagaan.',
            'generated_at' => now()->toISOString(),
            'ai_model' => 'SPPT-AI'
        ]);
    }
}
