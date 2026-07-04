<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsAuditTrail;

/**
 * TEKUN SPPT — DunningAction Model
 * Represents a dunning/collection action taken on an overdue account (Module 5).
 *
 * @property int    $id
 * @property int    $account_id
 * @property string $action_type   notis1 | notis2 | notis3 | call | legal | waiver
 * @property string $channel       sms | email | whatsapp | post
 * @property string $status        sent | delivered | responded | failed
 * @property string $notes
 * @property bool   $is_automated
 * @property int    $actioned_by   FK → users.id
 */
class DunningAction extends Model
{
    use HasFactory, LogsAuditTrail;

    protected $fillable = [
        'account_id',
        'action_type',
        'channel',
        'status',
        'notes',
        'is_automated',
        'actioned_by',
    ];

    protected $casts = [
        'is_automated' => 'boolean',
    ];

    protected $auditModule = 'module5';

    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    public function actionedBy()
    {
        return $this->belongsTo(User::class, 'actioned_by');
    }

    public function getActionTypeLabelAttribute(): string
    {
        return match ($this->action_type) {
            'notis1' => 'Notis Pertama (30 hari)',
            'notis2' => 'Notis Kedua (60 hari)',
            'notis3' => 'Notis Ketiga (90 hari)',
            'call'   => 'Panggilan Telefon',
            'legal'  => 'Tindakan Undang-undang',
            'waiver' => 'Pengecualian Penalti',
            default  => $this->action_type,
        };
    }
}
