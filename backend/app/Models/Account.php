<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsAuditTrail;

/**
 * TEKUN SPPT — Account Model
 * Represents a live financing account after disbursement (Module 4).
 *
 * @property int    $id
 * @property int    $application_id
 * @property string $account_no       e.g. TEKUN-2026-00001
 * @property string $ic_no
 * @property string $borrower_name
 * @property float  $principal
 * @property float  $profit_rate      % per annum
 * @property int    $tenure_months
 * @property float  $monthly_instalment
 * @property string $start_date
 * @property string $maturity_date
 * @property float  $outstanding_balance
 * @property float  $total_paid
 * @property float  $arrears_amount
 * @property int    $arrears_days
 * @property string $classification   lancar | perhatian_khusus | tidak_lancar | npl_substandard | npl_doubtful | npl_loss
 * @property float  $tawidh_amount    Late payment compensation (Shariah)
 * @property bool   $moratorium_active
 * @property string $moratorium_end_date
 * @property string $status           active | settled | written_off
 */
class Account extends Model
{
    use HasFactory, LogsAuditTrail;

    protected $fillable = [
        'application_id',
        'account_no',
        'ic_no',
        'borrower_name',
        'principal',
        'profit_rate',
        'tenure_months',
        'monthly_instalment',
        'start_date',
        'maturity_date',
        'outstanding_balance',
        'total_paid',
        'arrears_amount',
        'arrears_days',
        'classification',
        'tawidh_amount',
        'moratorium_active',
        'moratorium_end_date',
        'status',
    ];

    protected $casts = [
        'principal'           => 'decimal:2',
        'profit_rate'         => 'decimal:2',
        'monthly_instalment'  => 'decimal:2',
        'outstanding_balance' => 'decimal:2',
        'total_paid'          => 'decimal:2',
        'arrears_amount'      => 'decimal:2',
        'tawidh_amount'       => 'decimal:2',
        'moratorium_active'   => 'boolean',
        'start_date'          => 'date',
        'maturity_date'       => 'date',
        'moratorium_end_date' => 'date',
    ];

    protected $auditModule = 'module4';

    // ─── Relationships ────────────────────────────────────────────────────────

    public function application()
    {
        return $this->belongsTo(Application::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function nplRecords()
    {
        return $this->hasMany(NplRecord::class);
    }

    public function dunningActions()
    {
        return $this->hasMany(DunningAction::class);
    }

    public function moratoriums()
    {
        return $this->hasMany(\App\Modules\PengurusanAkaun\Models\Moratorium::class, 'account_id');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeNpl($query)
    {
        return $query->whereIn('classification', [
            'npl_substandard', 'npl_doubtful', 'npl_loss'
        ]);
    }

    public function scopeInArrears($query)
    {
        return $query->where('arrears_days', '>', 0);
    }

    public function scopeByClassification($query, string $classification)
    {
        return $query->where('classification', $classification);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /** Classification label in BM */
    public function getClassificationLabelAttribute(): string
    {
        return match ($this->classification) {
            'lancar'              => 'Lancar',
            'perhatian_khusus'    => 'Dalam Perhatian Khusus',
            'tidak_lancar'        => 'Tidak Lancar',
            'npl_substandard'     => 'NPL — Substandard',
            'npl_doubtful'        => 'NPL — Doubtful',
            'npl_loss'            => 'NPL — Loss',
            default               => $this->classification,
        };
    }

    /** Calculate Ta'widh (late payment compensation) based on BNM guidelines */
    public function calculateTawidh(): float
    {
        if ($this->arrears_days <= 0) return 0.0;
        // BNM: 1% per annum on overdue amount, max RM5,000
        $daily = $this->arrears_amount * 0.01 / 365;
        return min(round($daily * $this->arrears_days, 2), 5000.00);
    }

    /** Check if account is NPL */
    public function getIsNplAttribute(): bool
    {
        return str_starts_with($this->classification, 'npl_');
    }

    /** Repayment progress percentage */
    public function getRepaymentProgressAttribute(): float
    {
        if (!$this->principal) return 0.0;
        return round(($this->total_paid / $this->principal) * 100, 1);
    }
}
