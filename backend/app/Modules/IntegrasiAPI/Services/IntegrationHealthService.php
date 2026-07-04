<?php

namespace App\Modules\IntegrasiAPI\Services;

use App\Modules\IntegrasiAPI\Models\ApiIntegration;
use App\Modules\IntegrasiAPI\Models\ApiHealthMetric;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class IntegrationHealthService
{
    // ─── Constants ───────────────────────────────────────────────────────────

    /** Seconds before a HALF_OPEN probe is attempted after circuit opens */
    const HALF_OPEN_TIMEOUT = 30;

    /** Cache TTL for health summary (seconds) */
    const CACHE_TTL = 15;

    // ─── Simulated endpoints for demo/POC ────────────────────────────────────

    private array $simulatedEndpoints = [
        'esyariah' => ['url' => 'https://httpbin.org/delay/0', 'name' => 'e-Syariah'],
        'muflis'   => ['url' => 'https://httpbin.org/delay/0', 'name' => 'Muflis (Insolvency)'],
        'ssm'      => ['url' => 'https://httpbin.org/delay/0', 'name' => 'SSM (Suruhanjaya Syarikat)'],
        'ccris'    => ['url' => 'https://httpbin.org/delay/1', 'name' => 'CCRIS (Bank Negara)'],
        'ctos'     => ['url' => 'https://httpbin.org/delay/0', 'name' => 'CTOS (Credit Bureau)'],
        'mykad'    => ['url' => 'https://httpbin.org/delay/0', 'name' => 'MyKad / eKYC (JPN)'],
    ];

    // ─── Public Methods ───────────────────────────────────────────────────────

    /**
     * Return health summary for all 6 integrations.
     */
    public function getAllHealth(): array
    {
        return Cache::remember('api_health_all', self::CACHE_TTL, function () {
            $integrations = ApiIntegration::active()->get();
            return $integrations->map(fn($i) => $this->formatIntegration($i))->values()->toArray();
        });
    }

    /**
     * Return latency + uptime metrics for a specific service.
     */
    public function getServiceMetrics(string $serviceKey): array
    {
        $integration = ApiIntegration::where('service_key', $serviceKey)->firstOrFail();

        // Last 24 hours of latency data (hourly buckets)
        $latencyData = $this->getLatencyTimeSeries($integration->id);

        // 30-day uptime per day
        $uptimeData = $this->getUptimeTimeSeries($integration->id);

        return [
            'service'       => $this->formatIntegration($integration),
            'latency_24h'   => $latencyData,
            'uptime_30d'    => $uptimeData,
            'stats'         => [
                'avg_latency_ms'  => $this->getAvgLatency($integration->id, 24),
                'min_latency_ms'  => $this->getMinLatency($integration->id, 24),
                'max_latency_ms'  => $this->getMaxLatency($integration->id, 24),
                'uptime_30d_pct'  => (float) $integration->uptime_30d,
                'total_checks'    => ApiHealthMetric::where('api_integration_id', $integration->id)
                                        ->where('checked_at', '>=', now()->subDays(30))->count(),
                'failed_checks'   => ApiHealthMetric::where('api_integration_id', $integration->id)
                                        ->where('is_success', false)
                                        ->where('checked_at', '>=', now()->subDays(30))->count(),
            ],
        ];
    }

    /**
     * Trigger a live test call to the service.
     */
    public function testService(string $serviceKey): array
    {
        $integration = ApiIntegration::where('service_key', $serviceKey)->firstOrFail();

        // Check circuit breaker state
        if ($integration->isCircuitOpen()) {
            $openedAt = $integration->circuit_breaker_opened_at;
            $secondsOpen = $openedAt ? now()->diffInSeconds($openedAt) : 0;

            if ($secondsOpen < self::HALF_OPEN_TIMEOUT) {
                return [
                    'service_key'           => $serviceKey,
                    'circuit_breaker_state' => 'OPEN',
                    'message'               => 'Circuit breaker is OPEN. Retry in ' . (self::HALF_OPEN_TIMEOUT - $secondsOpen) . ' seconds.',
                    'success'               => false,
                    'tested_at'             => now()->toIso8601String(),
                ];
            }

            // Transition to HALF_OPEN for probe
            $integration->update(['circuit_breaker_state' => 'HALF_OPEN']);
        }

        // Perform simulated health check
        $result = $this->performHealthCheck($integration);

        // Bust cache
        Cache::forget('api_health_all');

        return array_merge($result, [
            'service_key' => $serviceKey,
            'tested_at'   => now()->toIso8601String(),
        ]);
    }

    /**
     * Reset circuit breaker for a service.
     */
    public function resetCircuitBreaker(string $serviceKey): array
    {
        $integration = ApiIntegration::where('service_key', $serviceKey)->firstOrFail();

        $integration->update([
            'circuit_breaker_state'     => 'CLOSED',
            'circuit_breaker_failures'  => 0,
            'circuit_breaker_opened_at' => null,
        ]);

        Cache::forget('api_health_all');

        return [
            'service_key'           => $serviceKey,
            'circuit_breaker_state' => 'CLOSED',
            'message'               => 'Circuit breaker reset successfully.',
            'reset_at'              => now()->toIso8601String(),
        ];
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    private function formatIntegration(ApiIntegration $i): array
    {
        return [
            'id'                        => $i->id,
            'service_key'               => $i->service_key,
            'service_name'              => $i->service_name,
            'description'               => $i->description,
            'status'                    => $i->status,
            'latency_ms'                => $i->latency_ms,
            'uptime_30d'                => (float) $i->uptime_30d,
            'circuit_breaker_state'     => $i->circuit_breaker_state,
            'circuit_breaker_failures'  => $i->circuit_breaker_failures,
            'circuit_breaker_threshold' => $i->circuit_breaker_threshold,
            'circuit_breaker_opened_at' => $i->circuit_breaker_opened_at?->toIso8601String(),
            'last_checked_at'           => $i->last_checked_at?->toIso8601String(),
            'last_success_at'           => $i->last_success_at?->toIso8601String(),
            'last_failure_at'           => $i->last_failure_at?->toIso8601String(),
            'is_active'                 => $i->is_active,
        ];
    }

    private function performHealthCheck(ApiIntegration $integration): array
    {
        $start = microtime(true);
        $success = false;
        $httpStatus = null;
        $errorMessage = null;
        $latencyMs = null;

        try {
            // Use simulated latency for POC (real URL calls would be made in production)
            $simulatedLatency = $this->getSimulatedLatency($integration->service_key);
            usleep($simulatedLatency * 1000); // simulate network delay

            $latencyMs = (int) round((microtime(true) - $start) * 1000);
            $httpStatus = 200;
            $success = true;

        } catch (\Exception $e) {
            $latencyMs = (int) round((microtime(true) - $start) * 1000);
            $errorMessage = $e->getMessage();
            $success = false;
        }

        // Persist metric
        ApiHealthMetric::create([
            'api_integration_id' => $integration->id,
            'latency_ms'         => $latencyMs,
            'status'             => $success ? ($latencyMs > 1000 ? 'DEGRADED' : 'OK') : 'ERROR',
            'http_status_code'   => $httpStatus,
            'error_message'      => $errorMessage,
            'is_success'         => $success,
            'checked_at'         => now(),
        ]);

        // Update integration state
        if ($success) {
            $integration->recordSuccess($latencyMs);
        } else {
            $integration->recordFailure();
            $integration->update([
                'last_failure_at' => now(),
                'last_checked_at' => now(),
            ]);
        }

        // Recalculate 30-day uptime
        $this->recalculateUptime($integration);

        return [
            'success'         => $success,
            'latency_ms'      => $latencyMs,
            'http_status_code'=> $httpStatus,
            'error_message'   => $errorMessage,
            'status'          => $success ? ($latencyMs > 1000 ? 'DEGRADED' : 'OK') : 'ERROR',
            'circuit_breaker_state' => $integration->fresh()->circuit_breaker_state,
        ];
    }

    private function getSimulatedLatency(string $serviceKey): int
    {
        // Realistic simulated latencies for POC
        $base = match ($serviceKey) {
            'esyariah' => 240,
            'muflis'   => 310,
            'ssm'      => 185,
            'ccris'    => 1800,  // intentionally slow
            'ctos'     => 420,
            'mykad'    => 560,
            default    => 300,
        };

        // Add ±20% jitter
        $jitter = (int) ($base * 0.2);
        return $base + rand(-$jitter, $jitter);
    }

    private function getLatencyTimeSeries(int $integrationId): array
    {
        $data = [];
        for ($h = 23; $h >= 0; $h--) {
            $hour = now()->subHours($h);
            $avg = ApiHealthMetric::where('api_integration_id', $integrationId)
                ->whereBetween('checked_at', [$hour->startOfHour()->copy(), $hour->endOfHour()->copy()])
                ->avg('latency_ms');

            $data[] = [
                'hour'       => $hour->format('H:00'),
                'latency_ms' => $avg ? (int) round($avg) : null,
                'timestamp'  => $hour->toIso8601String(),
            ];
        }
        return $data;
    }

    private function getUptimeTimeSeries(int $integrationId): array
    {
        $data = [];
        for ($d = 29; $d >= 0; $d--) {
            $day = now()->subDays($d);
            $total = ApiHealthMetric::where('api_integration_id', $integrationId)
                ->whereDate('checked_at', $day->toDateString())->count();
            $success = ApiHealthMetric::where('api_integration_id', $integrationId)
                ->whereDate('checked_at', $day->toDateString())
                ->where('is_success', true)->count();

            $data[] = [
                'date'       => $day->format('d/m'),
                'uptime_pct' => $total > 0 ? round(($success / $total) * 100, 1) : null,
                'timestamp'  => $day->toDateString(),
            ];
        }
        return $data;
    }

    private function getAvgLatency(int $integrationId, int $hours): ?int
    {
        $avg = ApiHealthMetric::where('api_integration_id', $integrationId)
            ->where('checked_at', '>=', now()->subHours($hours))
            ->where('is_success', true)
            ->avg('latency_ms');
        return $avg ? (int) round($avg) : null;
    }

    private function getMinLatency(int $integrationId, int $hours): ?int
    {
        return ApiHealthMetric::where('api_integration_id', $integrationId)
            ->where('checked_at', '>=', now()->subHours($hours))
            ->where('is_success', true)
            ->min('latency_ms');
    }

    private function getMaxLatency(int $integrationId, int $hours): ?int
    {
        return ApiHealthMetric::where('api_integration_id', $integrationId)
            ->where('checked_at', '>=', now()->subHours($hours))
            ->where('is_success', true)
            ->max('latency_ms');
    }

    private function recalculateUptime(ApiIntegration $integration): void
    {
        $total = ApiHealthMetric::where('api_integration_id', $integration->id)
            ->where('checked_at', '>=', now()->subDays(30))->count();
        $success = ApiHealthMetric::where('api_integration_id', $integration->id)
            ->where('checked_at', '>=', now()->subDays(30))
            ->where('is_success', true)->count();

        if ($total > 0) {
            $integration->update(['uptime_30d' => round(($success / $total) * 100, 2)]);
        }
    }
}
