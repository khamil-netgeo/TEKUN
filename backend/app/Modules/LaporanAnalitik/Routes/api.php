<?php

use Illuminate\Support\Facades\Route;
use App\Modules\LaporanAnalitik\Controllers\KpiDashboardController;
use App\Modules\LaporanAnalitik\Controllers\ReportBuilderController;

/**
 * Module 6 — Laporan & Analitik
 * All routes registered via AppServiceProvider dynamic loader.
 * DO NOT add these routes to routes/api.php directly.
 */
Route::middleware(['auth:sanctum'])->group(function () {

    // ── KPI Dashboard ──────────────────────────────────────────────────────
    // GET /api/dashboard/kpi
    Route::get('/dashboard/kpi', [KpiDashboardController::class, 'kpi']);

    // GET /api/dashboard/trends?period=monthly
    Route::get('/dashboard/trends', [KpiDashboardController::class, 'trends']);

    // GET /api/dashboard/branch-performance
    Route::get('/dashboard/branch-performance', [KpiDashboardController::class, 'branchPerformance']);

    // GET /api/dashboard/predictive
    Route::get('/dashboard/predictive', [KpiDashboardController::class, 'predictive']);

    // GET /api/dashboard/portfolio-composition
    Route::get('/dashboard/portfolio-composition', [KpiDashboardController::class, 'portfolioComposition']);

    // GET /api/dashboard/ai-insights
    Route::get('/dashboard/ai-insights', [KpiDashboardController::class, 'aiInsights']);

    // ── Report Builder ─────────────────────────────────────────────────────
    // GET /api/reports/builder?columns[]=X&from=Y&to=Z
    Route::get('/reports/builder', [ReportBuilderController::class, 'builder']);

    // POST /api/reports/export → {pdf_url, excel_url}
    Route::post('/reports/export', [ReportBuilderController::class, 'export']);

    // GET /api/reports/history
    Route::get('/reports/history', [ReportBuilderController::class, 'history']);

    // GET /api/reports/templates
    Route::get('/reports/templates', [ReportBuilderController::class, 'templates']);

    // POST /api/reports/templates
    Route::post('/reports/templates', [ReportBuilderController::class, 'saveTemplate']);

    // DELETE /api/reports/templates/{id}
    Route::delete('/reports/templates/{id}', [ReportBuilderController::class, 'deleteTemplate']);
});
