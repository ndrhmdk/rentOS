<?php

namespace App\Providers;

use App\Monitoring\ReferenceId;
use App\Notifications\DomainMailer;
use App\Notifications\LogDomainMailer;
use App\Notifications\ResendDomainMailer;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\LazyLoadingViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use InvalidArgumentException;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(DomainMailer::class, function ($app): DomainMailer {
            $mailer = (string) config('notifications.mailer');

            return match ($mailer) {
                'resend' => $app->make(ResendDomainMailer::class),
                'log' => $app->make(LogDomainMailer::class),
                default => throw new InvalidArgumentException('Unknown notification mailer ['.$mailer.'].'),
            };
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();
        $this->configureEloquentStrictness();
    }

    /**
     * Catch N+1 queries and attribute mistakes before they reach production.
     *
     * Outside production every violation throws. In production lazy loading is
     * still detected, but logged as `ops.lazy_loading` instead of failing the
     * request, so the slow-query and lazy-loading monitors run side by side.
     */
    private function configureEloquentStrictness(): void
    {
        $isProduction = $this->app->isProduction();

        Model::preventLazyLoading();
        Model::handleLazyLoadingViolationUsing(function (Model $model, string $relation) use ($isProduction): void {
            if (! $isProduction) {
                throw new LazyLoadingViolationException($model, $relation);
            }

            Log::warning('ops.lazy_loading', [
                'model' => $model::class,
                'relation' => $relation,
                'reference' => ReferenceId::current(),
            ]);
        });
        Model::preventSilentlyDiscardingAttributes(! $isProduction);
        Model::preventAccessingMissingAttributes(! $isProduction);
    }

    private function configureRateLimiting(): void
    {
        RateLimiter::for('public-api', function (Request $request): Limit {
            return Limit::perMinute(60)
                ->by($request->ip() ?? 'unknown')
                ->response($this->tooManyRequestsResponse());
        });

        RateLimiter::for('api', function (Request $request): Limit {
            $user = $request->user();
            $token = $user?->currentAccessToken();

            if ($token instanceof PersonalAccessToken) {
                return Limit::perMinute(60)
                    ->by('token:'.$token->id)
                    ->response($this->tooManyRequestsResponse());
            }

            if ($user !== null) {
                return Limit::perMinute(120)
                    ->by('user:'.$user->id)
                    ->response($this->tooManyRequestsResponse());
            }

            return Limit::perMinute(60)
                ->by($request->ip() ?? 'unknown')
                ->response($this->tooManyRequestsResponse());
        });

        RateLimiter::for('token-create', function (Request $request): Limit {
            $userId = $request->user()?->getAuthIdentifier() ?? $request->ip() ?? 'unknown';

            return Limit::perMinute(5)
                ->by('token-create:'.$userId)
                ->response($this->tooManyRequestsResponse());
        });
    }

    /**
     * @return callable(Request, array<string, string>): Response
     */
    private function tooManyRequestsResponse(): callable
    {
        return function (Request $request, array $headers): Response {
            return response()->json([
                'message' => 'Bạn thao tác quá nhanh. Vui lòng chờ rồi thử lại.',
            ], 429, $headers);
        };
    }
}
