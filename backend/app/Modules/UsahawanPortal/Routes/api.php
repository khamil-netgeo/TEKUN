<?php

use Illuminate\Support\Facades\Route;
use App\Modules\UsahawanPortal\Controllers\UsahawanPortalController;

/*
|--------------------------------------------------------------------------
| Usahawan Portal API Routes
|--------------------------------------------------------------------------
|
| These routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware(['auth:sanctum', 'role:usahawan'])->group(function () {
    // Borrower's Dashboard
    Route::get('usahawan/dashboard', [UsahawanPortalController::class, 'dashboard']);

    // Borrower's Account Details
    Route::get('accounts/my', [UsahawanPortalController::class, 'myAccount']);
    Route::get('accounts/my/summary', [UsahawanPortalController::class, 'myAccountSummary']);

    // Borrower's Applications
    Route::get('applications/mine', [UsahawanPortalController::class, 'myApplications']);

    // Moratorium Request
    Route::post('accounts/my/moratorium', [UsahawanPortalController::class, 'submitMoratorium']);
});