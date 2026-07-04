<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\NplController;
/** Module 5 — Pengurusan NPL Routes */
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/npl', [NplController::class, 'index']);
    Route::get('/npl/dashboard', [NplController::class, 'dashboard']);
    Route::get('/npl/{id}', [NplController::class, 'show']);
    Route::post('/npl/{id}/dunning', [NplController::class, 'dunning']);
    Route::post('/npl/{id}/restructure', [NplController::class, 'restructure']);
    Route::get('/npl/{id}/history', [NplController::class, 'history']);
});
