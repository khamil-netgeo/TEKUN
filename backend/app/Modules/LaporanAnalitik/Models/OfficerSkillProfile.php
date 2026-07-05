<?php

namespace App\Modules\LaporanAnalitik\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\LogsAuditTrail;

class OfficerSkillProfile extends Model
{
    use SoftDeletes, LogsAuditTrail;

    protected $table = 'officer_skill_profiles';

    protected $fillable = [
        'user_id',
        'skills_description',
        'skill_tags',
        'specialisation',
        'years_experience',
        'approval_rate',
        'total_decisions',
        'persona_config',
        'is_active',
    ];

    protected $casts = [
        'skill_tags'     => 'array',
        'persona_config' => 'array',
        'is_active'      => 'boolean',
        'approval_rate'  => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function decisions()
    {
        return $this->hasMany(OfficerAiDecision::class);
    }
}
