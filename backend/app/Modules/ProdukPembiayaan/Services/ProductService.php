<?php

namespace App\Modules\ProdukPembiayaan\Services;

use App\Modules\ProdukPembiayaan\Models\FinancingProduct;
use App\Modules\ProdukPembiayaan\Models\ProductAuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

/**
 * Module 9 — Produk Pembiayaan
 * Business logic for financing product configuration management.
 */
class ProductService
{
    /**
     * List all financing products with optional filters.
     */
    public function listProducts(array $filters = []): array
    {
        $query = FinancingProduct::with('eligibilityRules')->ordered();

        if (isset($filters['is_active'])) {
            $query->where('is_active', (bool) $filters['is_active']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('code', 'ilike', "%{$search}%");
            });
        }

        $perPage  = (int) ($filters['per_page'] ?? 20);
        $products = $query->get();

        return [
            'success' => true,
            'data'    => $products->map(fn($p) => $this->formatProduct($p))->values()->toArray(),
            'meta'    => [
                'total'  => $products->count(),
                'active' => $products->where('is_active', true)->count(),
            ],
        ];
    }

    /**
     * Get a single product by ID with eligibility rules.
     */
    public function getProduct(int $id): ?array
    {
        $product = FinancingProduct::with(['eligibilityRules', 'auditLogs' => fn($q) => $q->limit(10)])->find($id);
        if (!$product) {
            return null;
        }
        return $this->formatProduct($product, true);
    }

    /**
     * Update product configuration and log the change.
     */
    public function updateProduct(FinancingProduct $product, array $data, ?int $userId = null): FinancingProduct
    {
        $before = $product->toArray();

        // Only allow configurable fields to be updated
        $allowed = [
            'name', 'name_en', 'description', 'description_en',
            'min_amount', 'max_amount', 'profit_rate',
            'min_tenure_months', 'max_tenure_months',
            'processing_fee_type', 'processing_fee_value',
            'min_age', 'max_age', 'min_business_age_months',
            'eligible_sectors', 'eligible_genders', 'eligible_races',
            'requires_ssm_registration', 'requires_business_premises',
            'blacklist_check_required', 'ccris_check_required',
            'ctos_check_required', 'muflis_check_required', 'esyariah_check_required',
            'required_documents', 'color_hex', 'display_order',
        ];

        $filtered = array_intersect_key($data, array_flip($allowed));
        $filtered['last_updated_by'] = $userId ?? Auth::id();

        $product->update($filtered);
        $product->refresh();

        // Write product-specific audit log
        ProductAuditLog::create([
            'financing_product_id' => $product->id,
            'user_id'              => $userId ?? Auth::id(),
            'action'               => 'updated',
            'before'               => $before,
            'after'                => $product->toArray(),
            'notes'                => $data['notes'] ?? null,
        ]);

        return $product;
    }

    /**
     * Activate or deactivate a product and log the change.
     */
    public function toggleActivation(FinancingProduct $product, bool $activate, ?string $notes = null, ?int $userId = null): FinancingProduct
    {
        $before = $product->toArray();
        $uid    = $userId ?? Auth::id();

        if ($activate) {
            $product->update([
                'is_active'      => true,
                'activated_at'   => now(),
                'activated_by'   => $uid,
                'deactivated_at' => null,
                'deactivated_by' => null,
            ]);
            $action = 'activated';
        } else {
            $product->update([
                'is_active'      => false,
                'deactivated_at' => now(),
                'deactivated_by' => $uid,
            ]);
            $action = 'deactivated';
        }

        $product->refresh();

        ProductAuditLog::create([
            'financing_product_id' => $product->id,
            'user_id'              => $uid,
            'action'               => $action,
            'before'               => $before,
            'after'                => $product->toArray(),
            'notes'                => $notes,
        ]);

        return $product;
    }

    /**
     * Get audit logs for a product.
     */
    public function getAuditLogs(int $id): array
    {
        $product = FinancingProduct::find($id);
        if (!$product) {
            return [];
        }

        return $product->auditLogs()
            ->with('user:id,name,email')
            ->limit(50)
            ->get()
            ->map(fn($log) => [
                'id'         => $log->id,
                'action'     => $log->action,
                'user'       => $log->user ? ['id' => $log->user->id, 'name' => $log->user->name] : null,
                'notes'      => $log->notes,
                'created_at' => $log->created_at?->toIso8601String(),
            ])
            ->toArray();
    }

    /**
     * Format a product for API response.
     */
    private function formatProduct(FinancingProduct $product, bool $withDetails = false): array
    {
        $base = [
            'id'                   => $product->id,
            'code'                 => $product->code,
            'name'                 => $product->name,
            'name_en'              => $product->name_en,
            'description'          => $product->description,
            'min_amount'           => (float) $product->min_amount,
            'max_amount'           => (float) $product->max_amount,
            'amount_range'         => $product->amount_range,
            'profit_rate'          => (float) $product->profit_rate,
            'min_tenure_months'    => $product->min_tenure_months,
            'max_tenure_months'    => $product->max_tenure_months,
            'min_age'              => $product->min_age,
            'max_age'              => $product->max_age,
            'is_active'            => $product->is_active,
            'status_label'         => $product->status_label,
            'color_hex'            => $product->color_hex,
            'display_order'        => $product->display_order,
            'required_documents'   => $product->required_documents ?? [],
            'eligible_sectors'     => $product->eligible_sectors ?? [],
            'eligible_genders'     => $product->eligible_genders ?? [],
            'updated_at'           => $product->updated_at?->toIso8601String(),
        ];

        if ($withDetails) {
            $base['eligibility_rules'] = $product->eligibilityRules->map(fn($r) => [
                'id'               => $r->id,
                'rule_code'        => $r->rule_code,
                'rule_name'        => $r->rule_name,
                'rule_type'        => $r->rule_type,
                'operator'         => $r->operator,
                'rule_value'       => $r->rule_value,
                'is_hard_reject'   => $r->is_hard_reject,
                'is_active'        => $r->is_active,
                'priority'         => $r->priority,
            ])->toArray();

            $base['processing_fee_type']  = $product->processing_fee_type;
            $base['processing_fee_value'] = (float) $product->processing_fee_value;
            $base['blacklist_check_required'] = $product->blacklist_check_required;
            $base['ccris_check_required']     = $product->ccris_check_required;
            $base['ctos_check_required']      = $product->ctos_check_required;
            $base['muflis_check_required']    = $product->muflis_check_required;
            $base['activated_at']             = $product->activated_at?->toIso8601String();
            $base['deactivated_at']           = $product->deactivated_at?->toIso8601String();
        }

        return $base;
    }
}
