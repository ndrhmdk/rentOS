<?php

namespace App\Services;

use App\Domain\Discovery\ListingSearchCriteria;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ListingCacheService
{
    public const int DEFAULT_TTL_SECONDS = 3600;

    public const string SEARCH_VERSION_KEY = 'listings:search_version';

    public function getSearchVersion(): int
    {
        return (int) Cache::get(self::SEARCH_VERSION_KEY, 1);
    }

    public function bumpSearchVersion(): int
    {
        if (! Cache::add(self::SEARCH_VERSION_KEY, 2)) {
            return (int) Cache::increment(self::SEARCH_VERSION_KEY);
        }

        return 2;
    }

    public function searchKey(ListingSearchCriteria $criteria): string
    {
        $amenities = $criteria->amenityKeys;
        sort($amenities);

        $payload = [
            'ward' => $criteria->ward?->value(),
            'street' => $criteria->street?->value(),
            'move_in_date' => $criteria->moveInDate,
            'min_rent' => $criteria->minRent,
            'max_rent' => $criteria->maxRent,
            'unit_kind' => $criteria->unitKind,
            'bedrooms' => $criteria->bedrooms,
            'bathrooms' => $criteria->bathrooms,
            'occupants' => $criteria->occupants,
            'amenities' => $amenities,
            'pets' => $criteria->pets,
            'page' => $criteria->page,
            'per_page' => $criteria->perPage,
        ];

        $hash = hash('sha256', json_encode($payload, JSON_THROW_ON_ERROR));
        $version = $this->getSearchVersion();

        return "listings:search:v{$version}:{$hash}";
    }

    /**
     * @return array{data: array<int, mixed>, meta: array<string, mixed>, listing_ids: list<string>}|null
     */
    public function getSearch(ListingSearchCriteria $criteria): ?array
    {
        $cached = Cache::get($this->searchKey($criteria));

        return is_array($cached) ? $cached : null;
    }

    /**
     * @param  array{data: array<int, mixed>, meta: array<string, mixed>, listing_ids: list<string>}  $data
     */
    public function putSearch(ListingSearchCriteria $criteria, array $data, int $ttlSeconds = self::DEFAULT_TTL_SECONDS): void
    {
        Cache::put($this->searchKey($criteria), $data, $ttlSeconds);
    }

    public function detailKey(string $listingId): string
    {
        return "listings:detail:v1:{$listingId}";
    }

    /**
     * @return array<string, mixed>|null
     */
    public function getDetail(string $listingId): ?array
    {
        $cached = Cache::get($this->detailKey($listingId));

        return is_array($cached) ? $cached : null;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function putDetail(string $listingId, array $data, int $ttlSeconds = self::DEFAULT_TTL_SECONDS): void
    {
        Cache::put($this->detailKey($listingId), $data, $ttlSeconds);
    }

    public function invalidateListing(string $listingId): void
    {
        DB::afterCommit(function () use ($listingId): void {
            Cache::forget($this->detailKey($listingId));
            $this->bumpSearchVersion();
        });
    }

    public function invalidateProperty(string $propertyId): void
    {
        DB::afterCommit(function () use ($propertyId): void {
            $listingIds = DB::table('listings')
                ->where('property_id', $propertyId)
                ->pluck('id');

            foreach ($listingIds as $listingId) {
                Cache::forget($this->detailKey((string) $listingId));
            }

            $this->bumpSearchVersion();
        });
    }

    public function invalidateUnit(string $unitId): void
    {
        DB::afterCommit(function () use ($unitId): void {
            $propertyId = DB::table('units')
                ->where('id', $unitId)
                ->value('property_id');

            if ($propertyId !== null) {
                $listingIds = DB::table('listings')
                    ->where('property_id', (string) $propertyId)
                    ->pluck('id');

                foreach ($listingIds as $listingId) {
                    Cache::forget($this->detailKey((string) $listingId));
                }
            }

            $this->bumpSearchVersion();
        });
    }

    public function invalidateSearch(): void
    {
        DB::afterCommit(function (): void {
            $this->bumpSearchVersion();
        });
    }

    public function flushAll(): void
    {
        $this->bumpSearchVersion();
    }
}
