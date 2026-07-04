<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\PengurusanCawangan\Controllers\BranchController as ModuleBranchController;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * TEKUN SPPT — Branch Controller (Central API Proxy)
 * Delegates all requests to the Module 8 BranchController.
 */
class BranchController extends Controller
{
    private ModuleBranchController $module;

    public function __construct(ModuleBranchController $module)
    {
        $this->module = $module;
    }

    public function index(Request $request): JsonResponse
    {
        return $this->module->index($request);
    }

    public function performance(Request $request): JsonResponse
    {
        return $this->module->performance($request);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        return $this->module->show($request, $id);
    }

    public function staff(Request $request, int $id): JsonResponse
    {
        return $this->module->staff($request, $id);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        return $this->module->update($request, $id);
    }
}
