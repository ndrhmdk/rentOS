<?php

namespace Tests\Feature;

use App\Models\RentalRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Support\PublicListingFixture;
use Tests\TestCase;

class OwnerRentalRequestsTest extends TestCase
{
    use RefreshDatabase;

    private const string OWNER = '/api/v1/owner/rental-requests';

    private const string TENANT = '/api/v1/tenant/rental-requests';

    protected function beforeRefreshingDatabase(): void
    {
        $this->assertSame('pgsql', config('database.default'));
        $this->assertSame('rentos_test', config('database.connections.pgsql.database'));
        $this->assertContains(config('database.connections.pgsql.host'), ['rentos-rnt04-db', '127.0.0.1', 'localhost']);
    }

    public function test_owner_reads_only_their_inbox_sorted_oldest_first_and_gets_contact_snapshots(): void
    {
        $listing = PublicListingFixture::published();
        $foreignListing = PublicListingFixture::published();
        $newer = RentalRequest::factory()->create(['listing_id' => $listing->listingId, 'created_at' => now()]);
        $older = RentalRequest::factory()->create([
            'listing_id' => $listing->listingId, 'created_at' => now()->subDay(),
            'contact_name' => 'Tên khi gửi', 'contact_phone' => '0900111222', 'message' => 'Muốn xem căn.',
        ]);
        $foreign = RentalRequest::factory()->create(['listing_id' => $foreignListing->listingId]);
        User::query()->whereKey($older->tenant_id)->update(['phone' => '0900999999']);

        $this->getJson(self::OWNER)->assertUnauthorized();
        $this->actingAs($listing->owner, 'web')->getJson(self::OWNER)->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertJsonPath('data.counts.PENDING', 2)
            ->assertJsonCount(2, 'data.items')
            ->assertJsonPath('data.items.0.id', $older->id)
            ->assertJsonPath('data.items.1.id', $newer->id)
            ->assertJsonPath('data.items.0.contact_phone', '0900111222')
            ->assertJsonMissingPath('data.items.0.message');
        $this->getJson(self::OWNER.'/'.$older->id)->assertOk()
            ->assertJsonPath('data.contact_name', 'Tên khi gửi')
            ->assertJsonPath('data.message', 'Muốn xem căn.');
        $this->getJson(self::OWNER.'/'.$foreign->id)->assertNotFound();
        $this->postJson(self::OWNER.'/'.$foreign->id.'/reject', $this->payload($foreign))->assertNotFound();
        $this->assertDatabaseHas('rental_requests', ['id' => $foreign->id, 'status' => 'PENDING']);
    }

    public function test_detail_excludes_blocks_touching_the_requested_end_but_allows_adjacent_rentals(): void
    {
        $listing = PublicListingFixture::published(['units' => [
            ['label' => 'Căn ưu tiên'], ['label' => 'Căn sát ngày'], ['label' => 'Căn trùng ngày'],
        ]]);
        PublicListingFixture::blockUnit($listing->unitIds[0], '2027-02-01', '2027-04-30');
        PublicListingFixture::blockUnit($listing->unitIds[1], '2027-04-01', '2027-06-30');
        PublicListingFixture::blockUnit($listing->unitIds[2], '2027-03-31', '2027-06-30');
        $item = RentalRequest::factory()->create([
            'listing_id' => $listing->listingId, 'preferred_unit_id' => $listing->unitIds[0],
            'desired_move_in_date' => '2027-01-01', 'desired_end_date' => '2027-03-31',
        ]);

        $this->actingAs($listing->owner, 'web')->getJson(self::OWNER.'/'.$item->id)->assertOk()
            ->assertJsonPath('data.preferred_unit_available', false)
            ->assertJsonCount(1, 'data.alternative_units')
            ->assertJsonPath('data.alternative_units.0.id', $listing->unitIds[1]);
        $this->assertDatabaseCount('tenancies', 3);
    }

    public function test_submitted_request_is_rejected_once_and_the_tenant_sees_the_reason(): void
    {
        $listing = PublicListingFixture::published();
        $tenant = User::factory()->create();
        $id = $this->actingAs($tenant, 'web')->postJson(self::TENANT, [
            'listing_id' => $listing->listingId,
            'client_operation_id' => (string) Str::uuid(),
            'contact_name' => 'Mai',
            'contact_phone' => '0901234567',
            'desired_move_in_date' => '2027-01-01',
            'desired_end_date' => '2027-03-31',
        ])->assertCreated()->json('data.id');
        $item = RentalRequest::query()->findOrFail($id);
        $url = self::OWNER.'/'.$id.'/reject';
        $payload = $this->payload($item);

        Auth::forgetGuards();
        $this->actingAs($listing->owner, 'web')->postJson($url, array_replace($payload, ['reason' => '  ']))
            ->assertUnprocessable()->assertJsonValidationErrors('reason');
        $this->postJson($url, array_replace($payload, [
            'expected_updated_at' => $item->updated_at->copy()->subSecond()->format('Y-m-d\TH:i:s.uP'),
        ]))->assertConflict();
        $this->postJson($url, $payload)->assertNoContent();
        $this->postJson($url, array_replace($payload, ['reason' => trim($payload['reason'])]))->assertNoContent();
        $this->postJson($url, array_replace($payload, ['reason' => 'Lý do khác']))->assertConflict();
        $this->postJson($url, array_replace($payload, ['client_operation_id' => (string) Str::uuid()]))->assertConflict();
        $this->getJson(self::OWNER.'?status=REJECTED')->assertOk()
            ->assertJsonPath('data.counts.PENDING', 0)->assertJsonPath('data.items.0.id', $id);

        DB::statement('SET CONSTRAINTS ALL IMMEDIATE');
        $this->assertDatabaseHas('audit_logs', [
            'actor_id' => $listing->owner->id, 'entity_id' => $id, 'action' => 'rental_request.rejected',
            'reason' => trim($payload['reason']), 'correlation_id' => $payload['client_operation_id'],
        ]);
        $this->assertDatabaseHas('notifications', [
            'recipient_id' => $tenant->id,
            'audience' => 'TENANT',
            'event_key' => 'rental_request.rejected:'.$id,
        ]);
        $this->assertDatabaseCount('audit_logs', 2);
        $this->assertDatabaseCount('notifications', 2);
        $this->assertDatabaseCount('idempotency_records', 2);
        $this->assertDatabaseCount('tenancies', 0);
        Auth::forgetGuards();
        $this->actingAs($tenant, 'web')->getJson(self::TENANT.'/'.$id)->assertOk()
            ->assertJsonPath('data.status', 'REJECTED')->assertJsonPath('data.outcome_reason', trim($payload['reason']));
    }

