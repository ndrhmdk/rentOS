<?php

use App\Http\Controllers\Api\V1\OwnerSummaryController;
use App\Http\Middleware\DenyPersonalAccessToken;
use Illuminate\Support\Facades\Route;

Route::get('v1/owner/summary', [OwnerSummaryController::class, 'show'])
    ->middleware(['auth:sanctum', 'throttle:api', DenyPersonalAccessToken::class])
    ->name('api.v1.owner.summary');

Route::get('v1/owner/summary/properties', [OwnerSummaryController::class, 'properties'])
    ->middleware(['auth:sanctum', 'throttle:api', DenyPersonalAccessToken::class])
    ->name('api.v1.owner.summary.properties');
