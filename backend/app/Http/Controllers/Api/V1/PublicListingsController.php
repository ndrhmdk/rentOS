<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Discovery\EligibleUnitQuery;
use App\Domain\Discovery\ListingPresentation;
use App\Domain\Discovery\ListingSearchCriteria;
use App\Domain\Discovery\LocationQuery;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\PublicListingIndexRequest;
use App\Http\Requests\Api\V1\PublicListingShowRequest;
use App\Http\Resources\PublicListingCardResource;
use App\Http\Resources\PublicListingDetailResource;
use App\Models\Listing;
use App\Services\ListingCacheService;
use Carbon\CarbonImmutable;
use Dedoc\Scramble\Attributes\Header;
use Dedoc\Scramble\Attributes\HeaderParameter;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PublicListingsController extends Controller
{
    #[HeaderParameter('If-None-Match', 'ETag from a previous response; a match returns 304 with no body.', required: false)]
    #[Header('Cache-Control', 'public, max-age=30, stale-while-revalidate=60 on success; no-store, private on errors.', example: 'max-age=30, public, stale-while-revalidate=60')]
    #[Header('ETag', 'Weak validator over the response body. Changes whenever the cached search is invalidated.', example: 'W/"3f786850e387550fdab836ed7e6dc881de23001b"')]
    #[Header('X-Cache', 'HIT when served from the server-side listing cache, MISS when freshly queried.', example: 'MISS')]
    #[Response(304, description: 'Not modified: the If-None-Match ETag still matches.')]
    public function index(
        PublicListingIndexRequest $request,
        ListingPresentation $presentation,
        ListingCacheService $cache,
    ): JsonResponse {
        $criteria = $this->criteria($request);

        $cached = $cache->getSearch($criteria);
        if ($cached !== null) {
            $cachedIds = $cached['listing_ids'] ?? [];
            if ($cachedIds === []) {
                return response()->json([
                    'data' => $cached['data'],
                    'meta' => $cached['meta'],
                ])->header('X-Cache', 'HIT');
            }

            // Fresh visibility gate: ensure all cached listings remain publicly visible
            $visibleCount = Listing::query()->publiclyVisible()->whereIn('id', $cachedIds)->count();
            if ($visibleCount === count($cachedIds)) {
                return response()->json([
                    'data' => $cached['data'],
                    'meta' => $cached['meta'],
                ])->header('X-Cache', 'HIT');
            }
        }

        return DB::transaction(function () use ($criteria, $presentation, $cache): JsonResponse {
            ['ids' => $pageIds, 'total' => $total] = EligibleUnitQuery::matchingListingPage($criteria);
            $listings = $presentation->cardsFor($pageIds, $criteria);

            $meta = [
                'current_page' => $criteria->page,
                'per_page' => $criteria->perPage,
                'total' => $total,
                'last_page' => max(1, (int) ceil($total / $criteria->perPage)),
            ];

            if ($criteria->moveInDate !== null) {
                $meta['result_label'] = $total.' tin đăng còn trống từ '.CarbonImmutable::parse($criteria->moveInDate)->format('d/m/Y');
            }

            $data = PublicListingCardResource::collection($listings)->resolve();

            $cache->putSearch($criteria, [
                'data' => $data,
                'meta' => $meta,
                'listing_ids' => $pageIds,
            ]);

            return response()->json([
                'data' => $data,
                'meta' => $meta,
            ])->header('X-Cache', 'MISS');
        });
    }

    #[HeaderParameter('If-None-Match', 'ETag from a previous response; a match returns 304 with no body.', required: false)]
    #[Header('Cache-Control', 'public, no-cache: browsers must revalidate every time, so a hidden or suspended listing returns 404 instead of a stale copy.', example: 'no-cache, public')]
    #[Header('ETag', 'Weak validator over the response body.', example: 'W/"3f786850e387550fdab836ed7e6dc881de23001b"')]
    #[Header('X-Cache', 'HIT when served from the server-side listing cache, MISS when freshly queried.', example: 'HIT')]
    #[Response(304, description: 'Not modified: the listing is still public and unchanged.')]
    #[Response(404, description: 'The listing does not exist or is no longer publicly visible.', type: 'array{message: string}')]
    public function show(
        PublicListingShowRequest $request,
        string $listing,
        ListingPresentation $presentation,
        ListingCacheService $cache,
    ): JsonResponse {
        // Fresh visibility gate: check current live status directly before reading cache
        if (! Listing::query()->publiclyVisible()->whereKey($listing)->exists()) {
            abort(404);
        }

        $cached = $cache->getDetail($listing);
        if ($cached !== null) {
            return response()->json([
                'data' => $cached,
            ])->header('X-Cache', 'HIT');
        }

        return DB::transaction(function () use ($listing, $presentation, $cache): JsonResponse {
            $model = Listing::query()->with('property.owner')->find($listing);
            if (! $model instanceof Listing || ! Listing::query()->publiclyVisible()->whereKey($model->id)->exists()) {
                abort(404);
            }

            $presentation->prepareDetail($model);
            $resource = new PublicListingDetailResource($model);
            /** @var array<string, mixed> $data */
            $data = $resource->response()->getData(true)['data'];
            $cache->putDetail($listing, $data);

            return response()->json([
                'data' => $data,
            ])->header('X-Cache', 'MISS');
        });
    }

    private function criteria(PublicListingIndexRequest $request): ListingSearchCriteria
    {
        /** @var list<string> $amenities */
        $amenities = array_values($request->input('amenities', []));

        $ward = LocationQuery::fromInput(
            $request->input('ward') ?? $request->input('location'),
        );
        $street = LocationQuery::fromInput($request->input('street'));

        return new ListingSearchCriteria(
            ward: $ward,
            street: $street,
            moveInDate: $request->input('move_in_date'),
            minRent: $request->filled('min_rent') ? $request->integer('min_rent') : null,
            maxRent: $request->filled('max_rent') ? $request->integer('max_rent') : null,
            unitKind: $request->input('unit_kind'),
            bedrooms: $request->filled('bedrooms') ? $request->integer('bedrooms') : null,
            bathrooms: $request->filled('bathrooms') ? $request->integer('bathrooms') : null,
            occupants: $request->filled('occupants') ? $request->integer('occupants') : null,
            amenityKeys: $amenities,
            pets: $request->input('pets'),
            page: $request->integer('page', 1),
            perPage: $request->integer('per_page', 12),
        );
    }
}
