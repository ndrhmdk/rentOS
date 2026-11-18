<?php

namespace App\Actions\Tenancies;

use App\Domain\Media\PublicStorageUrl;
use App\Models\User;
use Illuminate\Database\Query\Builder;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use stdClass;

/**
 * @phpstan-type Proposal array{
 *     id: string, kind: 'contract'|'renewal', title: string, href: string, rental_request_id: string,
 *     unit_label: string, version: int, expires_at: string, start_date: string, end_date: string,
 *     monthly_rent: string, photo_url: ?string
 * }
 * @phpstan-type RentalAction array{id: string, kind: 'rental_request', title: string, href: string}
 * @phpstan-type Upcoming array{
 *     id: string, title: string, href: string, ward: ?string, city: ?string,
 *     unit_label: string, bedrooms: ?int, area_m2: ?string, version: int,
 *     start_date: string, end_date: string, monthly_rent: string, photo_url: ?string
 * }
 */
class ReadTenantSummary
{
    private const int PREVIEW_LIMIT = 5;

    public function __construct(private readonly PublicStorageUrl $storage) {}

    /**
     * @return array{
     *     counts: array{tenancies: int, pending_rental_requests: int, awaiting_confirmation: int, unread_notifications: int},
     *     pending_actions: list<Proposal|RentalAction>,
     *     upcoming_tenancy: ?Upcoming,
     *     renewal_href: ?string,
     *     recent_requests: list<array{
     *         id: string, title: string, href: string, status: 'PENDING'|'ACCEPTED'|'REJECTED'|'WITHDRAWN',
     *         created_at: string, desired_move_in_date: string, desired_end_date: string,
     *         preferred_unit: ?string, photo_url: ?string
     *     }>,
     *     recent_notifications: list<array{id: string, title: string, read_at: ?string, created_at: string}>
     * }
     */
    public function handle(User $tenant): array
    {
        $today = now('Asia/Ho_Chi_Minh')->toDateString();
        $requests = DB::table('rental_requests')->where('rental_requests.tenant_id', $tenant->id);
        $tenancies = DB::table('tenancies')->where('tenancies.tenant_id', $tenant->id);
        $notifications = DB::table('notifications')
            ->where('recipient_id', $tenant->id)->where('audience', 'TENANT');
        $pendingRequests = (clone $requests)->where('rental_requests.status', 'PENDING');

        $awaiting = (clone $tenancies)
            ->join('tenancy_contracts as contract', function (JoinClause $join): void {
                $join->on('contract.id', '=', 'tenancies.pending_contract_id')
                    ->on('contract.tenancy_id', '=', 'tenancies.id');
            })
            ->where('tenancies.confirmation_expires_at', '>', now())
            ->whereNull('contract.tenant_confirmed_at')
            ->whereNull('contract.tenant_rejected_at')
            ->where(fn (Builder $query) => $query
                ->where(fn (Builder $original) => $original
                    ->where('tenancies.status', 'PENDING_CONFIRMATION')
                    ->where('contract.type', 'ORIGINAL'))
                ->orWhere(fn (Builder $renewal) => $renewal
                    ->whereIn('tenancies.status', ['CONFIRMED', 'ACTIVE'])
                    ->where('contract.type', 'RENEWAL')
                    ->whereExists(DB::table('tenancy_renewal_requests')
                        ->selectRaw('1')
                        ->whereColumn('id', 'contract.renewal_request_id')
                        ->whereColumn('tenancy_id', 'tenancies.id')
                        ->where('status', 'PENDING'))));

        return [
            'counts' => [
                'tenancies' => $tenancies->count(),
                'pending_rental_requests' => $pendingRequests->count(),
                'awaiting_confirmation' => (clone $awaiting)->where('tenancies.status', 'PENDING_CONFIRMATION')->count(),
                'unread_notifications' => (clone $notifications)->whereNull('read_at')->count(),
            ],
            'pending_actions' => $this->pendingActions($awaiting, $pendingRequests),
            'upcoming_tenancy' => $this->upcoming(clone $tenancies, $today),
            'renewal_href' => $this->renewalHref(clone $tenancies, now()->toDateString()),
            'recent_requests' => array_values($this->withListingPhoto($requests)
                ->leftJoin('units', 'units.id', '=', 'rental_requests.preferred_unit_id')
                ->orderByDesc('rental_requests.created_at')->orderByDesc('rental_requests.id')->limit(self::PREVIEW_LIMIT)
                ->get([
                    'rental_requests.id', 'listings.title', 'rental_requests.status', 'rental_requests.created_at',
                    'rental_requests.desired_move_in_date', 'rental_requests.desired_end_date',
                    'units.label as preferred_unit', 'cover.storage_path',
                ])->map(fn (stdClass $row): array => [
                    'id' => $row->id, 'title' => $row->title, 'href' => '/tenant/requests/'.$row->id,
                    'status' => $row->status, 'created_at' => Carbon::parse($row->created_at)->toIso8601String(),
                    'desired_move_in_date' => $row->desired_move_in_date, 'desired_end_date' => $row->desired_end_date,
                    'preferred_unit' => $row->preferred_unit, 'photo_url' => $this->photo($row->storage_path),
                ])->all()),
            'recent_notifications' => array_values($notifications
                ->orderByDesc('created_at')->orderByDesc('id')->limit(self::PREVIEW_LIMIT)
                ->get(['id', 'title', 'read_at', 'created_at'])
                ->map(static fn (stdClass $row): array => [
                    'id' => $row->id, 'title' => $row->title, 'read_at' => $row->read_at,
                    'created_at' => Carbon::parse($row->created_at)->toIso8601String(),
                ])->all()),
        ];
    }

