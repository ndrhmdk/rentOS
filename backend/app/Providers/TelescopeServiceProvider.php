<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Laravel\Telescope\IncomingEntry;
use Laravel\Telescope\Telescope;
use Laravel\Telescope\TelescopeApplicationServiceProvider;

class TelescopeServiceProvider extends TelescopeApplicationServiceProvider
{
    public function register(): void
    {
        Telescope::hideRequestParameters(['_token', 'token', 'password', 'password_confirmation', 'current_password', 'plain_text_token']);
        Telescope::hideRequestHeaders(['authorization', 'cookie', 'set-cookie', 'x-csrf-token', 'x-xsrf-token']);
        Telescope::hideResponseParameters(['plain_text_token', 'token', 'password', 'remember_token']);
        // Diagnostics remain opt-in, with no credential-bearing request/query/mail payload storage.
        Telescope::filter(fn (IncomingEntry $entry): bool => $entry->isRequest() && in_array($entry->content['uri'] ?? '', ['/api/health', '/up'], true));
    }

    protected function authorization(): void
    {
        $this->gate();
        Telescope::auth(function ($request): bool {
            $user = Auth::guard('web')->user()?->fresh();

            return $user && $request->hasSession()
                && $request->session()->get('identity.credential_version') === $user->credential_version
                && Gate::forUser($user)->allows('viewTelescope');
        });
    }

    protected function gate(): void
    {
        Gate::define('viewTelescope', fn (User $user): bool => ! app()->isProduction() && $user->can('access-admin'));
    }
}
