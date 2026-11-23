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

class TenantSummaryTest extends TestCase
{
    use RefreshDatabase;

    private const string PATH = '/api/v1/tenant/summary';

    protected function beforeRefreshingDatabase(): void
    {
        $this->assertSame('pgsql', config('database.default'));
        $this->assertSame('rentos_test', config('database.connections.pgsql.database'));
        $this->assertContains(config('database.connections.pgsql.host'), ['rentos-rnt04-db', '127.0.0.1', 'localhost']);
    }

    public function test_current_tenant_only_sees_their_counts_and_audience_and_expired_proposals_stop_appearing(): void
    {
        $this->freezeTime();
        $listing = PublicListingFixture::published(['title' => 'Studio chờ xác nhận']);
        $foreignListing = PublicListingFixture::published(['title' => 'Đề xuất của người khác']);
        $start = now()->addDays(30);
        $end = $start->copy()->addMonthsNoOverflow(4)->subDay();
        PublicListingFixture::blockUnit($listing->unitIds[0], $start->toDateString(), $end->toDateString());
        PublicListingFixture::blockUnit($foreignListing->unitIds[0], $start->toDateString(), $end->toDateString());
        $tenancy = DB::table('tenancies')->where('unit_id', $listing->unitIds[0])->firstOrFail();
        $tenant = User::query()->findOrFail($tenancy->tenant_id);
        $foreignTenantId = DB::table('tenancies')->where('unit_id', $foreignListing->unitIds[0])->value('tenant_id');

        $pending = null;
        for ($index = 0; $index < 6; $index++) {
            $requestedListing = PublicListingFixture::published();
            $request = RentalRequest::factory()->create([
                'tenant_id' => $tenant->id, 'listing_id' => $requestedListing->listingId,
                'created_at' => now()->subMinutes($index + 1),
            ]);
            if ($index === 0) {
                $pending = $request;
            }
            $this->notification($tenant->id, "Thông báo {$index}", 'TENANT', $index + 1);
        }
        $this->assertNotNull($pending);
        $this->notification($tenant->id, 'Thông báo đã đọc', 'TENANT', 0, read: true);
        $this->notification($tenant->id, 'Thông báo chủ nhà', 'OWNER', 0);
        $this->notification($foreignTenantId, 'Thông báo riêng tư của người khác', 'TENANT', 0);

        $this->getJson(self::PATH)->assertUnauthorized();
        $this->actingAs($tenant, 'web')->getJson(self::PATH.'?tenant_id='.$foreignTenantId)
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertJsonPath('data.counts', [
                'tenancies' => 1, 'pending_rental_requests' => 6,
                'awaiting_confirmation' => 1, 'unread_notifications' => 6,
            ])
            ->assertJsonCount(5, 'data.pending_actions')
            ->assertJsonCount(5, 'data.recent_requests')
            ->assertJsonCount(5, 'data.recent_notifications')
            ->assertJsonPath('data.pending_actions.0.href', '/tenant/tenancies/'.$tenancy->id)
            ->assertJsonPath('data.pending_actions.0.kind', 'contract')
            ->assertJsonPath('data.pending_actions.1.href', '/tenant/requests/'.$pending->id)
            ->assertJsonPath('data.recent_requests.0.status', 'ACCEPTED')
            ->assertJsonPath('data.recent_notifications.0.title', 'Thông báo đã đọc')
            ->assertJsonMissing(['title' => 'Thông báo chủ nhà'])
            ->assertJsonMissing(['title' => 'Đề xuất của người khác'])
            ->assertJsonMissing(['title' => 'Thông báo riêng tư của người khác']);

        $this->travel(3)->days();
        $this->getJson(self::PATH)->assertOk()
            ->assertJsonPath('data.counts.awaiting_confirmation', 0)
            ->assertJsonPath('data.pending_actions.0.kind', 'rental_request')
            ->assertJsonMissing(['kind' => 'contract']);
        $this->assertDatabaseHas('tenancies', ['id' => $tenancy->id, 'status' => 'PENDING_CONFIRMATION']);
    }

