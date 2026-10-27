<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\UpdateUserPassword;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Fortify::createUsersUsing(CreateNewUser::class);
        Fortify::updateUserPasswordsUsing(UpdateUserPassword::class);

        Fortify::authenticateUsing(function (Request $request): ?User {
            $email = mb_strtolower(trim((string) $request->input('email')));
            $user = User::query()->where('email', $email)->where('account_status', 'ACTIVE')->first();

            return $user && Hash::check((string) $request->input('password'), $user->password)
                ? $user
                : null;
        });

        RateLimiter::for('login', function (Request $request): Limit {
            $email = $request->input('email');
            $throttleKey = Str::transliterate(mb_strtolower(is_string($email) ? trim($email) : '').'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });

    }
}
