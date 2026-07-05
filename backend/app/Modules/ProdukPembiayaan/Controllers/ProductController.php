<?php

namespace App\Modules\ProdukPembiayaan\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ProdukPembiayaan\Models\FinancingProduct;
use App\Modules\ProdukPembiayaan\Models\ProductAuditLog;
use App\Modules\ProdukPembiayaan\Services\ProductService;
use App\Modules\ProdukPembiayaan\Services\EligibilityCheckerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * Module 9 — Produk Pembiayaan
 * Handles all financing product configuration API endpoints.
 *
 * Routes (auto-loaded from app/Modules/ProdukPembiayaan/Routes/api.php):
 *   GET    /api/products
 *   GET    /api/products/{id}
 *   PUT    /api/products/{id}
 *   POST   /api/products/{id}/activate
 *   GET    /api/products/{id}/eligibility-check
 *   GET    /api/products/eligibility-check-all
 *   GET    /api/products/{id}/audit-logs
 */
class ProductController extends Controller
{
    public function __construct(
        private readonly ProductService           $productService,
        private readonly EligibilityCheckerService $eligibilityService,
    ) {}

    // ── GET /api/products ─────────────────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = FinancingProduct::withCount(['eligibilityRules as rules_count'])
            ->ordered();

        if ($request->boolean('active_only')) {
            $query->active();
        }

        $products = $query->get()->map(fn($p) => $this->formatProduct($p));

