<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsAuditTrail;

/**
 * TEKUN SPPT — Payment Model
 * Represents a payment transaction on a financing account (Module 4).
 *
 * @property int    $id
 * @property int    $account_id       FK → accounts.id
 * @property string $receipt_no
 * @property float  $amount
 * @property float  $principal_portion
 * @property float  $profit_portion
 * @property float  $tawidh_portion
 * @property string $channel          fpx | duitnow | counter | auto_debit | cheque
 * @property string $status           pending | success | failed | reversed
 * @property string $transaction_ref
 * @property string $payment_date
 * @property int    $recorded_by      FK → users.id
 */
class Payment extends Model
{
    use HasFactory, LogsAuditTrail;

    protected $fillable = [
        'account_id',
        'receipt_no',
        'amount',
        'principal_portion',
        'profit_portion',
        'tawidh_portion',
        'channel',
        'status',
        'transaction_ref',
        'payment_date',
        'recorded_by',
    ];

    protected $casts = [
        'amount'            => 'decimal:2',
        'principal_portion' => 'decimal:2',
        'profit_portion'    => 'decimal:2',
        'tawidh_portion'    => 'decimal:2',
        'payment_date'      => 'date',
    ];

    protected $auditModule = 'module4';

    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function scopeSuccessful($query)
    {
        return $query->where('status', 'success');
    }

    public function getChannelLabelAttribute(): string
    {
        return match ($this->channel) {
            'fpx'         => 'FPX Online',
            'duitnow'     => 'DuitNow',
            'counter'     => 'Kaunter TEKUN',
            'auto_debit'  => 'Autodebit',
            'cheque'      => 'Cek',
            default       => $this->channel,
        };
    }
}
