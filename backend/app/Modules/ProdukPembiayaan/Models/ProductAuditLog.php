<?php

namespace App\Modules\ProdukPembiayaan\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Module 9 — Produk Pembiayaan
 * Immutable audit log for product configuration changes.
 */
class ProductAuditLog extends Model
{
    protected $table = 'product_audit_logs';

    public $timestamps = false; // uses created_at only

    protected $fillable = [
        'financing_product_id',
        'user_id',
        'action',
        'before',
        'after',
        'ip_address',
        'user_agent',
        'notes',
        'created_at',
    ];

    protected $casts = [
        'before'     => 'array',
        'after'      => 'array',
        'created_at' => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(FinancingProduct::class, 'financing_product_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }
}
