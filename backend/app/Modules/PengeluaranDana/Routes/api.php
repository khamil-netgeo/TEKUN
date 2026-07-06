<?php

use Illuminate\Support\Facades\Route;
use App\Modules\PengeluaranDana\Controllers\DisbursementController;

/**
 * Module 3 — Pengeluaran Dana Routes
 * All routes require Sanctum authentication.
 * Specific routes declared BEFORE parameterised routes to avoid conflicts.
 */
Route::middleware(['auth:sanctum'])->group(function () {

    // ── Specific / named routes (must be before /{id} routes) ────────────────
    Route::get('/disbursements/aging-report',     [DisbursementController::class, 'agingReport']);
    Route::get('/disbursements/esign-queue',      [DisbursementController::class, 'esignQueue']);
    Route::get('/disbursements/authority-matrix', [DisbursementController::class, 'authorityMatrix']);
    Route::post('/disbursements/batch',           [DisbursementController::class, 'batch'])->middleware('permission:disbursement.manage');

    // ── Collection routes ─────────────────────────────────────────────────────
    Route::get('/disbursements',  [DisbursementController::class, 'index']);
    Route::post('/disbursements', [DisbursementController::class, 'store'])->middleware('permission:disbursement.manage');

    // ── Single-resource routes ────────────────────────────────────────────────
    Route::get('/disbursements/{id}',    [DisbursementController::class, 'show']);
    Route::put('/disbursements/{id}',    [DisbursementController::class, 'update'])->middleware('permission:disbursement.manage');
    Route::delete('/disbursements/{id}', [DisbursementController::class, 'destroy'])->middleware('permission:disbursement.manage');

    // ── Action routes ─────────────────────────────────────────────────────────
    Route::post('/disbursements/{id}/escalate',          [DisbursementController::class, 'escalate'])->middleware('permission:disbursement.manage');
    Route::post('/disbursements/{id}/approve',           [DisbursementController::class, 'approve'])->middleware('permission:disbursement.manage');
    Route::post('/disbursements/{id}/send-esign',        [DisbursementController::class, 'sendReminder'])->middleware('permission:disbursement.manage');
    Route::get('/disbursements/{id}/offer-letter',       [DisbursementController::class, 'offerLetterData']);
    Route::post('/disbursements/{id}/send-otp',          [DisbursementController::class, 'sendApprovalOtp'])->middleware('permission:disbursement.manage');
    Route::post('/disbursements/{id}/verify-otp-approve',[DisbursementController::class, 'verifyOtpAndApprove'])->middleware('permission:disbursement.manage');
});