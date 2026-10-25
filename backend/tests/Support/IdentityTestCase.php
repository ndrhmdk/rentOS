<?php

namespace Tests\Support;

use App\Http\Middleware\StrictCsrf;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Route;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class EnforcedTestCsrf extends StrictCsrf
{
    protected function runningUnitTests(): bool
    {
        return false;
    }
}

abstract class IdentityTestCase extends TestCase
{
    use RefreshDatabase;

    protected array $jar = [];

    protected function setUp(): void
    {
        parent::setUp();
        config(['session.driver' => 'database', 'sanctum.stateful' => ['localhost:3000', 'localhost:8000']]);
        $this->app->bind(StrictCsrf::class, EnforcedTestCsrf::class);
        Notification::fake();
    }

    protected function browser(string $method, string $uri, array $body = [], bool $csrf = true, array $headers = []): TestResponse
    {
        $server = ['HTTP_ACCEPT' => 'application/json', 'CONTENT_TYPE' => 'application/json', 'HTTP_ORIGIN' => 'http://localhost:3000'];
        if ($csrf && isset($this->jar['XSRF-TOKEN'])) {
            $server['HTTP_X_XSRF_TOKEN'] = $this->jar['XSRF-TOKEN'];
        }
        $response = $this->requestWithCookies($method, $uri, $body, $this->jar, array_merge($server, $headers));
        foreach ($response->headers->getCookies() as $cookie) {
            $this->jar[$cookie->getName()] = $cookie->getValue();
        }

        return $response;
    }

    protected function bearer(string $method, string $uri, string $token, array $body = []): TestResponse
    {
        return $this->requestWithCookies($method, $uri, $body, [], ['HTTP_ACCEPT' => 'application/json', 'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer '.$token]);
    }

    protected function requestWithCookies(string $method, string $uri, array $body, array $cookies, array $server): TestResponse
    {
        $this->app->forgetInstance('auth.driver');
        foreach (Route::getRoutes() as $route) {
            $route->flushController();
        }
        $this->app['auth']->forgetGuards();
        $this->app['auth']->shouldUse('web');
        $this->app['session']->forgetDrivers();
        $this->app->forgetInstance('session.store');

        return $this->call($method, $uri, [], $cookies, [], $server, json_encode($body));
    }

    protected function login(User $user): TestResponse
    {
        $this->jar = [];
        $this->browser('GET', '/sanctum/csrf-cookie')->assertNoContent();

        return $this->browser('POST', '/login', ['email' => $user->email, 'password' => 'password']);
    }

    protected function confirmPassword(): void
    {
        $this->browser('POST', '/user/confirm-password', ['password' => 'password'])->assertCreated();
    }
}
