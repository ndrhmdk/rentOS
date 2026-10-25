<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AccountAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $user?->refresh();
        abort_unless($user && $user->account_status === 'ACTIVE', 403, 'Account is not active.');
        if (Auth::guard('web')->check()) {
            if ($request->session()->get('identity.credential_version') !== $user->credential_version) {
                Auth::guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
                throw new AuthenticationException;
            }
        }
        // An unverified browser can read only its minimal current-account response.
        if (! ($request->isMethod('GET') && $request->is('api/v1/me') && Auth::guard('web')->check())) {
            abort_unless($user->hasVerifiedEmail(), 403, 'Email verification required.');
        }

        return $next($request);
    }
}
