<?php

namespace App\Modules\IntegrasiAPI\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApiHealthMetric extends Model
{
    public $timestamps = false;

    protected $table = 'api_health_metrics';

    protected $fillable = [
        'api_integration_id',
        'latency_ms',
        'status',
        'http_status_code',
        'error_message',
        'is_success',
        'checked_at',
    ];

    protected $casts = [
        'is_success' => 'boolean',
        'checked_at' => 'datetime',
    ];

    public function integration(): BelongsTo
    {
        return $this->belongsTo(ApiIntegration::class, 'api_integration_id');
    }
}
