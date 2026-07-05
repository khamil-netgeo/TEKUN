<?php
use Illuminate\Support\Facades\Route;
use App\Modules\IntegrasiAPI\Controllers\IntegrationController;
/** Module 10 — Integrasi API Routes */
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/integrations/health', [IntegrationController::class, 'health']);
    Route::post('/integrations/check/{service}', [IntegrationController::class, 'check']);
    Route::get('/integrations/logs', [IntegrationController::class, 'logs']);
    Route::post('/integrations/circuit-breaker/{service}/reset', [IntegrationController::class, 'resetCircuitBreaker']);
});
