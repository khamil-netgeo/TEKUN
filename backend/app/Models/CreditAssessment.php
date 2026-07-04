<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsAuditTrail;

/**
 * TEKUN SPPT — CreditAssessment Model
 * Represents the credit scoring and assessment for an application (Module 2).
 *
 * @property int    $id
 * @property int    $application_id  FK → applications.id
 * @property int    $assessed_by     FK → users.id
 * @property int    $total_score     0-100 composite credit score
 * @property string $risk_grade      A | B | C | D | E
 * @property int    $ccris_score
 * @property int    $ctos_score
 * @property int    $income_score
 * @property int    $business_score
 * @property int    $character_score
 * @property float  $dsr             Debt Service Ratio (%)
 * @property float  $amount_approved
 * @property int    $tenure_approved months
 * @property float  $profit_rate     % per annum
 * @property string $decision        pending | approved | rejected | query
 * @property string $decision_reason
 * @property string $ai_narrative    AI-generated credit narrative in BM
 * @property string $offer_letter_path  MinIO path to generated PDF
 * @property string $offer_sent_at
 * @property string $offer_accepted_at
 * @property string $decided_at
 */
class CreditAssessment extends Model
{
    use HasFactory, LogsAuditTrail;

    protected $fillable = [
        'application_id',
        'assessed_by',
        'total_score',
        'risk_grade',
        'ccris_score',
        'ctos_score',
        'income_score',
        'business_score',
        'character_score',
        'dsr',
        'amount_approved',
        'tenure_approved',
        'profit_rate',
        'decision',
        'decision_reason',
        'ai_narrative',
        'offer_letter_path',
        'offer_sent_at',
        'offer_accepted_at',
        'decided_at',
    ];

    protected $casts = [
        'dsr'              => 'decimal:2',
        'amount_approved'  => 'decimal:2',
        'profit_rate'      => 'decimal:2',
        'offer_sent_at'    => 'datetime',
        'offer_accepted_at'=> 'datetime',
        'decided_at'       => 'datetime',
    ];

    protected $auditModule = 'module2';

    // ─── Relationships ────────────────────────────────────────────────────────

    public function application()
    {
        return $this->belongsTo(Application::class);
    }

    public function assessor()
    {
        return $this->belongsTo(User::class, 'assessed_by');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /** Risk grade label in BM */
    public function getRiskGradeLabelAttribute(): string
    {
        return match ($this->risk_grade) {
            'A' => 'Sangat Rendah',
            'B' => 'Rendah',
            'C' => 'Sederhana',
            'D' => 'Tinggi',
            'E' => 'Sangat Tinggi',
            default => 'Tidak Dinilai',
        };
    }

    /** Monthly instalment calculation (Murabahah flat rate) */
    public function getMonthlyInstalmentAttribute(): float
    {
        if (!$this->amount_approved || !$this->tenure_approved) {
            return 0.0;
        }
        $totalProfit = $this->amount_approved * ($this->profit_rate / 100) * ($this->tenure_approved / 12);
        return round(($this->amount_approved + $totalProfit) / $this->tenure_approved, 2);
    }
}
