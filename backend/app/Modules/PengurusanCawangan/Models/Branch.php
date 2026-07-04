<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * TEKUN SPPT — Module 8: Pengurusan Cawangan
 * Represents a TEKUN branch (cawangan).
 */
class Branch extends Model
{
    use HasFactory;
    use \App\Traits\LogsAuditTrail;

    protected $fillable = [
        'code',
        'name',
        'state',
        'district',
        'address',
        'phone',
        'email',
        'manager_name',
        'npl_ratio',
        'collection_rate',
        'staff_count',
        'performance_rank',
        'target_collection_rate',
        'monthly_target',
        'monthly_actual',
        'is_active',
    ];

    protected $casts = [
        'is_active'              => 'boolean',
        'npl_ratio'              => 'float',
        'collection_rate'        => 'float',
        'target_collection_rate' => 'float',
        'monthly_target'         => 'float',
        'monthly_actual'         => 'float',
        'staff_count'            => 'integer',
        'performance_rank'       => 'integer',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function staff(): HasMany
    {
        return $this->hasMany(User::class, 'branch_code', 'code');
    }

    public function performanceHistory(): HasMany
    {
        return $this->hasMany(BranchPerformance::class);
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByState($query, string $state)
    {
        return $query->where('state', $state);
    }
}
