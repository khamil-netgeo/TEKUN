<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\BranchController;
/** Module 8 — Pengurusan Cawangan Routes */
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/branches', [BranchController::class, 'index']);
    Route::post('/branches', [BranchController::class, 'store']);
    Route::get('/branches/{id}', [BranchController::class, 'show']);
    Route::put('/branches/{id}', [BranchController::class, 'update']);
    Route::get('/branches/performance', [BranchController::class, 'performance']);
    Route::get('/branches/{id}/staff', [BranchController::class, 'staff']);
});