    public function test_personal_token_reads_only_its_owners_requests_and_cannot_manage_them(): void
    {
        $listing = PublicListingFixture::published();
        $foreignListing = PublicListingFixture::published();
        $item = RentalRequest::factory()->create(['listing_id' => $listing->listingId]);
        $foreign = RentalRequest::factory()->create(['listing_id' => $foreignListing->listingId]);
        $accountToken = $listing->owner->createToken('Read account', ['account:read'], now()->addHour());

        $this->withToken($accountToken->plainTextToken)->getJson(self::OWNER)->assertForbidden();

        Auth::forgetGuards();
        $token = $listing->owner->createToken('Read owner requests', ['rental-requests:read'], now()->addHour());
        $this->withToken($token->plainTextToken)->getJson(self::OWNER.'?status=ALL')->assertOk()
            ->assertJsonPath('data.counts.PENDING', 1)
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.id', $item->id);
        $this->getJson(self::OWNER.'/'.$item->id)->assertOk()->assertJsonPath('data.id', $item->id);
        $this->getJson(self::OWNER.'/'.$foreign->id)->assertNotFound();
        $this->getJson(self::OWNER.'/'.$item->id.'/proposal-context')->assertForbidden();
        $this->postJson(self::OWNER.'/'.$item->id.'/reject', $this->payload($item))->assertForbidden();
    }

    public function test_owner_gets_proposal_context_and_availability_for_pending_and_closed_requests(): void
    {
        $listing = PublicListingFixture::published();
        $foreign = PublicListingFixture::published();
        $tenant = User::factory()->create();

        $item = RentalRequest::factory()->create([
            'listing_id' => $listing->listingId,
            'tenant_id' => $tenant->id,
            'preferred_unit_id' => null,
            'desired_move_in_date' => '2026-12-01',
            'desired_end_date' => '2027-06-01',
            'status' => 'PENDING',
        ]);

        // Archived unit must be excluded from proposal context
        $primaryUnit = DB::table('units')->where('property_id', $listing->propertyId)->first();
        $this->assertNotNull($primaryUnit);
        $baseUnit = (array) $primaryUnit;
        $baseUnit['id'] = (string) Str::uuid();
        $baseUnit['client_operation_id'] = (string) Str::uuid();
        $baseUnit['label'] = 'Archived Unit';
        $baseUnit['archived_at'] = now();
        DB::table('units')->insert($baseUnit);

        // Conflicting tenancy on the primary unit
        $blockingReq = RentalRequest::factory()->create([
            'listing_id' => $listing->listingId,
            'status' => 'ACCEPTED',
            'closed_at' => now(),
        ]);
        DB::table('tenancies')->insert([
            'id' => (string) Str::uuid(),
            'unit_id' => $primaryUnit->id,
            'owner_id' => $listing->owner->id,
            'tenant_id' => $blockingReq->tenant_id,
            'rental_request_id' => $blockingReq->id,
            'client_operation_id' => (string) Str::uuid(),
            'status' => 'CONFIRMED',
            'blocked_start_date' => '2026-11-15',
            'blocked_end_date' => '2027-01-15',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($listing->owner, 'web')
            ->getJson(self::OWNER.'/'.$item->id.'/proposal-context')
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertJsonPath('data.request.id', $item->id)
            ->assertJsonCount(1, 'data.units')
            ->assertJsonPath('data.units.0.id', $primaryUnit->id)
            ->assertJsonPath('data.units.0.has_date_conflict', true);

        // Non-owner or missing request returns 404
        $foreignReq = RentalRequest::factory()->create(['listing_id' => $foreign->listingId]);
        $this->actingAs($listing->owner, 'web')
            ->getJson(self::OWNER.'/'.$foreignReq->id.'/proposal-context')
            ->assertNotFound();

        // show() when preferred_unit_id is null
        $this->actingAs($listing->owner, 'web')
            ->getJson(self::OWNER.'/'.$item->id)
            ->assertOk()
            ->assertJsonPath('data.preferred_unit_available', null);

        // show() when status !== PENDING
        $this->actingAs($listing->owner, 'web')
            ->postJson(self::OWNER.'/'.$item->id.'/reject', $this->payload($item))
            ->assertNoContent();
        $this->actingAs($listing->owner, 'web')
            ->getJson(self::OWNER.'/'.$item->id)
            ->assertOk()
            ->assertJsonPath('data.preferred_unit_available', null)
            ->assertJsonPath('data.alternative_units', []);
    }

    /** @return array<string, string> */
    private function payload(RentalRequest $item): array
    {
        return [
            'client_operation_id' => (string) Str::uuid(),
            'expected_updated_at' => $item->updated_at->format('Y-m-d\TH:i:s.uP'),
            'reason' => '  Không có căn phù hợp.  ',
        ];
    }
}
