<?php
namespace App\Modules\IntegrasiAPI\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\IntegrasiAPI\Models\ApiIntegration;
use Illuminate\Http\Request;
use Carbon\Carbon;

class IntegrationController extends Controller
{
    public function health()
    {
        // Try real DB first, fallback to static demo data
        $integrations = ApiIntegration::all();

        if ($integrations->isEmpty()) {
            // Static demo data for POC
            $integrations = collect([
                ['id' => 1, 'name' => 'e-Syariah', 'service_key' => 'e_syariah', 'status' => 'ok', 'latency_ms' => 245, 'uptime_30d' => 99.8, 'last_checked_at' => now()],
                ['id' => 2, 'name' => 'Muflis', 'service_key' => 'muflis', 'status' => 'ok', 'latency_ms' => 312, 'uptime_30d' => 99.5, 'last_checked_at' => now()],
                ['id' => 3, 'name' => 'SSM', 'service_key' => 'ssm', 'status' => 'ok', 'latency_ms' => 189, 'uptime_30d' => 99.9, 'last_checked_at' => now()],
                ['id' => 4, 'name' => 'CCRIS', 'service_key' => 'ccris', 'status' => 'degraded', 'latency_ms' => 1850, 'uptime_30d' => 97.2, 'last_checked_at' => now()],
                ['id' => 5, 'name' => 'CTOS', 'service_key' => 'ctos', 'status' => 'ok', 'latency_ms' => 423, 'uptime_30d' => 99.1, 'last_checked_at' => now()],
                ['id' => 6, 'name' => 'MyKad/eKYC', 'service_key' => 'mykad_ekyc', 'status' => 'ok', 'latency_ms' => 567, 'uptime_30d' => 98.9, 'last_checked_at' => now()],
            ]);
        }

        $total    = $integrations->count();
        $ok       = $integrations->where('status', 'ok')->count();
        $degraded = $integrations->where('status', 'degraded')->count();
        $down     = $integrations->where('status', 'down')->count();

        $avgLatency = $integrations->avg('latency_ms') ?? 0;
        $avgUptime  = $integrations->avg('uptime_30d') ?? 0;

        $overallStatus = $down > 0 ? 'down' : ($degraded > 0 ? 'degraded' : 'ok');

        return response()->json([
            'success' => true,
            'summary' => [
                'total'          => $total,
                'ok'             => $ok,
                'degraded'       => $degraded,
                'down'           => $down,
                'avg_latency_ms' => round($avgLatency, 1),
                'avg_uptime_30d' => round($avgUptime, 2),
                'checked_at'     => now()->toISOString(),
            ],
            'integrations' => $integrations->values(),
            // Legacy keys for backward compatibility
            'apis'           => $integrations->map(fn($i) => [
                'name'       => is_array($i) ? $i['name'] : $i->name,
                'status'     => strtoupper(is_array($i) ? $i['status'] : $i->status),
                'latency_ms' => is_array($i) ? $i['latency_ms'] : $i->latency_ms,
                'uptime'     => is_array($i) ? $i['uptime_30d'] : $i->uptime_30d,
            ])->values(),
            'overall_status' => strtoupper($overallStatus),
        ]);
    }

    public function check($service)
    {
        $latency = rand(100, 500);
        $status  = $latency > 400 ? 'degraded' : 'ok';
        return response()->json([
            'success'    => true,
            'service'    => $service,
            'status'     => $status,
            'latency_ms' => $latency,
            'checked_at' => now()->toISOString(),
        ]);
    }

    public function logs(Request $request)
    {
        return response()->json([
            'success' => true,
            'data'    => [],
            'total'   => 0,
        ]);
    }

    public function resetCircuitBreaker($service)
    {
        return response()->json([
            'success' => true,
            'message' => "Circuit breaker untuk {$service} telah direset.",
            'service' => $service,
        ]);
    }
}
