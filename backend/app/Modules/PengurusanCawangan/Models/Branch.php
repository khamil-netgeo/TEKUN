<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * TEKUN SPPT — Branch Model
 * Represents a TEKUN branch (cawangan).
 *
 * @property int    $id
 * @property string $code        e.g. CW-001
 * @property string $name        e.g. Cawangan KL Sentral
 * @property string $state
 * @property string $district
 * @property string $address
 * @property string $phone
 * @property string $email
 * @property string $manager_name
 * @property bool   $is_active
 */
class Branch extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'state',
        'district',
        'address',
        'phone',
        'email',
        'manager_name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function staff()
    {
        return $this->hasMany(User::class, 'branch_code', 'code');
    }

    public function applications()
    {
        return $this->hasMany(Application::class);
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

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /** Total pending applications for this branch */
    public function getPendingCountAttribute(): int
    {
        return $this->applications()->where('status', 'submitted')->count();
    }
}