    /** @return list<Proposal|RentalAction> */
    private function pendingActions(Builder $awaiting, Builder $pendingRequests): array
    {
        $proposals = $this->withTenancyDetails($awaiting)
            ->orderBy('tenancies.confirmation_expires_at')->orderBy('tenancies.id')->limit(self::PREVIEW_LIMIT)
            ->get([
                'tenancies.id', 'tenancies.rental_request_id', 'tenancies.confirmation_expires_at', 'units.label',
                'listings.title', 'contract.type', 'contract.version_number',
                'contract.start_date', 'contract.end_date', 'contract.monthly_rent', 'cover.storage_path',
            ])->map(fn (stdClass $row): array => [
                'id' => $row->id, 'kind' => $row->type === 'RENEWAL' ? 'renewal' : 'contract',
                'title' => $row->title, 'href' => '/tenant/tenancies/'.$row->id,
                'rental_request_id' => $row->rental_request_id, 'unit_label' => $row->label,
                'version' => (int) $row->version_number,
                'expires_at' => Carbon::parse($row->confirmation_expires_at)->toIso8601String(),
                'start_date' => $row->start_date, 'end_date' => $row->end_date,
                'monthly_rent' => (string) $row->monthly_rent, 'photo_url' => $this->photo($row->storage_path),
            ]);

        $remaining = self::PREVIEW_LIMIT - $proposals->count();
        $requests = $pendingRequests->join('listings', 'listings.id', '=', 'rental_requests.listing_id')
            ->orderByDesc('rental_requests.created_at')->orderByDesc('rental_requests.id')->limit($remaining)
            ->get(['rental_requests.id', 'listings.title'])
            ->map(static fn (stdClass $row): array => [
                'id' => $row->id, 'kind' => 'rental_request',
                'title' => $row->title, 'href' => '/tenant/requests/'.$row->id,
            ]);

        return array_values($proposals->concat($requests)->all());
    }

    /** @return ?Upcoming */
    private function upcoming(Builder $tenancies, string $today): ?array
    {
        $row = $this->withTenancyDetails($tenancies)
            ->join('tenancy_contracts as contract', 'contract.tenancy_id', '=', 'tenancies.id')
            ->where('tenancies.status', 'CONFIRMED')->whereNull('tenancies.moved_in_at')
            ->where('contract.type', 'ORIGINAL')->whereNotNull('contract.tenant_confirmed_at')
            ->whereNull('contract.tenant_rejected_at')->where('contract.start_date', '>=', $today)
            ->orderBy('contract.start_date')->orderBy('tenancies.id')
            ->first([
                'tenancies.id', 'properties.name', 'properties.ward', 'properties.city', 'units.label',
                'units.bedrooms', 'units.area_m2', 'contract.version_number',
                'contract.start_date', 'contract.end_date', 'contract.monthly_rent', 'cover.storage_path',
            ]);

        return $row === null ? null : [
            'id' => $row->id, 'title' => $row->name, 'href' => '/tenant/tenancies/'.$row->id,
            'ward' => $row->ward, 'city' => $row->city, 'unit_label' => $row->label,
            'bedrooms' => $row->bedrooms === null ? null : (int) $row->bedrooms,
            'area_m2' => $row->area_m2 === null ? null : (string) $row->area_m2,
            'version' => (int) $row->version_number, 'start_date' => $row->start_date, 'end_date' => $row->end_date,
            'monthly_rent' => (string) $row->monthly_rent, 'photo_url' => $this->photo($row->storage_path),
        ];
    }

    private function renewalHref(Builder $tenancies, string $today): ?string
    {
        $id = $tenancies->whereIn('tenancies.status', ['CONFIRMED', 'ACTIVE'])
            ->whereNotNull('tenancies.confirmed_end_date')
            ->whereNotExists(DB::table('tenancy_renewal_requests')->selectRaw('1')
                ->whereColumn('tenancy_id', 'tenancies.id')->where('status', 'PENDING'))
            ->whereNotExists(DB::table('tenancy_contracts')->selectRaw('1')
                ->whereColumn('tenancy_id', 'tenancies.id')->where('type', 'RENEWAL')
                ->whereNotNull('tenant_confirmed_at')->whereNull('tenant_rejected_at')
                ->where('start_date', '>', $today))
            ->orderBy('tenancies.confirmed_end_date')->orderBy('tenancies.id')->value('tenancies.id');

        return is_string($id) ? '/tenant/tenancies/'.$id : null;
    }

    private function withTenancyDetails(Builder $tenancies): Builder
    {
        return $this->withListingPhoto(
            $tenancies->join('rental_requests', 'rental_requests.id', '=', 'tenancies.rental_request_id')
                ->join('units', 'units.id', '=', 'tenancies.unit_id')
                ->join('properties', 'properties.id', '=', 'units.property_id'),
        );
    }

    private function withListingPhoto(Builder $requests): Builder
    {
        return $requests->join('listings', 'listings.id', '=', 'rental_requests.listing_id')
            ->leftJoin('property_media as cover', function (JoinClause $join): void {
                $join->on('cover.id', '=', 'listings.cover_media_id')->on('cover.property_id', '=', 'listings.property_id')
                    ->whereNull('cover.deleted_at')->whereNull('cover.purged_at');
            });
    }

    private function photo(?string $path): ?string
    {
        if ($path === null) {
            return null;
        }

        try {
            return $this->storage->forPath($path);
        } catch (RuntimeException) {
            return null;
        }
    }
}
