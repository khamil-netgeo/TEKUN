<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class IntegrationController extends Controller
{
    public function health()
    {
        return response()->json([
            'apis' => [
                ['name' => 'e-Syariah', 'status' => 'OK', 'latency_ms' => 245, 'uptime' => 99.8],
                ['name' => 'Muflis', 'status' => 'OK', 'latency_ms' => 312, 'uptime' => 99.5],
                ['name' => 'SSM', 'status' => 'OK', 'latency_ms' => 189, 'uptime' => 99.9],
                ['name' => 'CCRIS', 'status' => 'DEGRADED', 'latency_ms' => 1850, 'uptime' => 97.2],
                ['name' => 'CTOS', 'status' => 'OK', 'latency_ms' => 423, 'uptime' => 99.1],
                ['name' => 'MyKad/eKYC', 'status' => 'OK', 'latency_ms' => 567, 'uptime' => 98.9],
            ],
            'overall_status' => 'DEGRADED',
            'checked_at' => now()->toISOString()
        ]);
    }

    public function check($service)
    {
        return response()->json(['service' => $service, 'status' => 'OK', 'latency_ms' => rand(100, 500)]);
    }
}
