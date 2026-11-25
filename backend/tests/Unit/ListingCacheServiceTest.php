<?php

namespace Tests\Unit;

use App\Domain\Discovery\ListingSearchCriteria;
use App\Services\ListingCacheService;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class ListingCacheServiceTest extends TestCase
{
    private ListingCacheService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new ListingCacheService;
        Cache::flush();
    }

    public function test_amenity_keys_order_invariance_produces_identical_search_key(): void
    {
        $criteria1 = new ListingSearchCriteria(
            ward: null,
            street: null,
            moveInDate: '2026-12-01',
            minRent: 3000000,
            maxRent: 8000000,
            unitKind: 'STUDIO',
            bedrooms: 1,
            bathrooms: 1,
            occupants: 2,
            amenityKeys: ['wifi', 'air_conditioning', 'washing_machine', 'balcony'],
            pets: 'ALLOWED',
            page: 1,
            perPage: 12,
        );

        $criteria2 = new ListingSearchCriteria(
            ward: null,
            street: null,
            moveInDate: '2026-12-01',
            minRent: 3000000,
            maxRent: 8000000,
            unitKind: 'STUDIO',
            bedrooms: 1,
            bathrooms: 1,
            occupants: 2,
            amenityKeys: ['balcony', 'washing_machine', 'wifi', 'air_conditioning'],
            pets: 'ALLOWED',
            page: 1,
            perPage: 12,
        );

        $key1 = $this->service->searchKey($criteria1);
        $key2 = $this->service->searchKey($criteria2);

        $this->assertSame($key1, $key2, 'Cache key must be invariant to amenity keys ordering in query parameters.');
    }

    public function test_pagination_produces_distinct_search_keys(): void
    {
        $criteriaPage1 = new ListingSearchCriteria(
            ward: null,
            street: null,
            moveInDate: null,
            minRent: null,
            maxRent: null,
            unitKind: null,
            bedrooms: null,
            bathrooms: null,
            occupants: null,
            amenityKeys: ['wifi'],
            pets: null,
            page: 1,
            perPage: 12,
        );

        $criteriaPage2 = new ListingSearchCriteria(
            ward: null,
            street: null,
            moveInDate: null,
            minRent: null,
            maxRent: null,
            unitKind: null,
            bedrooms: null,
            bathrooms: null,
            occupants: null,
            amenityKeys: ['wifi'],
            pets: null,
            page: 2,
            perPage: 12,
        );

        $key1 = $this->service->searchKey($criteriaPage1);
        $key2 = $this->service->searchKey($criteriaPage2);

        $this->assertNotSame($key1, $key2, 'Page 1 and Page 2 must have distinct cache keys.');
    }

    public function test_bump_search_version_invalidates_all_previous_search_keys(): void
    {
        $criteria = new ListingSearchCriteria(
            ward: null,
            street: null,
            moveInDate: null,
            minRent: null,
            maxRent: null,
            unitKind: null,
            bedrooms: null,
            bathrooms: null,
            occupants: null,
            amenityKeys: [],
            pets: null,
            page: 1,
            perPage: 12,
        );

        $keyV1 = $this->service->searchKey($criteria);
        $this->assertStringStartsWith('listings:search:v1:', $keyV1);

        $newVersion = $this->service->bumpSearchVersion();
        $this->assertSame(2, $newVersion);

        $keyV2 = $this->service->searchKey($criteria);
        $this->assertStringStartsWith('listings:search:v2:', $keyV2);
        $this->assertNotSame($keyV1, $keyV2);
    }

    public function test_invalidate_listing_clears_detail_cache_and_bumps_search_version(): void
    {
        $listingId = 'list-uuid-123';
        $detailData = ['id' => $listingId, 'title' => 'Test Listing'];

        $this->service->putDetail($listingId, $detailData);
        $this->assertSame($detailData, $this->service->getDetail($listingId));

        $this->assertSame(1, $this->service->getSearchVersion());

        $this->service->invalidateListing($listingId);

        $this->assertNull($this->service->getDetail($listingId));
        $this->assertSame(2, $this->service->getSearchVersion());
    }
}
