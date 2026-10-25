<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BrowserSecurity
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->is('api/*') && ! $request->is('api/health')) {
            $origin = $request->header('Origin');
            $referer = $request->header('Referer');
            $hasBrowserContext = $origin !== null || $referer !== null || $request->headers->has('Sec-Fetch-Site') || $request->cookies->count() > 0;
            if ($hasBrowserContext) {
                $candidate = $origin ?? ($referer ? $this->origin($referer) : null);
                abort_unless(in_array($candidate, config('identity.allowed_origins'), true), 403, 'Untrusted browser origin.');
                // A stale/foreign cookie must never silently fall back to bearer authentication.
                abort_if($request->bearerToken() !== null, 403, 'Bearer requests must be cookie-free non-browser calls.');
            }
        }

        $response = $next($request);
        $response->headers->set('Cache-Control', 'no-store, private');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'no-referrer');

        return $response;
    }

    private function origin(string $url): string
    {
        $parts = parse_url($url);

        return ($parts['scheme'] ?? '').'://'.($parts['host'] ?? '').(isset($parts['port']) ? ':'.$parts['port'] : '');
    }
}
