<?php

namespace App\Modules\PengurusanNPL\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsAuditTrail;
use App\Models\Account;
use App\Models\User;

/**
 * TEKUN SPPT — CollectionTask Model (Module 5)
 *
 * Represents an AI-prioritized collection task assigned to a collection officer.
 * Each task tracks contact attempts, outcomes, and AI-generated recommendations.
 *
 * @property int    $id
 * @property int    $account_id
 * @property int    $assigned_to          FK → users.id
 * @property string $status               pending | in_progress | completed | escalated
 * @property int    $priority_score       0–100 (AI-generated)
 * @property string $ai_suggested_channel sms | email | whatsapp | call | visit
 * @property string $ai_best_contact_time HH:MM:SS
 * @property string $ai_recommendation    AI-generated action text
 * @property string $last_outcome         no_answer | promised_payment | refused | paid | rescheduled
 * @property string $outcome_notes
 * @property Carbon $last_contacted_at
 * @property Carbon $follow_up_at
 * @property int    $attempt_count
 */
class CollectionTask extends Model
{
    use HasFactory, LogsAuditTrail;

    protected $table = 'collection_tasks';

    protected $fillable = [
        'account_id',
        'assigned_to',
        'status',
        'priority_score',
        'ai_suggested_channel',
        'ai_best_contact_time',
        'ai_recommendation',
        'last_outcome',
        'outcome_notes',
        'last_contacted_at',
        'follow_up_at',
        'attempt_count',
    ];

    protected $casts = [
        'last_contacted_at' => 'datetime',
        'follow_up_at'      => 'datetime',
        'priority_score'    => 'integer',
        'attempt_count'     => 'integer',
    ];

    protected $auditModule = 'module5';

    // ── Relationships ─────────────────────────────────────────────────────────

    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeHighPriority($query)
    {
        return $query->where('priority_score', '>=', 70);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeOrderedByPriority($query)
    {
        return $query->orderByDesc('priority_score');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function getPriorityLabelAttribute(): string
    {
        return match(true) {
            $this->priority_score >= 90 => 'Kritikal',
            $this->priority_score >= 70 => 'Tinggi',
            $this->priority_score >= 50 => 'Sederhana',
            default                     => 'Rendah',
        };
    }

    public function getChannelLabelAttribute(): string
    {
        return match($this->ai_suggested_channel) {
            'sms'      => 'SMS',
            'email'    => 'E-mel',
            'whatsapp' => 'WhatsApp',
            'call'     => 'Panggilan Telefon',
            'visit'    => 'Lawatan Lapangan',
            default    => $this->ai_suggested_channel ?? '-',
        };
    }
}
