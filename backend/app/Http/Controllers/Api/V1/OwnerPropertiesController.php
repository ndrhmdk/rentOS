<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OwnerPropertiesController extends Controller
{
    /**
     * Get active properties for the authenticated owner.
     */
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $properties = DB::table('properties')
            ->where('owner_id', $user->id)
            ->whereNull('archived_at')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $properties,
        ]);
    }
}
