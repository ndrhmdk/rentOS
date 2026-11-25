<?php

namespace Tests\Unit\Http;

use App\Http\Middleware\PublicCacheHeaders;
use Illuminate\Http\Request;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Response;

class PublicCacheHeadersTest extends TestCase
{
    public function test_a_response_that_sets_a_cookie_is_never_marked_public(): void
    {
        $response = $this->handle(Request::create('/listings'), function (): Response {
            $response = new Response('{"data":[]}');
            $response->headers->setCookie(Cookie::create('session', 'secret'));

            return $response;
        }, '30', '60');

        $this->assertFalse($response->headers->hasCacheControlDirective('public'));
        $this->assertTrue($response->headers->hasCacheControlDirective('private'));
        $this->assertSame('30', $response->headers->getCacheControlDirective('max-age'));
    }

    public function test_non_cacheable_methods_and_non_200_responses_are_no_store(): void
    {
        $post = $this->handle(Request::create('/listings', 'POST'), fn (): Response => new Response('ok'), '30');
        $this->assertTrue($post->headers->hasCacheControlDirective('no-store'));
        $this->assertNull($post->headers->get('ETag'));

        $missing = $this->handle(Request::create('/listings/1'), fn (): Response => new Response('gone', 404));
        $this->assertTrue($missing->headers->hasCacheControlDirective('no-store'));
        $this->assertNull($missing->headers->get('ETag'));
    }

    public function test_head_requests_get_the_same_validators_as_get(): void
    {
        $response = $this->handle(Request::create('/amenities', 'HEAD'), fn (): Response => new Response('{"data":[]}'), '3600', '86400');

        $this->assertSame('W/"'.sha1('{"data":[]}').'"', $response->headers->get('ETag'));
        $this->assertSame('3600', $response->headers->getCacheControlDirective('max-age'));
        $this->assertSame('86400', $response->headers->getCacheControlDirective('stale-while-revalidate'));
    }

    public function test_matching_if_none_match_turns_the_response_into_an_empty_304(): void
    {
        $body = '{"data":{"id":"abc"}}';
        $request = Request::create('/listings/abc');
        $request->headers->set('If-None-Match', 'W/"'.sha1($body).'"');

        $response = $this->handle($request, fn (): Response => new Response($body, 200, ['Content-Type' => 'application/json']));

        $this->assertSame(304, $response->getStatusCode());
        $this->assertSame('', (string) $response->getContent());
        $this->assertTrue($response->headers->hasCacheControlDirective('no-cache'));
        $this->assertFalse($response->headers->has('Content-Type'));
    }

    private function handle(Request $request, \Closure $next, string $maxAge = PublicCacheHeaders::REVALIDATE, ?string $staleWhileRevalidate = null): Response
    {
        return (new PublicCacheHeaders)->handle($request, $next, $maxAge, $staleWhileRevalidate);
    }
}
