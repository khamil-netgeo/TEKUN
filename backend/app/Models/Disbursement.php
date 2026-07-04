<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsAuditTrail;

/**
 * TEKUN SPPT — Disbursement Model
 * Represents the fund disbursement record for an approved application (Module 3).
 *
 * @property int    $id
 * @property int    $application_id  FK → applications.id
 * @property string $ref_no          Disbursement reference
 * @property float  $amount
 * @property string $bank_name
 * @property string $bank_account_no
 * @property string $bank_account_name
 * @property bool   $bank_verified
 * @property string $esign_status    pending | signed | rejected
 * @property string $esign_doc_path  MinIO path to e-signed agreement
 * @property string $esign_signed_at
 * @property string $payment_status  pending | processed | failed
 * @property string $payment_ref
 * @property string $payment_channel ibg | duitnow | rtgs
 * @property string $payment_date
 * @property string $authority_level pegawai | pengurus | kredit | eksekutif
 * @property int    $approved_by     FK → users.id
 * @property string $approved_at
 * @property string $disbursed_at
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
        'esign_status',
        'esign_doc_path',
        'esign_signed_at',
        'payment_status',
        'payment_ref',
        'payment_channel',
        'payment_date',
        'authority_level',
        'approved_by',
        'approved_at',
        'disbursed_at',
    ];

    protected $casts = [
        'amount'          => 'decimal:2',
        'bank_verified'   => 'boolean',
        'esign_signed_at' => 'datetime',
        'approved_at'     => 'datetime',
        'disbursed_at'    => 'datetime',
    ];

    protected $auditModule = 'module3';

    // ─── Relationships ────────────────────────────────────────────────────────

    public function application()
    {
        return $this->belongsTo(Application::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopePendingEsign($query)
    {
        return $query->where('esign_status', 'pending');
    }

    public function scopePendingPayment($query)
    {
        return $query->where('payment_status', 'pending');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /** Determine authority level based on amount */
    public static function determineAuthority(float $amount): string
    {
        return match (true) {
            $amount <= 10000  => 'branch_officer',
            $amount <= 30000  => 'branch_manager',
            $amount <= 100000 => 'credit_officer',
            default           => 'executive',
        };
    }
}
