<?php

namespace Database\Factories;

use App\Models\Property;
use App\Models\Unit;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Rentable unit with every field a marketed READY unit must have.
 *
 * @extends Factory<Unit>
 */
class UnitFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $kind = fake()->randomElement(['ROOM', 'STUDIO', 'APARTMENT']);

        return [
            'property_id' => Property::factory(),
            'client_operation_id' => (string) Str::uuid(),
            'label' => match ($kind) {
                'ROOM' => 'Phòng '.fake()->unique()->numberBetween(1, 99999),
                'STUDIO' => 'Studio '.fake()->unique()->numberBetween(1, 99999),
                default => 'Căn '.fake()->unique()->numberBetween(1, 99999),
            },
            'unit_kind' => $kind,
            'description' => 'Đơn vị cho thuê mẫu.',
            'floor' => (string) fake()->numberBetween(1, 8),
            'area_m2' => fake()->numberBetween(16, 70),
            'bedrooms' => $kind === 'APARTMENT' ? fake()->numberBetween(1, 2) : ($kind === 'ROOM' ? 1 : 0),
            'bathrooms' => 1,
            'bathroom_arrangement' => $kind === 'ROOM' ? 'SHARED' : 'PRIVATE',
            'amenities' => ['schema_version' => 1, 'standard' => (object) [], 'custom' => []],
            'advertised_monthly_rent' => fake()->numberBetween(30, 120) * 100000,
            'deposit' => fake()->numberBetween(30, 120) * 100000,
            'minimum_rental_months' => fake()->randomElement([3, 6, 12]),
            'max_occupants' => fake()->numberBetween(1, 4),
            'operational_status' => 'READY',
            'is_marketed' => true,
            'policy_overrides' => (object) [],
        ];
    }

    public function maintenance(): static
    {
        return $this->state(['operational_status' => 'MAINTENANCE']);
    }

    public function notMarketed(): static
    {
        return $this->state(['is_marketed' => false]);
    }

    public function archived(): static
    {
        return $this->state(['archived_at' => now(), 'is_marketed' => false]);
    }
}
