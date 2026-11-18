<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\OwnerProperties\ReadOwnerPropertyPreview;
use App\Actions\OwnerProperties\ReadOwnerSummary;
use App\Domain\Media\PublicStorageUrl;
use App\Http\Controllers\Controller;
use App\Models\RentalRequest;
use App\Models\User;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class OwnerSummaryController extends Controller
{
    #[Response(
        200,
        description: 'Tổng quan chỉ đọc của chủ nhà đang đăng nhập.',
        type: <<<'TYPE'
            array{data: array{
                counts: array{
                    pending_rental_requests: int, awaiting_tenant_confirmation: int,
                    active_properties: int, unread_notifications: int
                },
                recent_requests: list<array{
                    id: string, contact_name: string, property_name: string, preferred_unit: ?string,
                    desired_move_in_date: string, desired_end_date: string, status: 'PENDING'|'ACCEPTED'
                }>,
                pending_actions: list<array{
                    id: string, kind: 'rental_request'|'contract_correction'|'renewal',
                    title: string, description: string, href: string
                }>,
                recent_notifications: list<array{id: string, title: string, read_at: ?string, created_at: string}>
            }}
            TYPE,
    )]
    #[Response(401, description: 'Cần đăng nhập.', type: 'array{message: string}')]
    #[Response(403, description: 'Tài khoản hoặc phiên không có quyền xem tổng quan.', type: 'array{message: string}')]
    public function show(Request $request, ReadOwnerSummary $summary): JsonResponse
    {
        Gate::authorize('viewOwnerInbox', RentalRequest::class);

        /** @var User $owner */
        $owner = $request->user();

        return response()->json(['data' => $summary->handle($owner)])
            ->header('Cache-Control', 'private, no-store');
    }

    #[Response(
        200,
        description: 'Tối đa ba bất động sản chưa lưu trữ của chủ nhà đang đăng nhập.',
        type: 'array{data: list<array{id: string, name: string, ward: ?string, city: ?string, rental_arrangement: string, unit_count: int, photo_url: ?string, moderation_status: ?string, publication_status: ?string, suspended: bool}>}',
    )]
    #[Response(401, description: 'Cần đăng nhập.', type: 'array{message: string}')]
    #[Response(403, description: 'Tài khoản hoặc phiên không có quyền xem tổng quan.', type: 'array{message: string}')]
    public function properties(Request $request, ReadOwnerPropertyPreview $preview, PublicStorageUrl $storage): JsonResponse
    {
        Gate::authorize('viewOwnerInbox', RentalRequest::class);

        /** @var User $owner */
        $owner = $request->user();

        return response()->json(['data' => $preview->handle($owner, $storage)])
            ->header('Cache-Control', 'private, no-store');
    }
}