    public function test_confirmed_move_in_and_renewal_proposal_show_the_correct_actions(): void
    {
        $this->freezeTime();
        $listing = PublicListingFixture::published(['name' => 'Căn hộ A', 'ward' => 'Hải Châu']);
        $start = now()->addDays(30);
        $end = $start->copy()->addMonthsNoOverflow(4)->subDay();
        PublicListingFixture::blockUnit($listing->unitIds[0], $start->toDateString(), $end->toDateString());
        $tenancy = DB::table('tenancies')->where('unit_id', $listing->unitIds[0])->firstOrFail();
        $tenant = User::query()->findOrFail($tenancy->tenant_id);
        $destination = '/tenant/tenancies/'.$tenancy->id;
        $tenantApi = '/api/v1'.$destination;

        $this->actingAs($tenant, 'web')->postJson($tenantApi.'/contracts/'.$tenancy->pending_contract_id.'/confirm', [
            'client_operation_id' => (string) Str::uuid(),
        ])->assertOk();
        $this->getJson(self::PATH)->assertOk()
            ->assertJsonPath('data.counts.awaiting_confirmation', 0)
            ->assertJsonPath('data.upcoming_tenancy.title', 'Căn hộ A')
            ->assertJsonPath('data.upcoming_tenancy.start_date', $start->toDateString())
            ->assertJsonPath('data.upcoming_tenancy.monthly_rent', '3800000')
            ->assertJsonPath('data.upcoming_tenancy.href', $destination)
            ->assertJsonPath('data.renewal_href', $destination);

        $requestedEnd = $end->copy()->addMonthsNoOverflow(3)->toDateString();
        $this->postJson($tenantApi.'/renewal-requests', [
            'client_operation_id' => (string) Str::uuid(),
            'requested_end_date' => $requestedEnd,
            'proposed_monthly_rent' => 4_200_000,
        ])->assertCreated();
        $renewalId = DB::table('tenancy_renewal_requests')->where('tenancy_id', $tenancy->id)->value('id');

        Auth::forgetGuards();
        $this->actingAs($listing->owner, 'web')->postJson('/api/v1/owner/tenancies/'.$tenancy->id.'/renewal-requests/'.$renewalId.'/proposal', [
            'client_operation_id' => (string) Str::uuid(),
            'end_date' => $requestedEnd,
            'monthly_rent' => 4_200_000,
            'deposit_amount' => 3_800_000,
            'policies_snapshot' => ['schema_version' => 1, 'pets' => 'NOT_ALLOWED', 'smoking' => 'NOT_ALLOWED', 'shared_rules' => []],
        ])->assertCreated();

        Auth::forgetGuards();
        $this->actingAs($tenant, 'web')->getJson(self::PATH)->assertOk()
            ->assertJsonPath('data.counts.awaiting_confirmation', 0)
            ->assertJsonPath('data.pending_actions.0.kind', 'renewal')
            ->assertJsonPath('data.pending_actions.0.monthly_rent', '4200000')
            ->assertJsonPath('data.upcoming_tenancy.monthly_rent', '3800000')
            ->assertJsonPath('data.renewal_href', null);
    }

    public function test_personal_token_does_not_grant_access_to_the_tenant_summary(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('Read account', ['account:read'], now()->addHour());

        $this->withToken($token->plainTextToken)->getJson(self::PATH)->assertForbidden();
    }

    private function notification(string $recipient, string $title, string $audience, int $minutes, bool $read = false): void
    {
        $resource = (string) Str::uuid();

        DB::table('notifications')->insert([
            'recipient_id' => $recipient, 'audience' => $audience,
            'event_key' => 'test.notification:'.$resource,
            'title' => $title, 'body' => 'Thông báo thử nghiệm.',
            'resource_type' => 'rental_request', 'resource_id' => $resource,
            'created_at' => now()->subMinutes($minutes), 'read_at' => $read ? now() : null,
        ]);
    }
}
