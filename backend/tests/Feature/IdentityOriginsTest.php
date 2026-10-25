<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Notification;
use Tests\Support\IdentityTestCase;

class IdentityOriginsTest extends IdentityTestCase
{
    public function test_exact_local_origin_can_preflight_auth_and_hostile_origin_cannot(): void
    {
        $allowed = $this->requestWithCookies('OPTIONS', '/login', [], [], ['HTTP_ORIGIN' => 'http://localhost:3000', 'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST', 'HTTP_ACCESS_CONTROL_REQUEST_HEADERS' => 'content-type,x-xsrf-token']);
        $allowed->assertNoContent()->assertHeader('Access-Control-Allow-Origin', 'http://localhost:3000')->assertHeader('Access-Control-Allow-Credentials', 'true');
        $hostile = $this->requestWithCookies('OPTIONS', '/login', [], [], ['HTTP_ORIGIN' => 'https://evil.example', 'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST']);
        // A single-origin CORS server may emit its configured origin for every preflight;
        // the browser still rejects it because it does not match the hostile Origin.
        $this->assertNotSame('https://evil.example', $hostile->headers->get('Access-Control-Allow-Origin'));
        $this->assertNotSame('*', $hostile->headers->get('Access-Control-Allow-Origin'));
    }

    public function test_local_csrf_endpoint_sets_httponly_session_and_readable_xsrf_cookie(): void
    {
        $response = $this->browser('GET', '/sanctum/csrf-cookie')->assertNoContent();
        $cookies = collect($response->headers->getCookies())->keyBy(fn ($cookie) => $cookie->getName());
        $this->assertTrue($cookies[config('session.cookie')]->isHttpOnly());
        $this->assertFalse($cookies['XSRF-TOKEN']->isHttpOnly());
        $this->assertSame('lax', $cookies[config('session.cookie')]->getSameSite());
    }

    public function test_sibling_https_configuration_sets_secure_parent_domain_cookies(): void
    {
        config([
            'identity.allowed_origins' => ['https://app.rentos.test'],
            'cors.allowed_origins' => ['https://app.rentos.test'],
            'sanctum.stateful' => ['app.rentos.test', 'api.rentos.test'],
            'session.domain' => '.rentos.test', 'session.secure' => true,
        ]);
        $response = $this->browser('GET', 'https://api.rentos.test/sanctum/csrf-cookie', headers: ['HTTP_ORIGIN' => 'https://app.rentos.test'])->assertNoContent();
        $cookies = collect($response->headers->getCookies())->keyBy(fn ($cookie) => $cookie->getName());
        $this->assertTrue($cookies[config('session.cookie')]->isSecure());
        $this->assertSame('.rentos.test', $cookies[config('session.cookie')]->getDomain());
        $response->assertHeader('Access-Control-Allow-Origin', 'https://app.rentos.test');
        // This is an HTTP integration configuration check, not proof of a deployed browser/domain.
    }

    public function test_reset_mail_uses_only_configured_frontend_destination(): void
    {
        $user = User::factory()->create();
        $this->browser('GET', '/sanctum/csrf-cookie');
        $this->browser('POST', '/forgot-password', ['email' => $user->email, 'return_url' => 'https://evil.example'])->assertOk();
        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user): bool {
            $url = $notification->toMail($user)->actionUrl;
            $this->assertStringStartsWith('http://localhost:3000/reset-password?', $url);
            $this->assertStringNotContainsString('evil.example', $url);

            return true;
        });
    }
}
