<?php

use App\Http\Controllers\Api\V1\ApiTokenController;
use App\Http\Controllers\Api\V1\CurrentUserController;
use App\Http\Controllers\Api\V1\ProfileController;
use Illuminate\Support\Facades\Route;

// The api group enforces auth:sanctum, active/verified account and credential mode by default.
Route::prefix('v1')->group(function (): void {
    Route::get('me', CurrentUserController::class)->name('account.me');
    Route::patch('profile', [ProfileController::class, 'update'])->name('account.profile.update');
    Route::prefix('account/api-tokens')->name('account.api-tokens.')->group(function (): void {
        Route::get('/', [ApiTokenController::class, 'index'])->name('index');
        Route::middleware(['password.recent', 'throttle:account-security'])->group(function (): void {
            Route::post('/', [ApiTokenController::class, 'store'])->name('store');
            Route::delete('/{id}', [ApiTokenController::class, 'destroy'])->name('destroy');
        });
    });
    // Q&A-02 (Khai): integrate real M04/admin routes here with resource Policies.
    // Route::middleware('account.admin')->prefix('admin')->group(...);
});
