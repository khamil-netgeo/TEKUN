<?php

use Illuminate\Support\Facades\Route;
use App\Modules\PengurusanNPL\Controllers\NplController;

Route::middleware(['auth:sanctum', 'role:Pegawai Kredit|admin'])->group(function () {
    Route::get('/npl/dashboard',             [NplController::class, 'dashboard']);
    Route::get('/npl/dunning',               [NplController::class, 'dunningList']);
    Route::get('/npl/accounts',              [NplController::class, 'nplAccounts']);
    Route::get('/npl/ai-automation',         [NplController::class, 'aiAutomationStatus']);
    Route::get('/collections/tasks',                 [NplController::class, 'collectionTasks']);
    Route::post('/collections/tasks/{id}/outcome',   [NplController::class, 'logOutcome']);
    Route::post('/collections/dunning/{id}',         [NplController::class, 'sendDunning']);
});