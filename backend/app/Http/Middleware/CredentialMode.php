<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class CredentialMode
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! Auth::guard('web')->check()) {
            $token = $request->user()?->currentAccessToken();
            abort_unless($token instanceof PersonalAccessToken, 403, 'Browser session required.');
            $ability = null;
            foreach (config('identity.pat_routes') as $pattern => $required) {
                if (preg_match('#^'.str_replace('\*', '[^/]+', preg_quote($pattern, '#')).'$#D', $request->method().' '.$request->path())) {
                    $ability = $required;
                    break;
                }
            }
            abort_unless($ability !== null, 403, 'Browser session required.');
            abort_unless($token->can($ability), 403, 'Token ability required.');
        }

        return $next($request);
    }
}
