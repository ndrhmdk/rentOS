<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class PrivateResponseCachingTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, array{string}>
     */
    public static function accountRoutes(): array
    {
        return [
            'current user' => ['/api/v1/me'],
            'personal access tokens' => ['/api/v1/personal-access-tokens'],
            'notifications' => ['/api/v1/notifications'],
            'favourite properties' => ['/api/v1/favourite-properties'],
        ];
    }

    #[DataProvider('accountRoutes')]
    public function test_account_responses_are_never_cacheable(string $uri): void
    {
        $this->actingAs(User::factory()->create(), 'web')
            ->getJson($uri)
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private');
    }

    #[DataProvider('accountRoutes')]
    public function test_unauthenticated_errors_on_account_routes_are_never_cacheable(string $uri): void
    {
        $this->getJson($uri)
            ->assertUnauthorized()
            ->assertHeader('Cache-Control', 'no-store, private');
    }

    public function test_csrf_cookie_response_is_never_cacheable(): void
    {
        $this->get('/sanctum/csrf-cookie')
            ->assertNoContent()
            ->assertHeader('Cache-Control', 'no-store, private');
    }

    public function test_login_and_password_reset_responses_are_never_cacheable(): void
    {
        $this->postJson('/login', ['email' => 'nobody@example.test', 'password' => 'wrong-password'])
            ->assertUnprocessable()
            ->assertHeader('Cache-Control', 'no-store, private');

        $this->postJson('/forgot-password', ['email' => 'not-an-email'])
            ->assertUnprocessable()
            ->assertHeader('Cache-Control', 'no-store, private');
    }

    public function test_token_creation_response_holding_the_secret_is_never_cacheable(): void
    {
        $this->actingAs(User::factory()->create(), 'web')
            ->postJson('/api/v1/personal-access-tokens', [
                'name' => 'Cache test token',
                'abilities' => ['account:read'],
                'expires_at' => null,
            ])
            ->assertCreated()
            ->assertHeader('Cache-Control', 'no-store, private');
    }
}
