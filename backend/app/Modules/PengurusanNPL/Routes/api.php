<?php

use Illuminate\Support\Facades\Route;
use App\Modules\PengurusanNPL\Controllers\NplController;

/**
 * Module 5 — Pengurusan NPL & Kutipan Hutang Routes
 * All routes use the module-specific NplController.
 */
Route::middleware(['auth:sanctum'])->group(function () {
    // NPL Dashboard & Records
    Route::get('/npl/dashboard',             [NplController::class, 'dashboard']);
    Route::get('/npl/dunning',               [NplController::class, 'dunningList']);
    Route::post('/collections/dunning/{id}', [NplController::class, 'sendDunning']);

    // Collection Tasks
    Route::get('/collections/tasks',                 [NplController::class, 'collectionTasks']);
    Route::post('/collections/tasks/{id}/outcome',   [NplController::class, 'logOutcome']);
});
