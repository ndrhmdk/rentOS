<?php

use App\Http\Controllers\Api\V1\AdminListingsController;
use App\Http\Controllers\Api\V1\CurrentUserController;
use App\Http\Controllers\Api\V1\OwnerAmenityCatalogController;
use App\Http\Controllers\Api\V1\OwnerListingsController;
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
    Route::get('/amenities', [OwnerAmenityCatalogController::class, 'index'])->name('api.v1.amenities.index');
    Route::get('/tenant/tenancies', [TenantTenanciesController::class, 'index'])->name('api.v1.tenant.tenancies');
    Route::get('/owner/properties', [OwnerPropertiesController::class, 'index'])->name('api.v1.owner.properties');
    Route::post('/owner/properties', [OwnerPropertiesController::class, 'store'])->name('api.v1.owner.properties.store');
    Route::get('/owner/properties/{property}', [OwnerPropertiesController::class, 'show'])->name('api.v1.owner.properties.show');
    Route::put('/owner/properties/{property}', [OwnerPropertiesController::class, 'update'])->name('api.v1.owner.properties.update');
    Route::patch('/owner/properties/{property}', [OwnerPropertiesController::class, 'update'])->name('api.v1.owner.properties.patch');
    Route::patch('/owner/properties/{property}/archive', [OwnerPropertiesController::class, 'archive'])->name('api.v1.owner.properties.archive');
    Route::post('/owner/properties/{property}/units', [OwnerPropertiesController::class, 'storeUnit'])->name('api.v1.owner.properties.units.store');
    Route::patch('/owner/properties/{property}/units/{unit}', [OwnerPropertiesController::class, 'updateUnit'])->name('api.v1.owner.properties.units.update');
    Route::patch('/owner/properties/{property}/units/{unit}/archive', [OwnerPropertiesController::class, 'archiveUnit'])->name('api.v1.owner.properties.units.archive');
    Route::post('/owner/properties/{property}/units/bulk', [OwnerPropertiesController::class, 'storeUnitsBatch'])->name('api.v1.owner.properties.units.bulk');
    Route::post('/owner/properties/{property}/media', [OwnerPropertiesController::class, 'storeMedia'])->name('api.v1.owner.properties.media.store');
    Route::get('/owner/properties/{property}/media', [OwnerPropertiesController::class, 'indexMedia'])->name('api.v1.owner.properties.media.index');
    Route::put('/owner/properties/{property}/gallery', [OwnerPropertiesController::class, 'updateGallery'])->name('api.v1.owner.properties.gallery.update');
    Route::delete('/owner/properties/{property}/media/{media}', [OwnerPropertiesController::class, 'archiveMedia'])->name('api.v1.owner.properties.media.archive');
    Route::get('/owner/properties/{property}/listing', [OwnerListingsController::class, 'show'])->name('api.v1.owner.properties.listing.show');
    Route::post('/owner/properties/{property}/listing', [OwnerListingsController::class, 'store'])->name('api.v1.owner.properties.listing.store');
    Route::patch('/owner/properties/{property}/listing', [OwnerListingsController::class, 'update'])->name('api.v1.owner.properties.listing.update');
    Route::post('/owner/properties/{property}/listing/submit', [OwnerListingsController::class, 'submit'])->name('api.v1.owner.properties.listing.submit');
    Route::post('/owner/properties/{property}/listing/publish', [OwnerListingsController::class, 'publish'])->name('api.v1.owner.properties.listing.publish');
    Route::post('/owner/properties/{property}/listing/hide', [OwnerListingsController::class, 'hide'])->name('api.v1.owner.properties.listing.hide');
    Route::post('/owner/properties/{property}/listing/archive', [OwnerListingsController::class, 'archive'])->name('api.v1.owner.properties.listing.archive');
    Route::get('/admin/listings/pending', [AdminListingsController::class, 'pending'])->name('api.v1.admin.listings.pending');
    Route::post('/admin/listings/{listing}/approve', [AdminListingsController::class, 'approve'])->name('api.v1.admin.listings.approve');
    Route::post('/admin/listings/{listing}/reject', [AdminListingsController::class, 'reject'])->name('api.v1.admin.listings.reject');
});
