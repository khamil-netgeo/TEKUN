<?php
use Illuminate\Support\Facades\Route;
use App\Modules\ProdukPembiayaan\Controllers\ProductController;
/** Module 9 — Produk Pembiayaan Routes */
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/eligibility-check-all', [ProductController::class, 'eligibilityCheckAll']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::put('/products/{id}', [ProductController::class, 'update'])->middleware('role:Pentadbir Sistem');
    Route::post('/products/{id}/activate', [ProductController::class, 'activate'])->middleware('role:Pentadbir Sistem');
    Route::get('/products/{id}/eligibility-check', [ProductController::class, 'eligibilityCheck']);
    Route::get('/products/{id}/audit-logs', [ProductController::class, 'auditLogs']);
});