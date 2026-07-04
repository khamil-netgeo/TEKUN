<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
/** Module 9 — Produk Pembiayaan Routes */
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::post('/products/{id}/eligibility', [ProductController::class, 'eligibility']);
});
