<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsAuditTrail;

/**
 * TEKUN SPPT — NplRecord Model
 * Snapshot of NPL classification for an account (Module 5).
 *
 * @property int    $id
 * @property int    $account_id
 * @property string $classification
 * @property int    $days_overdue
 * @property float  $outstanding
 * @property string $ai_risk_level          low | medium | high | critical
 * @property float  $ai_recovery_probability 0-100%
 * @property string $ai_recommendation      AI-generated action recommendation
 */
class NplRecord extends Model
{
    use HasFactory, LogsAuditTrail;

    protected $fillable = [
        'account_id',
        'classification',
        'days_overdue',
        'outstanding',
        'ai_risk_level',
        'ai_recovery_probability',
        'ai_recommendation',
    ];

    protected $casts = [
        'outstanding'              => 'decimal:2',
        'ai_recovery_probability'  => 'decimal:2',
    ];

    protected $auditModule = 'module5';

    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    public function scopeHighRisk($query)
    {
        return $query->whereIn('ai_risk_level', ['high', 'critical']);
    }
}
