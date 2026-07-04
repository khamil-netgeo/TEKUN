<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\DashboardController;
/** Module 6 — Laporan & Analitik Routes */
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/reports', [ReportController::class, 'index']);
    Route::post('/reports/generate', [ReportController::class, 'generate']);
    Route::get('/reports/{id}/download', [ReportController::class, 'download']);
    Route::get('/reports/executive-summary', [ReportController::class, 'executiveSummary']);
});
