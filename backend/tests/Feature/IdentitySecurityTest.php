<?php

namespace Tests\Feature;

use App\Actions\Identity\SuspendAccount;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Tests\Support\IdentityTestCase;

class IdentitySecurityTest extends IdentityTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // Harness only: no fake domain/admin endpoint is shipped in production.
        Route::middleware(['api', 'account.admin'])->get('/api/v1/testing/admin', fn () => response()->json(['allowed' => true]));
        Route::middleware('api')->match(['POST', 'PUT', 'PATCH', 'DELETE'], '/api/v1/testing/write', function () {
            DB::table('users')->where('id', request()->user()->id)->update(['name' => 'Harness write']);

            return response()->noContent();
        });
        Route::middleware('api')->put('/api/v1/favourite-properties/test-harness', fn () => response()->noContent());
    }

    public function test_missing_wrong_and_other_session_csrf_block_login_and_every_write_before_mutation(): void
    {
        $user = User::factory()->create(['name' => 'Original']);
        $this->browser('GET', '/sanctum/csrf-cookie');
        $otherXsrf = $this->jar['XSRF-TOKEN'];
        $this->jar = [];
        $this->browser('GET', '/sanctum/csrf-cookie');
        $this->browser('POST', '/login', ['email' => $user->email, 'password' => 'password'], csrf: false)->assertStatus(419);
        $this->browser('POST', '/login', ['email' => $user->email, 'password' => 'password'], headers: ['HTTP_X_XSRF_TOKEN' => 'wrong'])->assertStatus(419);
        $this->login($user)->assertOk();
        foreach (['POST', 'PUT', 'PATCH', 'DELETE'] as $method) {
            $this->browser($method, '/api/v1/testing/write', csrf: false)->assertStatus(419);
            $this->browser($method, '/api/v1/testing/write', headers: ['HTTP_X_XSRF_TOKEN' => $otherXsrf])->assertStatus(419);
            $this->browser($method, '/api/v1/testing/write', headers: ['HTTP_X_XSRF_TOKEN' => 'wrong', 'HTTP_SEC_FETCH_SITE' => 'same-origin'])->assertStatus(419);
        }
        $this->assertSame('Original', $user->fresh()->name);
        $this->assertDatabaseCount('audit_logs', 0);
        $this->assertDatabaseCount('notification_outbox', 0);
        $this->browser('PATCH', '/api/v1/testing/write')->assertNoContent();
        $this->assertSame('Harness write', $user->fresh()->name);
    }

    public function test_csrf_is_required_on_token_create_revoke_profile_and_logout(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('retained', ['account:read'], now()->addDay());
        $this->login($user)->assertOk();
        $this->confirmPassword();
        $this->browser('POST', '/api/v1/account/api-tokens', ['name' => 'denied', 'abilities' => ['account:read']], false)->assertStatus(419);
        $this->browser('DELETE', '/api/v1/account/api-tokens/'.$token->accessToken->id, csrf: false)->assertStatus(419);
        $this->browser('PATCH', '/api/v1/profile', ['name' => 'denied'], false)->assertStatus(419);
        $this->browser('POST', '/logout', csrf: false)->assertStatus(419);
        $this->assertDatabaseCount('personal_access_tokens', 1);
        $this->assertDatabaseCount('audit_logs', 0);
        $this->browser('GET', '/api/v1/me')->assertOk();
    }

    public function test_real_cookie_free_pat_enforces_scope_expiry_and_session_only_boundaries(): void
    {
        $user = User::factory()->create(['is_admin' => true]);
        $read = $user->createToken('read', ['account:read'], now()->addDay());
        $write = $user->createToken('write', ['favourites:write'], now()->addDay());
        $this->bearer('GET', '/api/v1/me', $write->plainTextToken)->assertForbidden();
        $this->bearer('PUT', '/api/v1/favourite-properties/test-harness', $read->plainTextToken)->assertForbidden();
        $this->bearer('PUT', '/api/v1/favourite-properties/test-harness', $write->plainTextToken)->assertNoContent();
        $this->bearer('GET', '/api/v1/account/api-tokens', $read->plainTextToken)->assertForbidden();
        $this->bearer('POST', '/api/v1/account/api-tokens', $read->plainTextToken, ['name' => 'escalation', 'abilities' => ['account:read']])->assertForbidden();
        $this->bearer('PATCH', '/api/v1/profile', $read->plainTextToken, ['name' => 'escalation'])->assertForbidden();
        $this->bearer('GET', '/api/v1/testing/admin', $read->plainTextToken)->assertForbidden();
        $this->bearer('GET', '/api/v1/me', 'provider.jwt.invalid')->assertUnauthorized();
        $this->travel(2)->days();
        $this->bearer('GET', '/api/v1/me', $read->plainTextToken)->assertUnauthorized();
        $this->assertDatabaseHas('personal_access_tokens', ['id' => $read->accessToken->id]);
    }

    public function test_browser_origin_and_mixed_credentials_cannot_bypass_csrf(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('read', ['account:read'], now()->addDay());
        $this->login($user)->assertOk();
        $this->browser('GET', '/api/v1/me', headers: ['HTTP_ORIGIN' => 'https://hostile.example'])->assertForbidden();
        $this->browser('GET', '/api/v1/me', headers: ['HTTP_AUTHORIZATION' => 'Bearer '.$token->plainTextToken])->assertForbidden();
        $this->requestWithCookies('GET', '/api/v1/me', [], $this->jar, ['HTTP_ACCEPT' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer '.$token->plainTextToken])->assertForbidden();
        $this->bearer('GET', '/api/v1/me', $token->plainTextToken)->assertOk();
    }

    public function test_current_admin_and_user_policies_apply_even_when_session_token_can_is_true(): void
    {
        $normal = User::factory()->create();
        $other = User::factory()->create();
        $this->login($normal)->assertOk();
        $this->browser('GET', '/api/v1/testing/admin')->assertForbidden();
        $this->assertFalse(Gate::forUser($normal)->allows('update', $other));
        $admin = User::factory()->create(['is_admin' => true]);
        $this->login($admin)->assertOk();
        $this->browser('GET', '/api/v1/testing/admin')->assertOk();
        $this->assertFalse(Gate::forUser($admin)->allows('update', $other));
        $admin->forceFill(['is_admin' => false])->save();
        $this->browser('GET', '/api/v1/testing/admin')->assertForbidden();
    }

    public function test_suspension_revokes_sessions_and_tokens_and_reenable_restores_neither(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create();
        $token = $user->createToken('read', ['account:read'], now()->addDay());
        $this->login($user)->assertOk();
        app(SuspendAccount::class)->handle($admin, $user);
        $this->assertDatabaseMissing('sessions', ['user_id' => $user->id]);
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $token->accessToken->id]);
        $this->browser('GET', '/api/v1/me')->assertUnauthorized();
        $this->bearer('GET', '/api/v1/me', $token->plainTextToken)->assertUnauthorized();
        $user->fresh()->forceFill(['account_status' => 'ACTIVE'])->save();
        $this->browser('GET', '/api/v1/me')->assertUnauthorized();
        $this->bearer('GET', '/api/v1/me', $token->plainTextToken)->assertUnauthorized();
    }

    public function test_status_and_verification_checks_reject_existing_pat_on_new_requests(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('read', ['account:read'], now()->addDay());
        $user->forceFill(['account_status' => 'SUSPENDED'])->save();
        $this->bearer('GET', '/api/v1/me', $token->plainTextToken)->assertForbidden();
        $user->forceFill(['account_status' => 'ACTIVE', 'email_verified_at' => null])->save();
        $this->bearer('GET', '/api/v1/me', $token->plainTextToken)->assertForbidden();
    }

    public function test_login_rate_limit_rejects_repeated_attempts(): void
    {
        $user = User::factory()->create();
        $this->browser('GET', '/sanctum/csrf-cookie');
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->browser('POST', '/login', ['email' => $user->email, 'password' => 'wrong'])->assertUnprocessable();
        }
        $this->browser('POST', '/login', ['email' => $user->email, 'password' => 'password'])->assertTooManyRequests();
    }
}
