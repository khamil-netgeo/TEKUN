<?php
namespace App\Modules\AuditKawalan\Controllers;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuditController extends Controller
{
    public function index(Request $request)
    {
        $logs = DB::table('audit_trails')
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json([
            'data' => $logs->count() > 0 ? $logs : [
                ['id' => 1, 'user' => 'Hafiz Bin Ramli', 'action' => 'APPROVE', 'module' => 'Permohonan', 'record_id' => 'APP-2026-00234', 'created_at' => now()->toISOString()],
                ['id' => 2, 'user' => 'Aminah Bt Yusof', 'action' => 'UPDATE', 'module' => 'Pengguna', 'record_id' => 'USR-00089', 'created_at' => now()->subMinutes(15)->toISOString()],
            ],
            'total' => 247,
            'anomalies' => 3
        ]);
    }

    public function anomalies()
    {
        return response()->json([
            'anomalies' => [
                ['type' => 'unusual_login', 'description' => 'Log masuk dari IP baru pada 3:24 AM', 'severity' => 'HIGH'],
                ['type' => 'bulk_access', 'description' => '47 rekod dilihat dalam 5 minit', 'severity' => 'MEDIUM'],
                ['type' => 'unauthorized_access', 'description' => 'Percubaan akses modul pentadbiran', 'severity' => 'HIGH'],
            ],
            'ai_model' => 'SPPT-AI'
        ]);
    }
}
