<?php

use Illuminate\Support\Facades\Route;
use App\Modules\PengurusanAkaun\Controllers\AccountController;
use App\Modules\PengurusanAkaun\Controllers\AiAccountController;

/**
 * Module 4 — Pengurusan Akaun & Pembayaran Balik
 *
 * All routes are auto-loaded by AppServiceProvider dynamic route loading.
 * These routes are prefixed with /api (set by AppServiceProvider).
 *
 * Required endpoints per project specification:
 *   GET  /api/accounts/{id}                → 360 data
 *   GET  /api/accounts/{id}/payment-history → history
 *   POST /api/accounts/{id}/payment         → receipt
 *   GET  /api/accounts/{id}/tawidh          → {amount, formula, shariah_compliant: true}
 *   POST /api/accounts/{id}/moratorium      → new_schedule
 *   POST /api/ai/default-prediction         → {probability, risk_level, factors}
 */
Route::middleware(['auth:sanctum', 'role:Pegawai Cawangan|Pengurus Cawangan|Pegawai Kredit|Eksekutif|Pentadbir Sistem'])->group(function () {

    // ─── Account 360 & Listing ────────────────────────────────────────────────
    Route::get('/accounts',                        [AccountController::class, 'index']);
    Route::get('/accounts/{id}',                   [AccountController::class, 'show']);

    // ─── Payment History ──────────────────────────────────────────────────────
    Route::get('/accounts/{id}/payment-history',   [AccountController::class, 'paymentHistory']);

    // ─── Payment Submission ───────────────────────────────────────────────────
    Route::post('/accounts/{id}/payment',          [AccountController::class, 'recordPayment']);

    // ─── Ta'widh Calculator ───────────────────────────────────────────────────
    Route::get('/accounts/{id}/tawidh',            [AccountController::class, 'tawidh']);

    // ─── Moratorium / Restructuring ───────────────────────────────────────────
    Route::post('/accounts/{id}/moratorium',       [AccountController::class, 'moratorium']);

    // ─── AI Default Prediction ────────────────────────────────────────────────
    // This route overrides the core-foundation placeholder in routes/api.php
    // with our production-ready AiDefaultPredictionService implementation.
    Route::post('/ai/default-prediction',          [AiAccountController::class, 'defaultPrediction']);
});