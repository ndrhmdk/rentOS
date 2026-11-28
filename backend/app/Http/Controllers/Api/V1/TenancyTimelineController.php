<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Tenancies\ListParticipantTenancies;
use App\Actions\Tenancies\ReadTenancyTimeline;
use App\Http\Controllers\Controller;
use App\Http\Requests\ParticipantTenancyIndexRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class TenancyTimelineController extends Controller
{
    public function show(
        Request $request,
        string $tenancy,
        ReadTenancyTimeline $timeline,
    ): JsonResponse {
        /** @var User $viewer */
        $viewer = $request->user();

        return response()->json([
            'data' => $timeline->handle($viewer, $tenancy),
        ]);
    }

    public function ownerIndex(
        ParticipantTenancyIndexRequest $request,
        ListParticipantTenancies $tenancies,
    ): JsonResponse {
        /** @var User $owner */
        $owner = $request->user();

        abort_unless(
            $owner->canManageOwnerProducts()
                && ! ($owner->currentAccessToken() instanceof PersonalAccessToken),
            404,
        );

        $page = $tenancies->forOwner(
            $owner,
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
}
