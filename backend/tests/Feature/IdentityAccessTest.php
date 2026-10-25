<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\Support\IdentityTestCase;

class IdentityAccessTest extends IdentityTestCase
{
    public function test_registration_normalizes_email_creates_only_user_and_sends_verification(): void
    {
        $this->browser('GET', '/sanctum/csrf-cookie')->assertNoContent();
        $this->browser('POST', '/register', ['name' => 'Hien', 'email' => ' HIEN@EXAMPLE.COM ', 'password' => 'StrongPassword123', 'password_confirmation' => 'StrongPassword123'])->assertCreated();
        $user = User::sole();
        $this->assertSame('hien@example.com', $user->email);
        $this->assertFalse($user->is_admin);
        $this->assertNull($user->email_verified_at);
        $this->assertTrue(Hash::check('StrongPassword123', $user->password));
        $this->assertDatabaseCount('personal_access_tokens', 0);
        Notification::assertSentTo($user, VerifyEmail::class);
        $this->browser('GET', '/api/v1/me')->assertOk()->assertJsonPath('data.email_verified', false)->assertJsonMissingPath('data.password');
        $this->browser('GET', '/api/v1/account/api-tokens')->assertForbidden();
    }

    public function test_registration_rejects_privilege_fields_and_invalid_or_duplicate_credentials_without_partial_writes(): void
    {
        User::factory()->create(['email' => 'used@example.com']);
        $this->browser('GET', '/sanctum/csrf-cookie');
        $this->browser('POST', '/register', ['name' => 'Hien', 'email' => 'new@example.com', 'password' => 'weak', 'password_confirmation' => 'different', 'is_admin' => true])->assertUnprocessable()->assertJsonValidationErrors(['password', 'is_admin']);
        $this->browser('POST', '/register', ['name' => 'Hien', 'email' => ' USED@EXAMPLE.COM ', 'password' => 'StrongPassword123', 'password_confirmation' => 'StrongPassword123'])->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->assertDatabaseCount('users', 1);
        Notification::assertNothingSent();
    }

    public function test_login_rotates_database_session_and_logout_invalidates_old_cookie_but_keeps_pat(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('independent', ['account:read'], now()->addDay())->plainTextToken;
        $this->browser('GET', '/sanctum/csrf-cookie');
        $before = DB::table('sessions')->sole()->id;
        $this->browser('POST', '/login', ['email' => strtoupper($user->email), 'password' => 'password', 'remember' => true])->assertOk();
        $this->assertDatabaseMissing('sessions', ['id' => $before]);
        $this->assertDatabaseCount('personal_access_tokens', 1);
        $cookies = $this->jar;
        $this->browser('GET', '/api/v1/me')->assertOk()->assertJsonPath('data.id', $user->id);
        $this->browser('POST', '/logout')->assertNoContent();
        $this->jar = $cookies;
        $this->browser('GET', '/api/v1/me')->assertUnauthorized();
        $this->bearer('GET', '/api/v1/me', $token)->assertOk();
    }

