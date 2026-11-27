<?php

use App\Http\Controllers\Api\V1\AmenitiesController;
use App\Http\Controllers\Api\V1\LocationsController;
use App\Http\Controllers\Api\V1\PublicListingsController;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

/*
 * Public reads never touch the session, so the Sanctum stateful stack is skipped:
 * responses carry no Set-Cookie and can be cached publicly (see PublicCacheHeaders).
 */
Route::middleware('throttle:public-api')
    ->withoutMiddleware(EnsureFrontendRequestsAreStateful::class)
    ->prefix('v1')
    ->group(function (): void {
        Route::get('/listings', [PublicListingsController::class, 'index'])->name('api.v1.listings.index')
            ->middleware('public.cache:30,60');
        Route::get('/listings/{listing}', [PublicListingsController::class, 'show'])->name('api.v1.listings.show')
            ->middleware('public.cache:revalidate');
        Route::get('/amenities', [AmenitiesController::class, 'index'])->name('api.v1.amenities.index')
            ->middleware('public.cache:3600,86400');
        Route::get('/locations/provinces', [LocationsController::class, 'provinces'])->name('api.v1.locations.provinces')
            ->middleware('public.cache:3600,86400');
        Route::get('/locations/provinces/{provinceCode}/wards', [LocationsController::class, 'wards'])->name('api.v1.locations.wards')
            ->middleware('public.cache:3600,86400');
    });
