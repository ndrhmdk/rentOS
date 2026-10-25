<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AccountResource;
use Illuminate\Http\Request;

class CurrentUserController extends Controller
{
    /** Current account. Session or account:read PAT; unverified sessions have minimal account access. */
    public function __invoke(Request $request): AccountResource
    {
        return new AccountResource($request->user());
    }
}
