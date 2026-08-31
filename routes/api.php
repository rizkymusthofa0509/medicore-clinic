<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SettingController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::get('/ping', function () {
    return response()->json([
        'success' => true,
        'message' => 'pong',
        'timestamp' => now()->toIso8601String(),
    ]);
});

Route::post('/login', [AuthController::class, 'login']);

// Protected routes (require Sanctum auth)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Settings
    Route::prefix('settings')->group(function () {
        // Branch
        Route::get('/branches', [SettingController::class, 'getBranches']);
        Route::post('/branches', [SettingController::class, 'storeBranch']);
        Route::put('/branches/{id}', [SettingController::class, 'updateBranch']);
        Route::delete('/branches/{id}', [SettingController::class, 'deleteBranch']);

        // User
        Route::get('/users', [SettingController::class, 'getUsers']);
        Route::post('/users', [SettingController::class, 'storeUser']);
        Route::put('/users/{id}', [SettingController::class, 'updateUser']);
        Route::delete('/users/{id}', [SettingController::class, 'deleteUser']);

        // User Branches (multi-branch)
        Route::get('/users/{userId}/branches', [SettingController::class, 'getUserBranches']);
        Route::post('/users/{userId}/branches', [SettingController::class, 'syncUserBranches']);
    });
});
