<?php

namespace App\Modules\CRMUsahawan\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\LogsAuditTrail;
use App\Models\User;
use App\Models\Branch;

/**
 * Module 7 — CRM & Pemantauan Usahawan
 * FieldVisit Model
 */
class FieldVisit extends Model
{
    use SoftDeletes, LogsAuditTrail;

    protected $table = 'field_visits';

    protected $fillable = [
        'ref_no', 'entrepreneur_id', 'officer_id', 'branch_id',
        'scheduled_date', 'scheduled_time', 'purpose', 'status',
        'checklist_items', 'actual_date', 'actual_time',
        'visit_notes', 'ai_report', 'ai_report_model', 'ai_report_generated_at',
        'reported_revenue', 'reported_expenses', 'reported_employees',
        'business_condition', 'gps_lat', 'gps_lng',
    ];

    protected $casts = [
        'scheduled_date'          => 'date',
        'actual_date'             => 'date',
        'ai_report_generated_at'  => 'datetime',
        'checklist_items'         => 'array',
        'reported_revenue'        => 'decimal:2',
        'reported_expenses'       => 'decimal:2',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function entrepreneur()
    {
        return $this->belongsTo(Entrepreneur::class);
    }

    public function officer()
    {
        return $this->belongsTo(User::class, 'officer_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function isCompleted(): bool
    {
        return $this->status === 'Selesai';
    }

    public function hasAiReport(): bool
    {
        return !empty($this->ai_report);
    }
}
