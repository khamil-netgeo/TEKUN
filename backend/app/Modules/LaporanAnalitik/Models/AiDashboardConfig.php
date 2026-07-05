<?php

namespace App\Modules\LaporanAnalitik\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AiDashboardConfig extends Model
{
    use SoftDeletes;

    protected $table = 'ai_dashboard_configs';

    protected $fillable = [
        'user_id',
        'name',
        'prompt',
        'widget_config',
        'status',
        'use_count',
        'last_used_at',
    ];

    protected $casts = [
        'widget_config' => 'array',
        'last_used_at'  => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
