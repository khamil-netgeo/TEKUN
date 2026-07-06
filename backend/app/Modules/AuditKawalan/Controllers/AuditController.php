<?php
namespace App\Modules\AuditKawalan\Controllers;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Modules\AuditKawalan\Services\AnomalyDetectionService;

class AuditController extends Controller
{
    public function index(Request $request, AnomalyDetectionService $anomalyDetectionService)
    {
        $logs = DB::table('audit_trails')
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json([
            'data' => $logs,
            'total' => DB::table('audit_trails')->count(),
            'anomalies' => count($anomalyDetectionService->detect())
        ]);
    }

    public function show($id)
    {
        $log = DB::table('audit_trails')->where('id', $id)->first();

        if (!$log) {
            return response()->json(['message' => 'Audit log not found'], 404);
        }

        return response()->json(['data' => $log]);
    }

    public function stats()
    {
        $stats = [
            'total' => DB::table('audit_trails')->count(),
            'by_action' => DB::table('audit_trails')
                ->select('action', DB::raw('count(*) as count'))
                ->groupBy('action')
                ->get(),
            'recent' => DB::table('audit_trails')
                ->where('created_at', '>=', now()->subDays(7))
                ->count()
        ];

        return response()->json(['data' => $stats]);
    }

    public function export()
    {
        $logs = DB::table('audit_trails')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'message' => 'Compliance report generated successfully',
            'data' => $logs
        ]);
    }

    public function anomalies(AnomalyDetectionService $anomalyDetectionService)
    {
        return response()->json([
            'anomalies' => $anomalyDetectionService->detect(),
            'ai_model' => 'SPPT-AI'
        ]);
    }
}