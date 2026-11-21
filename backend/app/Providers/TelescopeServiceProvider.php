<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Laravel\Telescope\EntryType;
use Laravel\Telescope\IncomingEntry;
use Laravel\Telescope\Telescope;
use Laravel\Telescope\TelescopeApplicationServiceProvider;

class TelescopeServiceProvider extends TelescopeApplicationServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        Telescope::night();

        $this->hideSensitiveRequestDetails();

        $isLocal = $this->app->environment('local');

        Telescope::filter(function (IncomingEntry $entry) use ($isLocal) {
            // Never persist auth/session SQL — QueryWatcher interpolates bindings into SQL.
            if ($entry->type === EntryType::QUERY && $this->isSensitiveQuery($entry)) {
                return false;
            }

            if (! $isLocal) {
                if ($entry->type === EntryType::MAIL) {
                    return false;
                }

                if ($entry->type === EntryType::REQUEST && preg_match(
                    '#^/(login|logout|register|email/|user/|api/v1/me(?:\?|$))#',
                    (string) ($entry->content['uri'] ?? ''),
                ) === 1) {
                    return false;
                }

                if ($entry->type === EntryType::MODEL && preg_match(
                    '/^(App\\\\Models\\\\User|Laravel\\\\Sanctum\\\\PersonalAccessToken):/',
                    (string) ($entry->content['model'] ?? ''),
                ) === 1) {
                    return false;
                }
            }

            return $isLocal ||
                $entry->isReportableException() ||
                $entry->isFailedRequest() ||
                $entry->isFailedJob() ||
                $entry->isScheduledTask() ||
                $entry->hasMonitoredTag();
        });

        // Strip interpolated string literals from recorded SQL so bindings cannot leak.
        Telescope::afterRecording(function ($telescope, IncomingEntry $entry): void {
            if ($entry->type !== EntryType::QUERY) {
                return;
            }

            $sql = (string) ($entry->content['sql'] ?? '');
            $entry->content['bindings'] = [];
            $entry->content['sql'] = preg_replace(
                "/'(?:[^'\\\\]|\\\\.)*'/",
                "'?'",
                $sql,
            ) ?? $sql;
        });
    }

    /**
     * Prevent sensitive request/response details from being logged by Telescope.
     */
    protected function hideSensitiveRequestDetails(): void
    {
        Telescope::hideRequestParameters([
            '_token',
            'password',
            'password_confirmation',
            'current_password',
            'email',
            'signature',
            'token',
            'plainTextToken',
            'remember_token',
            'two_factor_secret',
            'two_factor_recovery_codes',
        ]);

        Telescope::hideRequestHeaders([
            'authorization',
            'cookie',
            'set-cookie',
            'x-csrf-token',
            'x-xsrf-token',
        ]);

        Telescope::hideResponseParameters([
            'token',
            'plainTextToken',
            'access_token',
            'password',
            'password_confirmation',
            'current_password',
            'remember_token',
            'two_factor_secret',
            'two_factor_recovery_codes',
            'email',
            'signature',
        ]);
    }

    /**
     * Register the Telescope gate.
     *
     * Aligns with EnsureAdminSession: admin + ACTIVE + verified email.
     */
    protected function gate(): void
    {
        Gate::define('viewTelescope', function (User $user): bool {
            return $user->isAdmin()
                && $user->account_status === 'ACTIVE'
                && $user->hasVerifiedEmail();
        });
    }

    private function isSensitiveQuery(IncomingEntry $entry): bool
    {
        return preg_match(
            '/\b(users|sessions|personal_access_tokens|password_reset_tokens)\b/i',
            (string) ($entry->content['sql'] ?? ''),
        ) === 1;
    }
}
