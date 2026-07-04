<?php

use Illuminate\Support\Facades\Route;
use App\Modules\PengurusanCawangan\Controllers\BranchController;

/**
 * TEKUN SPPT — Module 8: Pengurusan Cawangan Routes
 *
 * Auto-loaded by AppServiceProvider dynamic route loader.
 * IMPORTANT: Static routes (e.g. /branches/performance) MUST be registered
 * BEFORE parameterised routes (e.g. /branches/{id}) to avoid conflicts.
 */
Route::middleware(['auth:sanctum'])->group(function () {
    // ── Static routes first ──────────────────────────────────────────────────
    Route::get('/branches',             [BranchController::class, 'index']);
    Route::get('/branches/performance', [BranchController::class, 'performance']);

    // ── Parameterised routes ─────────────────────────────────────────────────
    Route::get('/branches/{id}',        [BranchController::class, 'show']);
    Route::get('/branches/{id}/staff',  [BranchController::class, 'staff']);
    Route::put('/branches/{id}',        [BranchController::class, 'update']);
});
