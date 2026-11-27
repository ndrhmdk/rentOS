<?php

use App\Http\Controllers\Api\V1\AdminListingReportsController;
use App\Http\Controllers\Api\V1\AdminListingSuspensionController;
use App\Http\Controllers\Api\V1\ListingReportsController;
use App\Http\Controllers\Api\V1\TenantReportsController;
use App\Http\Middleware\EnsureAdminSession;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'throttle:api'])->prefix('v1')->name('api.v1.')->group(function (): void {
    // Listing Reports (Reporter Flow)
    Route::post('/listings/{listing}/reports', [ListingReportsController::class, 'store'])
        ->middleware('throttle:10,1')
        ->whereUuid('listing')
        ->name('listings.reports.store');
    Route::get('/tenant/reports', [TenantReportsController::class, 'index'])->name('tenant.reports.index');
    Route::get('/tenant/reports/{report}', [TenantReportsController::class, 'show'])
        ->whereUuid('report')
        ->name('tenant.reports.show');

    // Admin Listing Reports & Suspension Flow (session-only + non-disclosure 404 for non-admins)
    Route::middleware(EnsureAdminSession::class.':404')->group(function (): void {
        Route::get('/admin/listing-reports', [AdminListingReportsController::class, 'index'])->name('admin.listing-reports.index');
        Route::get('/admin/listing-reports/{report}', [AdminListingReportsController::class, 'show'])
            ->whereUuid('report')
            ->name('admin.listing-reports.show');
        Route::post('/admin/listing-reports/{report}/start-review', [AdminListingReportsController::class, 'startReview'])
            ->whereUuid('report')
            ->name('admin.listing-reports.start-review');
        Route::post('/admin/listing-reports/{report}/resolve', [AdminListingReportsController::class, 'resolve'])
            ->whereUuid('report')
            ->name('admin.listing-reports.resolve');
        Route::post('/admin/listing-reports/{report}/dismiss', [AdminListingReportsController::class, 'dismiss'])
            ->whereUuid('report')
            ->name('admin.listing-reports.dismiss');

        Route::post('/admin/listings/{listing}/suspend', [AdminListingSuspensionController::class, 'suspend'])
            ->whereUuid('listing')
            ->name('admin.listings.suspend');
        Route::post('/admin/listings/{listing}/restore', [AdminListingSuspensionController::class, 'restore'])
            ->whereUuid('listing')
            ->name('admin.listings.restore');
    });
});
