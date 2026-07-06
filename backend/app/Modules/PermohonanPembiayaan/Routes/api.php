<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ApplicationController;

/**
 * Module 1 — Permohonan Pembiayaan Routes
 * Loaded automatically via AppServiceProvider dynamic route loading.
 * DO NOT modify routes/api.php directly.
 *
 * NOTE: Core CRUD routes (index, store, show, update, submit, timeline, uploadDocuments)
 * are already defined in routes/api.php. This file only adds Module 1-specific
 * endpoints that are NOT in the core routes file.
 */
Route::middleware(['auth:sanctum', 'module:module1'])->group(function () {

    // ─── Eligibility check (preview, without submitting) ─────────────────────
    Route::match(['GET', 'POST'], '/applications/{id}/check-eligibility', [ApplicationController::class, 'checkEligibility']);

    // ─── Document management (delete) ────────────────────────────────────────
    Route::delete('/applications/{id}/documents/{docId}', [ApplicationController::class, 'deleteDocument']);

    // ─── Integration checks by IC number (6 external APIs, mock for POC) ─────
    Route::get('/integrations/check/{icNumber}', [ApplicationController::class, 'checkIntegrations']);

    // ─── AI document check (module-specific alias) ────────────────────────────
    Route::post('/ai/document-check', [ApplicationController::class, 'aiDocumentCheck']);
});
