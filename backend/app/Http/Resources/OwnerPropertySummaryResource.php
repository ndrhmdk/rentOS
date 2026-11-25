<?php

namespace App\Http\Resources;

use App\Domain\Rentals\UnitOccupancy;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Property
 */
class OwnerPropertySummaryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $units = $this->relationLoaded('units')
            ? $this->units->whereNull('archived_at')->values()
            : collect();

        $classified = $units->map(function ($unit): array {
            $tenancies = $unit->relationLoaded('tenancies')
                ? $unit->tenancies
                : collect();

            return UnitOccupancy::classify(
                (string) $unit->operational_status,
                $tenancies,
            );
        })->all();

        $listing = $this->relationLoaded('currentListing')
            ? $this->currentListing
            : null;

        return [
            'id' => $this->id,
            'owner_id' => $this->owner_id,
            'name' => $this->name,
            'property_type' => $this->property_type,
            'rental_arrangement' => $this->rental_arrangement,
            'address_line' => $this->address_line,
            'ward' => $this->ward,
            'city' => $this->city,
            'archived_at' => $this->archived_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'unit_count' => $units->count(),
            'occupancy' => UnitOccupancy::listBadge(
                (string) $this->rental_arrangement,
                $classified,
            ),
            'listing' => $listing === null
                ? null
                : [
                    'id' => $listing->id,
                    'title' => $listing->title,
                    'moderation_status' => $listing->moderation_status,
                    'publication_status' => $listing->publication_status,
                    'admin_suspended_at' => $listing->admin_suspended_at,
                ],
        ];
    }
}
