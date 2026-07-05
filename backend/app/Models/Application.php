<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\LogsAuditTrail;

/**
 * TEKUN SPPT — Application Model
 * Represents a financing application (permohonan pembiayaan).
 *
 * @property int    $id
 * @property string $ref_no          e.g. SPPT-2026-07-00001
 * @property int    $applicant_id    FK → users.id
 * @property int    $branch_id       FK → branches.id
 * @property string $scheme          tekun_micro | tekun_usahawan | tekun_wanita | tekun_belia
 * @property float  $amount_requested
 * @property string $status          draft | submitted | under_review | approved | rejected | disbursed
 * @property string $ic_no
 * @property string $full_name
 * @property string $phone
 * @property string $email
 * @property string $business_name
 * @property string $business_type
 * @property string $business_address
 * @property int    $business_age_months
 * @property float  $monthly_income
 * @property float  $monthly_expense
 * @property string $loan_purpose
 * @property bool   $is_auto_rejected
 * @property string $auto_reject_reason
 * @property string $auto_reject_narrative  AI-generated BM narrative
 * @property array  $eligibility_checks     JSON: results from 6 external APIs
 * @property string $submitted_at
 * @property string $reviewed_at
 * @property string $decided_at
 * @property int    $reviewed_by    FK → users.id
 */
class Application extends Model
{
    use HasFactory, SoftDeletes, LogsAuditTrail;

    protected $fillable = [
        'ref_no',
        'branch_id',
        'officer_id',
        'applicant_name',
        'ic_no',
        'phone',
        'email',
        'address',
        'state',
        'district',
        'scheme',
        'amount_requested',
        'tenure_months',
        'purpose',
        'sector',
        'race',
        'gender',
        'dob',
        'status',
        'priority',
        'ai_score',
        'ai_risk_grade',
        'ai_recommendation',
        'auto_rejected',
        'auto_reject_reason',
        'ccris_checked',
        'ctos_checked',
        'ssm_checked',
        'muflis_checked',
        'esyariah_checked',
        'ekyc_verified',
        'amount_approved',
        'profit_rate',
        'approved_tenure',
        'rejection_reason',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'amount_requested' => 'decimal:2',
        'amount_approved'  => 'decimal:2',
        'profit_rate'      => 'decimal:2',
        'auto_rejected'    => 'boolean',
        'ccris_checked'    => 'boolean',
        'ctos_checked'     => 'boolean',
        'ssm_checked'      => 'boolean',
        'muflis_checked'   => 'boolean',
        'esyariah_checked' => 'boolean',
        'ekyc_verified'    => 'boolean',
        'dob'              => 'date',
        'approved_at'      => 'datetime',
    ];

    protected $auditModule = 'module1';

    // ─── Relationships ────────────────────────────────────────────────────────

    public function officer()
    {
        return $this->belongsTo(User::class, 'officer_id');
    }

    /**
     * Alias for officer — used when the officer IS the applicant (usahawan self-apply).
     * The controller loads 'applicant:id,name,email,phone' in the show() method.
     */
    public function applicant()
    {
        return $this->belongsTo(User::class, 'officer_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    public function creditAssessment()
    {
        return $this->hasOne(CreditAssessment::class);
    }

    public function disbursement()
    {
        return $this->hasOne(Disbursement::class);
    }

    public function account()
    {
        return $this->hasOne(Account::class);
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    /** Filter by branch for branch-scoped roles */
    public function scopeForBranch($query, int $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    /** Only active (non-rejected, non-draft) applications */
    public function scopeActive($query)
    {
        return $query->whereNotIn('status', ['draft', 'rejected']);
    }

    /** Pending review */
    public function scopePending($query)
    {
        return $query->where('status', 'submitted');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /** Generate a unique reference number: SPPT-YYYY-MM-NNNNN */
    public static function generateRefNo(): string
    {
        $prefix = 'SPPT-' . now()->format('Y-m') . '-';
        $last   = static::withTrashed()
                        ->where('ref_no', 'like', $prefix . '%')
                        ->orderByDesc('id')
                        ->value('ref_no');

        $seq = $last ? ((int) substr($last, -5)) + 1 : 1;
        return $prefix . str_pad($seq, 5, '0', STR_PAD_LEFT);
    }

    /** Human-readable status label in BM */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'draft'        => 'Draf',
            'submitted'    => 'Dihantar',
            'under_review' => 'Dalam Semakan',
            'approved'     => 'Diluluskan',
            'rejected'     => 'Ditolak',
            'disbursed'    => 'Telah Dikeluarkan',
            default        => ucfirst($this->status),
        };
    }

    /** Check if application can be edited */
    public function isEditable(): bool
    {
        return $this->status === 'draft';
    }

    /** Scheme label in BM */
    public function getSchemeLabelAttribute(): string
    {
        return match ($this->scheme) {
            'tekun_micro'     => 'TEKUN Micro',
            'tekun_usahawan'  => 'TEKUN Usahawan',
            'tekun_wanita'    => 'TEKUN Wanita',
            'tekun_belia'     => 'TEKUN Belia',
            default           => $this->scheme,
        };
    }

    /** Scheme max amount */
    public function getSchemeMaxAmount(): int
    {
        return match ($this->scheme) {
            'tekun_micro'    => 10000,
            'tekun_usahawan' => 50000,
            'tekun_wanita'   => 30000,
            'tekun_belia'    => 20000,
            default          => 50000,
        };
    }

    /**
     * Accessor: full_name → maps to DB column 'applicant_name'
     * Ensures frontend Application type field 'full_name' is always populated.
     */
    public function getFullNameAttribute(): ?string
    {
        return $this->attributes['applicant_name'] ?? null;
    }

    /**
     * Accessor: loan_purpose → maps to DB column 'purpose'
     * Ensures frontend Application type field 'loan_purpose' is always populated.
     */
    public function getLoanPurposeAttribute(): ?string
    {
        return $this->attributes['purpose'] ?? null;
    }

    /**
     * Ensure full_name and loan_purpose are always included in JSON/array output.
     */
    protected $appends = ['status_label', 'scheme_label', 'full_name', 'loan_purpose'];
}
