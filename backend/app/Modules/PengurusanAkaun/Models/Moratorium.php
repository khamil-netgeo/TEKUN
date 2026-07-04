<?php

namespace App\Modules\PengurusanAkaun\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsAuditTrail;

/**
 * Moratorium / Restructuring Request Model
 *
 * Tracks moratorium and loan restructuring requests submitted by officers
 * or borrowers, including AI hardship analysis and approval workflow.
 */
class Moratorium extends Model
{
    use HasFactory, LogsAuditTrail;

    protected $table = 'moratoriums';

    protected $fillable = [
        'account_id',
        'type',              // moratorium | restructuring | rescheduling
        'months_requested',
        'reason',
        'hardship_score',
        'ai_recommendation', // DISYORKAN | PERLU_SEMAKAN
        'status',            // pending | approved | rejected | active | completed
        'new_instalment',
        'new_end_date',
        'approved_by',
        'approved_at',
        'rejection_reason',
        'submitted_by',
        'submitted_at',
    ];

    protected $casts = [
        'new_instalment' => 'decimal:2',
        'hardship_score' => 'integer',
        'new_end_date'   => 'date',
        'approved_at'    => 'datetime',
        'submitted_at'   => 'datetime',
    ];

    protected $auditModule = 'module4';

    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    public function approver()
    {
        return $this->belongsTo(\App\Models\User::class, 'approved_by');
    }

    public function submitter()
    {
        return $this->belongsTo(\App\Models\User::class, 'submitted_by');
    }
}
