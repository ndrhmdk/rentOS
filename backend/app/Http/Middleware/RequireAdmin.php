<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class RequireAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless(Auth::guard('web')->check(), 403, 'Browser session required.');
        Gate::authorize('access-admin');

        return $next($request);
    }
}
