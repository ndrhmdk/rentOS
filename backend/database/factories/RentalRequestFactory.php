<?php

namespace Database\Factories;

use App\Models\Listing;
use App\Models\RentalRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<RentalRequest> */
class RentalRequestFactory extends Factory
{
    public function definition(): array
    {
        return [
            'listing_id' => Listing::factory(),
            'tenant_id' => User::factory(),
            'client_operation_id' => (string) Str::uuid(),
            'contact_name' => fake()->name(),
            'contact_phone' => '0901234567',
            'desired_move_in_date' => '2027-01-01',
            'desired_end_date' => '2027-03-31',
            'message' => '',
            'status' => 'PENDING',
        ];
    }

    /**
     * Created the given number of days ago (the 15-day rule looks at created_at).
     */
    public function agedDays(int $days): static
    {
        return $this->state(fn (): array => ['created_at' => now()->subDays($days), 'updated_at' => now()->subDays($days)]);
    }

    public function withdrawn(): static
    {
        return $this->state(fn (): array => ['status' => 'WITHDRAWN', 'closed_at' => now()]);
    }

    public function rejected(string $reason = 'Không còn phòng phù hợp.'): static
    {
        return $this->state(fn (): array => ['status' => 'REJECTED', 'outcome_reason' => $reason, 'closed_at' => now()]);
    }
}
