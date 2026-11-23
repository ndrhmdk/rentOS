<?php

namespace Tests\Feature;

use App\Actions\RentalRequests\RejectAgedRentalRequestAction;
use App\Http\Resources\OwnerRentalRequestResource;
use App\Http\Resources\TenantRentalRequestResource;
use App\Models\Listing;
use App\Models\RentalRequest;
use App\Models\Unit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Support\PublicListingFixture;
use Tests\TestCase;

class RejectAgedRentalRequestsTest extends TestCase
{
    use RefreshDatabase;

    protected function beforeRefreshingDatabase(): void
    {
        $this->assertSame('pgsql', config('database.default'));
        $this->assertSame('rentos_test', config('database.connections.pgsql.database'));
    }

    /**
     * FR85-AC01: Boundary: age 14d 23h 59m and all units blocked -> Keep PENDING; not due.
     */
    public function test_boundary_age_under_15_days_retains_pending_even_if_all_units_are_blocked(): void
    {
        $listing = PublicListingFixture::published();
        $unitId = $listing->unitIds[0];

        // Block the only unit
        PublicListingFixture::blockUnit($unitId, now()->toDateString(), now()->addMonths(6)->toDateString(), 'ACTIVE');

        // Request created 14 days, 23 hours, 59 minutes ago (< 15 full days)
        $request = RentalRequest::factory()->create([
            'listing_id' => $listing->listingId,
            'created_at' => now()->subDays(15)->addMinute(),
            'desired_move_in_date' => now()->addDays(5)->toDateString(),
            'desired_end_date' => now()->addMonths(3)->toDateString(),
            'status' => 'PENDING',
        ]);

        $this->artisan('rentals:reject-aged')
            ->expectsOutputToContain('0 pending rental request(s) aged >= 15 days.')
            ->assertSuccessful();

        $this->assertSame('PENDING', $request->fresh()->status);
        $this->assertNull($request->fresh()->closed_at);
    }

    /**
     * FR85-AC02: Positive: age >= 15d and no qualifying unit for complete requested period -> REJECTED with NO_AVAILABLE_UNIT.
     */
    public function test_positive_aged_15_days_rejects_when_no_eligible_unit_covers_interval(): void
    {
        $listing = PublicListingFixture::published();
        $unitId = $listing->unitIds[0];

        // Block the unit for the requested period
        PublicListingFixture::blockUnit($unitId, now()->addDays(1)->toDateString(), now()->addMonths(6)->toDateString(), 'CONFIRMED');

        $request = RentalRequest::factory()->create([
            'listing_id' => $listing->listingId,
            'created_at' => now()->subDays(15)->subMinute(),
            'desired_move_in_date' => now()->addDays(5)->toDateString(),
            'desired_end_date' => now()->addMonths(3)->toDateString(),
            'status' => 'PENDING',
        ]);

        $this->artisan('rentals:reject-aged')
            ->expectsOutputToContain('Found 1 pending rental request(s) aged >= 15 days.')
            ->expectsOutputToContain("Request {$request->id}: REJECTED (NO_AVAILABLE_UNIT).")
            ->assertSuccessful();

        $fresh = $request->fresh();
        $this->assertSame('REJECTED', $fresh->status);
        $this->assertSame('NO_AVAILABLE_UNIT', $fresh->outcome_reason);
        $this->assertNotNull($fresh->closed_at);
        $this->assertNotNull($fresh->availability_checked_at);

        // Audit log exists
        $this->assertDatabaseHas('audit_logs', [
            'entity_type' => 'rental_request',
            'entity_id' => $request->id,
            'action' => 'rental_request.rejected_aged',
            'reason' => 'NO_AVAILABLE_UNIT',
        ]);

        // Outbox notification recorded once
        $this->assertDatabaseHas('notifications', [
            'recipient_id' => $request->tenant_id,
            'audience' => 'TENANT',
            'event_key' => 'rental_request.rejected_aged:'.$request->id,
        ]);

        // Retrying command is idempotent
        $this->artisan('rentals:reject-aged')
            ->expectsOutputToContain('Found 0 pending rental request(s) aged >= 15 days.')
            ->assertSuccessful();

        $this->assertSame(1, DB::table('notifications')->where('event_key', 'rental_request.rejected_aged:'.$request->id)->count());
    }

