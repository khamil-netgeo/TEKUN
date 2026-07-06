<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
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
    
    Route::get('/applications/{id}/offer-letter', function ($id) {
        $application = DB::table('applications')->where('id', $id)->first();
        
        if (!$application) {
            return response()->json([
                'success' => false,
                'message' => 'Application not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'pdf_url' => 'https://mock-minio.local/offer-letters/application-' . $id . '.pdf'
        ], 200);
    });
});