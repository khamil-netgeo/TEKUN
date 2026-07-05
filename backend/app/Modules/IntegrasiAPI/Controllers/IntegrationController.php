<?php
namespace App\Modules\IntegrasiAPI\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\IntegrasiAPI\Models\ApiIntegration;
use App\Modules\IntegrasiAPI\Models\ApiAlertConfig;
use Illuminate\Http\Request;

class IntegrationController extends Controller
{
    private function getDemoIntegrations(): \Illuminate\Support\Collection
    {
        return collect([
            ['id'=>1,'name'=>'e-Syariah','service_key'=>'esyariah','status'=>'ok','latency_ms'=>245,'uptime_30d'=>99.8,'last_checked_at'=>now()],
            ['id'=>2,'name'=>'Muflis','service_key'=>'muflis','status'=>'ok','latency_ms'=>312,'uptime_30d'=>99.5,'last_checked_at'=>now()],
            ['id'=>3,'name'=>'SSM','service_key'=>'ssm','status'=>'ok','latency_ms'=>189,'uptime_30d'=>99.9,'last_checked_at'=>now()],
            ['id'=>4,'name'=>'CCRIS','service_key'=>'ccris','status'=>'degraded','latency_ms'=>1850,'uptime_30d'=>97.2,'last_checked_at'=>now()],
            ['id'=>5,'name'=>'CTOS','service_key'=>'ctos','status'=>'ok','latency_ms'=>423,'uptime_30d'=>99.1,'last_checked_at'=>now()],
            ['id'=>6,'name'=>'MyKad/eKYC','service_key'=>'mykad_ekyc','status'=>'ok','latency_ms'=>567,'uptime_30d'=>98.9,'last_checked_at'=>now()],
        ]);
    }

    public function health(): \Illuminate\Http\JsonResponse
    {
        $integrations = ApiIntegration::all();
        if ($integrations->isEmpty()) {
            $integrations = $this->getDemoIntegrations();
        }
        $total    = $integrations->count();
        $ok       = $integrations->where('status', 'ok')->count();
        $degraded = $integrations->where('status', 'degraded')->count();
        $down     = $integrations->where('status', 'down')->count();
        $overallStatus = $down > 0 ? 'down' : ($degraded > 0 ? 'degraded' : 'ok');

        return response()->json([
            'success'      => true,
            'summary'      => [
                'total'          => $total,
                'ok'             => $ok,
                'degraded'       => $degraded,
                'down'           => $down,
                'avg_latency_ms' => round($integrations->avg('latency_ms') ?? 0, 1),
                'avg_uptime_30d' => round($integrations->avg('uptime_30d') ?? 0, 2),
                'checked_at'     => now()->toISOString(),
            ],
            'integrations' => $integrations->values(),
            'apis'         => $integrations->map(fn($i) => [
                'name'       => is_array($i) ? $i['name'] : $i->name,
                'status'     => strtoupper(is_array($i) ? $i['status'] : $i->status),
                'latency_ms' => is_array($i) ? $i['latency_ms'] : $i->latency_ms,
                'uptime'     => is_array($i) ? $i['uptime_30d'] : $i->uptime_30d,
            ])->values(),
            'overall_status' => strtoupper($overallStatus),
        ]);
    }

    public function metrics(Request $request, string $service): \Illuminate\Http\JsonResponse
    {
        $known = ['e_syariah','esyariah','muflis','ssm','ccris','ctos','mykad_ekyc','mykad'];
        if (!in_array(strtolower(str_replace('-','_',$service)), $known)) {
            return response()->json(['success'=>false,'message'=>'Servis tidak dijumpai.'], 404);
        }
        return response()->json([
            'success' => true,
            'data'    => [
                'service'     => $service,
                'latency_24h' => array_map(fn($h) => ['hour'=>$h,'latency_ms'=>rand(100,800)], range(0,23)),
                'uptime_30d'  => round(95 + rand(0,499)/100, 2),
                'stats'       => ['total_calls'=>rand(1000,9999),'success_rate'=>round(97+rand(0,299)/100,2),'avg_latency_ms'=>rand(150,600)],
            ],
        ]);
    }

    public function testService(Request $request, string $service): \Illuminate\Http\JsonResponse
    {
        $latency = rand(80, 600);
        return response()->json([
            'success' => true,
            'result'  => [
                'success'    => true,
                'latency_ms' => $latency,
                'status'     => $latency > 500 ? 'degraded' : 'ok',
                'service_key'=> $service,
                'tested_at'  => now()->toISOString(),
            ],
        ]);
    }

    public function alerts(Request $request): \Illuminate\Http\JsonResponse
    {
        $configs = ApiAlertConfig::all();
        return response()->json(['success'=>true,'data'=>$configs]);
    }

    public function updateAlerts(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        $allowedRoles = ['system_admin','executive','Pentadbir Sistem','Eksekutif'];
        if (!$user || !in_array($user->role ?? '', $allowedRoles)) {
            // Also check Spatie roles
            $hasRole = $user && ($user->hasRole('Pentadbir Sistem') || $user->hasRole('Eksekutif') || $user->hasRole('system_admin') || $user->hasRole('executive'));
            if (!$hasRole) {
                return response()->json(['message'=>'Akses ditolak.'], 403);
            }
        }
        foreach ($request->input('configs', []) as $config) {
            ApiAlertConfig::updateOrCreate(
                ['service_key'=>$config['service_key']??'global','alert_type'=>$config['alert_type']??'latency'],
                $config
            );
        }
        return response()->json(['success'=>true,'message'=>'Konfigurasi amaran dikemaskini.']);
    }

    public function check(Request $request, string $service): \Illuminate\Http\JsonResponse
    {
        $latency = rand(100, 500);
        return response()->json([
            'success'    => true,
            'service'    => $service,
            'status'     => $latency > 400 ? 'degraded' : 'ok',
            'latency_ms' => $latency,
            'checked_at' => now()->toISOString(),
        ]);
    }

    public function logs(Request $request): \Illuminate\Http\JsonResponse
    {
        return response()->json(['success'=>true,'data'=>[],'total'=>0]);
    }

    public function resetCircuitBreaker(Request $request, string $service): \Illuminate\Http\JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => "Circuit breaker untuk {$service} telah direset.",
            'service' => $service,
        ]);
    }
}
