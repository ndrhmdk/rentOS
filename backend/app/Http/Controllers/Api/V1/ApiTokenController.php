<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Identity\SecurityAudit;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreApiTokenRequest;
use App\Http\Resources\ApiTokenResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class ApiTokenController extends Controller
{
    /** List own token metadata. Browser session only; no plaintext or hashes. */
    public function index(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('manageTokens', $request->user());

        return ApiTokenResource::collection($request->user()->tokens()->orderByDesc('id')->paginate(25));
    }

    /** Create a finite scoped PAT. Session + CSRF + password confirmation within 15 minutes. */
    public function store(StoreApiTokenRequest $request, SecurityAudit $audit): JsonResponse
    {
        return DB::transaction(function () use ($request, $audit): JsonResponse {
            $user = User::query()->lockForUpdate()->findOrFail($request->user()->id);
            abort_unless($user->account_status === 'ACTIVE' && $user->hasVerifiedEmail(), 403);
            abort_unless($user->credential_version === $request->user()->credential_version, 401);
            $token = $user->createToken($request->validated('name'), $request->validated('abilities'), now()->addDays((int) $request->validated('expiry_days')));
            $audit->record($user, 'api_token.created', ['token_id' => (string) $token->accessToken->id, 'abilities' => $token->accessToken->abilities, 'expires_at' => $token->accessToken->expires_at->toIso8601String()]);

            return response()->json(['data' => new ApiTokenResource($token->accessToken), 'plain_text_token' => $token->plainTextToken], 201)->header('Cache-Control', 'no-store');
        });
    }

    /** Revoke own PAT. Foreign/absent IDs return 404. Session + CSRF + recent password. */
    public function destroy(Request $request, string $id, SecurityAudit $audit): Response
    {
        Gate::authorize('manageTokens', $request->user());
        abort_unless(ctype_digit($id) && strlen($id) <= 18, 404);
        DB::transaction(function () use ($request, $id, $audit): void {
            $user = User::query()->lockForUpdate()->findOrFail($request->user()->id);
            abort_unless($user->account_status === 'ACTIVE', 403);
            abort_unless($user->credential_version === $request->user()->credential_version, 401);
            $token = $user->tokens()->whereKey($id)->firstOrFail();
            $audit->record($user, 'api_token.revoked', ['token_id' => (string) $token->id, 'abilities' => $token->abilities, 'expires_at' => $token->expires_at?->toIso8601String()]);
            $token->delete();
        });

        return response()->noContent();
    }
}
