<?php

namespace Database\Seeders;

use App\Models\Listing;
use App\Models\Property;
use App\Models\RentalRequest;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Factory-built volume data on top of the curated BaselineSeeder fixtures.
 *
 * Each run adds owners with draft properties, units and listings, plus rental
 * requests in every status and age. The draft listings never appear in public
 * search, so the curated demo stays unchanged. Raise the counts to produce a
 * realistic dataset for query-plan evidence.
 */
class BulkDataSeeder extends Seeder
{
    public function run(int $properties = 20, int $requestsPerListing = 6): void
    {
        DB::transaction(function () use ($properties, $requestsPerListing): void {
            $owners = User::factory()->count(max(1, intdiv($properties, 4)))->create();

            for ($index = 0; $index < $properties; $index++) {
                $property = Property::factory()
                    ->for($owners[$index % $owners->count()], 'owner')
                    ->has(Unit::factory()->count(3))
                    ->has(Unit::factory()->maintenance())
                    ->create();

                $listing = Listing::factory()->for($property)->create();

                $this->seedRequests($listing, $requestsPerListing);
            }
        });
    }

    private function seedRequests(Listing $listing, int $count): void
    {
        for ($index = 0; $index < $count; $index++) {
            $factory = RentalRequest::factory()
                ->state(['listing_id' => $listing->id])
                ->agedDays(fake()->numberBetween(0, 40));

            $factory = match ($index % 4) {
                1 => $factory->withdrawn(),
                2 => $factory->rejected(),
                default => $factory,
            };

            $factory->create();
        }
    }
}
