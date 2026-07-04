<?php

namespace App\Modules\PengurusanCawangan\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\PengurusanCawangan\Services\BranchService;
use App\Modules\PengurusanCawangan\Requests\UpdateBranchRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

/**
 * TEKUN SPPT — Module 8: Pengurusan Cawangan
 * BranchController — handles all branch management API endpoints.
 *
 * RBAC:
 *  - All authenticated users can read (GET) branch data.
 *  - PUT /branches/{id} requires 'branch.update' permission
 *    (Pengurus Cawangan scoped to own branch, Pentadbir Sistem for all).
 */
class BranchController extends Controller
{
    public function __construct(private readonly BranchService $service) {}

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/branches
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * List all branches with performance metrics.
     * Supports: ?search=, ?state=, ?status=, ?sort_by=, ?sort_dir=, ?per_page=
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $result = $this->service->getBranches($user, $request->all());

        return response()->json($result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/branches/performance
    // NOTE: This route MUST be registered BEFORE /branches/{id} to avoid
    //       "performance" being treated as an {id} parameter.
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Get ranked branch performance data for the current month.
     */
    public function performance(Request $request): JsonResponse
    {
        $user = Auth::user();
        $period = $request->query('period'); // optional: YYYY-MM
        $result = $this->service->getPerformanceRanking($user, $period);

        return response()->json($result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/branches/{id}
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Get full branch detail including performance history.
     */
    public function show(int $id): JsonResponse
    {
        $user = Auth::user();

        try {
            $branch = $this->service->getBranchDetail($user, $id);
            return response()->json(['data' => $branch]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Cawangan tidak ditemui.'], 404);
        } catch (\Illuminate\Auth\Access\AuthorizationException) {
            return response()->json(['message' => 'Akses tidak dibenarkan.'], 403);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/branches/{id}/staff
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Get staff list for a specific branch.
     */
    public function staff(int $id): JsonResponse
    {
        $user = Auth::user();

        try {
            $result = $this->service->getBranchStaff($user, $id);
            return response()->json($result);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Cawangan tidak ditemui.'], 404);
        } catch (\Illuminate\Auth\Access\AuthorizationException) {
            return response()->json(['message' => 'Akses tidak dibenarkan.'], 403);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUT /api/branches/{id}
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Update branch information.
     * RBAC: Pengurus Cawangan (own branch only) or Pentadbir Sistem (all).
     */
    public function update(UpdateBranchRequest $request, int $id): JsonResponse
    {
        $user = Auth::user();

        // RBAC check: only managers (own branch) and admins can update
        if (!in_array($user->role, ['pengurus_cawangan', 'system_admin', 'eksekutif'])) {
            return response()->json(['message' => 'Akses tidak dibenarkan.'], 403);
        }

        try {
            $branch = $this->service->updateBranch($user, $id, $request->validated());
            return response()->json([
                'message' => 'Maklumat cawangan berjaya dikemaskini.',
                'data'    => $branch,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Cawangan tidak ditemui.'], 404);
        } catch (\Illuminate\Auth\Access\AuthorizationException) {
            return response()->json(['message' => 'Akses tidak dibenarkan untuk cawangan ini.'], 403);
        }
    }
}
