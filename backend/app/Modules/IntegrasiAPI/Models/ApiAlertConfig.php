<?php

namespace App\Modules\IntegrasiAPI\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\LogsAuditTrail;

class ApiAlertConfig extends Model
{
    use LogsAuditTrail;

    protected $table = 'api_alert_configs';

    protected $fillable = [
        'api_integration_id',
        'alert_type',
        'latency_threshold_ms',
        'downtime_threshold_minutes',
        'error_rate_threshold',
        'notify_email',
        'notify_sms',
        'notify_email_addresses',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'notify_email'       => 'boolean',
        'notify_sms'         => 'boolean',
        'is_active'          => 'boolean',
        'error_rate_threshold' => 'decimal:2',
    ];

    public function integration(): BelongsTo
    {
        return $this->belongsTo(ApiIntegration::class, 'api_integration_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }
}
