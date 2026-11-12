<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Tenancies\ResolveTenancyRenewalRequest;
use App\Http\Controllers\Controller;
use App\Http\Requests\RejectTenancyRenewalRequest;
use App\Models\User;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;

class OwnerTenancyRenewalRequestsController extends Controller
{
    #[Response(200, description: 'Đề nghị gia hạn đã bị từ chối.', type: 'array{data: array{id: string, tenancy_id: string, status: "REJECTED", reviewed_at: string, review_reason: string, blocked_end_date: string, replayed: bool}}')]
    #[Response(409, description: 'Đề nghị gia hạn không còn chờ xử lý.', type: 'array{message: string}')]
    public function reject(
        RejectTenancyRenewalRequest $request,
        string $tenancy,
        string $renewalRequest,
        ResolveTenancyRenewalRequest $resolve,
    ): JsonResponse {
        /** @var User $owner */
        $owner = $request->user();
        $result = $resolve->handle(
            $owner,
            strtolower($tenancy),
            strtolower($renewalRequest),
            'reject',
            $request->validated(),
        );

        return response()->json([
            'data' => [
                'id' => $result['renewal_request']->id,
                'tenancy_id' => $result['renewal_request']->tenancy_id,
                'status' => $result['renewal_request']->status,
                'reviewed_at' => $result['renewal_request']->reviewed_at,
                'review_reason' => $result['renewal_request']->review_reason,
                'blocked_end_date' => $result['tenancy']->blocked_end_date,
                'replayed' => $result['replayed'],
            ],
        ])->header('Cache-Control', 'private, no-store');
    }
}
