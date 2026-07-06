<?php

use Illuminate\Support\Facades\Route;
use App\Modules\PengeluaranDana\Controllers\DisbursementController;

/**
 * Module 3 — Pengeluaran Dana Routes
 * All routes require Sanctum authentication.
 * Specific routes declared BEFORE parameterised routes to avoid conflicts.
 *
 * Middleware: role:Pengurus Cawangan|Pegawai Kredit|Pentadbir Sistem
 * (Replaces permission:disbursement.manage — Spatie 'permission' middleware
 *  alias is not registered in the test environment kernel.)
 */
Route::middleware(['auth:sanctum'])->group(function () {

    // ── Specific / named routes (must be before /{id} routes) ────────────────
    Route::get('/disbursements/aging-report',     [DisbursementController::class, 'agingReport']);
    Route::get('/disbursements/aging',            [DisbursementController::class, 'agingReport']);
    Route::get('/disbursements/esign-queue',      [DisbursementController::class, 'esignQueue']);
    Route::get('/disbursements/authority-matrix', [DisbursementController::class, 'authorityMatrix']);

    Route::post('/disbursements/batch', [DisbursementController::class, 'batch'])
        ->middleware('role:Pengurus Cawangan|Pegawai Kredit|Pentadbir Sistem');

    // ── Collection routes ─────────────────────────────────────────────────────
    Route::get('/disbursements',  [DisbursementController::class, 'index']);

    Route::post('/disbursements', [DisbursementController::class, 'store'])
        ->middleware('role:Pengurus Cawangan|Pegawai Kredit|Pentadbir Sistem');

    // ── Single-resource routes ────────────────────────────────────────────────
    Route::get('/disbursements/{id}',    [DisbursementController::class, 'show']);

    Route::put('/disbursements/{id}', [DisbursementController::class, 'update'])
        ->middleware('role:Pengurus Cawangan|Pegawai Kredit|Pentadbir Sistem');

    Route::delete('/disbursements/{id}', [DisbursementController::class, 'destroy'])
        ->middleware('role:Pengurus Cawangan|Pegawai Kredit|Pentadbir Sistem');

    // ── Action routes ─────────────────────────────────────────────────────────
    Route::post('/disbursements/{id}/escalate', [DisbursementController::class, 'escalate'])
        ->middleware('role:Pengurus Cawangan|Pegawai Kredit|Pentadbir Sistem');

    Route::post('/disbursements/{id}/approve', [DisbursementController::class, 'approve'])
        ->middleware('role:Pengurus Cawangan|Pegawai Kredit|Pentadbir Sistem');

    Route::post('/disbursements/{id}/send-esign', [DisbursementController::class, 'sendReminder'])
        ->middleware('role:Pengurus Cawangan|Pegawai Kredit|Pentadbir Sistem');

    Route::post('/disbursements/{id}/esign', [DisbursementController::class, 'sendReminder'])
        ->middleware('role:Pengurus Cawangan|Pegawai Kredit|Pentadbir Sistem');

    Route::get('/disbursements/{id}/offer-letter', [DisbursementController::class, 'offerLetterData']);

    Route::post('/disbursements/{id}/send-otp', [DisbursementController::class, 'sendApprovalOtp'])
        ->middleware('role:Pengurus Cawangan|Pegawai Kredit|Pentadbir Sistem');

    Route::post('/disbursements/{id}/verify-otp-approve', [DisbursementController::class, 'verifyOtpAndApprove'])
        ->middleware('role:Pengurus Cawangan|Pegawai Kredit|Pentadbir Sistem');

    Route::post('/disbursements/{id}/confirm-payment', [DisbursementController::class, 'confirmPayment'])
        ->middleware('role:Pengurus Cawangan|Pegawai Kredit|Pentadbir Sistem');
});
