<?php

namespace App\Modules\LaporanAnalitik\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class GeneratedReport extends Model
{
    protected $table = 'generated_reports';

    protected $fillable = [
        'generated_by',
        'template_id',
        'report_ref',
        'report_name',
        'report_type',
        'columns',
        'filters',
        'date_from',
        'date_to',
        'total_records',
        'status',
        'pdf_path',
        'excel_path',
        'pdf_url',
        'excel_url',
        'completed_at',
    ];

    protected $casts = [
        'columns' => 'array',
        'filters' => 'array',
        'date_from' => 'date',
        'date_to' => 'date',
        'completed_at' => 'datetime',
    ];

    public function generator()
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    public function template()
    {
        return $this->belongsTo(ReportTemplate::class, 'template_id');
    }
}
