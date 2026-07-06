<?php

use Illuminate\Support\Facades\Route;
use App\Modules\LaporanAnalitik\Controllers\KpiDashboardController;
use App\Modules\LaporanAnalitik\Controllers\ReportBuilderController;
use App\Modules\LaporanAnalitik\Controllers\AiDashboardController;
use App\Modules\LaporanAnalitik\Controllers\OfficerSkillController;

/**
 * Module 6 — Laporan & Analitik
 * All routes registered via AppServiceProvider dynamic loader.
 * DO NOT add these routes to routes/api.php directly.
 *
 * Middleware: auth:sanctum + role check (Spatie 'permission:' alias
 * is not registered in test env — use 'role:' instead).
 */
Route::middleware(['auth:sanctum', 'role:Eksekutif|Pengurus Cawangan|Pentadbir Sistem'])->group(function () {

    // KPI Dashboard
    Route::get('/dashboard/kpi', [KpiDashboardController::class, 'kpi']);
    Route::get('/dashboard/trends', [KpiDashboardController::class, 'trends']);
    Route::get('/dashboard/branch-performance', [KpiDashboardController::class, 'branchPerformance']);
    Route::get('/dashboard/predictive', [KpiDashboardController::class, 'predictive']);
    Route::get('/dashboard/portfolio-composition', [KpiDashboardController::class, 'portfolioComposition']);
    Route::get('/dashboard/ai-insights', [KpiDashboardController::class, 'aiInsights']);
    Route::get('/module6/dashboard', [KpiDashboardController::class, 'fullDashboard']);

    // Report Builder
    Route::get('/reports/builder', [ReportBuilderController::class, 'builder']);
    Route::post('/reports/export', [ReportBuilderController::class, 'export']);
    Route::get('/reports/history', [ReportBuilderController::class, 'history']);
    Route::get('/reports/templates', [ReportBuilderController::class, 'templates']);
    Route::post('/reports/templates', [ReportBuilderController::class, 'saveTemplate']);
    Route::delete('/reports/templates/{id}', [ReportBuilderController::class, 'deleteTemplate']);

    // AI Dynamic Dashboard Builder
    Route::post('/ai/dashboard/generate', [AiDashboardController::class, 'generate']);
    Route::get('/ai/dashboard/configs', [AiDashboardController::class, 'listConfigs']);
    Route::get('/ai/dashboard/configs/{id}', [AiDashboardController::class, 'getConfig']);
    Route::delete('/ai/dashboard/configs/{id}', [AiDashboardController::class, 'deleteConfig']);

    // Officer Skill Profile
    Route::post('/officer-skills', [OfficerSkillController::class, 'store']);
    Route::get('/officer-skills/me', [OfficerSkillController::class, 'me']);
    Route::get('/officer-skills/history', [OfficerSkillController::class, 'history']);
    Route::post('/ai/decision-assist', [OfficerSkillController::class, 'decisionAssist']);
});

