<?php
use Illuminate\Support\Facades\Route;

// Named login route required by Sanctum/Auth middleware
Route::get('/login', function () {
    return response()->json(['message' => 'Unauthenticated.'], 401);
})->name('login');

Route::get('/', function () {
    return response()->json(['message' => 'SPPT API v1.0', 'status' => 'running']);
});