        return response()->json([
            'data' => $products,
            'meta' => [
                'total'    => $products->count(),
                'active'   => $products->where('is_active', true)->count(),
                'inactive' => $products->where('is_active', false)->count(),
            ],
        ]);
    }

    // ── GET /api/products/{id} ────────────────────────────────────────────────
    public function show(int $id): JsonResponse
    {
        $product = FinancingProduct::with(['eligibilityRules', 'auditLogs' => fn($q) => $q->limit(5)])
            ->withCount(['eligibilityRules as rules_count'])
            ->findOrFail($id);

        return response()->json([
            'data' => $this->formatProduct($product, includeRelations: true),
        ]);
    }

    // ── PUT /api/products/{id} ────────────────────────────────────────────────
    public function update(Request $request, int $id): JsonResponse
    {
        $product = FinancingProduct::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'profit_rate'             => 'sometimes|numeric|min:0|max:100',
            'min_amount'              => 'sometimes|numeric|min:0',
            'max_amount'              => 'sometimes|numeric|min:0|gte:min_amount',
            'min_tenure_months'       => 'sometimes|integer|min:1',
            'max_tenure_months'       => 'sometimes|integer|min:1',
            'min_age'                 => 'sometimes|integer|min:18|max:100',
            'max_age'                 => 'sometimes|integer|min:18|max:100',
            'min_business_age_months' => 'sometimes|integer|min:0',
            'processing_fee_type'     => 'sometimes|in:fixed,percentage',
            'processing_fee_value'    => 'sometimes|numeric|min:0',
            'eligible_sectors'        => 'sometimes|array',
            'eligible_genders'        => 'sometimes|array',
            'required_documents'      => 'sometimes|array',
            'color_hex'               => 'sometimes|string|max:7',
            'display_order'           => 'sometimes|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $updated = $this->productService->updateProduct($product, $request->all(), auth()->id());

        return response()->json([
            'message' => 'Konfigurasi produk berjaya dikemaskini.',
            'data'    => $this->formatProduct($updated),
        ]);
    }

    // ── POST /api/products/{id}/activate ─────────────────────────────────────
    public function activate(Request $request, int $id): JsonResponse
    {
        $product = FinancingProduct::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'action' => 'required|in:activate,deactivate',
            'notes'  => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $activate = $request->input('action') === 'activate';

        // 409 Conflict: product is already in the desired state
        if ($product->is_active === $activate) {
            $state = $activate ? 'aktif' : 'tidak aktif';
            return response()->json([
                'message' => "Produk sudah dalam keadaan {$state}.",
                'data'    => ['id' => $product->id, 'is_active' => $product->is_active],
            ], 409);
        }

        $updated  = $this->productService->toggleActivation(
            $product,
            $activate,
            $request->input('notes'),
            auth()->id(),
        );

        $label = $activate ? 'diaktifkan' : 'dinyahaktifkan';

        return response()->json([
            'message' => "Produk {$updated->name} berjaya {$label}.",
            'data'    => [
                'id'              => $updated->id,
                'is_active'       => $updated->is_active,
                'activated_at'    => $updated->activated_at?->toISOString(),
                'deactivated_at'  => $updated->deactivated_at?->toISOString(),
            ],
        ]);
    }

    // ── GET /api/products/{id}/eligibility-check ──────────────────────────────
    public function eligibilityCheck(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'ic' => 'required|string|min:12|max:12',
        ]);
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $product = FinancingProduct::with('activeRules')->findOrFail($id);
        $result = $this->eligibilityService->check($product, $request->all());
        return response()->json(['data' => $result]);
    }

    // ── GET /api/products/eligibility-check-all ───────────────────────────────
    public function eligibilityCheckAll(Request $request): JsonResponse
    {
        $results = $this->eligibilityService->checkAllProducts($request->all());

        $eligibleCount   = count(array_filter($results, fn($r) => $r['eligible']));
        $ineligibleCount = count($results) - $eligibleCount;

        return response()->json([
            'data' => $results,
            'meta' => [
                'eligible_count'   => $eligibleCount,
                'ineligible_count' => $ineligibleCount,
            ],
        ]);
    }

    // ── GET /api/products/{id}/audit-logs ─────────────────────────────────────
    public function auditLogs(Request $request, int $id): JsonResponse
    {
        $product = FinancingProduct::findOrFail($id);

        $perPage = (int) $request->input('per_page', 20);
        $logs    = $product->auditLogs()->paginate($perPage);

        return response()->json([
            'data'         => $logs->items(),
            'total'        => $logs->total(),
            'per_page'     => $logs->perPage(),
            'current_page' => $logs->currentPage(),
        ]);
    }

    // ── Private helpers ───────────────────────────────────────────────────────
    private function formatProduct(FinancingProduct $product, bool $includeRelations = false): array
    {
        $data = [
            'id'                        => $product->id,
            'code'                      => $product->code,
            'name'                      => $product->name,
            'name_en'                   => $product->name_en,
            'description'               => $product->description,
            'description_en'            => $product->description_en,
            'min_amount'                => (float) $product->min_amount,
            'max_amount'                => (float) $product->max_amount,
            'amount_range'              => $product->amount_range,
            'profit_rate'               => (float) $product->profit_rate,
            'min_tenure_months'         => $product->min_tenure_months,
            'max_tenure_months'         => $product->max_tenure_months,
            'processing_fee_type'       => $product->processing_fee_type,
            'processing_fee_value'      => (float) $product->processing_fee_value,
            'min_age'                   => $product->min_age,
            'max_age'                   => $product->max_age,
            'min_business_age_months'   => $product->min_business_age_months,
            'eligible_sectors'          => $product->eligible_sectors,
            'eligible_genders'          => $product->eligible_genders,
            'eligible_races'            => $product->eligible_races,
            'requires_ssm_registration' => $product->requires_ssm_registration,
            'requires_business_premises'=> $product->requires_business_premises,
            'blacklist_check_required'  => $product->blacklist_check_required,
            'ccris_check_required'      => $product->ccris_check_required,
            'ctos_check_required'       => $product->ctos_check_required,
            'muflis_check_required'     => $product->muflis_check_required,
            'esyariah_check_required'   => $product->esyariah_check_required,
            'required_documents'        => $product->required_documents,
            'is_active'                 => $product->is_active,
            'status_label'              => $product->status_label,
            'color_hex'                 => $product->color_hex,
            'display_order'             => $product->display_order,
            'rules_count'               => $product->rules_count ?? 0,
            'last_updated_by'           => $product->last_updated_by,
            'activated_at'              => $product->activated_at?->toISOString(),
            'deactivated_at'            => $product->deactivated_at?->toISOString(),
            'activated_by'              => $product->activated_by,
            'deactivated_by'            => $product->deactivated_by,
            'updated_at'                => $product->updated_at?->toISOString(),
        ];

        if ($includeRelations) {
            if ($product->relationLoaded('eligibilityRules')) {
                $data['eligibility_rules'] = $product->eligibilityRules->toArray();
            }
            if ($product->relationLoaded('auditLogs')) {
                $data['recent_audit_logs'] = $product->auditLogs->map(fn($log) => [
                    'id'         => $log->id,
                    'action'     => $log->action,
                    'user'       => $log->user_id,
                    'created_at' => $log->created_at?->toISOString(),
                    'notes'      => $log->notes,
                ])->toArray();
            }
        }

        return $data;
    }
}
