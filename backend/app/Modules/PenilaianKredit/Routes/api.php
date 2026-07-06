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

    // Role-based actions — role check done in controller to support both Spatie and direct-DB users
    Route::post('/applications/{id}/approve', [CreditAssessmentController::class, 'approve']);
    Route::post('/applications/{id}/reject', [CreditAssessmentController::class, 'reject']);
    Route::post('/applications/{id}/kuari', [CreditAssessmentController::class, 'kuari']);

    Route::get('/applications/{id}/offer-letter', [CreditAssessmentController::class, 'offerLetter']);

    // FIX: New AI Report endpoint — generates comprehensive AI narrative via Gemini 3.1 Pro
    Route::post('/applications/{id}/ai-report', [CreditAssessmentController::class, 'aiReport']);
});
