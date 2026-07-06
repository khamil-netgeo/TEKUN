<?php

use Illuminate\Support\Facades\Route;
use App\Modules\PenilaianKredit\Controllers\CreditAssessmentController;

/**
 * Module 2 — Penilaian Risiko & Skor Kredit Routes
 * These routes are automatically loaded by AppServiceProvider
 */

Route::middleware(['auth:sanctum'])->group(function () {
    // POC Requirements endpoints
    Route::get('/applications', [CreditAssessmentController::class, 'index']);
    Route::get('/applications/{id}/credit-score', [CreditAssessmentController::class, 'creditScore']);
    Route::get('/applications/{id}/amortization', [CreditAssessmentController::class, 'amortization']);
    
    Route::middleware(['role:credit_officer|manager'])->group(function () {
        Route::post('/applications/{id}/approve', [CreditAssessmentController::class, 'approve']);
        Route::post('/applications/{id}/reject', [CreditAssessmentController::class, 'reject']);
        Route::post('/applications/{id}/kuari', [CreditAssessmentController::class, 'kuari']);
    });
    
    Route::get('/applications/{id}/offer-letter', [CreditAssessmentController::class, 'offerLetter']);
});