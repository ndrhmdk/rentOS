<?php

namespace App\Http\Resources;

use App\Models\Listing;
use App\Support\ApproximateArea;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Listing
 */
class PublicListingDetailResource extends JsonResource
{
    /**
     * @return array{
     *     id: string,
     *     property_id: string,
     *     title: string,
     *     description: string|null,
     *     availability_label: string,
     *     available_unit_count: int,
     *     gallery: list<string>,
     *     property: array{
     *         name: string,
     *         property_type: string,
     *         rental_arrangement: string,
     *         address_line: string,
     *         ward: string|null,
     *         city: string|null,
     *         description: string|null,
     *         shared_rules: list<string>,
     *         shared_amenities: list<string>,
     *         custom_amenities: list<string>,
     *         area: array{latitude: float, longitude: float}|null
     *     },
     *     owner: array{name: string|null},
     *     units: list<mixed>
     * }
     */
    public function toArray(Request $request): array
    {
        $property = $this->property;
        /** @var array<string, mixed> $summary */
        $summary = $this->resource->getAttribute('search_summary');

        return [
            'id' => $this->id,
            'property_id' => $this->property_id,
            'title' => $this->title,
            'description' => $this->description,
            'availability_label' => $summary['availability_label'],
            'available_unit_count' => $summary['available_unit_count'],
            'gallery' => $this->resource->getAttribute('public_gallery'),
            'property' => [
                'name' => $property->name,
                'property_type' => $property->property_type,
                'rental_arrangement' => $property->rental_arrangement,
                'address_line' => $property->address_line,
                'ward' => $property->ward,
                'city' => $property->city,
                'description' => $property->description,
                'shared_rules' => $property->policies['shared_rules'] ?? [],
                'shared_amenities' => $this->resource->getAttribute('public_shared_amenities'),
                'custom_amenities' => $this->resource->getAttribute('public_custom_amenities'),
                'area' => ApproximateArea::from($property->latitude, $property->longitude),
            ],
            'owner' => [
                'name' => $property->owner?->name,
            ],
            'units' => PublicUnitResource::collection($this->resource->getAttribute('public_units'))->resolve(),
        ];
    }
}
