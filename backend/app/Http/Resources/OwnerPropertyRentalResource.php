<?php

namespace App\Http\Resources;

use App\Domain\Rentals\UnitOccupancy;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Property
 */
class OwnerPropertyRentalResource extends JsonResource
{
    private const PROPERTY_TYPE_LABELS = [
        'APARTMENT' => 'Căn hộ',
        'HOUSE' => 'Nhà',
        'ROOM' => 'Phòng',
        'STUDIO' => 'Studio',
    ];

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
            $occupancy = UnitOccupancy::classify(
                (string) $unit->operational_status,
                $tenancies,
            );

            return [
                'id' => $unit->id,
                'label' => $unit->label,
                'occupancy' => $occupancy,
            ];
        });

        $occupancies = $classified
            ->pluck('occupancy')
            ->all();
        $counts = UnitOccupancy::counts($occupancies);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'address' => collect([
                $this->address_line,
                $this->ward,
                $this->city,
            ])->filter()->implode(', '),
            'property_type' => $this->property_type,
            'property_type_label' => self::PROPERTY_TYPE_LABELS[$this->property_type]
                ?? $this->property_type,
            'rental_arrangement' => $this->rental_arrangement,
            'rental_arrangement_label' => $this->rental_arrangement === 'WHOLE_SPACE'
                ? 'Toàn bộ không gian'
                : 'Từng căn riêng lẻ',
            'counts' => [
                'total' => $counts['total'],
                'occupied' => $counts['occupied'],
                'vacant' => $counts['vacant'],
                'maintenance' => $counts['maintenance'],
            ],
            'units' => $classified->map(function (array $row): array {
                $occupancy = $row['occupancy'];

                return [
                    'id' => $row['id'],
                    'label' => $row['label'],
                    'operational' => $occupancy['operational'],
                    'operational_label' => UnitOccupancy::operationalLabel(
                        $occupancy['operational'],
                    ),
                    'rental' => $occupancy['rental'],
                    'rental_label' => UnitOccupancy::rentalLabel(
                        $occupancy['rental'],
                    ),
                    'tenant_name' => $occupancy['tenant_name'],
                    'start_date' => $occupancy['start_date'],
                    'end_date' => $occupancy['end_date'],
                    'tenancy_id' => $occupancy['tenancy_id'],
                ];
            })->values()->all(),
        ];
    }
}
