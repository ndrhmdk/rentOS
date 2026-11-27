<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Makes every web and API response private and uncacheable by default.
 *
 * Account, session, CSRF, password-reset and token responses must never be
 * kept by a browser or shared cache. Only routes that explicitly opt in to
 * public caching through {@see PublicCacheHeaders} keep their headers.
 */
class PrivateNoStore
{
    public const string HEADER_VALUE = 'private, no-store';

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! $response->headers->hasCacheControlDirective('public')) {
            $response->headers->set('Cache-Control', self::HEADER_VALUE);
        }

        return $response;
    }
}
