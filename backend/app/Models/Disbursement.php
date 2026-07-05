<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsAuditTrail;

/**
 * TEKUN SPPT — Disbursement Model (Module 3 — Pengeluaran Dana)
 */
class Disbursement extends Model
{
    use HasFactory, LogsAuditTrail;

    protected $fillable = [
        'application_id',
        'ref_no',
        'amount',
        'bank_name',
        'bank_account_no',
        'bank_account_name',
        'bank_verified',
        'status',
        'approval_level',
        'approved_by_l1',
        'approved_by_l2',
        'approved_by_l3',
        'approved_at',
        'esign_status',
        'esign_ref',
        'esigned_at',
        'is_batch',
        'batch_ref',
        'disbursed_at',
        'payment_ref',
        'aging_days',
        'is_escalated',
        'ai_anomaly_flag',
        'ai_anomaly_reason',
        'ai_anomaly_score',
        'authority_level_required',
        'authority_label',
        'payment_file_url',
        'payment_file_format',
        'payment_file_generated_at',
        'twofa_required',
        'twofa_confirmed',
        'twofa_confirmed_at',
        'twofa_confirmed_by',
        'esign_sent_at',
        'esign_deadline',
        'esign_reminder_sent',
        'esign_ai_anomaly',
        'esign_ai_anomaly_reason',
        'sla_breach',
        'sla_breach_at',
        'escalated_to',
        'escalated_at',
        'escalation_reason',
        'notify_sent',
        'notify_sent_at',
        'notify_channel',
        'bank_confirmation_ref',
        'bank_confirmed_at',
    ];

    protected $casts = [
        'amount'                    => 'decimal:2',
        'bank_verified'             => 'boolean',
        'is_batch'                  => 'boolean',
        'is_escalated'              => 'boolean',
        'ai_anomaly_flag'           => 'boolean',
        'twofa_required'            => 'boolean',
        'twofa_confirmed'           => 'boolean',
        'esign_reminder_sent'       => 'boolean',
        'esign_ai_anomaly'          => 'boolean',
        'sla_breach'                => 'boolean',
        'notify_sent'               => 'boolean',
        'approved_at'               => 'datetime',
        'esigned_at'                => 'datetime',
        'disbursed_at'              => 'datetime',
        'esign_sent_at'             => 'datetime',
        'esign_deadline'            => 'datetime',
        'twofa_confirmed_at'        => 'datetime',
        'sla_breach_at'             => 'datetime',
        'escalated_at'              => 'datetime',
        'notify_sent_at'            => 'datetime',
        'bank_confirmed_at'         => 'datetime',
        'payment_file_generated_at' => 'datetime',
    ];

    protected $auditModule = 'module3';

    // ─── Relationships ────────────────────────────────────────────────────────

    public function application()
    {
        return $this->belongsTo(Application::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by_l1');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopePendingEsign($query)
    {
        return $query->where('esign_status', 'pending');
    }

    public function scopePendingApproval($query)
    {
        return $query->where('status', 'pending');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /** Determine authority level based on financing amount */
    public static function determineAuthority(float $amount): string
    {
        return match (true) {
            $amount <= 10000  => 'branch_officer',
            $amount <= 30000  => 'branch_manager',
            $amount <= 100000 => 'credit_committee',
            default           => 'executive',
        };
    }

    /** Get human-readable authority label */
    public static function getAuthorityLabel(string $level): string
    {
        return match ($level) {
            'branch_officer'   => 'Pegawai Cawangan',
            'branch_manager'   => 'Pengurus Cawangan',
            'credit_committee' => 'Jawatankuasa Kredit',
            'executive'        => 'Lembaga Pengarah',
            default            => $level,
        };
    }
}
