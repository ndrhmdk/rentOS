<?php

namespace Tests\Feature;

use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\BaselineSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Support\PublicListingFixture;
use Tests\TestCase;

class TenantJourneyIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(BaselineSeeder::class);
        Carbon::setTestNow('2026-12-01');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    /**
     * Verifies the complete coherent journey across Discovery, Favourites,
     * Rental Requests, Proposals, Immediate Competing Rejections, and Contract Confirmation.
     */
    public function test_complete_tenant_journey_from_search_to_contract_confirmation(): void
    {
        // Setup: Published listing with 1 unit
        $published = PublicListingFixture::published([
            'title' => 'Căn hộ view biển Mỹ Khê',
            'city' => 'Đà Nẵng',
            'ward' => 'Phước Mỹ',
            'address_line' => '10 đường Mỹ Khê',
            'units' => [
                [
                    'label' => 'Phòng 101',
                    'advertised_monthly_rent' => 5000000,
                    'minimum_rental_months' => 3,
                ],
            ],
        ]);
        $owner = $published->owner;
        $unitId = $published->unitIds[0];

        $tenant1 = User::factory()->create(['name' => 'Khách Thuê Một']);
        $tenant2 = User::factory()->create(['name' => 'Khách Thuê Hai']);

        // -------------------------------------------------------------
        // Step 1: Discovery & Search (FR19, FR20)
        // -------------------------------------------------------------
        $searchResponse = $this->getJson('/api/v1/listings?street=My%20Khe&move_in_date=2026-12-01');
        $searchResponse->assertOk();
        $this->assertContains(
            $published->listingId,
            collect($searchResponse->json('data'))->pluck('id')->all(),
            'Search results must include the published qualifying listing'
        );

        // Detail check (FR21)
        $detailResponse = $this->getJson('/api/v1/listings/'.$published->listingId);
        $detailResponse->assertOk()
            ->assertJsonPath('data.id', $published->listingId)
            ->assertJsonPath('data.units.0.id', $unitId)
            ->assertJsonMissing(['admin_suspended_at', 'storage_path']);

        // -------------------------------------------------------------
        // Step 2: Favourites Management (FR88)
        // -------------------------------------------------------------
        $this->switchAccount($tenant1);

        // First save returns 201
        $this->putJson('/api/v1/favourite-properties/'.$published->propertyId)
            ->assertCreated();

        // Idempotent repeat save returns 200
        $this->putJson('/api/v1/favourite-properties/'.$published->propertyId)
            ->assertOk();

        // Check favourites list and count
        $favsResponse = $this->getJson('/api/v1/favourite-properties');
        $favsResponse->assertOk()
            ->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.items.0.property_id', $published->propertyId)
            ->assertJsonPath('data.items.0.listing.id', $published->listingId);

        // -------------------------------------------------------------
        // Step 3: Rental Request Submissions (FR25, FR26)
        // -------------------------------------------------------------
        // Tenant 1 submits enquiry
        $req1Response = $this->postJson('/api/v1/tenant/rental-requests', [
            'client_operation_id' => (string) Str::uuid(),
            'listing_id' => $published->listingId,
            'preferred_unit_id' => $unitId,
            'contact_name' => 'Khách Thuê Một',
            'contact_phone' => '0901111111',
            'desired_move_in_date' => '2026-12-05',
            'desired_end_date' => '2027-03-05',
            'message' => 'Tôi muốn thuê căn này 3 tháng.',
        ]);
        $req1Response->assertCreated()
            ->assertJsonPath('data.status', 'PENDING');
        $req1Id = $req1Response->json('data.id');

        // Tenant 2 switches account and submits competing enquiry for the same unit/listing
        $this->switchAccount($tenant2);
        $req2Response = $this->postJson('/api/v1/tenant/rental-requests', [
            'client_operation_id' => (string) Str::uuid(),
            'listing_id' => $published->listingId,
            'preferred_unit_id' => $unitId,
            'contact_name' => 'Khách Thuê Hai',
            'contact_phone' => '0902222222',
            'desired_move_in_date' => '2026-12-05',
            'desired_end_date' => '2027-03-05',
            'message' => 'Tôi cũng muốn thuê căn này.',
        ]);
        $req2Response->assertCreated()
            ->assertJsonPath('data.status', 'PENDING');
        $req2Id = $req2Response->json('data.id');

        // Both are currently PENDING
        $this->assertSame('PENDING', DB::table('rental_requests')->where('id', $req1Id)->value('status'));
        $this->assertSame('PENDING', DB::table('rental_requests')->where('id', $req2Id)->value('status'));

        // -------------------------------------------------------------
        // Step 4: Owner Reviews Inbox & Proposes Tenancy for Tenant 1 (FR29, FR31, RNT-11)
        // -------------------------------------------------------------
        $this->switchAccount($owner);
        $ownerInbox = $this->getJson('/api/v1/owner/rental-requests');
        $ownerInbox->assertOk()
            ->assertJsonPath('data.counts.PENDING', 2);

        // Owner creates tenancy proposal for Tenant 1
        $proposalResponse = $this->postJson('/api/v1/owner/rental-requests/'.$req1Id.'/proposal', [
            'client_operation_id' => (string) Str::uuid(),
            'unit_id' => $unitId,
            'start_date' => '2026-12-05',
            'end_date' => '2027-03-05',
            'monthly_rent' => 5000000,
            'deposit_amount' => 5000000,
            'policies_snapshot' => [
                'schema_version' => 1,
                'pets' => 'NOT_ALLOWED',
                'smoking' => 'NOT_ALLOWED',
                'shared_rules' => ['Giữ gìn vệ sinh chung'],
            ],
        ]);
        $proposalResponse->assertCreated();
        $tenancyId = $proposalResponse->json('data.tenancy_id');
        $this->assertNotNull($tenancyId);

        // -------------------------------------------------------------
        // Step 5: Immediate Coherence Check (RNT-11 Refinement)
        // -------------------------------------------------------------
        // Tenant 1 request is ACCEPTED
        $this->assertSame('ACCEPTED', DB::table('rental_requests')->where('id', $req1Id)->value('status'));

        // Competing Tenant 2 request is IMMEDIATELY AUTO-REJECTED
        $req2 = DB::table('rental_requests')->where('id', $req2Id)->first();
        $this->assertSame('REJECTED', $req2->status);
        $this->assertSame('Đã có khách thuê hoàn tất thỏa thuận', $req2->outcome_reason);

        // Tenant 1 sees ACCEPTED and linked pending confirmation tenancy
        $this->switchAccount($tenant1);
        $tenant1Dashboard = $this->getJson('/api/v1/tenant/rental-requests');
        $tenant1Dashboard->assertOk()
            ->assertJsonPath('data.items.0.id', $req1Id)
            ->assertJsonPath('data.items.0.status', 'ACCEPTED')
            ->assertJsonPath('data.items.0.tenancy.id', $tenancyId)
            ->assertJsonPath('data.items.0.tenancy.status', 'PENDING_CONFIRMATION');

        // Tenant 2 sees REJECTED with clear reason
        $this->switchAccount($tenant2);
        $tenant2Dashboard = $this->getJson('/api/v1/tenant/rental-requests');
        $tenant2Dashboard->assertOk()
            ->assertJsonPath('data.items.0.id', $req2Id)
            ->assertJsonPath('data.items.0.status', 'REJECTED')
            ->assertJsonPath('data.items.0.outcome_reason', 'Đã có khách thuê hoàn tất thỏa thuận');

        // -------------------------------------------------------------
        // Step 6: Tenancy Contract Mutual Confirmation
        // -------------------------------------------------------------
        $tenancy = DB::table('tenancies')->where('id', $tenancyId)->first();
        $contractId = $tenancy->pending_contract_id;
        $this->assertNotNull($contractId);

        // Tenant 2 CANNOT confirm Tenant 1's contract (Security authorization isolation: anti-enumeration 404)
        $this->switchAccount($tenant2);
        $this->postJson("/api/v1/tenant/tenancies/{$tenancyId}/contracts/{$contractId}/confirm", [
            'client_operation_id' => (string) Str::uuid(),
        ])->assertNotFound();

        // Tenant 1 confirms contract
        $this->switchAccount($tenant1);
        $confirmResponse = $this->postJson("/api/v1/tenant/tenancies/{$tenancyId}/contracts/{$contractId}/confirm", [
            'client_operation_id' => (string) Str::uuid(),
        ]);
        $confirmResponse->assertOk()
            ->assertJsonPath('data.status', 'CONFIRMED');

        $this->assertSame('CONFIRMED', DB::table('tenancies')->where('id', $tenancyId)->value('status'));
        $this->assertSame($contractId, DB::table('tenancies')->where('id', $tenancyId)->value('latest_confirmed_contract_id'));
        $this->assertNull(DB::table('tenancies')->where('id', $tenancyId)->value('pending_contract_id'));
    }

    private function switchAccount(User $user): void
    {
        Auth::guard('web')->logout();
        $this->app['auth']->forgetGuards();
        $this->flushSession();
        $this->actingAs($user, 'web');
    }
}
