<?php

namespace App\Actions\Tenancies;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

class ListParticipantTenancies
{
    /**
     * @return LengthAwarePaginator<int, \stdClass>
     */
    public function forOwner(User $owner, int $perPage = 20, int $page = 1): LengthAwarePaginator
    {
        return $this->forParticipant($owner, true, $perPage, $page);
    }

    /**
     * @return LengthAwarePaginator<int, \stdClass>
     */
    public function forTenant(User $tenant, int $perPage = 20, int $page = 1): LengthAwarePaginator
    {
        return $this->forParticipant($tenant, false, $perPage, $page);
    }

    /**
     * @return LengthAwarePaginator<int, \stdClass>
     */
    private function forParticipant(User $viewer, bool $isOwner, int $perPage, int $page): LengthAwarePaginator
    {
        $participantColumn = $isOwner
            ? 'tenancies.owner_id'
            : 'tenancies.tenant_id';

        $counterpartyColumn = $isOwner
            ? 'tenancies.tenant_id'
            : 'tenancies.owner_id';

        /** @var LengthAwarePaginator<int, \stdClass> $pageResult */
        $pageResult = $this->baseQuery($participantColumn, $counterpartyColumn, $viewer->id)
            ->paginate($perPage, ['*'], 'page', $page);

        return $pageResult;
    }

    private function baseQuery(string $participantColumn, string $counterpartyColumn, string $viewerId): Builder
    {
        return DB::table('tenancies')
            ->join('units', 'units.id', '=', 'tenancies.unit_id')
            ->join('properties', 'properties.id', '=', 'units.property_id')
            ->join('rental_requests', 'rental_requests.id', '=', 'tenancies.rental_request_id')
            ->leftJoin('tenancy_contracts as pending_contracts', function ($join): void {
                $join->on('pending_contracts.id', '=', 'tenancies.pending_contract_id')
                    ->on('pending_contracts.tenancy_id', '=', 'tenancies.id');
            })
            ->leftJoin('tenancy_contracts as latest_contracts', function ($join): void {
                $join->on('latest_contracts.id', '=', 'tenancies.latest_confirmed_contract_id')
                    ->on('latest_contracts.tenancy_id', '=', 'tenancies.id');
            })
            ->join('users as counterparty', 'counterparty.id', '=', $counterpartyColumn)
            ->where($participantColumn, $viewerId)
            ->orderByDesc('tenancies.created_at')
            ->select([
                'tenancies.id',
                'tenancies.unit_id',
                'tenancies.tenant_id',
                'tenancies.owner_id',
                'tenancies.rental_request_id',
                'tenancies.status',
                'tenancies.confirmed_start_date',
                'tenancies.confirmed_end_date',
                'tenancies.blocked_start_date',
                'tenancies.blocked_end_date',
                'tenancies.pending_contract_id',
                'tenancies.latest_confirmed_contract_id',
                'tenancies.confirmation_expires_at',
                'tenancies.moved_in_at',
                'tenancies.actual_ended_at',
                'tenancies.end_reason',
                'tenancies.created_at',
                'tenancies.updated_at',
                'properties.name as property_name',
                'properties.city as property_city',
                'units.label as unit_label',
                'rental_requests.status as rental_request_status',
                'counterparty.name as counterparty_name',
                'pending_contracts.version_number as pending_contract_version',
                'pending_contracts.start_date as pending_contract_start_date',
                'pending_contracts.end_date as pending_contract_end_date',
                'pending_contracts.monthly_rent as pending_contract_monthly_rent',
                'pending_contracts.deposit_amount as pending_contract_deposit_amount',
                'latest_contracts.version_number as latest_confirmed_contract_version',
                'latest_contracts.start_date as latest_confirmed_contract_start_date',
                'latest_contracts.end_date as latest_confirmed_contract_end_date',
                'latest_contracts.monthly_rent as latest_confirmed_contract_monthly_rent',
                'latest_contracts.deposit_amount as latest_confirmed_contract_deposit_amount',
            ]);
    }
}
