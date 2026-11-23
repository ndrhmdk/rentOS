<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Tenancies\ReadTenantSummary;
use App\Http\Controllers\Controller;
use App\Models\RentalRequest;
use App\Models\User;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TenantSummaryController extends Controller
{
    #[Response(
        200,
        description: 'Tổng quan chỉ đọc của người thuê đang đăng nhập.',
        type: <<<'TYPE'
            array{data: array{
                counts: array{tenancies: int, pending_rental_requests: int, awaiting_confirmation: int, unread_notifications: int},
                pending_actions: list<
                    array{id: string, kind: 'rental_request', title: string, href: string}|
                    array{id: string, kind: 'contract'|'renewal', title: string, href: string, rental_request_id: string,
                        unit_label: string, version: int, expires_at: string, start_date: string, end_date: string,
                        monthly_rent: string, photo_url: ?string}
                >,
                upcoming_tenancy: array{id: string, title: string, href: string, ward: ?string, city: ?string,
                    unit_label: string, bedrooms: ?int, area_m2: ?string, version: int, start_date: string,
                    end_date: string, monthly_rent: string, photo_url: ?string}|null,
                renewal_href: ?string,
                recent_requests: list<array{id: string, title: string, href: string, status: 'PENDING'|'ACCEPTED'|'REJECTED'|'WITHDRAWN',
                    created_at: string, desired_move_in_date: string, desired_end_date: string, preferred_unit: ?string, photo_url: ?string}>,
                recent_notifications: list<array{id: string, title: string, read_at: ?string, created_at: string}>
            }}
            TYPE,
    )]
    #[Response(401, description: 'Cần đăng nhập.', type: 'array{message: string}')]
    #[Response(403, description: 'Tài khoản hoặc phiên không có quyền xem tổng quan.', type: 'array{message: string}')]
    public function show(Request $request, ReadTenantSummary $summary): JsonResponse
    {
        Gate::authorize('viewAny', RentalRequest::class);

        /** @var User $tenant */
        $tenant = $request->user();

        return response()->json(['data' => $summary->handle($tenant)])
            ->header('Cache-Control', 'private, no-store');
    }
}
