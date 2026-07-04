<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\PengurusanCawangan\Services\BranchService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * TEKUN SPPT — Module 8: Pengurusan Cawangan
 * Central API controller — delegates to BranchService.
 * This controller is registered in the central routes/api.php.
 * The module-specific controller handles {id} routes via auto-loaded module routes.
 */
class BranchController extends Controller
{
    private BranchService $service;

    public function __construct(BranchService $service)
    {
        $this->service = $service;
    }

    /**
     * GET /api/branches
     * List all branches with performance metrics.
     * Supports: ?state=, ?search=, ?per_page=, ?page=
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $result = $this->service->getBranches($user, $request->all());
        return response()->json($result);
    }

    /**
     * GET /api/branches/performance
     * Ranked performance data for all branches.
     */
    public function performance(Request $request): JsonResponse
    {
        $result = $this->service->getPerformanceRanking($request->get('period'));
        return response()->json($result);
    }
}
