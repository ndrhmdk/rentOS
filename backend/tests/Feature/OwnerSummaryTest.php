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

class OwnerSummaryTest extends TestCase
{
    use RefreshDatabase;

    private const string PATH = '/api/v1/owner/summary';

    protected function beforeRefreshingDatabase(): void
    {
        $this->assertSame('pgsql', config('database.default'));
        $this->assertSame('rentos_test', config('database.connections.pgsql.database'));
        $this->assertContains(config('database.connections.pgsql.host'), ['rentos-rnt04-db', '127.0.0.1', 'localhost']);
    }

    public function test_property_preview_only_shows_current_properties_and_their_real_cover_and_status(): void
    {
        $this->freezeTime();
        $listing = PublicListingFixture::published([
            'name' => 'Studio Mỹ Khê', 'ward' => 'Phước Mỹ', 'admin_suspended_at' => now(),
            'units' => [[], ['is_marketed' => false, 'archived_at' => now()]],
        ]);
        $foreign = PublicListingFixture::published(['name' => 'Bất động sản chủ nhà khác']);
        $property = DB::table('properties')->where('id', $listing->propertyId)->firstOrFail();
        for ($index = 1; $index <= 4; $index++) {
            DB::table('properties')->insert(array_replace((array) $property, [
                'id' => (string) Str::uuid(),
                'client_operation_id' => (string) Str::uuid(),
                'name' => "Căn {$index}",
                'created_at' => now()->subDays($index),
                'archived_at' => $index === 1 ? now() : null,
            ]));
        }

        $endpoint = self::PATH.'/properties';
        $this->getJson($endpoint)->assertUnauthorized();
        $this->actingAs($listing->owner, 'web')->getJson($endpoint.'?owner_id='.$foreign->owner->id)
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0', [
                'id' => $listing->propertyId,
                'name' => 'Studio Mỹ Khê',
                'ward' => 'Phước Mỹ',
                'city' => 'Đà Nẵng',
                'rental_arrangement' => 'SEPARATE_UNITS',
                'unit_count' => 1,
                'photo_url' => 'https://example.supabase.co/storage/v1/object/public/property-media/listings/'.$listing->coverMediaId.'.jpg',
                'moderation_status' => 'APPROVED',
                'publication_status' => 'PUBLISHED',
                'suspended' => true,
            ])
            ->assertJsonPath('data.1.photo_url', null)
            ->assertJsonPath('data.1.moderation_status', null)
            ->assertJsonPath('data.1.name', 'Căn 2')
            ->assertJsonPath('data.2.name', 'Căn 3')
            ->assertJsonMissing(['name' => 'Bất động sản chủ nhà khác']);
    }

    public function test_counts_and_previews_are_scoped_to_the_owner_and_notification_audience(): void
    {
        $this->freezeTime();
        $listing = PublicListingFixture::published(['units' => [[], []]]);
        $foreign = PublicListingFixture::published();
        $property = DB::table('properties')->where('id', $listing->propertyId)->first();
        $this->assertNotNull($property);
        DB::table('properties')->insert(array_replace((array) $property, [
            'id' => (string) Str::uuid(),
            'client_operation_id' => (string) Str::uuid(),
            'archived_at' => now(),
        ]));

        $oldest = RentalRequest::factory()->create(['listing_id' => $listing->listingId, 'created_at' => now()->subDays(10)]);
        RentalRequest::factory()->count(5)->create(['listing_id' => $listing->listingId, 'created_at' => now()->subDay()]);
        $foreignRequest = RentalRequest::factory()->create(['listing_id' => $foreign->listingId, 'contact_name' => 'Người thuê của chủ nhà khác']);
        PublicListingFixture::blockUnit($listing->unitIds[0], '2027-04-01', '2027-07-31');
        PublicListingFixture::blockUnit($listing->unitIds[1], '2027-04-01', '2027-07-31');
        DB::table('tenancies')->where('unit_id', $listing->unitIds[1])->update(['confirmation_expires_at' => now()->subMinute()]);
        PublicListingFixture::blockUnit($foreign->unitIds[0], '2027-04-01', '2027-07-31');

        for ($index = 0; $index < 6; $index++) {
            $this->notification($listing->owner, "Thông báo {$index}", index: $index);
        }
        $this->notification($listing->owner, 'Thông báo đã đọc', read: true);
        $this->notification($listing->owner, 'Thông báo cổng người thuê', audience: 'TENANT');
        $this->notification($foreign->owner, 'Thông báo của chủ nhà khác');

        $this->getJson(self::PATH)->assertUnauthorized();
        $this->actingAs($listing->owner, 'web')->getJson(self::PATH)
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertJsonPath('data.counts', [
                'pending_rental_requests' => 6,
                'awaiting_tenant_confirmation' => 1,
                'active_properties' => 1,
                'unread_notifications' => 6,
            ])
            ->assertJsonCount(5, 'data.recent_requests')
            ->assertJsonCount(5, 'data.pending_actions')
            ->assertJsonCount(5, 'data.recent_notifications')
            ->assertJsonPath('data.pending_actions.0.href', '/owner/requests/'.$oldest->id)
            ->assertJsonPath('data.recent_notifications.0.title', 'Thông báo đã đọc')
            ->assertJsonPath('data.recent_notifications.1.title', 'Thông báo 0')
            ->assertJsonMissingPath('data.recent_requests.0.contact_phone')
            ->assertJsonMissing(['contact_name' => $foreignRequest->contact_name])
            ->assertJsonMissing(['title' => 'Thông báo của chủ nhà khác'])
            ->assertJsonMissing(['title' => 'Thông báo cổng người thuê']);

        Auth::forgetGuards();
        $this->actingAs($foreign->owner, 'web')->getJson(self::PATH)
            ->assertOk()
            ->assertJsonPath('data.counts.pending_rental_requests', 1)
            ->assertJsonPath('data.recent_notifications.0.title', 'Thông báo của chủ nhà khác');
    }

    public function test_admin_without_owned_records_sees_empty_summary(): void
    {
        $listing = PublicListingFixture::published();
        RentalRequest::factory()->create(['listing_id' => $listing->listingId]);
        $this->notification($listing->owner, 'Dữ liệu riêng của chủ nhà');

        $this->actingAs(User::factory()->create(['is_admin' => true]), 'web')
            ->getJson(self::PATH.'?owner_id='.$listing->owner->id)
            ->assertOk()
            ->assertExactJson(['data' => [
                'counts' => [
                    'pending_rental_requests' => 0,
                    'awaiting_tenant_confirmation' => 0,
                    'active_properties' => 0,
                    'unread_notifications' => 0,
                ],
                'recent_requests' => [],
                'pending_actions' => [],
                'recent_notifications' => [],
            ]]);
    }

    public function test_summary_separates_owner_actions_from_proposals_awaiting_the_tenant(): void
    {
        $this->freezeTime();
        $listing = PublicListingFixture::published(['units' => [[], []]]);
        $start = now()->addDays(30);
        $end = $start->copy()->addMonthsNoOverflow(4)->subDay();
        foreach ($listing->unitIds as $unitId) {
            PublicListingFixture::blockUnit($unitId, $start->toDateString(), $end->toDateString());
        }
        $correction = DB::table('tenancies')->where('unit_id', $listing->unitIds[0])->firstOrFail();
        $renewing = DB::table('tenancies')->where('unit_id', $listing->unitIds[1])->firstOrFail();
        $correctionUrl = '/api/v1/tenant/tenancies/'.$correction->id.'/contracts/'.$correction->pending_contract_id.'/decline';
        $renewalTenantPath = '/api/v1/tenant/tenancies/'.$renewing->id;
        $renewalOwnerPath = '/api/v1/owner/tenancies/'.$renewing->id;
        $renewalEndDate = $end->copy()->addMonthsNoOverflow(3)->toDateString();

        $this->actingAs(User::query()->findOrFail($correction->tenant_id), 'web')
            ->postJson($correctionUrl, ['client_operation_id' => (string) Str::uuid(), 'reason' => 'Tôi muốn đổi điều khoản.'])
            ->assertOk();
        Auth::forgetGuards();
        $this->actingAs(User::query()->findOrFail($renewing->tenant_id), 'web')
            ->postJson($renewalTenantPath.'/contracts/'.$renewing->pending_contract_id.'/confirm', ['client_operation_id' => (string) Str::uuid()])
            ->assertOk();
        $this->postJson($renewalTenantPath.'/renewal-requests', [
            'client_operation_id' => (string) Str::uuid(),
            'requested_end_date' => $renewalEndDate,
            'proposed_monthly_rent' => 3_800_000,
        ])->assertCreated();
        $renewalId = DB::table('tenancy_renewal_requests')->where('tenancy_id', $renewing->id)->value('id');

        Auth::forgetGuards();
        $this->actingAs($listing->owner, 'web')->getJson(self::PATH)->assertOk()
            ->assertJsonPath('data.counts.awaiting_tenant_confirmation', 0)
            ->assertJsonPath('data.pending_actions.0.kind', 'contract_correction')
            ->assertJsonPath('data.pending_actions.0.href', '/owner/tenancies/'.$correction->id.'/correction')
            ->assertJsonPath('data.pending_actions.1.kind', 'renewal')
            ->assertJsonPath('data.pending_actions.1.href', '/owner/tenancies/'.$renewing->id);

        $this->postJson($renewalOwnerPath.'/renewal-requests/'.$renewalId.'/proposal', [
            'client_operation_id' => (string) Str::uuid(),
            'end_date' => $renewalEndDate,
            'monthly_rent' => 3_800_000,
            'deposit_amount' => 3_800_000,
            'policies_snapshot' => [
                'schema_version' => 1,
                'pets' => 'NOT_ALLOWED',
                'smoking' => 'NOT_ALLOWED',
                'shared_rules' => [],
            ],
        ])->assertCreated();

        $this->getJson(self::PATH)->assertOk()
            ->assertJsonPath('data.counts.awaiting_tenant_confirmation', 1)
            ->assertJsonCount(1, 'data.pending_actions')
            ->assertJsonPath('data.pending_actions.0.kind', 'contract_correction');
    }

    public function test_personal_token_is_forbidden_even_for_the_owner(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('Read account', ['account:read'], now()->addHour());

        $this->withToken($token->plainTextToken)->getJson(self::PATH)->assertForbidden();
    }

    private function notification(User $user, string $title, string $audience = 'OWNER', int $index = 0, bool $read = false): void
    {
        $resource = (string) Str::uuid();

        DB::table('notifications')->insert([
            'recipient_id' => $user->id,
            'audience' => $audience,
            'event_key' => 'rental_request.submitted:'.$resource,
            'title' => $title,
            'body' => 'Nội dung thông báo.',
            'resource_type' => 'rental_request',
            'resource_id' => $resource,
            'created_at' => now()->subMinutes($read ? 0 : $index + 1),
            'read_at' => $read ? now() : null,
        ]);
    }
}
