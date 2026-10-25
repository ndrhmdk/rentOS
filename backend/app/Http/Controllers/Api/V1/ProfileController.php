<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\AccountResource;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ProfileController extends Controller
{
    /** Update own contact fields. Browser session + verified active account + CSRF only. */
    public function update(UpdateProfileRequest $request): AccountResource
    {
        $user = $request->user();
        // Q&A-01 (Khai): disabled proposal, pending schema/contract agreement:
        // User::whereKey($user->id)->where('profile_revision', $expectedRevision)
        //     ->update([...$contact, 'profile_revision' => DB::raw('profile_revision + 1')]);
        // Return 409 when affected rows = 0. Do not enable without the additive migration.
        $user = DB::transaction(function () use ($request) {
            $current = User::query()->lockForUpdate()->findOrFail($request->user()->id);
            abort_unless($current->account_status === 'ACTIVE' && $current->hasVerifiedEmail(), 403);
            abort_unless($current->credential_version === $request->user()->credential_version, 401);
            $current->forceFill($request->safe()->only(['name', 'phone']))->save();

            return $current;
        });

        return new AccountResource($user);
    }
}