    /**
     * FR85-AC03: Alternative unit available although preferred unit is blocked -> Keep PENDING.
     */
    public function test_aged_request_is_kept_pending_if_alternative_unit_in_property_is_free(): void
    {
        $listing = PublicListingFixture::published();
        $preferredUnitId = $listing->unitIds[0];

        // Add a second marketed ready unit to the same property
        $altUnit = Unit::query()->create([
            'property_id' => $listing->propertyId,
            'client_operation_id' => (string) str()->uuid(),
            'label' => 'Phòng 102 - Thay thế',
            'unit_kind' => 'STUDIO',
            'description' => 'Căn thay thế còn trống.',
            'floor' => '1',
            'area_m2' => 30,
            'bedrooms' => 1,
            'bathrooms' => 1,
            'bathroom_arrangement' => 'PRIVATE',
            'amenities' => PublicListingFixture::amenityDocument(),
            'advertised_monthly_rent' => 5000000,
            'deposit' => 5000000,
            'minimum_rental_months' => 3,
            'max_occupants' => 2,
            'operational_status' => 'READY',
            'is_marketed' => true,
        ]);

        // Block ONLY the preferred unit
        PublicListingFixture::blockUnit($preferredUnitId, now()->toDateString(), now()->addMonths(6)->toDateString(), 'CONFIRMED');

        $request = RentalRequest::factory()->create([
            'listing_id' => $listing->listingId,
            'preferred_unit_id' => $preferredUnitId,
            'created_at' => now()->subDays(16),
            'desired_move_in_date' => now()->addDays(5)->toDateString(),
            'desired_end_date' => now()->addMonths(3)->toDateString(),
            'status' => 'PENDING',
        ]);

        $this->artisan('rentals:reject-aged')
            ->expectsOutputToContain("Request {$request->id}: PENDING_KEPT (eligible unit available).")
            ->assertSuccessful();

        $fresh = $request->fresh();
        $this->assertSame('PENDING', $fresh->status);
        $this->assertNull($fresh->closed_at);
        $this->assertNotNull($fresh->availability_checked_at);
    }

    /**
     * FR85-AC04: Reap expired hold under lock; retain request if unit now available.
     */
    public function test_aged_request_reaps_due_hold_and_retains_pending(): void
    {
        $listing = PublicListingFixture::published();
        $unitId = $listing->unitIds[0];

        // Create an expired reservation hold on the unit
        PublicListingFixture::blockUnit($unitId, now()->toDateString(), now()->addMonths(6)->toDateString(), 'PENDING_CONFIRMATION');
        $expiredTenancy = DB::table('tenancies')->where('unit_id', $unitId)->first();
        DB::table('tenancies')->where('id', $expiredTenancy->id)->update([
            'confirmation_expires_at' => now()->subHour(),
        ]);

        $request = RentalRequest::factory()->create([
            'listing_id' => $listing->listingId,
            'created_at' => now()->subDays(16),
            'desired_move_in_date' => now()->addDays(5)->toDateString(),
            'desired_end_date' => now()->addMonths(3)->toDateString(),
            'status' => 'PENDING',
        ]);

        $this->artisan('rentals:reject-aged')
            ->expectsOutputToContain("Request {$request->id}: PENDING_KEPT (eligible unit available).")
            ->assertSuccessful();

        $this->assertSame('PENDING', $request->fresh()->status);
        // Expired hold was reaped
        $this->assertSame('EXPIRED', DB::table('tenancies')->where('id', $expiredTenancy->id)->value('status'));
    }

