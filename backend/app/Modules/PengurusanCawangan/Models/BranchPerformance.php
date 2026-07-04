<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * TEKUN SPPT — Branch Monthly Performance Record
 */
class BranchPerformance extends Model
{
    protected $table = 'branch_performance';

    protected $fillable = [
        'branch_id', 'period', 'target_amount', 'actual_amount',
        'collection_rate', 'npl_ratio', 'new_applications',
        'approved_applications', 'rejected_applications', 'performance_rank',
    ];

    protected $casts = [
        'target_amount'  => 'float',
        'actual_amount'  => 'float',
        'collection_rate'=> 'float',
        'npl_ratio'      => 'float',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function getAchievementPercentAttribute(): float
    {
        if ($this->target_amount <= 0) return 0;
        return round(($this->actual_amount / $this->target_amount) * 100, 1);
    }
}
