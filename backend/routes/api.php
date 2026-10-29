<?php

use App\Http\Controllers\Api\V1\CurrentUserController;
use App\Http\Controllers\Api\V1\OwnerPropertiesController;
use App\Http\Controllers\Api\V1\TenantTenanciesController;
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
    Route::get('/tenant/tenancies', [TenantTenanciesController::class, 'index'])->name('api.v1.tenant.tenancies');
    Route::get('/owner/properties', [OwnerPropertiesController::class, 'index'])->name('api.v1.owner.properties');
    Route::post('/owner/properties', [OwnerPropertiesController::class, 'store'])->name('api.v1.owner.properties.store');
    Route::get('/owner/properties/{property}', [OwnerPropertiesController::class, 'show'])->name('api.v1.owner.properties.show');
    Route::put('/owner/properties/{property}', [OwnerPropertiesController::class, 'update'])->name('api.v1.owner.properties.update');
    Route::patch('/owner/properties/{property}', [OwnerPropertiesController::class, 'update'])->name('api.v1.owner.properties.patch');
    Route::patch('/owner/properties/{property}/archive', [OwnerPropertiesController::class, 'archive'])->name('api.v1.owner.properties.archive');
    Route::post('/owner/properties/{property}/units', [OwnerPropertiesController::class, 'storeUnit'])->name('api.v1.owner.properties.units.store');
});