<?php

use App\Modules\UsahawanPortal\Controllers\UsahawanController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Usahawan Portal API Routes
|--------------------------------------------------------------------------
| Auto-loaded by AppServiceProvider. Prefixed with /api.
| Role check (usahawan only) is enforced inside each controller method.
*/

Route::middleware(['auth:sanctum'])->group(function () {
    // Dashboard summary
    Route::get('/usahawan/dashboard',       [UsahawanController::class, 'dashboard']);

    // My applications list (with search + status filter)
    Route::get('/usahawan/my-applications', [UsahawanController::class, 'myApplications']);

    // My financing account (360 view + payment history + schedule)
    Route::get('/accounts/my',              [UsahawanController::class, 'myAccount']);

    // Submit a payment
    Route::post('/accounts/my/payment',     [UsahawanController::class, 'storePayment']);

    // Submit a moratorium request
    Route::post('/accounts/my/moratorium',  [UsahawanController::class, 'storeMoratorium']);
});
