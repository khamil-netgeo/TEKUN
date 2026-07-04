<?php
namespace App\Modules\ProdukPembiayaan\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ProdukPembiayaan\Services\ProductService;
use App\Modules\ProdukPembiayaan\Services\EligibilityCheckerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * ProductController — M9 ProdukPembiayaan
 * Handles all financing product configuration endpoints.
 */
class ProductController extends Controller
{
    public function __construct(
        protected ProductService $productService,
        protected EligibilityCheckerService $eligibilityService
    ) {}

    /**
     * GET /api/products
     * List all financing schemes with optional filters.
     */
    public function index(Request $request)
    {
        $filters = $request->only(['is_active', 'search', 'per_page']);
        $result  = $this->productService->listProducts($filters);
        return response()->json($result);
    }

    /**
     * GET /api/products/{id}
     * Get a single product with its eligibility rules.
     */
    public function show(Request $request, $id)
    {
        $product = $this->productService->getProduct((int) $id);
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Produk tidak dijumpai.'], 404);
        }
        return response()->json(['success' => true, 'data' => $product]);
    }

    /**
     * PUT /api/products/{id}
     * Update product configuration (profit rate, tenure, eligibility rules, required docs).
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name'                 => 'sometimes|string|max:255',
            'description'          => 'sometimes|string',
            'profit_rate'          => 'sometimes|numeric|min:0|max:100',
            'min_tenure_months'    => 'sometimes|integer|min:1',
            'max_tenure_months'    => 'sometimes|integer|min:1',
            'min_amount'           => 'sometimes|numeric|min:0',
            'max_amount'           => 'sometimes|numeric|min:0',
            'required_documents'   => 'sometimes|array',
            'eligibility_rules'    => 'sometimes|array',
            'notes'                => 'sometimes|string|nullable',
        ]);

        $userId  = Auth::id();
        $product = $this->productService->updateProduct((int) $id, $validated, $userId);

        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Produk tidak dijumpai.'], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Konfigurasi produk berjaya dikemaskini.',
            'data'    => $product,
        ]);
    }

    /**
     * POST /api/products/{id}/activate
     * Activate or deactivate a financing product.
     */
    public function activate(Request $request, $id)
    {
        $validated = $request->validate([
            'is_active' => 'required|boolean',
            'reason'    => 'sometimes|string|max:500',
        ]);

        $userId  = Auth::id();
        $product = $this->productService->setActiveStatus(
            (int) $id,
            (bool) $validated['is_active'],
            $validated['reason'] ?? null,
            $userId
        );

        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Produk tidak dijumpai.'], 404);
        }

        $status = $validated['is_active'] ? 'diaktifkan' : 'dinyahaktifkan';
        return response()->json([
            'success' => true,
            'message' => "Produk berjaya {$status}.",
            'data'    => $product,
        ]);
    }

    /**
     * GET /api/products/{id}/eligibility-check
     * Check if an applicant is eligible for a specific product.
     * Query params: ic, business_age_years, monthly_income, sector, is_blacklisted, gender, age
     */
    public function eligibilityCheck(Request $request, $id)
    {
        $product = $this->productService->getProduct((int) $id);
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Produk tidak dijumpai.'], 404);
        }

        $applicantData = $request->only([
            'ic', 'age', 'gender', 'business_age_years',
            'monthly_income', 'sector', 'is_blacklisted',
        ]);

        $result = $this->eligibilityService->check($product, $applicantData);

        return response()->json([
            'success'      => true,
            'product_id'   => (int) $id,
            'product_name' => $product['name'],
            'data'         => $result,
        ]);
    }

    /**
     * GET /api/products/eligibility-check-all
     * Check eligibility across all active products for an applicant.
     */
    public function eligibilityCheckAll(Request $request)
    {
        $applicantData = $request->only([
            'ic', 'age', 'gender', 'business_age_years',
            'monthly_income', 'sector', 'is_blacklisted',
        ]);

        $results = $this->eligibilityService->checkAll($applicantData);

        return response()->json([
            'success' => true,
            'data'    => $results,
        ]);
    }

    /**
     * GET /api/products/{id}/audit-logs
     * Get the audit trail for a product.
     */
    public function auditLogs(Request $request, $id)
    {
        $logs = $this->productService->getAuditLogs((int) $id);
        return response()->json([
            'success' => true,
            'data'    => $logs,
        ]);
    }
}
