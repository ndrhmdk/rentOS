<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\DB;
use Tests\Support\CreatesListingReviewPackages;
use Tests\Support\PublicListingFixture;
use Tests\TestCase;

class OwnerListingSuspensionConcurrencyTest extends TestCase
{
    use CreatesListingReviewPackages, DatabaseMigrations;

    protected function setUp(): void
    {
        parent::setUp();
        config(['queue.default' => 'database']);
    }

    protected function beforeRefreshingDatabase(): void
    {
        $this->assertReviewDatabaseIsIsolated();
    }

    public function test_concurrent_owner_publish_cannot_expose_listing_after_admin_suspends_it(): void
    {
        if (! function_exists('pcntl_fork') || ! function_exists('stream_socket_pair')) {
            $this->markTestSkipped('Concurrent listing writes require pcntl and Unix socket pairs.');
        }

        $published = PublicListingFixture::published();
        $admin = User::factory()->create(['is_admin' => true]);

        $results = $this->runConcurrentRequests([
            [
                'actor' => $published->owner,
                'path' => "/api/v1/owner/properties/{$published->propertyId}/listing/publish",
                'payload' => ['expected_content_revision' => 1],
            ],
            [
                'actor' => $admin,
                'path' => "/api/v1/admin/listings/{$published->listingId}/suspend",
                'payload' => ['reason' => 'Đang kiểm tra xử lý đồng thời'],
            ],
        ]);

        $ownerResult = collect($results)->firstWhere('actor_id', $published->owner->id);
        $adminResult = collect($results)->firstWhere('actor_id', $admin->id);

        $this->assertNotNull($ownerResult);
        $this->assertContains($ownerResult['status'], [200, 422]);
        $this->assertNotNull($adminResult);
        $this->assertSame(200, $adminResult['status']);

        $listing = Listing::query()->findOrFail($published->listingId);
        $this->assertNotNull($listing->admin_suspended_at);
        $this->assertSame($admin->id, $listing->admin_suspended_by);
        $this->assertSame('Đang kiểm tra xử lý đồng thời', $listing->suspension_reason);
        $this->assertSame(0, Listing::query()->publiclyVisible()->count());
        $this->assertDatabaseHas('audit_logs', [
            'entity_type' => 'listing',
            'entity_id' => $published->listingId,
            'actor_id' => $admin->id,
            'action' => 'listing.suspended',
        ]);
        $this->assertDatabaseHas('notifications', [
            'recipient_id' => $published->owner->id,
            'resource_type' => 'listing',
            'resource_id' => $published->listingId,
        ]);
    }

    public function test_concurrent_owner_property_update_and_admin_suspension_complete_without_lock_inversion(): void
    {
        if (! function_exists('pcntl_fork') || ! function_exists('stream_socket_pair')) {
            $this->markTestSkipped('Concurrent listing writes require pcntl and Unix socket pairs.');
        }

        $published = PublicListingFixture::published();
        $admin = User::factory()->create(['is_admin' => true]);

        $results = $this->runConcurrentRequests([
            [
                'actor' => $published->owner,
                'method' => 'PATCH',
                'path' => "/api/v1/owner/properties/{$published->propertyId}",
                'payload' => [
                    'name' => 'Tên nhà đã cập nhật đồng thời',
                    'expected_content_revision' => 1,
                ],
            ],
            [
                'actor' => $admin,
                'path' => "/api/v1/admin/listings/{$published->listingId}/suspend",
                'payload' => ['reason' => 'Đang kiểm tra xử lý đồng thời'],
            ],
        ]);

        $ownerResult = collect($results)->firstWhere('actor_id', $published->owner->id);
        $adminResult = collect($results)->firstWhere('actor_id', $admin->id);

        $this->assertNotNull($ownerResult);
        $this->assertSame(200, $ownerResult['status'], $ownerResult['error'] ?? null);
        $this->assertNotNull($adminResult);
        $this->assertSame(200, $adminResult['status'], $adminResult['error'] ?? null);

        $this->assertDatabaseHas('properties', [
            'id' => $published->propertyId,
            'name' => 'Tên nhà đã cập nhật đồng thời',
        ]);
        $this->assertDatabaseHas('listings', [
            'id' => $published->listingId,
            'admin_suspended_by' => $admin->id,
            'suspension_reason' => 'Đang kiểm tra xử lý đồng thời',
        ]);
        $this->assertSame(0, Listing::query()->publiclyVisible()->count());
    }

    /**
     * @param  array<int, array{actor: User, path: string, payload: array<string, mixed>, method?: string}>  $requests
     * @return array<int, array{status: int, actor_id: string, error?: string}>
     */
    private function runConcurrentRequests(array $requests): array
    {
        $this->assertSame(0, DB::transactionLevel(), 'Concurrent requests require committed fixtures.');
        DB::purge('pgsql');

        $sockets = [];
        foreach ($requests as $_request) {
            $pair = stream_socket_pair(STREAM_PF_UNIX, STREAM_SOCK_STREAM, 0);
            $this->assertIsArray($pair);
            $sockets[] = $pair;
        }

        $processIds = [];
        foreach ($requests as $index => $request) {
            $processId = pcntl_fork();
            $this->assertNotSame(-1, $processId);

            if ($processId === 0) {
                foreach ($sockets as $socketIndex => $pair) {
                    fclose($pair[0]);
                    if ($socketIndex !== $index) {
                        fclose($pair[1]);
                    }
                }

                $socket = $sockets[$index][1];
                stream_set_timeout($socket, 20);
                fread($socket, 1);

                try {
                    $this->app['auth']->forgetGuards();
                    $test = $this->actingAs($request['actor'], 'web');
                    $response = strtoupper($request['method'] ?? 'POST') === 'PATCH'
                        ? $test->patchJson($request['path'], $request['payload'])
                        : $test->postJson($request['path'], $request['payload']);
                    $result = ['status' => $response->getStatusCode(), 'actor_id' => $request['actor']->id];
                } catch (\Throwable $failure) {
                    $result = [
                        'status' => 0,
                        'actor_id' => $request['actor']->id,
                        'error' => $failure::class.': '.$failure->getMessage(),
                    ];
                }

                fwrite($socket, json_encode($result, JSON_THROW_ON_ERROR)."\n");
                fclose($socket);
                exit(0);
            }

            $processIds[] = $processId;
        }

        foreach ($sockets as $pair) {
            fclose($pair[1]);
            stream_set_timeout($pair[0], 20);
            fwrite($pair[0], 'G');
        }

        $results = [];
        try {
            foreach ($sockets as $pair) {
                $line = fgets($pair[0]);
                $this->assertNotFalse($line, 'A concurrent listing request returned no result.');
                $results[] = json_decode($line, true, flags: JSON_THROW_ON_ERROR);
                fclose($pair[0]);
            }
        } finally {
            foreach ($processIds as $processId) {
                pcntl_waitpid($processId, $status);
                $this->assertTrue(pcntl_wifexited($status));
                $this->assertSame(0, pcntl_wexitstatus($status));
            }
        }

        return $results;
    }
}
