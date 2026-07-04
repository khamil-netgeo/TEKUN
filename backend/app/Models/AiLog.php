<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * TEKUN SPPT — AiLog Model
 * Logs all AI/LLM interactions for audit, cost tracking, and debugging.
 *
 * @property int    $id
 * @property int    $user_id
 * @property string $module        module1 | module2 | chatbot | fraud | etc.
 * @property string $action        credit_score | document_check | chatbot_query | etc.
 * @property string $prompt
 * @property string $response
 * @property string $model_used    e.g. SPPT-AI
 * @property int    $tokens_used
 * @property int    $latency_ms
 * @property bool   $success
 * @property string $error_message
 */
class AiLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'module',
        'action',
        'prompt',
        'response',
        'model_used',
        'tokens_used',
        'latency_ms',
        'success',
        'error_message',
    ];

    protected $casts = [
        'success' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeSuccessful($query)
    {
        return $query->where('success', true);
    }

    public function scopeForModule($query, string $module)
    {
        return $query->where('module', $module);
    }

    /** Total tokens used today */
    public static function tokensToday(): int
    {
        return static::whereDate('created_at', today())->sum('tokens_used');
    }
}
