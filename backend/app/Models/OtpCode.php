<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;

/**
 * Core Foundation Model: OtpCode
 * Manages OTP generation, validation, and expiry.
 */
class OtpCode extends Model
{
    protected $fillable = [
        'identifier',
        'channel',
        'code',
        'purpose',
        'is_used',
        'attempts',
        'expires_at',
    ];

    protected $casts = [
        'is_used'    => 'boolean',
        'expires_at' => 'datetime',
    ];

    // ── Scopes ───────────────────────────────────────────────────────────────

    public function scopeValid(Builder $query): Builder
    {
        return $query->where('is_used', false)
                     ->where('expires_at', '>', Carbon::now());
    }

    public function scopeForIdentifier(Builder $query, string $identifier, string $channel): Builder
    {
        return $query->where('identifier', $identifier)
                     ->where('channel', $channel);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isExceededAttempts(): bool
    {
        return $this->attempts >= 3;
    }

    public function incrementAttempts(): void
    {
        $this->increment('attempts');
    }

    public function markAsUsed(): void
    {
        $this->update(['is_used' => true]);
    }
}
