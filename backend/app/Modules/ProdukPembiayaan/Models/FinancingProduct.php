<?php

namespace App\Modules\ProdukPembiayaan\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\LogsAuditTrail;

/**
 * Module 9 — Produk Pembiayaan
 * Represents a TEKUN financing scheme (Micro, Usahawan, Wanita, Belia).
 */
class FinancingProduct extends Model
{
    use HasFactory;
    use SoftDeletes, LogsAuditTrail;

    protected $table = 'financing_products';

    protected $fillable = [
        'code',
        'name',
        'name_en',
        'description',
        'description_en',
        'min_amount',
        'max_amount',
        'profit_rate',
        'min_tenure_months',
        'max_tenure_months',
        'processing_fee_type',
        'processing_fee_value',
        'min_age',
        'max_age',
        'min_business_age_months',
        'eligible_sectors',
        'eligible_genders',
        'eligible_races',
        'requires_ssm_registration',
        'requires_business_premises',
        'blacklist_check_required',
        'ccris_check_required',
        'ctos_check_required',
        'muflis_check_required',
        'esyariah_check_required',
        'required_documents',
        'is_active',
        'activated_at',
        'deactivated_at',
        'activated_by',
        'deactivated_by',
        'last_updated_by',
        'color_hex',
        'display_order',
    ];

    protected $casts = [
        'eligible_sectors'            => 'array',
        'eligible_genders'            => 'array',
        'eligible_races'              => 'array',
        'required_documents'          => 'array',
        'is_active'                   => 'boolean',
        'requires_ssm_registration'   => 'boolean',
        'requires_business_premises'  => 'boolean',
        'blacklist_check_required'    => 'boolean',
        'ccris_check_required'        => 'boolean',
        'ctos_check_required'         => 'boolean',
        'muflis_check_required'       => 'boolean',
        'esyariah_check_required'     => 'boolean',
        'min_amount'                  => 'decimal:2',
        'max_amount'                  => 'decimal:2',
        'profit_rate'                 => 'decimal:2',
        'processing_fee_value'        => 'decimal:2',
        'activated_at'                => 'datetime',
        'deactivated_at'              => 'datetime',
    ];

    // ── Relationships ──────────────────────────────────────────────────────────

    public function eligibilityRules(): HasMany
    {
        return $this->hasMany(ProductEligibilityRule::class, 'financing_product_id')
                    ->orderBy('priority');
    }

    public function activeRules(): HasMany
    {
        return $this->hasMany(ProductEligibilityRule::class, 'financing_product_id')
                    ->where('is_active', true)
                    ->orderBy('priority');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(ProductAuditLog::class, 'financing_product_id')
                    ->orderByDesc('created_at');
    }

    public function activatedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'activated_by');
    }

    public function deactivatedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'deactivated_by');
    }

    public function lastUpdatedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'last_updated_by');
    }

    // ── Scopes ─────────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('display_order')->orderBy('code');
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    public function getAmountRangeAttribute(): string
    {
        return 'RM ' . number_format($this->min_amount) . ' – RM ' . number_format($this->max_amount);
    }

    public function getStatusLabelAttribute(): string
    {
        return $this->is_active ? 'Aktif' : 'Tidak Aktif';
    }
}
