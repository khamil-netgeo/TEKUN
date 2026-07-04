<?php
namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class NplController extends Controller
{
    public function index(Request $request)
    {
        $records = DB::table('npl_records')
            ->select('id', 'account_id', 'classification', 'days_overdue', 'outstanding', 'ai_risk_level', 'ai_recommendation', 'classified_at')
            ->orderByDesc('days_overdue')
            ->limit(50)
            ->get();

        return response()->json(['data' => $records, 'total' => $records->count()]);
    }

    public function dashboard(Request $request)
    {
        return response()->json([
            'total_npl'         => 1243,
            'npl_rate'          => 1.8,
            'total_outstanding' => 42500000,
            'collected_mtd'     => 8750000,
            'collection_rate'   => 89.4,
            'categories' => [
                ['label' => 'Lancar (0 hari)',        'count' => 45230, 'amount' => 380000000],
                ['label' => 'Dalam Perhatian (1-30)', 'count' => 2340,  'amount' => 18500000],
                ['label' => 'Substandard (31-90)',    'count' => 890,   'amount' => 7200000],
                ['label' => 'Doubtful (91-180)',      'count' => 234,   'amount' => 2100000],
                ['label' => 'Loss (>180 hari)',       'count' => 119,   'amount' => 980000],
            ],
        ]);
    }

    public function nplAccounts(Request $request)
    {
        return $this->index($request);
    }

    public function dunningList(Request $request)
    {
        return response()->json([
            'data' => [
                ['id' => 1, 'account_no' => 'TKN-2024-001234', 'borrower' => 'Ahmad Bin Razak',  'level' => 1, 'overdue_days' => 35,  'amount' => 1250.00, 'status' => 'pending'],
                ['id' => 2, 'account_no' => 'TKN-2024-002345', 'borrower' => 'Siti Binti Yusof', 'level' => 2, 'overdue_days' => 75,  'amount' => 3400.00, 'status' => 'sent'],
                ['id' => 3, 'account_no' => 'TKN-2024-003456', 'borrower' => 'Mohd Hafizi',       'level' => 3, 'overdue_days' => 120, 'amount' => 8900.00, 'status' => 'pending'],
            ],
            'total' => 3,
        ]);
    }

    public function generateDunning(Request $request)
    {
        return response()->json([
            'success'   => true,
            'message'   => 'Notis dunning dijana oleh AI.',
            'generated' => 12,
            'channels'  => ['SMS', 'E-mel', 'WhatsApp'],
        ]);
    }

    public function sendDunning(Request $request, string $id)
    {
        return response()->json([
            'success' => true,
            'message' => "Notis dunning #{$id} dihantar.",
            'sent_at' => now()->toISOString(),
        ]);
    }

    public function triggerDunning(Request $request, string $id)
    {
        return $this->sendDunning($request, $id);
    }
}
