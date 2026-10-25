<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateCurrentUserRequest;
use App\Http\Resources\CurrentUserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CurrentUserController extends Controller
{
    public function show(Request $request): CurrentUserResource
    {
        abort_unless($request->user()->account_status === 'ACTIVE' && $request->user()->tokenCan('account:read'), 403);

        return new CurrentUserResource($request->user());
    }

    public function update(UpdateCurrentUserRequest $request): JsonResource
    {
        $request->user()->fill($request->safe()->only(['name', 'phone']))->save();

        return new CurrentUserResource($request->user()->refresh());
    }
}
