<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuditController;

/**
 * Module 11 — Audit & Kawalan Dalaman Routes
 * All routes require auth:sanctum.
 * Privileged routes (stats, anomalies, export) additionally require
 * Pentadbir Sistem or Eksekutif role (enforced in controller).
 *
 * NOTE: Static routes (anomalies, stats, export) MUST be defined BEFORE
 * the dynamic {id} route to prevent route shadowing.
 */
Route::middleware(['auth:sanctum'])->group(function () {
    // Static routes first (before {id} wildcard)
    Route::get('/audit-logs/anomalies', [AuditController::class, 'anomalies']);
    Route::get('/audit-logs/stats',     [AuditController::class, 'stats']);
    Route::post('/audit-logs/export',   [AuditController::class, 'export']);

    // Dynamic routes after
    Route::get('/audit-logs',           [AuditController::class, 'index']);
    Route::get('/audit-logs/{id}',      [AuditController::class, 'show']);
});
