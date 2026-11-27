<?php

namespace Database\Factories;

use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Draft rental property in Da Nang with valid shared amenities and policies.
 *
 * @extends Factory<Property>
 */
class PropertyFactory extends Factory
{
    private const array WARDS = ['Hải Châu', 'Hòa Cường', 'An Hải', 'Thanh Khê', 'An Khê', 'Ngũ Hành Sơn', 'Sơn Trà'];

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $ward = fake()->randomElement(self::WARDS);

        return [
            'owner_id' => User::factory(),
            'client_operation_id' => (string) Str::uuid(),
            'name' => 'Nhà '.fake()->lastName().' '.fake()->numberBetween(1, 999),
            'property_type' => fake()->randomElement(['HOUSE', 'APARTMENT', 'APARTMENT_BUILDING']),
            'rental_arrangement' => 'SEPARATE_UNITS',
            'address_line' => fake()->numberBetween(1, 300).' '.fake()->randomElement(['Nguyễn Văn Linh', 'Lê Duẩn', 'Hùng Vương', 'Bạch Đằng', '2 Tháng 9']),
            'ward' => $ward,
            'city' => 'Đà Nẵng',
            'description' => "Dữ liệu mẫu tại {$ward}, Đà Nẵng.",
            'shared_amenities' => ['schema_version' => 1, 'standard' => ['wifi' => ['enabled' => true]], 'custom' => []],
            'policies' => [
                'schema_version' => 1,
                'pets' => fake()->randomElement(['NOT_ALLOWED', 'ASK_OWNER', 'ALLOWED']),
                'smoking' => 'NOT_ALLOWED',
                'shared_rules' => ['Giữ yên tĩnh sau 22:00'],
            ],
            'content_revision' => 1,
            'latitude' => fake()->randomFloat(7, 16.00, 16.10),
            'longitude' => fake()->randomFloat(7, 108.15, 108.26),
        ];
    }

    public function wholeSpace(): static
    {
        return $this->state(['rental_arrangement' => 'WHOLE_SPACE', 'property_type' => 'HOUSE']);
    }

    public function archived(): static
    {
        return $this->state(['archived_at' => now()]);
    }
}
