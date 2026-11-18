<?php

namespace App\Actions\OwnerProperties;

use App\Models\Property;
use App\Models\RentalRequest;
use App\Models\User;
use Illuminate\Database\Query\Builder;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use stdClass;

/**
 * @phpstan-type PendingAction array{id: string, kind: 'rental_request'|'contract_correction'|'renewal', title: string, description: string, href: string}
 * @phpstan-type OwnerSummary array{
 *     counts: array{pending_rental_requests: int, awaiting_tenant_confirmation: int, active_properties: int, unread_notifications: int},
 *     recent_requests: list<array{id: string, contact_name: string, property_name: string, preferred_unit: ?string, desired_move_in_date: string, desired_end_date: string, status: 'PENDING'|'ACCEPTED'}>,
 *     pending_actions: list<PendingAction>,
 *     recent_notifications: list<array{id: string, title: string, read_at: ?string, created_at: string}>
 * }
 */
class ReadOwnerSummary
{
    private const int PREVIEW_LIMIT = 5;

    /** @return OwnerSummary */
    public function handle(User $owner): array
    {
        $properties = Property::query()->where('owner_id', $owner->id)->whereNull('archived_at');
        $requests = RentalRequest::query()->forOwner($owner)->toBase();
        $tenancies = DB::table('tenancies')->where('tenancies.owner_id', $owner->id);
        $notifications = DB::table('notifications')
            ->where('recipient_id', $owner->id)->where('audience', 'OWNER');

        $awaitingConfirmation = (clone $tenancies)
            ->join('tenancy_contracts as pending_contract', function (JoinClause $join): void {
                $join->on('pending_contract.id', '=', 'tenancies.pending_contract_id')
                    ->on('pending_contract.tenancy_id', '=', 'tenancies.id');
            })
            ->where('tenancies.confirmation_expires_at', '>', now())
            ->whereNull('pending_contract.tenant_confirmed_at')
            ->whereNull('pending_contract.tenant_rejected_at')
            ->where(fn (Builder $query) => $query
                ->where('tenancies.status', 'PENDING_CONFIRMATION')
                ->orWhere(fn (Builder $query) => $query
                    ->whereIn('tenancies.status', ['ACTIVE', 'CONFIRMED'])
                    ->where('pending_contract.type', 'RENEWAL')))
            ->count();

        $requestPreview = (clone $requests)
            ->join('listings', 'listings.id', '=', 'rental_requests.listing_id')
            ->join('properties', 'properties.id', '=', 'listings.property_id')
            ->leftJoin('units', 'units.id', '=', 'rental_requests.preferred_unit_id')
            ->whereIn('rental_requests.status', ['PENDING', 'ACCEPTED'])
            ->orderByDesc('rental_requests.created_at')->orderByDesc('rental_requests.id')
            ->limit(self::PREVIEW_LIMIT)
            ->get([
                'rental_requests.id', 'rental_requests.contact_name', 'properties.name as property_name',
                'units.label as preferred_unit', 'rental_requests.desired_move_in_date',
                'rental_requests.desired_end_date', 'rental_requests.status',
            ]);

        return [
            'counts' => [
                'pending_rental_requests' => (clone $requests)->where('rental_requests.status', 'PENDING')->count(),
                'awaiting_tenant_confirmation' => $awaitingConfirmation,
                'active_properties' => $properties->count(),
                'unread_notifications' => (clone $notifications)->whereNull('read_at')->count(),
            ],
            'recent_requests' => array_values($requestPreview->reverse()->map(static fn (stdClass $row): array => [
                'id' => $row->id,
                'contact_name' => $row->contact_name,
                'property_name' => $row->property_name,
                'preferred_unit' => $row->preferred_unit,
                'desired_move_in_date' => $row->desired_move_in_date,
                'desired_end_date' => $row->desired_end_date,
                'status' => $row->status,
            ])->all()),
            'pending_actions' => $this->pendingActions($tenancies, $requests),
            'recent_notifications' => array_values($notifications
                ->orderByDesc('created_at')->orderByDesc('id')
                ->limit(self::PREVIEW_LIMIT)->get(['id', 'title', 'read_at', 'created_at'])
                ->map(static fn (stdClass $row): array => [
                    'id' => $row->id,
                    'title' => $row->title,
                    'read_at' => $row->read_at,
                    'created_at' => Carbon::parse($row->created_at)->toIso8601String(),
                ])->all()),
        ];
    }

    /** @return list<PendingAction> */
    private function pendingActions(Builder $tenancies, Builder $requests): array
    {
        $corrections = (clone $tenancies)
            ->join('rental_requests', 'rental_requests.id', '=', 'tenancies.rental_request_id')
            ->where('tenancies.status', 'AWAITING_REVISION')
            ->orderBy('tenancies.updated_at')->orderBy('tenancies.id')
            ->limit(self::PREVIEW_LIMIT)->get(['tenancies.id', 'rental_requests.contact_name'])
            ->map(static fn (stdClass $row): array => [
                'id' => $row->id,
                'kind' => 'contract_correction',
                'title' => 'Điều chỉnh đề xuất cho '.$row->contact_name,
                'description' => 'Người thuê đã từ chối đề xuất trước.',
                'href' => '/owner/tenancies/'.$row->id.'/correction',
            ]);

        $renewals = (clone $tenancies)
            ->join('tenancy_renewal_requests as renewal', 'renewal.tenancy_id', '=', 'tenancies.id')
            ->join('rental_requests', 'rental_requests.id', '=', 'tenancies.rental_request_id')
            ->whereIn('tenancies.status', ['ACTIVE', 'CONFIRMED'])
            ->whereNull('tenancies.pending_contract_id')
            ->where('renewal.status', 'PENDING')
            ->orderBy('renewal.created_at')->orderBy('renewal.id')
            ->limit(self::PREVIEW_LIMIT)->get(['renewal.id', 'tenancies.id as tenancy_id', 'rental_requests.contact_name'])
            ->map(static fn (stdClass $row): array => [
                'id' => $row->id,
                'kind' => 'renewal',
                'title' => 'Xem yêu cầu gia hạn của '.$row->contact_name,
                'description' => 'Yêu cầu gia hạn đang chờ bạn xử lý.',
                'href' => '/owner/tenancies/'.$row->tenancy_id,
            ]);

        $pendingRequests = $requests
            ->join('listings', 'listings.id', '=', 'rental_requests.listing_id')
            ->where('rental_requests.status', 'PENDING')
            ->orderBy('rental_requests.created_at')->orderBy('rental_requests.id')
            ->limit(self::PREVIEW_LIMIT)->get(['rental_requests.id', 'rental_requests.contact_name', 'listings.title'])
            ->map(static fn (stdClass $row): array => [
                'id' => $row->id,
                'kind' => 'rental_request',
                'title' => 'Xem yêu cầu của '.$row->contact_name,
                'description' => $row->title,
                'href' => '/owner/requests/'.$row->id,
            ]);

        return array_values($corrections->concat($renewals)->concat($pendingRequests)->take(self::PREVIEW_LIMIT)->all());
    }
}
