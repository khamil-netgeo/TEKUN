<?php

namespace App\Traits;

use App\Models\AuditTrail;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

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

            $userId = Auth::id();
            $module = $this->getAuditModule();

            AuditTrail::create([
                'user_id'        => $userId,
                'auditable_type' => static::class,
                'auditable_id'   => $this->getKey() ?? 0,
                'action'         => $action,
                'module'         => $module,
                'old_values'     => !empty($oldValues) ? json_encode($oldValues) : null,
                'new_values'     => !empty($newValues) ? json_encode($newValues) : null,
                'ip_address'     => Request::ip(),
                'user_agent'     => Request::userAgent(),
                'description'    => $description,
                'severity'       => $this->getAuditSeverity($action),
            ]);
        } catch (\Throwable $e) {
            // Never let audit logging break the main operation
            \Illuminate\Support\Facades\Log::warning('Audit trail failed: ' . $e->getMessage(), [
                'model'  => static::class,
                'action' => $action,
            ]);
        }
    }

    /**
     * Get the module name for this model.
     */
    protected function getAuditModule(): string
    {
        if (property_exists($this, 'auditModule')) {
            return $this->auditModule;
        }

        // Derive from class name
        $class = class_basename(static::class);
        return $class;
    }

    /**
     * Get severity based on action.
     */
    protected function getAuditSeverity(string $action): string
    {
        return match ($action) {
            'deleted'  => 'HIGH',
            'created'  => 'LOW',
            'updated'  => 'LOW',
            default    => 'MEDIUM',
        };
    }

    /**
     * Log a custom audit event (for use in controllers/services).
     */
    public function logCustomAudit(
        string $action,
        string $description,
        array $oldValues = [],
        array $newValues = []
    ): void {
        $this->logAuditEvent($action, $oldValues, $newValues, $description);
    }
}
