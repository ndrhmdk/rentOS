<?php

namespace App\Domain\Rentals;

use App\Models\Unit;
use Illuminate\Support\Facades\DB;

final class PropertyRentalAvailability
{
    /**
     * Determine if a property has at least one eligible unit covering the complete desired interval.
     *
     * Rules:
     * - Physical availability only: listing publication/hiding status does not dictate physical occupation.
     * - An eligible unit must be READY, marketed, and not archived.
     * - The unit must have no overlapping tenancies in PENDING_CONFIRMATION, CONFIRMED, or ACTIVE status.
     * - Preferred unit is soft; any qualifying alternative unit counts as available.
     * - Dates in the past use the stored interval directly without silent shifting.
     *
     * @param  array<int, string>  $ignoredTenancyIds  Optional tenancies to ignore (e.g. holds due for expiration)
     */
    public function hasEligibleUnit(string $propertyId, string $desiredMoveInDate, string $desiredEndDate, array $ignoredTenancyIds = []): bool
    {
        $eligibleUnits = Unit::query()
            ->where('property_id', $propertyId)
            ->where('operational_status', 'READY')
            ->where('is_marketed', true)
            ->whereNull('archived_at')
            ->pluck('id');

        if ($eligibleUnits->isEmpty()) {
            return false;
        }

        // Find units with overlapping tenancies in blocking statuses
        $query = DB::table('tenancies')
            ->whereIn('unit_id', $eligibleUnits)
            ->whereIn('status', ['PENDING_CONFIRMATION', 'CONFIRMED', 'ACTIVE'])
            ->whereNotNull('blocked_start_date')
            ->whereNotNull('blocked_end_date')
            ->where('blocked_start_date', '<=', $desiredEndDate)
            ->where('blocked_end_date', '>=', $desiredMoveInDate);

        if (! empty($ignoredTenancyIds)) {
            $query->whereNotIn('id', $ignoredTenancyIds);
        }

        $blockedUnitIds = $query->pluck('unit_id')->unique();

        return $eligibleUnits->diff($blockedUnitIds)->isNotEmpty();
    }
}
