<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Tenancies\ConfirmTenancyContract;
use App\Actions\Tenancies\DeclineTenancyContract;
use App\Actions\Tenancies\ExpireTenancyReservation;
use App\Actions\Tenancies\ListParticipantTenancies;
use App\Http\Controllers\Controller;
use App\Http\Requests\ConfirmTenancyContractRequest;
use App\Http\Requests\DeclineTenancyContractRequest;
use App\Http\Requests\ParticipantTenancyIndexRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class TenantTenanciesController extends Controller
{
    /**
     * Get active or confirmed tenancies for the authenticated tenant.
     */
    public function index(
        ParticipantTenancyIndexRequest $request,
        ListParticipantTenancies $tenancies,
    ): JsonResponse {
        /** @var User $tenant */
        $tenant = $request->user();

        $page = $tenancies->forTenant(
            $tenant,
            $request->integer('per_page', 20),
            $request->integer('page', 1),
        );

        return response()->json([
            'data' => $page->items(),
            'meta' => [
                'current_page' => $page->currentPage(),
                'per_page' => $page->perPage(),
                'total' => $page->total(),
                'last_page' => $page->lastPage(),
            ],
        ]);
    }

    public function confirmContract(
        ConfirmTenancyContractRequest $request,
        string $tenancy,
        string $contract,
        ConfirmTenancyContract $confirmation,
        ExpireTenancyReservation $expiry,
    ): JsonResponse {
        /** @var User $tenant */
        $tenant = $request->user();

        $expiry->handle(strtolower($tenancy), strtolower($contract), actor: $tenant);

        $result = $confirmation->handle(
            $tenant,
            $tenancy,
            $contract,
            $request->validated(),
        );

        return response()->json([
            'data' => [
                'tenancy_id' => $result['tenancy']->id,
                'status' => $result['tenancy']->status,
                'confirmed_start_date' => $result['tenancy']->confirmed_start_date,
                'confirmed_end_date' => $result['tenancy']->confirmed_end_date,
                'contract_id' => $result['contract']->id,
                'version_number' => $result['contract']->version_number,
                'replayed' => $result['replayed'],
            ],
        ]);
    }

    public function declineContract(
        DeclineTenancyContractRequest $request,
        string $tenancy,
        string $contract,
        DeclineTenancyContract $decline,
        ExpireTenancyReservation $expiry,
    ): JsonResponse {
        /** @var User $tenant */
        $tenant = $request->user();

        $expiry->handle(strtolower($tenancy), strtolower($contract), actor: $tenant);

        $result = $decline->handle(
            $tenant,
            $tenancy,
            $contract,
            $request->validated(),
        );

        return response()->json([
            'data' => [
                'tenancy_id' => $result['tenancy']->id,
                'status' => $result['tenancy']->status,
                'contract_id' => $result['contract']->id,
                'version_number' => $result['contract']->version_number,
                'tenant_rejected_at' => $result['contract']->tenant_rejected_at,
                'reason' => $result['contract']->tenant_rejection_reason,
                'replayed' => $result['replayed'],
            ],
        ]);
    }
}
