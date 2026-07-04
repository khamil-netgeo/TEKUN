<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * TEKUN SPPT — Module 8: Pengurusan Cawangan
 * BranchPerformance model for monthly performance history.
 */
class BranchPerformance extends Model
{
    protected $table = 'branch_performance';

    protected $fillable = [
        'branch_id',
        'period',
        'collection_rate',
        'npl_ratio',
        'disbursement_amount',
        'applications_received',
        'applications_approved',
        'applications_rejected',
        'target_collection_rate',
        'target_disbursement',
        'performance_rank',
    ];

    protected $casts = [
        'collection_rate'        => 'float',
        'npl_ratio'              => 'float',
        'disbursement_amount'    => 'float',
        'target_collection_rate' => 'float',
        'target_disbursement'    => 'float',
        'performance_rank'       => 'integer',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
