<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireRecentPassword
{
    public function handle(Request $request, Closure $next): Response
    {
        $confirmedAt = (int) $request->session()->get('auth.password_confirmed_at', 0);
        abort_if($confirmedAt <= 0 || $confirmedAt > now()->timestamp || now()->timestamp - $confirmedAt > config('identity.password_confirmation_seconds'), 423, 'Password confirmation required.');

        return $next($request);
    }
}
