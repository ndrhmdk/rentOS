<?php

use App\Http\Controllers\Api\V1\CurrentUserController;
use App\Http\Controllers\Api\V1\RoleStatusController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'app' => 'rentOS',
    ]);
});

Route::middleware('auth:sanctum')->prefix('v1')->group(function (): void {
    Route::get('/me', [CurrentUserController::class, 'show'])->name('api.v1.me.show');
    Route::patch('/me', [CurrentUserController::class, 'update'])->name('api.v1.me.update');
    Route::get('/me/role-status', [RoleStatusController::class, 'show'])->name('api.v1.me.role-status');
});
