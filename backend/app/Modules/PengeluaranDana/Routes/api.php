<?php

use Illuminate\Support\Facades\Route;
use App\Modules\PengeluaranDana\Controllers\DisbursementController;

/** Module 3 — Pengeluaran Dana Routes */
Route::middleware(['auth:sanctum'])->group(function () {
    // Specific routes first
    Route::get('/disbursements/aging-report', [DisbursementController::class, 'agingReport']);
    Route::get('/disbursements/esign-queue', [DisbursementController::class, 'esignQueue']);
    Route::get('/disbursements/authority-matrix', [DisbursementController::class, 'authorityMatrix']);
    Route::post('/disbursements/batch', [DisbursementController::class, 'batch']);
    
    // Resource routes
    Route::get('/disbursements', [DisbursementController::class, 'index']);
    
    // Action routes with IDs
    Route::post('/disbursements/{id}/escalate', [DisbursementController::class, 'escalate']);
    Route::post('/disbursements/{id}/approve', [DisbursementController::class, 'approve']);
    Route::post('/disbursements/{id}/send-esign', [DisbursementController::class, 'sendReminder']);
});
