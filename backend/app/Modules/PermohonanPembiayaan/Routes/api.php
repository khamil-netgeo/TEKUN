<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ApplicationController;

/**
 * Module 1 — Permohonan Pembiayaan Routes
 * Loaded automatically via AppServiceProvider dynamic route loading.
 * DO NOT modify routes/api.php directly.
 */
Route::middleware(['auth:sanctum'])->group(function () {

    // Application CRUD
    Route::get('/applications', [ApplicationController::class, 'index']);
    Route::post('/applications', [ApplicationController::class, 'store']);
    Route::get('/applications/{id}', [ApplicationController::class, 'show']);
    Route::put('/applications/{id}', [ApplicationController::class, 'update']);
    Route::delete('/applications/{id}', [ApplicationController::class, 'destroy']);

    // Application workflow
    Route::post('/applications/{id}/submit', [ApplicationController::class, 'submit']);
    Route::post('/applications/{id}/auto-reject', [ApplicationController::class, 'autoReject']);
    Route::get('/applications/{id}/timeline', [ApplicationController::class, 'timeline']);

    // Document management
    Route::post('/applications/{id}/documents', [ApplicationController::class, 'uploadDocument']);
    Route::delete('/applications/{id}/documents/{docId}', [ApplicationController::class, 'deleteDocument']);

    // AI document check
    Route::post('/ai/document-check', [ApplicationController::class, 'aiDocumentCheck']);
});
