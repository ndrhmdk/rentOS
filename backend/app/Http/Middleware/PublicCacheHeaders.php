<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Adds browser and shared-cache headers to public, user-independent API reads.
 *
 * Usage: `public.cache:{maxAgeSeconds},{staleWhileRevalidateSeconds}` for data that
 * may be briefly stale, or `public.cache:revalidate` for data that must be checked
 * on every request (the browser keeps the body and the server answers 304 when the
 * weak ETag still matches, so fresh visibility checks keep running).
 *
 * Only successful GET/HEAD responses become cacheable. Errors stay `no-store`, and
 * a response that sets a cookie is downgraded to `private` so a shared cache can
 * never replay one visitor's cookie to another.
 */
class PublicCacheHeaders
{
    public const string REVALIDATE = 'revalidate';

    public function handle(Request $request, Closure $next, string $maxAge = self::REVALIDATE, ?string $staleWhileRevalidate = null): Response
    {
        $response = $next($request);

        if (! $request->isMethodCacheable() || $response->getStatusCode() !== Response::HTTP_OK) {
            $response->headers->set('Cache-Control', PrivateNoStore::HEADER_VALUE);

            return $response;
        }

        $visibility = $response->headers->getCookies() === [] ? 'public' : 'private';
        $response->headers->set('Cache-Control', $this->cacheControl($visibility, $maxAge, $staleWhileRevalidate));
        $response->setVary('Origin', false);

        $content = $response->getContent();
        if (is_string($content) && $content !== '') {
            $response->setEtag(sha1($content), weak: true);
            $response->isNotModified($request);
        }

        return $response;
    }

    private function cacheControl(string $visibility, string $maxAge, ?string $staleWhileRevalidate): string
    {
        if ($maxAge === self::REVALIDATE) {
            return $visibility.', no-cache';
        }

        $directives = [$visibility, 'max-age='.max(0, (int) $maxAge)];
        if ($staleWhileRevalidate !== null) {
            $directives[] = 'stale-while-revalidate='.max(0, (int) $staleWhileRevalidate);
        }

        return implode(', ', $directives);
    }
}
