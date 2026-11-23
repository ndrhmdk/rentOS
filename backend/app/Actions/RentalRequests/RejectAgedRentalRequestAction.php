<?php

namespace App\Actions\RentalRequests;

use App\Actions\Notifications\RecordNotification;
use App\Actions\Tenancies\ExpireTenancyReservation;
use App\Domain\Rentals\PropertyRentalAvailability;
use App\Models\Property;
use App\Models\RentalRequest;
use App\Models\Unit;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RejectAgedRentalRequestAction
{
    public function __construct(
        private readonly PropertyRentalAvailability $availability,
        private readonly ExpireTenancyReservation $expiry,
        private readonly RecordNotification $notification,
    ) {}

    /**
     * Evaluate and process a pending rental request aged >= 15 days.
     *
     * @return 'REJECTED'|'PENDING_KEPT'|'NOT_DUE'|null
     */
    public function execute(string $requestId, bool $dryRun = false): ?string
    {
        $context = DB::table('rental_requests')
            ->join('listings', 'listings.id', '=', 'rental_requests.listing_id')
            ->where('rental_requests.id', $requestId)
            ->select('rental_requests.id', 'listings.property_id')
            ->first();

        if ($context === null) {
            return null;
        }

        $propertyId = (string) $context->property_id;

        if ($dryRun) {
            $request = RentalRequest::query()->find($requestId);
            if ($request === null || $request->status !== 'PENDING') {
                return null;
            }

            $createdAt = Carbon::parse($request->created_at);
            if ($createdAt->copy()->addDays(15)->isFuture()) {
                return 'NOT_DUE';
            }

            $units = Unit::query()
                ->where('property_id', $propertyId)
                ->orderBy('id')
                ->get();

            $dueTenancyIds = DB::table('tenancies')
                ->whereIn('unit_id', $units->pluck('id'))
                ->whereNotNull('pending_contract_id')
                ->whereNotNull('confirmation_expires_at')
                ->where('confirmation_expires_at', '<=', now())
                ->orderBy('id')
                ->pluck('id')
                ->map(fn ($id) => (string) $id)
                ->all();

            $moveInDate = Carbon::parse($request->desired_move_in_date)->toDateString();
            $endDate = Carbon::parse($request->desired_end_date)->toDateString();

            $hasEligibleUnit = $this->availability->hasEligibleUnit(
                $propertyId,
                $moveInDate,
                $endDate,
                $dueTenancyIds,
            );

            return $hasEligibleUnit ? 'PENDING_KEPT' : 'REJECTED';
        }

        return DB::transaction(function () use ($requestId, $propertyId): ?string {
            // 1. Lock Property (Common lock order: Property -> Unit -> Tenancy / RentalRequest)
            $property = Property::query()
                ->whereKey($propertyId)
                ->lockForUpdate()
                ->first();

            if ($property === null) {
                return null;
            }

            // 2. Lock Units of Property
            $units = Unit::query()
                ->where('property_id', $propertyId)
                ->orderBy('id')
                ->lockForUpdate()
                ->get();

            // 3. Lock Rental Request
            $request = RentalRequest::query()
                ->whereKey($requestId)
                ->lockForUpdate()
                ->first();

            if ($request === null || $request->status !== 'PENDING') {
                return null;
            }

            // Boundary check: created_at + 15 days <= now()
            $createdAt = Carbon::parse($request->created_at);
            if ($createdAt->copy()->addDays(15)->isFuture()) {
                return 'NOT_DUE';
            }

            // Reap due holds across units of this property before evaluating availability
            $dueTenancies = DB::table('tenancies')
                ->whereIn('unit_id', $units->pluck('id'))
                ->whereNotNull('pending_contract_id')
                ->whereNotNull('confirmation_expires_at')
                ->where('confirmation_expires_at', '<=', now())
                ->orderBy('id')
                ->get();

            foreach ($dueTenancies as $due) {
                $this->expiry->handle(
                    (string) $due->id,
                    (string) $due->pending_contract_id,
                    (string) $due->confirmation_expires_at,
                );
            }

            // Check availability across all eligible units
            $moveInDate = Carbon::parse($request->desired_move_in_date)->toDateString();
            $endDate = Carbon::parse($request->desired_end_date)->toDateString();

            $hasEligibleUnit = $this->availability->hasEligibleUnit(
                $propertyId,
                $moveInDate,
                $endDate,
            );

            $request->availability_checked_at = now();

            if ($hasEligibleUnit) {
                $request->save();

                return 'PENDING_KEPT';
            }

            // No eligible unit covers the complete period: Reject with NO_AVAILABLE_UNIT
            $request->status = 'REJECTED';
            $request->outcome_reason = 'NO_AVAILABLE_UNIT';
            $request->closed_at = now();
            $request->save();

            // Record audit log
            DB::table('audit_logs')->insert([
                'actor_id' => null,
                'entity_type' => 'rental_request',
                'entity_id' => $request->id,
                'action' => 'rental_request.rejected_aged',
                'before_values' => json_encode(['status' => 'PENDING'], JSON_THROW_ON_ERROR),
                'after_values' => json_encode(['status' => 'REJECTED', 'outcome_reason' => 'NO_AVAILABLE_UNIT'], JSON_THROW_ON_ERROR),
                'reason' => 'NO_AVAILABLE_UNIT',
                'correlation_id' => (string) Str::uuid(),
                'created_at' => now(),
            ]);

            // Notify tenant
            $this->notification->record(
                recipientId: (string) $request->tenant_id,
                audience: 'TENANT',
                eventKey: 'rental_request.rejected_aged:'.$request->id,
                title: 'Yêu cầu thuê đã bị từ chối tự động',
                body: 'Yêu cầu thuê của bạn đã quá 15 ngày và hiện không còn phòng trống phù hợp cho toàn bộ thời gian yêu cầu.',
                resourceType: 'rental_request',
                resourceId: (string) $request->id,
                actorId: null,
            );

            return 'REJECTED';
        });
    }
}
