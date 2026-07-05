<?php

namespace App\Modules\LaporanAnalitik\Models;

use Illuminate\Database\Eloquent\Model;

class OfficerAiDecision extends Model
{
    protected $table = 'officer_ai_decisions';

    protected $fillable = [
        'officer_skill_profile_id',
        'user_id',
        'case_type',
        'case_reference',
        'context_summary',
        'ai_recommendation',
        'confidence_score',
        'reasoning_bm',
        'reasoning_en',
        'factors',
        'officer_override',
        'override_reason',
    ];

    protected $casts = [
        'factors'          => 'array',
        'confidence_score' => 'decimal:2',
    ];

    public function profile()
    {
        return $this->belongsTo(OfficerSkillProfile::class, 'officer_skill_profile_id');
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
