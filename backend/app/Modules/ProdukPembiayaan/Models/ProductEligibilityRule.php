<?php

namespace App\Modules\ProdukPembiayaan\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Module 9 — Produk Pembiayaan
 * Represents a single eligibility rule for a financing product.
 */
class ProductEligibilityRule extends Model
{
    protected $table = 'product_eligibility_rules';

    protected $fillable = [
        'financing_product_id',
        'rule_code',
        'rule_name',
        'rule_name_en',
        'rule_type',
        'operator',
        'rule_value',
        'is_hard_reject',
        'rejection_message',
        'rejection_message_en',
        'is_active',
        'priority',
    ];

    protected $casts = [
        'rule_value'     => 'array',
        'is_hard_reject' => 'boolean',
        'is_active'      => 'boolean',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(FinancingProduct::class, 'financing_product_id');
    }
}
