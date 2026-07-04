<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuditController;
/** Module 11 — Audit & Kawalan Routes */
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/audit-logs', [AuditController::class, 'index']);
    Route::get('/audit-logs/{id}', [AuditController::class, 'show']);
    Route::get('/audit-logs/anomalies', [AuditController::class, 'anomalies']);
    Route::get('/audit-logs/export', [AuditController::class, 'export']);
});
