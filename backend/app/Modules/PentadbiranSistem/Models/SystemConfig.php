<?php

namespace App\Modules\PentadbiranSistem\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsAuditTrail;

/**
 * Module 12 — Pentadbiran Sistem
 * Model: SystemConfig
 * Stores system-wide key-value configuration parameters.
 */
class SystemConfig extends Model
{
    use LogsAuditTrail;

    protected $table = 'system_configs';

    protected $fillable = [
        'key', 'value', 'type', 'group',
        'label', 'description',
        'is_sensitive', 'is_readonly',
    ];

    protected $casts = [
        'is_sensitive' => 'boolean',
        'is_readonly'  => 'boolean',
    ];

    /**
     * Return masked value for sensitive configs in API responses.
     */
    public function getMaskedValueAttribute(): ?string
    {
        if ($this->is_sensitive && $this->value) {
            return '••••••••';
        }
        return $this->value;
    }

    /**
     * Get typed value (cast to correct PHP type).
     */
    public function getTypedValueAttribute(): mixed
    {
        return match ($this->type) {
            'boolean' => filter_var($this->value, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $this->value,
            'json'    => json_decode($this->value, true),
            default   => $this->value,
        };
    }

    /**
     * Scope by group.
     */
    public function scopeGroup($query, string $group)
    {
        return $query->where('group', $group);
    }
}