    /**
     * FR85-AC05: Race: Scheduler rejects while owner creates proposal or tenant withdraws -> one terminal transition.
     */
    public function test_scheduler_does_not_reject_accepted_or_withdrawn_request(): void
    {
        $listing = PublicListingFixture::published();
        $unitId = $listing->unitIds[0];

        // Block unit (creates an ACCEPTED request under the hood)
        PublicListingFixture::blockUnit($unitId, now()->toDateString(), now()->addMonths(6)->toDateString(), 'ACTIVE');
        $acceptedRequest = RentalRequest::query()->where('listing_id', $listing->listingId)->where('status', 'ACCEPTED')->firstOrFail();
        $acceptedRequest->forceFill(['created_at' => now()->subDays(20)])->saveQuietly();

        // Request is already WITHDRAWN
        $withdrawnRequest = RentalRequest::factory()->create([
            'listing_id' => $listing->listingId,
            'created_at' => now()->subDays(20),
            'status' => 'WITHDRAWN',
            'closed_at' => now()->subDays(10),
        ]);

        $this->artisan('rentals:reject-aged')
            ->expectsOutputToContain('0 pending rental request(s) aged >= 15 days.')
            ->assertSuccessful();

        $this->assertSame('ACCEPTED', $acceptedRequest->fresh()->status);
        $this->assertSame('WITHDRAWN', $withdrawnRequest->fresh()->status);
    }

    /**
     * FR85-AC06: Inventory change / maintenance release competes with availability scan.
     */
    public function test_unit_in_maintenance_is_not_eligible_until_released_to_ready(): void
    {
        $listing = PublicListingFixture::published();
        $unit = Unit::query()->findOrFail($listing->unitIds[0]);

        // Put unit into MAINTENANCE
        $unit->update(['operational_status' => 'MAINTENANCE']);

        $request = RentalRequest::factory()->create([
            'listing_id' => $listing->listingId,
            'created_at' => now()->subDays(16),
            'desired_move_in_date' => now()->addDays(5)->toDateString(),
            'desired_end_date' => now()->addMonths(3)->toDateString(),
            'status' => 'PENDING',
        ]);

        // In maintenance -> not eligible -> rejected
        $this->artisan('rentals:reject-aged')
            ->expectsOutputToContain("Request {$request->id}: REJECTED (NO_AVAILABLE_UNIT).")
            ->assertSuccessful();

        $this->assertSame('REJECTED', $request->fresh()->status);
    }

    /**
     * FR85-AC07: Integrity: Listing manually hidden but suitable unit available -> keep pending.
     */
    public function test_manually_hidden_listing_does_not_infer_unavailability_and_keeps_pending(): void
    {
        $listing = PublicListingFixture::published();
        // Manually hide listing
        Listing::query()->whereKey($listing->listingId)->update([
            'publication_status' => 'HIDDEN',
        ]);

        $request = RentalRequest::factory()->create([
            'listing_id' => $listing->listingId,
            'created_at' => now()->subDays(16),
            'desired_move_in_date' => now()->addDays(5)->toDateString(),
            'desired_end_date' => now()->addMonths(3)->toDateString(),
            'status' => 'PENDING',
        ]);

        $this->artisan('rentals:reject-aged')
            ->expectsOutputToContain("Request {$request->id}: PENDING_KEPT (eligible unit available).")
            ->assertSuccessful();

        $this->assertSame('PENDING', $request->fresh()->status);
    }

