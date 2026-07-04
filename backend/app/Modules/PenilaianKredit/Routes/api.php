<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CreditAssessmentController;

/**
 * Module 2 — Penilaian Kredit Routes
 */
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/credit-assessments', [CreditAssessmentController::class, 'index']);
    Route::post('/credit-assessments', [CreditAssessmentController::class, 'store']);
    Route::get('/credit-assessments/{id}', [CreditAssessmentController::class, 'show']);
    Route::put('/credit-assessments/{id}', [CreditAssessmentController::class, 'update']);
    Route::post('/credit-assessments/{id}/approve', [CreditAssessmentController::class, 'approve']);
    Route::post('/credit-assessments/{id}/reject', [CreditAssessmentController::class, 'reject']);
    Route::get('/credit-assessments/{id}/offer-letter', [CreditAssessmentController::class, 'offerLetter']);
    Route::post('/credit-assessments/{id}/amortization', [CreditAssessmentController::class, 'amortization']);
});
