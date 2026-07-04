<?php

namespace App\Modules\LaporanAnalitik\Models;

use Illuminate\Database\Eloquent\Model;

class DashboardSnapshot extends Model
{
    protected $table = 'dashboard_snapshots';

    protected $fillable = [
        'snapshot_type',
        'snapshot_date',
        'total_portfolio',
        'disbursement_volume',
        'approval_rate',
        'npl_ratio',
        'collection_rate',
        'total_applications',
        'approved_applications',
        'rejected_applications',
        'pending_applications',
        'active_accounts',
        'branch_breakdown',
        'scheme_breakdown',
        'state_breakdown',
    ];

    protected $casts = [
        'snapshot_date' => 'date',
        'total_portfolio' => 'decimal:2',
        'disbursement_volume' => 'decimal:2',
        'approval_rate' => 'decimal:2',
        'npl_ratio' => 'decimal:2',
        'collection_rate' => 'decimal:2',
        'branch_breakdown' => 'array',
        'scheme_breakdown' => 'array',
        'state_breakdown' => 'array',
    ];

    public function scopeMonthly($query)
    {
        return $query->where('snapshot_type', 'monthly');
    }

    public function scopeDaily($query)
    {
        return $query->where('snapshot_type', 'daily');
    }
}
