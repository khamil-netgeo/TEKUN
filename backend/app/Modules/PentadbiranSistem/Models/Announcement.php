<?php

namespace App\Modules\PentadbiranSistem\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;
use App\Traits\LogsAuditTrail;

/**
 * Module 12 — Pentadbiran Sistem
 * Model: Announcement
 * System-wide announcements with expiry and target roles.
 */
class Announcement extends Model
{
    use LogsAuditTrail;

    protected $table = 'announcements';

    protected $fillable = [
        'title', 'body', 'type',
        'target_roles', 'is_active',
        'published_at', 'expires_at', 'created_by',
    ];

    protected $casts = [
        'target_roles' => 'array',
        'is_active'    => 'boolean',
        'published_at' => 'datetime',
        'expires_at'   => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope: active and not expired.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now());
            });
    }
}
