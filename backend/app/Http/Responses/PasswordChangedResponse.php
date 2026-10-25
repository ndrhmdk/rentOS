<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Contracts\PasswordUpdateResponse;

class PasswordChangedResponse implements PasswordUpdateResponse
{
    public function toResponse($request): JsonResponse
    {
        // Fortify must finish its broker cleanup/event before the current guard is cleared.
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Password changed. Sign in again.']);
    }
}
