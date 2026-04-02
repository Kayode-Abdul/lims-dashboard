<?php

use App\Http\Controllers\Api\DesktopAuthController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\TestOrderController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Desktop App Auth
Route::post('/desktop/login', [DesktopAuthController::class , 'login']);

Route::middleware(['auth:sanctum', 'lab.subscription'])->name('api.')->group(function () {
    Route::post('/logout', [DesktopAuthController::class , 'logout']);

    // User Info
    Route::get('/user', function (Request $request) {
            return $request->user()->load('lab');
        }
        )->name('user');

        // Lab Data API (Mapped to existing controllers but returning JSON)
        Route::apiResource('patients', PatientController::class);
        Route::apiResource('test-orders', TestOrderController::class);
    });
// Offline Desktop Sync Engine
Route::prefix('sync')->group(function () {
    Route::post('/push', [\App\Http\Controllers\Api\SyncController::class , 'push']);
    Route::get('/pull', [\App\Http\Controllers\Api\SyncController::class , 'pull']);
    Route::post('/login', [\App\Http\Controllers\Api\SyncController::class , 'login']);
}
);