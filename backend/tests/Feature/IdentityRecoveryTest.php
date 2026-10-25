<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\URL;
use Tests\Support\IdentityTestCase;

class IdentityRecoveryTest extends IdentityTestCase
{
    public function test_forgot_password_is_generic_for_known_unknown_and_throttled_emails(): void
    {
        $user = User::factory()->create();
        $this->browser('GET', '/sanctum/csrf-cookie');
        $known = $this->browser('POST', '/forgot-password', ['email' => $user->email])->assertOk();
        $unknown = $this->browser('POST', '/forgot-password', ['email' => 'unknown@example.com'])->assertOk();
        $again = $this->browser('POST', '/forgot-password', ['email' => $user->email])->assertOk();
        $this->assertSame($known->json(), $unknown->json());
        $this->assertSame($known->json(), $again->json());
        Notification::assertSentToTimes($user, ResetPassword::class, 1);
    }

    public function test_valid_guest_reset_consumes_link_and_revokes_all_credentials_without_existing_login(): void
    {
        $user = User::factory()->create();
        $pat = $user->createToken('read', ['account:read'], now()->addDay());
        $oldRemember = $user->remember_token;
        $this->login($user)->assertOk();
        $oldJar = $this->jar;
        $this->jar = [];
        $reset = Password::broker()->createToken($user);
        $this->assertNotSame($reset, DB::table('password_reset_tokens')->where('email', $user->email)->value('token'));
        $this->browser('GET', '/sanctum/csrf-cookie');
        $body = ['email' => $user->email, 'token' => $reset, 'password' => 'ChangedPassword123', 'password_confirmation' => 'ChangedPassword123'];
        $this->browser('POST', '/reset-password', $body)->assertOk();
        $this->assertTrue(Hash::check('ChangedPassword123', $user->fresh()->password));
        $this->assertNotSame($oldRemember, $user->fresh()->remember_token);
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => $user->email]);
        $this->assertDatabaseMissing('sessions', ['user_id' => $user->id]);
        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->browser('POST', '/reset-password', $body)->assertUnprocessable();
        $this->jar = $oldJar;
        $this->browser('GET', '/api/v1/me')->assertUnauthorized();
        $this->bearer('GET', '/api/v1/me', $pat->plainTextToken)->assertUnauthorized();
    }

    public function test_change_password_revokes_current_and_other_sessions_and_requires_fresh_login(): void
    {
        $user = User::factory()->create();
        $user->createToken('read', ['account:read'], now()->addDay());
        $this->login($user)->assertOk();
        $firstJar = $this->jar;
        $this->login($user)->assertOk();
        $this->browser('PUT', '/user/password', ['current_password' => 'wrong', 'password' => 'ChangedPassword123', 'password_confirmation' => 'ChangedPassword123'])->assertUnprocessable();
        $this->browser('PUT', '/user/password', ['current_password' => 'password', 'password' => 'ChangedPassword123', 'password_confirmation' => 'ChangedPassword123'])->assertOk();
        $this->assertDatabaseMissing('sessions', ['user_id' => $user->id]);
        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->browser('GET', '/api/v1/me')->assertUnauthorized();
        $this->jar = $firstJar;
        $this->browser('GET', '/api/v1/me')->assertUnauthorized();
    }

    public function test_verification_is_signed_bound_to_current_user_and_ignores_external_redirect(): void
    {
        $user = User::factory()->unverified()->create();
        $other = User::factory()->unverified()->create();
        $this->login($user)->assertOk();
        $this->browser('POST', '/email/verification-notification')->assertStatus(202);
        Notification::assertSentTo($user, VerifyEmail::class);
        $foreign = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), ['id' => $other->id, 'hash' => sha1($other->email)]);
        $this->browser('GET', $foreign)->assertForbidden();
        $valid = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), ['id' => $user->id, 'hash' => sha1($user->email)]);
        $this->browser('GET', $valid.'&return_url=https://evil.example')->assertForbidden();
        $this->browser('GET', $valid)->assertNoContent();
        $this->browser('GET', $valid)->assertNoContent();
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        $this->assertFalse($other->fresh()->hasVerifiedEmail());
    }

    public function test_expired_reset_and_verification_links_do_not_change_account(): void
    {
        $user = User::factory()->unverified()->create();
        $reset = Password::broker()->createToken($user);
        $link = URL::temporarySignedRoute('verification.verify', now()->addMinute(), ['id' => $user->id, 'hash' => sha1($user->email)]);
        $this->travel(61)->minutes();
        $this->browser('GET', '/sanctum/csrf-cookie');
        $this->browser('POST', '/reset-password', ['email' => $user->email, 'token' => $reset, 'password' => 'ChangedPassword123', 'password_confirmation' => 'ChangedPassword123'])->assertUnprocessable();
        $this->login($user)->assertOk();
        $this->browser('GET', $link)->assertForbidden();
        $this->assertTrue(Hash::check('password', $user->fresh()->password));
        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }
}