    /**
     * FR85-AC08: Date boundary: Desired move-in already in past -> use stored interval directly without silent shifting.
     */
    public function test_desired_move_in_in_the_past_evaluates_stored_interval_without_shifting(): void
    {
        $listing = PublicListingFixture::published();
        $unitId = $listing->unitIds[0];

        // Past interval: 30 days ago to 10 days ago
        $pastMoveIn = now()->subDays(30)->toDateString();
        $pastEnd = now()->subDays(10)->toDateString();

        // Block that past interval
        PublicListingFixture::blockUnit($unitId, now()->subDays(35)->toDateString(), now()->subDays(5)->toDateString(), 'CONFIRMED');

        $request = RentalRequest::factory()->create([
            'listing_id' => $listing->listingId,
            'created_at' => now()->subDays(16),
            'desired_move_in_date' => $pastMoveIn,
            'desired_end_date' => $pastEnd,
            'status' => 'PENDING',
        ]);

        $this->artisan('rentals:reject-aged')
            ->expectsOutputToContain("Request {$request->id}: REJECTED (NO_AVAILABLE_UNIT).")
            ->assertSuccessful();

        $fresh = $request->fresh();
        $this->assertSame('REJECTED', $fresh->status);
        // Stored dates remain untouched (not shifted to today or future)
        $this->assertSame($pastMoveIn, $fresh->desired_move_in_date->toDateString());
        $this->assertSame($pastEnd, $fresh->desired_end_date->toDateString());
    }

    /**
     * Stage 4: Test --dry-run scans and reports real availability without mutating database.
     */
    public function test_dry_run_scans_and_evaluates_availability_without_persisting_changes(): void
    {
        $listing = PublicListingFixture::published();
        $unitId = $listing->unitIds[0];

        // Case A: Blocked unit -> Would be REJECTED
        PublicListingFixture::blockUnit($unitId, now()->toDateString(), now()->addMonths(6)->toDateString(), 'CONFIRMED');

        $reqA = RentalRequest::factory()->create([
            'listing_id' => $listing->listingId,
            'created_at' => now()->subDays(16),
            'desired_move_in_date' => now()->addDays(5)->toDateString(),
            'desired_end_date' => now()->addMonths(3)->toDateString(),
            'status' => 'PENDING',
        ]);

        // Case B: Create another listing with a free unit -> Would be KEPT
        $listingB = PublicListingFixture::published();
        $reqB = RentalRequest::factory()->create([
            'listing_id' => $listingB->listingId,
            'created_at' => now()->subDays(16),
            'desired_move_in_date' => now()->addDays(5)->toDateString(),
            'desired_end_date' => now()->addMonths(3)->toDateString(),
            'status' => 'PENDING',
        ]);

        // Case C: Young request (< 15 days) -> Not included in sweep
        $reqC = RentalRequest::factory()->create([
            'listing_id' => $listing->listingId,
            'created_at' => now()->subDays(5),
            'desired_move_in_date' => now()->addDays(5)->toDateString(),
            'desired_end_date' => now()->addMonths(3)->toDateString(),
            'status' => 'PENDING',
        ]);

        $auditCountBefore = DB::table('audit_logs')->count();
        $notifCountBefore = DB::table('notifications')->count();

        $this->artisan('rentals:reject-aged --dry-run')
            ->expectsOutputToContain('Found 2 pending rental request(s) aged >= 15 days.')
            ->expectsOutputToContain("DRY-RUN: Request {$reqA->id} would be REJECTED (NO_AVAILABLE_UNIT).")
            ->expectsOutputToContain("DRY-RUN: Request {$reqB->id} would be KEPT.")
            ->expectsOutputToContain('Completed aged rental requests sweep: 1 rejected, 1 retained pending.')
            ->assertSuccessful();

        // Verify NO database changes occurred
        $this->assertSame('PENDING', $reqA->fresh()->status);
        $this->assertNull($reqA->fresh()->closed_at);
        $this->assertNull($reqA->fresh()->availability_checked_at);

        $this->assertSame('PENDING', $reqB->fresh()->status);
        $this->assertNull($reqB->fresh()->closed_at);
        $this->assertNull($reqB->fresh()->availability_checked_at);

        $this->assertSame('PENDING', $reqC->fresh()->status);

        // Verify zero audit logs or notifications were emitted
        $this->assertSame($auditCountBefore, DB::table('audit_logs')->count());
        $this->assertSame($notifCountBefore, DB::table('notifications')->count());
    }

