<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\Property;
use Database\Seeders\BulkDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Support\PublicListingFixture;
use Tests\TestCase;

class BulkDataSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_factory_seeder_builds_related_volume_data_that_passes_database_constraints(): void
    {
        $this->seed(BulkDataSeeder::class);

        $this->assertDatabaseCount('properties', 20);
        $this->assertDatabaseCount('units', 80);
        $this->assertDatabaseCount('listings', 20);
        $this->assertDatabaseCount('rental_requests', 120);
        $this->assertSame(5, DB::table('properties')->distinct()->count('owner_id'));
        $this->assertSame(20, DB::table('units')->where('operational_status', 'MAINTENANCE')->count());

        $statuses = DB::table('rental_requests')->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');
        $this->assertSame(['PENDING' => 60, 'REJECTED' => 20, 'WITHDRAWN' => 40], $statuses->map(fn ($total): int => (int) $total)->sortKeys()->all());
        $this->assertSame(0, DB::table('rental_requests')->where('status', 'PENDING')->whereNotNull('closed_at')->count());
        $this->assertTrue(DB::table('rental_requests')->where('created_at', '<=', now()->subDays(15))->exists());

        $property = Property::query()->with(['owner', 'units', 'listings'])->firstOrFail();
        $this->assertNotNull($property->owner);
        $this->assertCount(4, $property->units);
        $this->assertCount(1, $property->listings);
    }

    public function test_seeded_draft_listings_never_reach_public_search(): void
    {
        PublicListingFixture::published();
        $this->seed(BulkDataSeeder::class);

        $this->assertSame(20, Listing::query()->where('publication_status', 'DRAFT')->count());
        $this->getJson('/api/v1/listings')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);
    }
}
