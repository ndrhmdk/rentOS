<?php

namespace App\Http\Resources;

use App\Models\Listing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Listing
 */
class AdminListingReviewResource extends JsonResource
{
    public function withResponse(Request $request, JsonResponse $response): void
    {
        $response->headers->set('Cache-Control', 'private, no-store');
    }

    public function toArray(Request $request): array
    {
        return $this->resource;
    }
}
