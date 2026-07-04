<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DisbursementController;

/** Module 3 — Pengeluaran Dana Routes */
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/disbursements', [DisbursementController::class, 'index']);
    Route::post('/disbursements', [DisbursementController::class, 'store']);
    Route::get('/disbursements/{id}', [DisbursementController::class, 'show']);
    Route::put('/disbursements/{id}', [DisbursementController::class, 'update']);
    Route::post('/disbursements/{id}/approve', [DisbursementController::class, 'approve']);
    Route::post('/disbursements/{id}/process', [DisbursementController::class, 'process']);
    Route::get('/disbursements/{id}/aging', [DisbursementController::class, 'aging']);
});
