<?php

namespace Tests\Feature;

use Database\Seeders\BaselineSeeder;
use Database\Seeders\Rnt11AgedRequestsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RentalsTestSeederAndCleanupTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(BaselineSeeder::class);
    }

    protected function beforeRefreshingDatabase(): void
    {
        $this->assertSame('pgsql', config('database.default'));
        $this->assertSame('rentos_test', config('database.connections.pgsql.database'));
    }

    /**
     * Stage 4: Test rentals:seed-test-data successfully seeds all 4 standard test scenarios.
     */
    public function test_rentals_seed_test_data_creates_standard_rnt11_fixtures(): void
    {
        $seeder = new Rnt11AgedRequestsSeeder;

        $this->artisan('rentals:seed-test-data')
            ->assertSuccessful();

        // Case 1: 16d old request, fully blocked
        $this->assertDatabaseHas('rental_requests', [
            'id' => $seeder->id(13),
            'status' => 'PENDING',
        ]);
        $this->assertDatabaseHas('listings', [
            'id' => $seeder->id(12),
        ]);

        // Case 2: 16d old request, preferred blocked, alt unit free
        $this->assertDatabaseHas('rental_requests', [
            'id' => $seeder->id(24),
            'status' => 'PENDING',
        ]);
        $this->assertDatabaseHas('units', [
            'id' => $seeder->id(22),
            'label' => 'P.202 (Trống thay thế)',
        ]);

        // Case 3: 7d old request (not due)
        $this->assertDatabaseHas('rental_requests', [
            'id' => $seeder->id(33),
            'status' => 'PENDING',
        ]);

        // Case 4: 16d old request with expired hold
        $this->assertDatabaseHas('rental_requests', [
            'id' => $seeder->id(43),
            'status' => 'PENDING',
        ]);
        $this->assertDatabaseHas('tenancies', [
            'id' => $seeder->id(44),
            'status' => 'PENDING_CONFIRMATION',
        ]);
    }

    /**
     * Stage 4: Test rentals:cleanup-test-data removes all seeded fixtures cleanly.
     */
    public function test_rentals_cleanup_test_data_removes_all_fixtures(): void
    {
        $seeder = new Rnt11AgedRequestsSeeder;

        // 1. First seed data
        $this->artisan('rentals:seed-test-data')->assertSuccessful();

        $this->assertDatabaseHas('rental_requests', ['id' => $seeder->id(13)]);

        // 2. Run cleanup
        $this->artisan('rentals:cleanup-test-data')
            ->assertSuccessful();

        // 3. Verify all fixtures are gone
        $fixtures = [
            $seeder->id(13),
            $seeder->id(24),
            $seeder->id(33),
            $seeder->id(43),
        ];

        foreach ($fixtures as $id) {
            $this->assertDatabaseMissing('rental_requests', ['id' => $id]);
        }

        $tenancies = [
            $seeder->id(14),
            $seeder->id(25),
            $seeder->id(34),
            $seeder->id(44),
        ];

        foreach ($tenancies as $id) {
            $this->assertDatabaseMissing('tenancies', ['id' => $id]);
        }
    }
}
