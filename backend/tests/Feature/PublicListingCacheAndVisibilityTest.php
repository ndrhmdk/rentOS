<?php

namespace Tests\Feature;

use App\Actions\OwnerProperties\PropertyWriteService;
use App\Actions\Reports\SuspendListingAction;
use App\Models\Listing;
use App\Models\Property;
use App\Models\User;
use App\Services\ListingCacheService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Support\PublicListingFixture;
use Tests\TestCase;

class PublicListingCacheAndVisibilityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    /**
     * Cache Miss then Cache Hit on search index.
     */
    public function test_public_search_caches_results_and_returns_hit_on_repeat(): void
    {
        $listing = PublicListingFixture::published();

        // 1. First search -> MISS
        $response1 = $this->getJson('/api/v1/listings');
        $response1->assertOk()
            ->assertHeader('X-Cache', 'MISS')
            ->assertJsonPath('meta.total', 1);

        // 2. Second search with identical query -> HIT
        $response2 = $this->getJson('/api/v1/listings');
        $response2->assertOk()
            ->assertHeader('X-Cache', 'HIT')
            ->assertJsonPath('meta.total', 1);

        $this->assertSame($response1->json(), $response2->json());
    }

    /**
     * Cache Miss then Cache Hit on listing detail.
     */
    public function test_public_detail_caches_payload_and_returns_hit_on_repeat(): void
    {
        $listing = PublicListingFixture::published();

        // 1. First detail fetch -> MISS
        $response1 = $this->getJson('/api/v1/listings/'.$listing->listingId);
        $response1->assertOk()
            ->assertHeader('X-Cache', 'MISS')
            ->assertJsonPath('data.id', $listing->listingId);

        // 2. Second detail fetch -> HIT
        $response2 = $this->getJson('/api/v1/listings/'.$listing->listingId);
        $response2->assertOk()
            ->assertHeader('X-Cache', 'HIT')
            ->assertJsonPath('data.id', $listing->listingId);

        $this->assertSame($response1->json(), $response2->json());
    }

    /**
     * FR46-AC01: Owner edits approved content -> Cache invalidated; refreshed content appears.
     */
    public function test_owner_editing_approved_content_invalidates_cache_and_serves_fresh_data(): void
    {
        $listing = PublicListingFixture::published();

        // Prime cache
        $this->getJson('/api/v1/listings')->assertHeader('X-Cache', 'MISS');
        $this->getJson('/api/v1/listings/'.$listing->listingId)->assertHeader('X-Cache', 'MISS');

        // Owner edits title
        $property = Property::query()->findOrFail($listing->propertyId);
        $this->actingAs($listing->owner, 'web')
            ->patchJson('/api/v1/owner/properties/'.$listing->propertyId.'/listing', [
                'expected_content_revision' => $property->content_revision,
                'title' => 'Tiêu đề đã được cập nhật mới',
            ])
            ->assertOk();

        // Fresh search -> Cache was invalidated, title is updated without reapproval
        $searchResponse = $this->getJson('/api/v1/listings');
        $searchResponse->assertOk()
            ->assertHeader('X-Cache', 'MISS')
            ->assertJsonPath('data.0.title', 'Tiêu đề đã được cập nhật mới');

        // Fresh detail -> Cache was invalidated, title is updated
        $detailResponse = $this->getJson('/api/v1/listings/'.$listing->listingId);
        $detailResponse->assertOk()
            ->assertHeader('X-Cache', 'MISS')
            ->assertJsonPath('data.title', 'Tiêu đề đã được cập nhật mới');
    }

    /**
     * FR46-AC02: Admin suspends while stale cache exists -> Fresh visibility gate prevents serving suspended listing.
     */
    public function test_admin_suspending_listing_is_immediately_gated_even_with_stale_cache(): void
    {
        $listing = PublicListingFixture::published();

        // Prime cache
        $this->getJson('/api/v1/listings')->assertHeader('X-Cache', 'MISS');
        $this->getJson('/api/v1/listings/'.$listing->listingId)->assertHeader('X-Cache', 'MISS');

        // Admin suspends listing
        $admin = User::factory()->create(['is_admin' => true, 'account_status' => 'ACTIVE']);
        $model = Listing::query()->findOrFail($listing->listingId);
        app(SuspendListingAction::class)->execute($model, $admin, 'Vi phạm quy định quảng cáo.');

        // Detail request MUST be rejected with 404 through fresh visibility gate
        $this->getJson('/api/v1/listings/'.$listing->listingId)->assertNotFound();

        // Search request MUST immediately exclude suspended listing
        $searchResponse = $this->getJson('/api/v1/listings');
        $searchResponse->assertOk()
            ->assertJsonPath('meta.total', 0);
    }

    /**
     * Owner hides listing -> Fresh visibility gate immediately excludes from public views.
     */
    public function test_owner_hiding_listing_is_immediately_gated_from_public_views(): void
    {
        $listing = PublicListingFixture::published();

        // Prime cache
        $this->getJson('/api/v1/listings')->assertHeader('X-Cache', 'MISS');
        $this->getJson('/api/v1/listings/'.$listing->listingId)->assertHeader('X-Cache', 'MISS');

        // Owner hides listing
        $property = Property::query()->findOrFail($listing->propertyId);
        $this->actingAs($listing->owner, 'web')
            ->postJson('/api/v1/owner/properties/'.$listing->propertyId.'/listing/hide', [
                'expected_content_revision' => $property->content_revision,
            ])
            ->assertOk();

        // Detail returns 404
        $this->getJson('/api/v1/listings/'.$listing->listingId)->assertNotFound();

        // Search excludes hidden listing
        $this->getJson('/api/v1/listings')->assertJsonPath('meta.total', 0);
    }

    /**
     * Privacy: Shared cache does not contain user-specific heart / favourite status or private contact info.
     */
    public function test_shared_cache_does_not_contain_private_user_fields(): void
    {
        $listing = PublicListingFixture::published();

        $response = $this->getJson('/api/v1/listings/'.$listing->listingId);
        $response->assertOk();

        $data = $response->json('data');
        $this->assertArrayNotHasKey('is_favourited', $data);
        $this->assertArrayNotHasKey('password', $data);
        $this->assertArrayNotHasKey('remember_token', $data);

        // Cached payload directly inspected
        $cached = app(ListingCacheService::class)->getDetail($listing->listingId);
        $this->assertNotNull($cached);
        $this->assertArrayNotHasKey('is_favourited', $cached);
    }

    /**
     * Query count verification: Batch optimization eliminates N+1 queries.
     */
    public function test_query_count_remains_bounded_and_avoids_n_plus_one(): void
    {
        // Create 4 distinct published listings
        PublicListingFixture::published();
        PublicListingFixture::published();
        PublicListingFixture::published();
        PublicListingFixture::published();

        // 1. Fresh search (cache MISS): Count database queries
        $queriesOnMiss = 0;
        DB::listen(function () use (&$queriesOnMiss): void {
            $queriesOnMiss++;
        });

        $responseMiss = $this->getJson('/api/v1/listings?per_page=4');
        $responseMiss->assertOk()->assertHeader('X-Cache', 'MISS');

        // Bounded queries: matching IDs query, listings query, units query, tenancies batch, photos batch <= 10
        $this->assertLessThanOrEqual(10, $queriesOnMiss, "Expected <= 10 queries on cache miss, got {$queriesOnMiss}");

        // 2. Repeated search (cache HIT): Count database queries
        $queriesOnHit = 0;
        DB::listen(function () use (&$queriesOnHit): void {
            $queriesOnHit++;
        });

        $responseHit = $this->getJson('/api/v1/listings?per_page=4');
        $responseHit->assertOk()->assertHeader('X-Cache', 'HIT');

        // On cache hit, only the single visibility gate count query runs!
        $this->assertSame(1, $queriesOnHit, "Expected exactly 1 query (visibility gate) on cache hit, got {$queriesOnHit}");
    }

    /**
     * FR46-AC03: Search cache says available but reservation has committed -> Proposal fails with conflict; cache never authorizes allocation.
     */
    public function test_search_cache_never_authorizes_allocation_and_committed_reservation_rejects_proposal_with_conflict(): void
    {
        $listing = PublicListingFixture::published();
        $unitId = $listing->unitIds[0];
        $startDate = now()->addDays(5)->toDateString();
        $endDate = now()->addMonths(6)->toDateString();

        // 1. Visitor searches -> cache primed as available
        $this->getJson('/api/v1/listings')->assertOk()->assertHeader('X-Cache', 'MISS');

        // 2. Meanwhile, a conflicting reservation commits on this unit
        PublicListingFixture::blockUnit($unitId, $startDate, $endDate, 'CONFIRMED');

        // 3. Tenant submits request
        $tenant = User::factory()->create();
        $requestId = (string) Str::uuid();
        DB::table('rental_requests')->insert([
            'id' => $requestId,
            'listing_id' => $listing->listingId,
            'tenant_id' => $tenant->id,
            'preferred_unit_id' => $unitId,
            'client_operation_id' => (string) Str::uuid(),
            'desired_move_in_date' => $startDate,
            'desired_end_date' => $endDate,
            'message' => 'Yêu cầu thuê phòng.',
            'contact_name' => $tenant->name,
            'contact_phone' => '0901234567',
            'status' => 'PENDING',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 4. Owner attempts to create proposal for the conflicting unit -> must fail with 409 Conflict
        $this->actingAs($listing->owner, 'web')->postJson(
            '/api/v1/owner/rental-requests/'.$requestId.'/proposal',
            [
                'client_operation_id' => (string) Str::uuid(),
                'unit_id' => $unitId,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'monthly_rent' => 3_800_000,
                'deposit_amount' => 3_800_000,
                'policies_snapshot' => [
                    'schema_version' => 1,
                    'pets' => 'NOT_ALLOWED',
                    'smoking' => 'NOT_ALLOWED',
                    'shared_rules' => [],
                ],
            ]
        )->assertStatus(409);
    }

    /**
     * Stage 4: Test query amenities order invariance hits cache on repeat search.
     */
    public function test_search_amenities_order_invariance_hits_cache(): void
    {
        PublicListingFixture::published();

        // 1. First search with amenities [wifi, air_conditioning] -> MISS
        $response1 = $this->getJson('/api/v1/listings?amenities[]=wifi&amenities[]=air_conditioning');
        $response1->assertOk()
            ->assertHeader('X-Cache', 'MISS');

        // 2. Second search with reversed amenities [air_conditioning, wifi] -> HIT
        $response2 = $this->getJson('/api/v1/listings?amenities[]=air_conditioning&amenities[]=wifi');
        $response2->assertOk()
            ->assertHeader('X-Cache', 'HIT');

        $this->assertSame($response1->json('data'), $response2->json('data'));
    }

    /**
     * Stage 4: Test admin restoring suspended listing invalidates search and detail cache.
     */
    public function test_admin_restoring_suspended_listing_invalidates_cache(): void
    {
        $listing = PublicListingFixture::published();
        $admin = User::factory()->create(['is_admin' => true, 'account_status' => 'ACTIVE']);
        $model = Listing::query()->findOrFail($listing->listingId);

        // Suspend
        app(SuspendListingAction::class)->execute($model, $admin, 'Tạm đình chỉ kiểm tra.');

        // Prime search cache while suspended (total = 0)
        $this->getJson('/api/v1/listings')->assertOk()->assertJsonPath('meta.total', 0);

        // Restore listing
        $this->actingAs($admin, 'web')
            ->postJson('/api/v1/admin/listings/'.$listing->listingId.'/restore', [
                'reason' => 'Đã xác minh đầy đủ giấy tờ, khôi phục.',
            ])
            ->assertOk();

        // Fresh search -> Cache was invalidated, now returns MISS and total = 1
        $this->getJson('/api/v1/listings')
            ->assertOk()
            ->assertHeader('X-Cache', 'MISS')
            ->assertJsonPath('meta.total', 1);

        // Detail -> returns 200 fresh
        $this->getJson('/api/v1/listings/'.$listing->listingId)
            ->assertOk()
            ->assertHeader('X-Cache', 'MISS');
    }

    /**
     * Stage 4: Test owner archiving listing invalidates cache and gates visibility.
     */
    public function test_owner_archiving_listing_invalidates_cache_and_gates_visibility(): void
    {
        $listing = PublicListingFixture::published();
        $property = Property::query()->findOrFail($listing->propertyId);

        // Prime cache
        $this->getJson('/api/v1/listings')->assertHeader('X-Cache', 'MISS');
        $this->getJson('/api/v1/listings/'.$listing->listingId)->assertHeader('X-Cache', 'MISS');

        // Owner archives listing
        $this->actingAs($listing->owner, 'web')
            ->postJson('/api/v1/owner/properties/'.$listing->propertyId.'/listing/archive', [
                'expected_content_revision' => $property->content_revision,
            ])
            ->assertOk();

        // Detail immediately returns 404
        $this->getJson('/api/v1/listings/'.$listing->listingId)->assertNotFound();

        // Search excludes archived listing
        $this->getJson('/api/v1/listings')
            ->assertOk()
            ->assertJsonPath('meta.total', 0);
    }

    /**
     * B2/B3/B4: PropertyWriteService unit/property mutations invalidate cache after commit.
     */
    public function test_property_write_service_mutations_invalidate_listing_cache_and_serve_fresh_data(): void
    {
        $listing = PublicListingFixture::published();
        $property = Property::query()->findOrFail($listing->propertyId);

        // 1. Prime detail cache -> MISS, then HIT
        $this->getJson('/api/v1/listings/'.$listing->listingId)->assertHeader('X-Cache', 'MISS');
        $this->getJson('/api/v1/listings/'.$listing->listingId)->assertHeader('X-Cache', 'HIT');

        // 2. Prime search cache -> MISS, then HIT
        $this->getJson('/api/v1/listings')->assertHeader('X-Cache', 'MISS');
        $this->getJson('/api/v1/listings')->assertHeader('X-Cache', 'HIT');

        // 3. Mutate property via PropertyWriteService
        $this->actingAs($listing->owner, 'web');
        $writer = app(PropertyWriteService::class);
        $writer->update($listing->owner, $property, [
            'expected_content_revision' => $property->content_revision,
            'name' => 'Tòa nhà mới sửa sang tuyệt đẹp',
            'description' => 'Mô tả chi tiết đã cập nhật qua PropertyWriteService',
            'property_type' => $property->property_type,
        ]);

        // 4. Verify search cache is MISS with fresh version
        $this->getJson('/api/v1/listings')
            ->assertOk()
            ->assertHeader('X-Cache', 'MISS');

        // 5. Verify detail cache is MISS with fresh data
        $this->getJson('/api/v1/listings/'.$listing->listingId)
            ->assertOk()
            ->assertHeader('X-Cache', 'MISS');
    }
}
