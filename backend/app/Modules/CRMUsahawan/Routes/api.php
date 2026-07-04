<?php

use Illuminate\Support\Facades\Route;
use App\Modules\CRMUsahawan\Controllers\EntrepreneurController;

/**
 * Module 7 — CRM & Pemantauan Usahawan Routes
 * Loaded automatically by AppServiceProvider dynamic route loader.
 * DO NOT modify routes/api.php directly.
 */
Route::middleware(['auth:sanctum'])->group(function () {
    // Entrepreneur CRUD
    Route::get('/entrepreneurs',             [EntrepreneurController::class, 'index']);
    Route::get('/entrepreneurs/{id}',        [EntrepreneurController::class, 'show']);
    Route::put('/entrepreneurs/{id}',        [EntrepreneurController::class, 'update']);

    // Field visits
    Route::get('/entrepreneurs/{id}/visits',  [EntrepreneurController::class, 'getVisits']);
    Route::post('/entrepreneurs/{id}/visits', [EntrepreneurController::class, 'storeVisit']);

    // AI-generated visit report
    Route::post('/entrepreneurs/visits/{visitId}/report', [EntrepreneurController::class, 'generateVisitReport']);

    // AI health score
    Route::get('/ai/entrepreneur-health/{id}', [EntrepreneurController::class, 'aiHealth']);
});
