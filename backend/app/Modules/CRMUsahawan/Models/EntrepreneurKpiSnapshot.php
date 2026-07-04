<?php

namespace App\Modules\CRMUsahawan\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Module 7 — CRM & Pemantauan Usahawan
 * EntrepreneurKpiSnapshot — monthly KPI time series
 */
class EntrepreneurKpiSnapshot extends Model
{
    protected $table = 'entrepreneur_kpi_snapshots';

    protected $fillable = [
        'entrepreneur_id', 'period', 'revenue', 'expenses',
        'profit', 'employee_count', 'sales_volume', 'source',
    ];

    protected $casts = [
        'revenue'        => 'decimal:2',
        'expenses'       => 'decimal:2',
        'profit'         => 'decimal:2',
        'sales_volume'   => 'decimal:2',
    ];

    public function entrepreneur()
    {
        return $this->belongsTo(Entrepreneur::class);
    }
}
