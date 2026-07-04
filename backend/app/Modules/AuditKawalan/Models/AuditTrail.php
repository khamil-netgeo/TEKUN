<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * TEKUN SPPT — AuditTrail Model
 * Immutable audit log for all data mutations across the system (Module 11).
 * This model does NOT use the LogsAuditTrail trait (to avoid infinite recursion).
 *
 * @property int    $id
 * @property int    $user_id
 * @property string $action        create | update | delete | approve | reject | login | logout | export
 * @property string $module        module1 | module2 | ... | module12
 * @property string $model_type    App\Models\Application | etc.
 * @property int    $model_id
 * @property array  $old_values    JSON snapshot before change
 * @property array  $new_values    JSON snapshot after change
 * @property string $ip_address
 * @property string $user_agent
 */
class AuditTrail extends Model
{
    use HasFactory;

    // Audit trails are immutable — no updates allowed
    public $timestamps = true;

    protected $fillable = [
        'user_id',
        'action',
        'module',
        'auditable_type',
        'auditable_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeForModule($query, string $module)
    {
        return $query->where('module', $module);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    // ─── Static Helper ────────────────────────────────────────────────────────

    /**
     * Create an audit log entry.
     * Called by LogsAuditTrail trait and controllers.
     */
    public static function log(
        string $action,
        string $module,
        ?Model $model = null,
        ?array $oldValues = null,
        ?array $newValues = null
    ): self {
        return static::create([
            'user_id'        => auth()->id(),
            'action'         => $action,
            'module'         => $module,
            'auditable_type' => $model ? get_class($model) : null,
            'auditable_id'   => $model?->id,
            'old_values'     => $oldValues ? json_encode($oldValues) : null,
            'new_values'     => $newValues ? json_encode($newValues) : null,
            'ip_address'     => request()->ip(),
            'user_agent'     => request()->userAgent(),
        ]);
    }
}