    public function test_wrong_password_and_suspended_login_fail_without_tokens(): void
    {
        $user = User::factory()->create(['account_status' => 'SUSPENDED']);
        $this->browser('GET', '/sanctum/csrf-cookie');
        $this->browser('POST', '/login', ['email' => $user->email, 'password' => 'wrong'])->assertUnprocessable();
        $this->browser('POST', '/login', ['email' => $user->email, 'password' => 'password'])->assertUnprocessable();
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_profile_updates_only_current_verified_user_contact_fields(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $this->login($user)->assertOk();
        $this->browser('PATCH', '/api/v1/profile', ['name' => 'Updated', 'phone' => '+84 901234567'])->assertOk()->assertJsonPath('data.name', 'Updated');
        $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'Updated', 'phone' => '+84 901234567']);
        $this->browser('PATCH', '/api/v1/profile', ['name' => 'Escalation', 'is_admin' => true, 'id' => $other->id, 'email_verified_at' => now()->toIso8601String()])->assertUnprocessable()->assertJsonValidationErrors(['is_admin', 'id', 'email_verified_at']);
        $this->assertDatabaseMissing('users', ['id' => $user->id, 'name' => 'Escalation']);
        $this->assertFalse($user->fresh()->is_admin);
    }

    public function test_api_token_create_list_and_revoke_are_scoped_and_plaintext_is_once(): void
    {
        $user = User::factory()->create();
        $this->login($user)->assertOk();
        $this->browser('POST', '/api/v1/account/api-tokens', ['name' => 'tool', 'abilities' => ['account:read']])->assertStatus(423);
        $this->confirmPassword();
        $created = $this->browser('POST', '/api/v1/account/api-tokens', ['name' => 'tool', 'abilities' => ['account:read'], 'expiry_days' => 7])->assertCreated();
        $secret = $created->json('plain_text_token');
        $id = $created->json('data.id');
        $this->assertStringContainsString('no-store', $created->headers->get('Cache-Control'));
        $stored = $user->tokens()->sole();
        $this->assertSame(hash('sha256', explode('|', $secret, 2)[1]), $stored->token);
        $this->assertSame($user->id, $stored->tokenable_id);
        $this->assertSame(['account:read'], $stored->abilities);
        $this->assertSame(7, (int) $stored->created_at->diffInDays($stored->expires_at));
        $list = $this->browser('GET', '/api/v1/account/api-tokens')->assertOk();
        $this->assertStringNotContainsString($secret, $list->getContent());
        $this->assertStringNotContainsString($stored->token, $list->getContent());
        $this->bearer('GET', '/api/v1/me', $secret)->assertOk();
        $this->browser('DELETE', '/api/v1/account/api-tokens/'.$id)->assertNoContent();
        $this->bearer('GET', '/api/v1/me', $secret)->assertUnauthorized();
        $this->assertDatabaseHas('audit_logs', ['entity_id' => $user->id, 'action' => 'api_token.created']);
        $this->assertDatabaseHas('audit_logs', ['entity_id' => $user->id, 'action' => 'api_token.revoked']);
        $audit = json_encode(DB::table('audit_logs')->get());
        $this->assertStringNotContainsString($secret, $audit);
        $this->assertStringNotContainsString($stored->token, $audit);
    }

    public function test_invalid_scopes_empty_name_and_invalid_expiry_never_issue_tokens(): void
    {
        $this->login(User::factory()->create())->assertOk();
        $this->confirmPassword();
        foreach ([['name' => '', 'abilities' => []], ['name' => str_repeat('a', 101), 'abilities' => ['*']], ['name' => 'tool', 'abilities' => ['admin'], 'expiry_days' => 365], ['name' => 'tool', 'abilities' => ['account:read', 'account:read']]] as $body) {
            $this->browser('POST', '/api/v1/account/api-tokens', $body)->assertUnprocessable();
        }
        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->assertDatabaseCount('audit_logs', 0);
    }

    public function test_foreign_token_id_cannot_be_revoked_and_stale_confirmation_is_rejected(): void
    {
        $other = User::factory()->create();
        $token = $other->createToken('foreign', ['account:read'], now()->addDay());
        $this->login(User::factory()->create())->assertOk();
        $this->confirmPassword();
        $list = $this->browser('GET', '/api/v1/account/api-tokens')->assertOk();
        $this->assertSame([], $list->json('data'));
        $this->browser('DELETE', '/api/v1/account/api-tokens/'.$token->accessToken->id)->assertNotFound();
        $this->travel(16)->minutes();
        $this->browser('DELETE', '/api/v1/account/api-tokens/'.$token->accessToken->id)->assertStatus(423);
        $this->assertDatabaseHas('personal_access_tokens', ['id' => $token->accessToken->id]);
        $this->assertDatabaseCount('audit_logs', 0);
    }

    public function test_expired_database_session_requires_fresh_login(): void
    {
        $user = User::factory()->create();
        $this->login($user)->assertOk();
        DB::table('sessions')->where('user_id', $user->id)->update(['last_activity' => now()->subMinutes(config('session.lifetime') + 1)->timestamp]);
        $this->browser('GET', '/api/v1/me')->assertUnauthorized();
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
