<?php

namespace App\Traits;

use App\Models\AuditTrail;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

/**
 * Core Foundation Trait: LogsAuditTrail
 *
 * Auto-logs create/update/delete events to the audit_trails table.
 * Use this trait in any Eloquent model that requires audit logging.
 *
 * Usage:
 *   use App\Traits\LogsAuditTrail;
 *   class Application extends Model {
 *       use LogsAuditTrail;
 *   }
 *
 * Columns logged: user_id, action, auditable_type, auditable_id,
 *                 old_values, new_values, ip_address, user_agent, description.
 */
trait LogsAuditTrail
{
    /**
     * Boot the trait — register Eloquent model event listeners.
     */
    public static function bootLogsAuditTrail(): void
    {
        static::created(function ($model) {
            $model->logAuditEvent('created', [], $model->getAttributes());
        });

        static::updated(function ($model) {
            $model->logAuditEvent(
                'updated',
                $model->getOriginal(),
                $model->getChanges()
            );
        });

        static::deleted(function ($model) {
            $model->logAuditEvent('deleted', $model->getAttributes(), []);
        });
    }

    /**
     * Write an audit trail record.
     *
     * @param string $action     'created' | 'updated' | 'deleted' | custom string
     * @param array  $oldValues  State before the change
     * @param array  $newValues  State after the change
     * @param string|null $description  Optional human-readable description
     */
    public function logAuditEvent(
        string $action,
        array $oldValues = [],
        array $newValues = [],
        ?string $description = null
    ): void {
        try {
            // Remove sensitive fields from logs
            $sensitiveFields = ['password', 'remember_token', 'token', 'secret'];
            $oldValues = array_diff_key($oldValues, array_flip($sensitiveFields));
            $newValues = array_diff_key($newValues, array_flip($sensitiveFields));

            AuditTrail::create([
                'user_id'        => Auth::id(),
                'action'         => $action,
                'auditable_type' => get_class($this),
                'auditable_id'   => $this->getKey(),
                'old_values'     => empty($oldValues) ? null : $oldValues,
                'new_values'     => empty($newValues) ? null : $newValues,
                'ip_address'     => Request::ip(),
                'user_agent'     => Request::userAgent(),
                'description'    => $description ?? $this->buildDescription($action),
            ]);
        } catch (\Exception $e) {
            // Never let audit logging break the main operation
            \Illuminate\Support\Facades\Log::error('AuditTrail log failed', [
                'model'  => get_class($this),
                'action' => $action,
                'error'  => $e->getMessage(),
            ]);
        }
    }

    /**
     * Build a human-readable description for the audit event.
     */
    private function buildDescription(string $action): string
    {
        $modelName = class_basename($this);
        $id        = $this->getKey();
        $userName  = Auth::user()?->name ?? 'System';

        return match ($action) {
            'created' => "{$userName} mencipta rekod {$modelName} #{$id}.",
            'updated' => "{$userName} mengemaskini rekod {$modelName} #{$id}.",
            'deleted' => "{$userName} memadam rekod {$modelName} #{$id}.",
            default   => "{$userName} melakukan tindakan '{$action}' pada {$modelName} #{$id}.",
        };
    }

    /**
     * Manually log a custom action (for use in controllers/services).
     * Example: $application->logCustomAction('submitted', 'Permohonan dihantar untuk semakan.');
     */
    public function logCustomAction(string $action, string $description, array $context = []): void
    {
        $this->logAuditEvent($action, [], $context, $description);
    }
}
