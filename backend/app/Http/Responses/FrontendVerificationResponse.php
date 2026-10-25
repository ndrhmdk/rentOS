<?php

namespace App\Http\Responses;

use App\Support\FrontendUrl;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Laravel\Fortify\Contracts\VerifyEmailResponse;

class FrontendVerificationResponse implements VerifyEmailResponse
{
    public function toResponse($request): JsonResponse|RedirectResponse
    {
        return $request->expectsJson() ? response()->json(null, 204) : redirect()->away(FrontendUrl::make('/verify-email?verified=1'));
    }
}
