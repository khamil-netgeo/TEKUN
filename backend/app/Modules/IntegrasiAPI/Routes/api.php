<?php
use Illuminate\Support\Facades\Route;
use App\Modules\IntegrasiAPI\Controllers\IntegrationController;

/** Module 10 — Integrasi API Routes */
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/integrations/health',                          [IntegrationController::class, 'health']);
    Route::get('/integrations/logs',                            [IntegrationController::class, 'logs']);
    Route::get('/integrations/alerts',                          [IntegrationController::class, 'alerts']);
    Route::match(['put', 'patch'], '/integrations/alerts',      [IntegrationController::class, 'updateAlerts'])->middleware('role:pentadbir_sistem|admin');
    Route::get('/integrations/{service}/metrics',               [IntegrationController::class, 'metrics']);
    Route::post('/integrations/{service}/test',                 [IntegrationController::class, 'testService']);
    Route::post('/integrations/{service}/circuit-breaker/reset',[IntegrationController::class, 'resetCircuitBreaker']);
    Route::post('/integrations/check/{service}',                [IntegrationController::class, 'check']);
});