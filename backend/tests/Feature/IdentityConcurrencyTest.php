<?php

namespace Tests\Feature;

use App\Actions\Identity\CreateAccount;
use App\Actions\Identity\ResetAccountPassword;
use App\Http\Middleware\AtomicPasswordReset;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Concurrency;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class IdentityConcurrencyTest extends TestCase
{
    use DatabaseMigrations;

    public function test_two_processes_registering_the_same_email_create_only_one_account(): void
    {
        $input = ['name' => 'Concurrent account', 'email' => 'concurrent@example.com', 'password' => 'StrongPassword123', 'password_confirmation' => 'StrongPassword123'];
        $register = static function () use ($input): string {
            try {
                app(CreateAccount::class)->create($input);

                return 'created';
            } catch (ValidationException) {
                return 'rejected';
            }
        };
        $results = Concurrency::driver('process')->run([$register, $register]);
        sort($results);
        $this->assertSame(['created', 'rejected'], $results);
        $this->assertDatabaseCount('users', 1);
        $this->assertFalse(User::sole()->is_admin);
        $this->assertTrue(Hash::check('StrongPassword123', User::sole()->password));
    }

    public function test_concurrent_reset_redemptions_consume_one_link_and_revoke_credentials_once(): void
    {
        $user = User::factory()->create();
        $user->createToken('before reset', ['account:read'], now()->addDay());
        $input = ['email' => $user->email, 'token' => Password::broker()->createToken($user), 'password' => 'ChangedPassword123', 'password_confirmation' => 'ChangedPassword123'];
        $redeem = static function () use ($input): string {
            $request = Request::create('/reset-password', 'POST', $input);
            $response = app(AtomicPasswordReset::class)->handle($request, function () use ($input) {
                $status = Password::broker()->reset($input, function (User $account) use ($input): void {
                    app(ResetAccountPassword::class)->reset($account, $input);
                });

                return response($status);
            });

            return $response->getContent();
        };
        $results = Concurrency::driver('process')->run([$redeem, $redeem]);
        sort($results);
        $this->assertSame(['passwords.reset', 'passwords.token'], $results);
        $this->assertSame(2, $user->fresh()->credential_version);
        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->assertDatabaseCount('password_reset_tokens', 0);
        $this->assertDatabaseCount('audit_logs', 1);
    }
}
