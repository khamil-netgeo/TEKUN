<?php

namespace App\Modules\PengurusanCawangan\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\PengurusanCawangan\Services\BranchService;
use App\Modules\PengurusanCawangan\Requests\UpdateBranchRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Throwable;

/**
 * TEKUN SPPT — Module 8: Pengurusan Cawangan
 * Handles all branch management API endpoints.
 *
 * RBAC:
 *  - branch_manager: own branch only
 *  - branch_officer: read-only, own branch only
 *  - executive / system_admin: all branches
 */
class BranchController extends Controller
{
    public function __construct(private BranchService $service) {}

    /**
     * GET /api/branches
     * List all branches with performance metrics.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $filters = $request->only(['state', 'search', 'is_active', 'per_page', 'page']);

        $result = $this->service->getBranches($user, $filters);

        return response()->json($result);
    }

    /**
     * GET /api/branches/performance
     * Ranked performance data (monthly targets vs actual).
     */
    public function performance(Request $request): JsonResponse
    {
        $period = $request->query('period', date('Y-m'));
        $result = $this->service->getPerformanceRanking($period);

        return response()->json($result);
    }

    /**
     * GET /api/branches/{id}
     * Branch detail with performance history.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $result = $this->service->getBranchDetail($id, $user);

        if (!$result) {
            return response()->json(['message' => 'Cawangan tidak dijumpai atau akses ditolak.'], 404);
        }

        return response()->json($result);
    }

    /**
     * GET /api/branches/{id}/staff
     * Staff list for a branch.
     */
    public function staff(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $result = $this->service->getBranchStaff($id, $user);

        if (!$result) {
            return response()->json(['message' => 'Cawangan tidak dijumpai atau akses ditolak.'], 404);
        }

        return response()->json($result);
    }

    /**
     * PUT /api/branches/{id}
     * Update branch information (RBAC-protected).
     */
    public function update(UpdateBranchRequest $request, int $id): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        // Use the authenticated user's ID instead of requiring an admin user lookup
        $data['updated_by'] = $user ? $user->id : null;

        try {
            // Pass the user object to the service for RBAC or auditing
            $branch = $this->service->updateBranch($id, $data, $user);

            if (!$branch) {
                return response()->json(['message' => 'Cawangan tidak dijumpai.'], 404);
            }

            return response()->json([
                'message' => 'Maklumat cawangan berjaya dikemaskini.',
                'branch'  => $branch,
            ]);
        } catch (Throwable $e) {
            // Gracefully handle any lookup failures (e.g., admin not found in legacy service code)
            // returning a 400 Bad Request instead of a 500 Internal Server Error
            return response()->json([
                'message' => 'Ralat semasa mengemaskini cawangan.',
                'error'   => $e->getMessage()
            ], 400);
        }
    }
}