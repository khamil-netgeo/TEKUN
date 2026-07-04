<?php

namespace App\Traits;

use App\Models\AuditTrail;
use Illuminate\Database\Eloquent\Model;

/**
 * TEKUN SPPT — LogsAuditTrail Trait
 *
 * Automatically logs all create, update, and delete operations
 * to the audit_trails table. Attach this trait to any Eloquent Model
 * that requires immutable audit logging.
 *
 * Usage:
 *   class Application extends Model {
 *       use LogsAuditTrail;
 *       protected $auditModule = 'module1'; // optional, defaults to 'system'
 *   }
 *
 * Each model can define $auditExclude to skip sensitive fields:
 *   protected $auditExclude = ['password', 'remember_token'];
 *
 * Tender requirement: SRS-AUD-001 — Immutable Audit Trail
 * "Every data mutation must be traceable with before/after values,
 *  user identity, timestamp, IP address, and module context."
 */
trait LogsAuditTrail
{
    /**
     * Boot the trait — register Eloquent event listeners.
     */
    public static function bootLogsAuditTrail(): void
    {
        // ── CREATE ────────────────────────────────────────────────────────────
        static::created(function (Model $model) {
            static::writeAuditLog($model, 'create', null, $model->getAuditableAttributes());
        });

        // ── UPDATE ────────────────────────────────────────────────────────────
        static::updating(function (Model $model) {
            // Capture old values BEFORE the update is committed
            $model->_auditOldValues = $model->getOriginal();
        });

        static::updated(function (Model $model) {
            $old = $model->_auditOldValues ?? [];
            $new = $model->getChanges();

            // Filter out excluded fields and timestamps
            $old = static::filterAuditFields($model, $old);
            $new = static::filterAuditFields($model, $new);

            if (!empty($new)) {
                static::writeAuditLog($model, 'update', $old, $new);
            }
        });

        // ── DELETE ────────────────────────────────────────────────────────────
        static::deleted(function (Model $model) {
            static::writeAuditLog($model, 'delete', $model->getAuditableAttributes(), null);
        });
    }

    /**
     * Write a single audit log entry.
     */
    protected static function writeAuditLog(
        Model   $model,
        string  $action,
        ?array  $oldValues,
        ?array  $newValues
    ): void {
        // Skip logging during seeding or CLI commands without auth
        if (app()->runningInConsole() && !auth()->check()) {
            return;
        }

        try {
            AuditTrail::create([
                'user_id'    => auth()->id(),
                'action'     => $action,
                'module'     => $model->auditModule ?? 'system',
                'model_type' => get_class($model),
                'model_id'   => $model->getKey(),
                'old_values' => $oldValues,
                'new_values' => $newValues,
                'ip_address' => request()?->ip(),
                'user_agent' => request()?->userAgent(),
            ]);
        } catch (\Throwable $e) {
            // Never let audit logging failure break the main operation
            \Illuminate\Support\Facades\Log::warning('AuditTrail write failed: ' . $e->getMessage());
        }
    }

    /**
     * Get all auditable attributes (excluding sensitive/excluded fields).
     */
    protected function getAuditableAttributes(): array
    {
        $attributes = $this->getAttributes();
        return static::filterAuditFields($this, $attributes);
    }

    /**
     * Remove excluded fields and standard timestamps from audit data.
     */
    protected static function filterAuditFields(Model $model, array $data): array
    {
        $exclude = array_merge(
            ['updated_at', 'created_at', 'remember_token', '_auditOldValues'],
            $model->auditExclude ?? []
        );

        return array_diff_key($data, array_flip($exclude));
    }

    /**
     * Temporary storage for old values during update cycle.
     * This is a runtime-only property (not persisted).
     */
    public array $_auditOldValues = [];

    /**
     * Manually log a custom action (e.g., 'approve', 'reject', 'export').
     * Call from controllers for business-level events.
     *
     * Example:
     *   $application->logAction('approve', ['status' => 'submitted'], ['status' => 'approved']);
     */
    public function logAction(string $action, ?array $oldValues = null, ?array $newValues = null): void
    {
        static::writeAuditLog($this, $action, $oldValues, $newValues);
    }
}
