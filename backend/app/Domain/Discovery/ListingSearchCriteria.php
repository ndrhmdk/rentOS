<?php

namespace App\Domain\Discovery;

final class ListingSearchCriteria
{
    /**
     * @param  list<string>  $amenityKeys
     */
    public function __construct(
        public ?LocationQuery $ward,
        public ?LocationQuery $street,
        public ?string $moveInDate,
        public ?int $minRent,
        public ?int $maxRent,
        public ?string $unitKind,
        public ?int $bedrooms,
        public ?int $bathrooms,
        public ?int $occupants,
        public array $amenityKeys,
        public ?string $pets,
        public int $page,
        public int $perPage,
    ) {}

    public function hasPlaceFilter(): bool
    {
        return $this->ward !== null || $this->street !== null;
    }
}
