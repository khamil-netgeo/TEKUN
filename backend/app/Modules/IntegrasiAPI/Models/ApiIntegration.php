<?php

namespace App\Modules\IntegrasiAPI\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\LogsAuditTrail;

class ApiIntegration extends Model
{
    use LogsAuditTrail;

    protected $table = 'api_integrations';

    protected $fillable = [
        'service_key',
        'service_name',
        'base_url',
        'description',
        'status',
        'latency_ms',
        'uptime_30d',
        'circuit_breaker_state',
        'circuit_breaker_failures',
        'circuit_breaker_threshold',
        'circuit_breaker_opened_at',
        'last_checked_at',
        'last_success_at',
        'last_failure_at',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'uptime_30d'                  => 'decimal:2',
        'is_active'                   => 'boolean',
        'circuit_breaker_opened_at'   => 'datetime',
        'last_checked_at'             => 'datetime',
        'last_success_at'             => 'datetime',
        'last_failure_at'             => 'datetime',
    ];

    // ─── Relationships ───────────────────────────────────────────────────────

    public function healthMetrics(): HasMany
    {
        return $this->hasMany(ApiHealthMetric::class, 'api_integration_id');
    }

    public function alertConfigs(): HasMany
    {
        return $this->hasMany(ApiAlertConfig::class, 'api_integration_id');
    }

    // ─── Scopes ──────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true)->orderBy('sort_order');
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    public function isCircuitOpen(): bool
    {
        return $this->circuit_breaker_state === 'OPEN';
    }

    public function isCircuitHalfOpen(): bool
    {
        return $this->circuit_breaker_state === 'HALF_OPEN';
    }

    /**
     * Increment failure count and open circuit if threshold exceeded.
     */
    public function recordFailure(): void
    {
        $this->increment('circuit_breaker_failures');
        $this->refresh();

        if ($this->circuit_breaker_failures >= $this->circuit_breaker_threshold
            && $this->circuit_breaker_state === 'CLOSED') {
            $this->update([
                'circuit_breaker_state'     => 'OPEN',
                'circuit_breaker_opened_at' => now(),
                'status'                    => 'DOWN',
            ]);
        }
    }

    /**
     * Reset circuit breaker after successful probe.
     */
    public function recordSuccess(int $latencyMs): void
    {
        $this->update([
            'circuit_breaker_state'    => 'CLOSED',
            'circuit_breaker_failures' => 0,
            'circuit_breaker_opened_at'=> null,
            'status'                   => $latencyMs > 1000 ? 'DEGRADED' : 'OK',
            'latency_ms'               => $latencyMs,
            'last_success_at'          => now(),
            'last_checked_at'          => now(),
        ]);
    }
}
