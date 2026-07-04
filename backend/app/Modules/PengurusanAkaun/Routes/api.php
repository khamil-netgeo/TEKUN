<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AccountController;
/** Module 4 — Pengurusan Akaun Routes */
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/accounts', [AccountController::class, 'index']);
    Route::get('/accounts/{id}', [AccountController::class, 'show']);
    Route::get('/accounts/{id}/payments', [AccountController::class, 'payments']);
    Route::post('/accounts/{id}/payments', [AccountController::class, 'storePayment']);
    Route::post('/accounts/{id}/moratorium', [AccountController::class, 'moratorium']);
    Route::get('/accounts/{id}/tawwidh', [AccountController::class, 'tawwidh']);
    Route::get('/accounts/{id}/statement', [AccountController::class, 'statement']);
});