    /**
     * Stage 4: Concurrency race simulation (Aging vs Tenant withdrawal).
     * Lock ordering ensures deterministic transition and prevents double terminal mutation.
     */
    public function test_concurrency_race_aging_vs_tenant_withdrawal_ensures_single_terminal_state(): void
    {
        $listing = PublicListingFixture::published();
        $unitId = $listing->unitIds[0];
        PublicListingFixture::blockUnit($unitId, now()->toDateString(), now()->addMonths(6)->toDateString(), 'ACTIVE');

        $request = RentalRequest::factory()->create([
            'listing_id' => $listing->listingId,
            'created_at' => now()->subDays(16),
            'desired_move_in_date' => now()->addDays(5)->toDateString(),
            'desired_end_date' => now()->addMonths(3)->toDateString(),
            'status' => 'PENDING',
        ]);

        // Simulate tenant withdrawal winning the race under lock
        DB::transaction(function () use ($request): void {
            $locked = RentalRequest::query()->whereKey($request->id)->lockForUpdate()->firstOrFail();
            $locked->status = 'WITHDRAWN';
            $locked->closed_at = now();
            $locked->outcome_reason = 'Đổi kế hoạch';
            $locked->save();
        });

        // Scheduler attempts to process the same request
        $action = app(RejectAgedRentalRequestAction::class);
        $result = $action->execute($request->id);

        $this->assertNull($result);
        $this->assertSame('WITHDRAWN', $request->fresh()->status);
        $this->assertSame('Đổi kế hoạch', $request->fresh()->outcome_reason);
    }

    /**
     * Stage 4: Concurrency race simulation (Aging vs Owner proposal).
     * Proposal creates tenancy and marks request ACCEPTED; aging does not overwrite.
     */
    public function test_concurrency_race_aging_vs_owner_proposal_ensures_single_terminal_state(): void
    {
        $listing = PublicListingFixture::published();

        $request = RentalRequest::factory()->create([
            'listing_id' => $listing->listingId,
            'created_at' => now()->subDays(16),
            'desired_move_in_date' => now()->addDays(5)->toDateString(),
            'desired_end_date' => now()->addMonths(3)->toDateString(),
            'status' => 'PENDING',
        ]);

        // Simulate owner proposal committing first
        DB::transaction(function () use ($request): void {
            $locked = RentalRequest::query()->whereKey($request->id)->lockForUpdate()->firstOrFail();
            $locked->status = 'ACCEPTED';
            $locked->closed_at = now();
            $locked->save();
        });

        $action = app(RejectAgedRentalRequestAction::class);
        $result = $action->execute($request->id);

        $this->assertNull($result);
        $this->assertSame('ACCEPTED', $request->fresh()->status);
    }

    /**
     * B1: Verify RentalRequest resources serialize desired dates as "YYYY-MM-DD" date strings, not ISO timestamps.
     */
    public function test_rental_request_resources_serialize_dates_as_iso_date_strings_without_time(): void
    {
        $listing = PublicListingFixture::published();

        $request = RentalRequest::factory()->create([
            'listing_id' => $listing->listingId,
            'desired_move_in_date' => '2027-01-10',
            'desired_end_date' => '2027-03-31',
            'status' => 'PENDING',
        ]);

        $tenantResource = (new TenantRentalRequestResource($request))->resolve();
        $this->assertSame('2027-01-10', $tenantResource['desired_move_in_date']);
        $this->assertSame('2027-03-31', $tenantResource['desired_end_date']);

        $ownerResource = (new OwnerRentalRequestResource($request))->resolve();
        $this->assertSame('2027-01-10', $ownerResource['desired_move_in_date']);
        $this->assertSame('2027-03-31', $ownerResource['desired_end_date']);
    }
}
