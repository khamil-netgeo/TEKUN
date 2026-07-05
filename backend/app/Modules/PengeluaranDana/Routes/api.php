<?php

use Illuminate\Support\Facades\Route;
use App\Modules\PengeluaranDana\Controllers\DisbursementController;

/**
 * Module 3 — Pengeluaran Dana Routes
 * All routes require Sanctum authentication.
 * IMPORTANT: Specific named routes MUST be declared BEFORE parameterised /{id}
 * routes to prevent Laravel matching "aging", "esign-queue", etc. as an ID.
 */
Route::middleware(['auth:sanctum'])->group(function () {

    // ── Specific / named routes (MUST be before /{id} wildcard) ──────────────
    Route::get('/disbursements/authority-matrix', [DisbursementController::class, 'authorityMatrix']);
    Route::get('/disbursements/aging-report',     [DisbursementController::class, 'agingReport']);
    Route::get('/disbursements/aging',            [DisbursementController::class, 'agingReport']); // alias used by frontend
    Route::get('/disbursements/esign-queue',      [DisbursementController::class, 'esignQueue']);

    // ── Collection routes ─────────────────────────────────────────────────────
    Route::get('/disbursements',  [DisbursementController::class, 'index']);
    Route::post('/disbursements', [DisbursementController::class, 'store']);
    Route::post('/disbursements/batch', [DisbursementController::class, 'batch']);

    // ── Single-resource routes (wildcard LAST) ────────────────────────────────
    Route::get('/disbursements/{id}',    [DisbursementController::class, 'show']);
    Route::put('/disbursements/{id}',    [DisbursementController::class, 'update']);
    Route::delete('/disbursements/{id}', [DisbursementController::class, 'destroy']);

    // ── Action routes ─────────────────────────────────────────────────────────
    Route::post('/disbursements/{id}/escalate',           [DisbursementController::class, 'escalate']);
    Route::post('/disbursements/{id}/approve',            [DisbursementController::class, 'approve']);
    Route::post('/disbursements/{id}/send-esign',         [DisbursementController::class, 'sendReminder']);
    Route::post('/disbursements/{id}/esign',              [DisbursementController::class, 'sendReminder']); // alias
    Route::get('/disbursements/{id}/offer-letter',        [DisbursementController::class, 'offerLetterData']);
    Route::post('/disbursements/{id}/send-otp',           [DisbursementController::class, 'sendApprovalOtp']);
    Route::post('/disbursements/{id}/verify-otp-approve', [DisbursementController::class, 'verifyOtpAndApprove']);
    Route::post('/disbursements/{id}/confirm-payment',    [DisbursementController::class, 'confirmPayment']);
});
