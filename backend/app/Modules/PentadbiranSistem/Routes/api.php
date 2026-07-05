<?php

use Illuminate\Support\Facades\Route;
use App\Modules\PentadbiranSistem\Controllers\UserController;

/**
 * Module 12 — Pentadbiran Sistem Routes
 *
 * All routes protected by:
 *   - auth:sanctum  : requires valid Sanctum token
 *   - role:Pentadbir Sistem : requires system_admin Spatie role
 *
 * NOTE: This file is auto-loaded by AppServiceProvider dynamic route loader.
 * Do NOT add these routes to routes/api.php directly.
 */
Route::middleware(['auth:sanctum', 'role:Pentadbir Sistem'])->group(function () {

    // ── User Management ──────────────────────────────────────────────────────
    Route::get('/users',                         [UserController::class, 'index']);
    Route::post('/users',                        [UserController::class, 'store']);
    Route::get('/users/stats',                   [UserController::class, 'stats']);
    Route::get('/users/{id}',                    [UserController::class, 'show']);
    Route::put('/users/{id}',                    [UserController::class, 'update']);
    Route::post('/users/{id}/suspend',           [UserController::class, 'suspend']);
    Route::post('/users/{id}/activate',          [UserController::class, 'activate']);
    Route::post('/users/{id}/reset-password',    [UserController::class, 'resetPassword']);

    // ── Role Management ──────────────────────────────────────────────────────
    Route::get('/roles',                         [UserController::class, 'roles']);

});
