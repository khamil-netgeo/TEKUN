<?php

namespace App\Modules\CRMUsahawan\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\LogsAuditTrail;
use App\Models\Branch;
use App\Models\User;

/**
 * Module 7 — CRM & Pemantauan Usahawan
 * Entrepreneur Model
 */
class Entrepreneur extends Model
{
    use SoftDeletes, LogsAuditTrail;

    protected $table = 'entrepreneurs';

    protected $fillable = [
        'ref_no', 'name', 'ic_no', 'phone', 'email',
        'address', 'district', 'state', 'race', 'gender', 'dob',
        'business_name', 'business_reg_no', 'sector', 'sub_sector',
        'business_type', 'business_start_date', 'business_address', 'business_state',
        'skim', 'total_financing', 'outstanding_balance', 'financing_status',
        'branch_id', 'assigned_officer_id',
        'monthly_revenue', 'monthly_expenses', 'employee_count', 'monthly_sales', 'kpi_updated_at',
        'health_score', 'distress_level', 'default_probability', 'ai_factors', 'ai_score_updated_at',
        'embedding_json', 'status', 'notes',
    ];

    protected $casts = [
        'dob'                   => 'date',
        'business_start_date'   => 'date',
        'ai_score_updated_at'   => 'datetime',
        'total_financing'       => 'decimal:2',
        'outstanding_balance'   => 'decimal:2',
        'monthly_revenue'       => 'decimal:2',
        'monthly_expenses'      => 'decimal:2',
        'monthly_sales'         => 'decimal:2',
        'default_probability'   => 'decimal:4',
        'ai_factors'            => 'array',
    ];

    protected $hidden = ['embedding_json', 'deleted_at'];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function assignedOfficer()
    {
        return $this->belongsTo(User::class, 'assigned_officer_id');
    }

    public function fieldVisits()
    {
        return $this->hasMany(FieldVisit::class);
    }

    public function kpiSnapshots()
    {
        return $this->hasMany(EntrepreneurKpiSnapshot::class);
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeByBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeDistressed($query)
    {
        return $query->whereIn('distress_level', ['Tinggi', 'Kritikal']);
    }

    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('name', 'ilike', "%{$term}%")
              ->orWhere('ref_no', 'ilike', "%{$term}%")
              ->orWhere('ic_no', 'like', "%{$term}%")
              ->orWhere('business_name', 'ilike', "%{$term}%");
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function getHealthBadgeAttribute(): string
    {
        if ($this->health_score >= 70) return 'Sihat';
        if ($this->health_score >= 50) return 'Sederhana';
        if ($this->health_score >= 30) return 'Lemah';
        return 'Kritikal';
    }

    public function getBusinessAgeYearsAttribute(): ?int
    {
        if (!$this->business_start_date) return null;
        return (int) $this->business_start_date->diffInYears(now());
    }
}
