<?php

namespace App\Modules\LaporanAnalitik\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class ReportTemplate extends Model
{
    use SoftDeletes;

    protected $table = 'report_templates';

    protected $fillable = [
        'created_by',
        'name',
        'report_type',
        'columns',
        'filters',
        'group_by',
        'sort_by',
        'sort_direction',
        'is_scheduled',
        'schedule_frequency',
        'schedule_email',
        'last_generated_at',
    ];

    protected $casts = [
        'columns' => 'array',
        'filters' => 'array',
        'is_scheduled' => 'boolean',
        'last_generated_at' => 'datetime',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function generatedReports()
    {
        return $this->hasMany(GeneratedReport::class, 'template_id');
    }
}
