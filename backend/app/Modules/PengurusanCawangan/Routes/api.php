<?php

use Illuminate\Support\Facades\Route;
use App\Modules\PengurusanCawangan\Controllers\BranchController;

/**
 * TEKUN SPPT — Module 8: Pengurusan Cawangan
 * Routes for branch management endpoints.
 * Auto-loaded by AppServiceProvider.
 *
 * IMPORTANT: Static routes (performance) MUST come before parameterised routes ({id}).
 */
Route::middleware(['auth:sanctum'])->group(function () {
    // Static routes first
    Route::get('/branches/performance', [BranchController::class, 'performance']);
    // List and create
    Route::get('/branches', [BranchController::class, 'index']);
    // Parameterised routes
    Route::get('/branches/{id}/staff', [BranchController::class, 'staff']);
    Route::get('/branches/{id}', [BranchController::class, 'show']);
    Route::put('/branches/{id}', [BranchController::class, 'update']);
});
