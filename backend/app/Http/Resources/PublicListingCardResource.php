<?php

namespace App\Http\Resources;

use App\Models\Listing;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Listing
 */
class PublicListingCardResource extends JsonResource
{
    /**
     * @return array{
     *     id: string,
     *     property_id: string,
     *     title: string,
     *     availability_label: string,
     *     available_unit_count: int,
     *     rent_min: int|null,
     *     rent_max: int|null,
     *     minimum_rental_months: int,
     *     cover_url: string|null,
     *     image_urls: list<string>,
     *     property: array{
     *         name: string,
     *         property_type: string,
     *         ward: string|null,
     *         city: string|null
     *     }
     * }
     */
    public function toArray(Request $request): array
    {
        /** @var array<string, mixed> $summary */
        $summary = $this->resource->getAttribute('search_summary');
        $property = $this->property;

        return [
            'id' => $this->id,
            'property_id' => $this->property_id,
            'title' => $this->title,
            'availability_label' => $summary['availability_label'],
            'available_unit_count' => $summary['available_unit_count'],
            'rent_min' => $summary['rent_min'],
            'rent_max' => $summary['rent_max'],
            'minimum_rental_months' => $summary['minimum_rental_months'],
            'cover_url' => $summary['cover_url'],
            'image_urls' => $summary['image_urls'],
            'property' => [
                'name' => $property->name,
                'property_type' => $property->property_type,
                'ward' => $property->ward,
                'city' => $property->city,
            ],
        ];
    }
}
