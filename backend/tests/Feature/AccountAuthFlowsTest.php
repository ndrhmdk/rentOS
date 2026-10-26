<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\Support\EnforcingCsrfMiddleware;
use Tests\TestCase;

class AccountAuthFlowsTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_normalizes_email_hashes_password_and_sends_verification(): void
    {
        Notification::fake();

        $response = $this->postJson('/register', [
            'name' => '  Test User  ',
            'email' => '  Test.User@Example.test  ',
            'password' => 'A-strong-password-123',
            'password_confirmation' => 'A-strong-password-123',
            'is_admin' => true,
        ]);

        $response->assertCreated();
        $user = User::query()->where('email', 'test.user@example.test')->firstOrFail();

        $this->assertSame('Test User', $user->name);
        $this->assertNull($user->email_verified_at);
        $this->assertFalse($user->is_admin);
        $this->assertTrue(Hash::check('A-strong-password-123', $user->password));
        $this->assertAuthenticatedAs($user, 'web');
        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $user->id]);
        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_registration_rejects_an_existing_normalized_email(): void
    {
        User::factory()->create(['email' => 'member@example.test']);

        $this->postJson('/register', [
            'name' => 'Another Member',
            'email' => ' MEMBER@example.test ',
            'password' => 'A-strong-password-123',
            'password_confirmation' => 'A-strong-password-123',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');

        $this->assertDatabaseCount('users', 1);
    }

    public function test_stateful_registration_requires_a_valid_csrf_token_before_mutating_users(): void
    {
        $this->withCredentials();
        Notification::fake();
        config([
            'sanctum.stateful' => ['localhost:3000'],
            'sanctum.middleware.validate_csrf_token' => EnforcingCsrfMiddleware::class,
        ]);
        $router = app(Router::class);
        $webMiddleware = $router->getMiddlewareGroups()['web'];
        $router->middlewareGroup('web', array_map(
            fn ($middleware): string => $middleware === PreventRequestForgery::class
                ? EnforcingCsrfMiddleware::class
                : $middleware,
            $webMiddleware,
        ));

        $csrfResponse = $this->withHeader('Origin', 'http://localhost:3000')
            ->get('/sanctum/csrf-cookie')
            ->assertNoContent();
        $sessionId = $csrfResponse->getCookie(config('session.cookie'))?->getValue();
        $xsrfCookie = $csrfResponse->getCookie('XSRF-TOKEN', false)?->getValue();

        $this->assertNotEmpty($sessionId);
        $this->assertNotEmpty($xsrfCookie);

        $registration = [
            'name' => 'CSRF Test User',
            'email' => 'csrf-test@example.test',
            'password' => 'A-strong-password-123',
            'password_confirmation' => 'A-strong-password-123',
        ];
        $originHeaders = [
            'Origin' => 'http://localhost:3000',
            'Referer' => 'http://localhost:3000/register',
        ];

        $this->withCookie(config('session.cookie'), $sessionId)
            ->withHeaders($originHeaders)
            ->postJson('/register', $registration)
            ->assertStatus(419);
        $this->assertDatabaseCount('users', 0);

        $this->withCookie(config('session.cookie'), $sessionId)
            ->withHeaders($originHeaders + ['X-XSRF-TOKEN' => 'incorrect-token'])
            ->postJson('/register', $registration)
            ->assertStatus(419);
        $this->assertDatabaseCount('users', 0);

        $this->withCookie(config('session.cookie'), $sessionId)
            ->withHeaders($originHeaders + ['X-XSRF-TOKEN' => $xsrfCookie])
            ->postJson('/register', $registration)
            ->assertCreated();
        $this->assertDatabaseCount('users', 1);
    }

    public function test_signed_email_verification_marks_only_the_authenticated_user_verified(): void
    {
        $user = User::factory()->unverified()->create();
        $url = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(10),
            ['id' => $user->id, 'hash' => sha1($user->email)],
        );

        $this->actingAs($user)->get($url)->assertRedirect();

        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_expired_email_verification_link_does_not_verify_the_user(): void
    {
        $user = User::factory()->unverified()->create();
        $url = URL::temporarySignedRoute(
            'verification.verify',
            now()->subMinute(),
            ['id' => $user->id, 'hash' => sha1($user->email)],
        );

        $this->actingAs($user)->get($url)->assertForbidden();

        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_login_rotates_the_session_and_logout_does_not_create_a_token(): void
    {
        $this->withCredentials();
        $user = User::factory()->create([
            'email' => 'login@example.test',
            'password' => 'Current-password-123',
        ]);
        $sessionCookie = config('session.cookie');
        $csrfResponse = $this->get('/sanctum/csrf-cookie');
        $initialSessionId = $csrfResponse->getCookie($sessionCookie)?->getValue();

        $loginResponse = $this->withCookie($sessionCookie, $initialSessionId)->postJson('/login', [
            'email' => ' LOGIN@example.test ',
            'password' => 'Current-password-123',
        ])->assertOk();
        $rotatedSessionId = $loginResponse->getCookie($sessionCookie)?->getValue();

        $this->assertNotNull($initialSessionId);
        $this->assertNotNull($rotatedSessionId);
        $this->assertNotSame($initialSessionId, $rotatedSessionId);
        $this->assertAuthenticatedAs($user, 'web');
        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $user->id]);

        config(['sanctum.stateful' => ['localhost:3000']]);
        $this->withCookie($sessionCookie, $rotatedSessionId)->withHeader('Origin', 'http://localhost:3000');
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/me')->assertOk();
        $this->postJson('/logout')->assertNoContent();
        $this->assertGuest('web');
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_current_user_profile_is_allowlisted_and_only_updates_name_and_phone(): void
    {
        $user = User::factory()->create(['phone' => null]);

        $this->actingAs($user)->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonMissingPath('data.is_admin')
            ->assertJsonMissingPath('data.password');

        $this->actingAs($user)->patchJson('/api/v1/me', [
            'name' => 'Updated Name',
            'phone' => '+84901234567',
        ])->assertOk()->assertJsonPath('data.name', 'Updated Name');

        $this->actingAs($user)->patchJson('/api/v1/me', [
            'name' => 'Attempted Elevation',
            'phone' => '+84901234567',
            'is_admin' => true,
        ])->assertUnprocessable()->assertJsonValidationErrors('is_admin');

        $this->assertFalse($user->fresh()->is_admin);
        $this->assertSame('Updated Name', $user->fresh()->name);
        $this->assertSame('+84901234567', $user->fresh()->phone);
    }

    public function test_password_change_checks_current_password_and_revokes_tokens_and_session(): void
    {
        $user = User::factory()->create(['password' => 'Old-password-123']);
        $user->createToken('account-test', ['account:read'], now()->addHour());
        $rememberToken = $user->remember_token;
        $otherUser = User::factory()->create();
        $otherUser->createToken('other-account', ['account:read'], now()->addHour());
        foreach ([$user, $otherUser] as $sessionUser) {
            DB::table('sessions')->insert([
                'id' => 'session-'.$sessionUser->id,
                'user_id' => $sessionUser->id,
                'payload' => '',
                'last_activity' => now()->timestamp,
            ]);
        }

        $this->actingAs($user)->putJson('/user/password', [
            'current_password' => 'incorrect-password',
            'password' => 'New-password-456',
            'password_confirmation' => 'New-password-456',
        ])->assertUnprocessable()->assertJsonValidationErrors('current_password');

        $this->assertTrue(Hash::check('Old-password-123', $user->fresh()->password));
        $this->assertDatabaseCount('personal_access_tokens', 2);
        $this->assertSame($rememberToken, $user->fresh()->remember_token);
        $this->assertDatabaseHas('sessions', ['user_id' => $user->id]);

        $this->actingAs($user)->putJson('/user/password', [
            'current_password' => 'Old-password-123',
            'password' => 'New-password-456',
            'password_confirmation' => 'New-password-456',
        ])->assertOk();

        $this->assertTrue(Hash::check('New-password-456', $user->fresh()->password));
        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $user->id]);
        $this->assertDatabaseHas('personal_access_tokens', ['tokenable_id' => $otherUser->id]);
        $this->assertNotSame($rememberToken, $user->fresh()->remember_token);
        $this->assertDatabaseMissing('sessions', ['user_id' => $user->id]);
        $this->assertDatabaseHas('sessions', ['user_id' => $otherUser->id]);
        $this->assertGuest('web');
    }

    public function test_registration_rejects_non_string_identity_without_creating_users(): void
    {
        $this->postJson('/register', [
            'name' => ['invalid'], 'email' => ['invalid'],
            'password' => 'short', 'password_confirmation' => 'different',
        ])->assertUnprocessable()->assertJsonValidationErrors(['name', 'email', 'password']);
        $this->assertDatabaseCount('users', 0);
    }

    public function test_login_rejects_wrong_password_and_throttles_normalized_email(): void
    {
        User::factory()->create(['email' => 'limited@example.test']);
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/login', ['email' => ' LIMITED@example.test ', 'password' => 'wrong'])
                ->assertUnprocessable();
        }
        $this->postJson('/login', ['email' => 'limited@example.test', 'password' => 'wrong'])
            ->assertTooManyRequests();
        $this->assertGuest('web');
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_forged_and_foreign_verification_links_do_not_verify_either_user(): void
    {
        $user = User::factory()->unverified()->create();
        $other = User::factory()->unverified()->create();
        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(10), [
            'id' => $user->id, 'hash' => sha1($user->email),
        ]);
        $this->actingAs($other)->get($url)->assertForbidden();
        $this->actingAs($user)->get($url.'&tampered=1')->assertForbidden();
        $this->assertNull($user->fresh()->email_verified_at);
        $this->assertNull($other->fresh()->email_verified_at);
    }

    public function test_resend_is_throttled_and_reset_email_endpoints_are_unavailable(): void
    {
        Notification::fake();
        $user = User::factory()->unverified()->create();
        for ($attempt = 0; $attempt < 6; $attempt++) {
            $this->actingAs($user)->postJson('/email/verification-notification')->assertAccepted();
        }
        $this->postJson('/email/verification-notification')->assertTooManyRequests();
        Notification::assertSentToTimes($user, VerifyEmail::class, 6);
        $this->postJson('/forgot-password', ['email' => $user->email])->assertNotFound();
        $this->postJson('/reset-password', [])->assertNotFound();
    }

    public function test_profile_ignores_empty_prohibited_fields_and_preserves_identity(): void
    {
        $user = User::factory()->create();
        $email = $user->email;
        $password = $user->password;
        $this->actingAs($user)->patchJson('/api/v1/me', [
            'name' => 'Safe Name', 'email' => null, 'password' => null, 'is_admin' => null,
        ])->assertOk();
        $this->assertSame($email, $user->fresh()->email);
        $this->assertSame($password, $user->fresh()->password);
        $this->assertFalse($user->fresh()->is_admin);
    }

    public function test_cookie_free_pat_cannot_update_profile_and_needs_account_read_scope(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('read-only', ['account:read'], now()->addHour())->plainTextToken;
        $this->withToken($token)->getJson('/api/v1/me')->assertOk()->assertJsonPath('data.id', $user->id);
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->patchJson('/api/v1/me', ['name' => 'Forbidden'])->assertForbidden();
        $this->assertNotSame('Forbidden', $user->fresh()->name);
        $token = $user->createToken('wrong-scope', ['favourites:read'], now()->addHour())->plainTextToken;
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/v1/me')->assertForbidden();
    }

    public function test_real_csrf_denies_account_mutations_without_side_effects_then_accepts_valid_tokens(): void
    {
        Notification::fake();
        $this->withCredentials()->withHeaders(['Origin' => 'http://localhost:3000']);
        config(['sanctum.stateful' => ['localhost:3000'],
            'sanctum.middleware.validate_csrf_token' => EnforcingCsrfMiddleware::class]);
        $router = app(Router::class);
        $router->middlewareGroup('web', array_map(
            fn ($middleware): string => $middleware === PreventRequestForgery::class ? EnforcingCsrfMiddleware::class : $middleware,
            $router->getMiddlewareGroups()['web'],
        ));
        $user = User::factory()->unverified()->create(['password' => 'Old-password-123']);
        $user->createToken('existing', ['account:read'], now()->addHour());
        $originalName = $user->name;
        $csrf = $this->get('/sanctum/csrf-cookie')->assertNoContent();
        $this->withCookie(config('session.cookie'), $csrf->getCookie(config('session.cookie'))->getValue());
        $login = ['email' => $user->email, 'password' => 'Old-password-123'];
        foreach (['', 'invalid'] as $token) {
            $this->withHeader('X-XSRF-TOKEN', $token)->postJson('/login', $login)->assertStatus(419);
            $this->assertGuest('web');
        }
        $response = $this->withHeader('X-XSRF-TOKEN', $csrf->getCookie('XSRF-TOKEN', false)->getValue())
            ->postJson('/login', $login)->assertOk();
        $this->withCookie(config('session.cookie'), $response->getCookie(config('session.cookie'))->getValue());
        $this->app['auth']->forgetGuards();
        $csrf = $this->get('/sanctum/csrf-cookie')->assertNoContent();
        $password = ['current_password' => 'Old-password-123', 'password' => 'New-password-456',
            'password_confirmation' => 'New-password-456'];
        foreach (['', 'invalid'] as $token) {
            $this->withHeader('X-XSRF-TOKEN', $token);
            $this->patchJson('/api/v1/me', ['name' => 'Blocked'])->assertStatus(419);
            $this->putJson('/user/password', $password)->assertStatus(419);
            $this->postJson('/email/verification-notification')->assertStatus(419);
            $this->postJson('/logout')->assertStatus(419);
            $this->assertSame($originalName, $user->fresh()->name);
            $this->assertTrue(Hash::check('Old-password-123', $user->fresh()->password));
            $this->assertDatabaseCount('personal_access_tokens', 1);
        }
        Notification::assertNothingSent();
        $this->withHeader('X-XSRF-TOKEN', $csrf->getCookie('XSRF-TOKEN', false)->getValue());
        $this->patchJson('/api/v1/me', ['name' => 'Allowed'])->assertOk();
        $this->assertSame('Allowed', $user->fresh()->name);
        $this->postJson('/email/verification-notification')->assertAccepted();
        Notification::assertSentTo($user, VerifyEmail::class);
        $signedOut = $this->postJson('/logout')->assertNoContent();
        $this->assertGuest('web');
        $this->withCookie(config('session.cookie'), $signedOut->getCookie(config('session.cookie'))->getValue());
        $csrf = $this->get('/sanctum/csrf-cookie')->assertNoContent();
        $response = $this->withHeader('X-XSRF-TOKEN', $csrf->getCookie('XSRF-TOKEN', false)->getValue())
            ->postJson('/login', $login)->assertOk();
        $this->withCookie(config('session.cookie'), $response->getCookie(config('session.cookie'))->getValue());
        $this->withHeader('X-XSRF-TOKEN', $response->getCookie('XSRF-TOKEN', false)->getValue());
        $this->putJson('/user/password', $password)->assertOk();
        $this->assertTrue(Hash::check('New-password-456', $user->fresh()->password));
        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->assertGuest('web');
    }

    public function test_stale_authenticated_password_cannot_overwrite_a_committed_change(): void
    {
        $user = User::factory()->create(['password' => 'Old-password-123']);
        $user->createToken('preserve-on-failure', ['account:read'], now()->addHour());
        User::query()->whereKey($user->id)->update(['password' => Hash::make('Committed-password-456')]);
        $this->actingAs($user)->putJson('/user/password', [
            'current_password' => 'Old-password-123', 'password' => 'Attempt-password-789',
            'password_confirmation' => 'Attempt-password-789',
        ])->assertUnprocessable()->assertJsonValidationErrors('current_password');
        $this->assertTrue(Hash::check('Committed-password-456', $user->fresh()->password));
        $this->assertDatabaseCount('personal_access_tokens', 1);
        $this->actingAs($user)->putJson('/user/password', [
            'current_password' => ['invalid'], 'password' => 'Attempt-password-789',
            'password_confirmation' => 'Attempt-password-789',
        ])->assertUnprocessable()->assertJsonValidationErrors('current_password');
    }

    public function test_verification_without_session_redirects_to_frontend_sign_in(): void
    {
        $user = User::factory()->unverified()->create();
        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(10), [
            'id' => $user->id, 'hash' => sha1($user->email),
        ]);
        $this->get($url)->assertRedirect(rtrim(config('fortify.home'), '/').'/login');
        $this->assertNull($user->fresh()->email_verified_at);
    }
}
