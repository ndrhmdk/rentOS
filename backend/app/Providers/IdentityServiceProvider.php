<?php

namespace App\Providers;

use App\Actions\Identity\ChangeAccountPassword;
use App\Actions\Identity\CreateAccount;
use App\Actions\Identity\ResetAccountPassword;
use App\Http\Responses\FrontendVerificationResponse;
use App\Http\Responses\GenericResetLinkResponse;
use App\Http\Responses\PasswordChangedResponse;
use App\Models\User;
use App\Support\FrontendUrl;
use App\Support\IdentityOpenApi;
use Dedoc\Scramble\Scramble;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Fortify\Contracts\FailedPasswordResetLinkRequestResponse;
use Laravel\Fortify\Contracts\PasswordUpdateResponse;
use Laravel\Fortify\Contracts\SuccessfulPasswordResetLinkRequestResponse;
use Laravel\Fortify\Contracts\VerifyEmailResponse;
use Laravel\Fortify\Fortify;
use Laravel\Sanctum\Sanctum;

class IdentityServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(FailedPasswordResetLinkRequestResponse::class, GenericResetLinkResponse::class);
        $this->app->bind(SuccessfulPasswordResetLinkRequestResponse::class, GenericResetLinkResponse::class);
        $this->app->bind(VerifyEmailResponse::class, FrontendVerificationResponse::class);
        $this->app->bind(PasswordUpdateResponse::class, PasswordChangedResponse::class);
    }

    public function boot(): void
    {
        Scramble::afterOpenApiGenerated(new IdentityOpenApi);
        Fortify::createUsersUsing(CreateAccount::class);
        Fortify::resetUserPasswordsUsing(ResetAccountPassword::class);
        Fortify::updateUserPasswordsUsing(ChangeAccountPassword::class);
        Fortify::authenticateUsing(function (Request $request): ?User {
            $user = User::query()->where('email', $request->input('email'))->first();

            return $user && Hash::check($request->input('password'), $user->password) && $user->account_status === 'ACTIVE' ? $user : null;
        });
        Event::listen(Login::class, function (Login $event): void {
            if ($event->guard === 'web' && request()->hasSession()) {
                request()->session()->put('identity.credential_version', $event->user->credential_version ?? 1);
                request()->session()->forget('auth.password_confirmed_at');
            }
        });
        Gate::define('access-admin', function (User $user): bool {
            $current = $user->fresh();

            return $current && $current->is_admin && $current->account_status === 'ACTIVE' && $current->hasVerifiedEmail();
        });
        // No global Gate::before admin bypass: every resource still needs its own Policy.
        Sanctum::authenticateAccessTokensUsing(fn ($token, bool $valid): bool => $valid && $token->expires_at !== null && $token->expires_at->isFuture() && $token->tokenable_type === User::class);
        ResetPassword::createUrlUsing(fn (User $user, string $token): string => FrontendUrl::make('/reset-password').'?'.http_build_query(['token' => $token, 'email' => $user->email]));
        RateLimiter::for('login', fn (Request $request): Limit => Limit::perMinute(5)->by(hash('sha256', $request->input('email').'|'.$request->ip())));
        RateLimiter::for('verification', fn (Request $request): Limit => Limit::perMinute(6)->by($request->user()?->id ?? $request->ip()));
        RateLimiter::for('account-security', fn (Request $request): Limit => Limit::perMinute(10)->by($request->user()?->id ?? $request->ip()));
        RateLimiter::for('auth-forms', fn (Request $request): Limit => Limit::perMinute(10)->by($request->ip()));
    }
}
