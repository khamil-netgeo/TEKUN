<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\EntrepreneurController;
/** Module 7 — CRM Usahawan Routes */
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/entrepreneurs', [EntrepreneurController::class, 'index']);
    Route::get('/entrepreneurs/{id}', [EntrepreneurController::class, 'show']);
    Route::put('/entrepreneurs/{id}', [EntrepreneurController::class, 'update']);
    Route::get('/entrepreneurs/{id}/visits', [EntrepreneurController::class, 'visits']);
    Route::post('/entrepreneurs/{id}/visits', [EntrepreneurController::class, 'storeVisit']);
    Route::post('/entrepreneurs/visits/{id}/report', [EntrepreneurController::class, 'visitReport']);
});
