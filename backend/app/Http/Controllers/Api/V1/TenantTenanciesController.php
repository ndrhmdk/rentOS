<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TenantTenanciesController extends Controller
{
    /**
     * Get active or confirmed tenancies for the authenticated tenant.
     */
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $tenancies = DB::table('tenancies')
            ->where('tenant_id', $user->id)
            ->whereIn('status', ['ACTIVE', 'CONFIRMED'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $tenancies,
        ]);
    }
}
