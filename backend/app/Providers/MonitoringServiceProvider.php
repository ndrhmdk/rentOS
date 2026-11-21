<?php

namespace App\Providers;

use App\Jobs\SendOpsDiscordAlert;
use App\Monitoring\ErrorCode;
use App\Monitoring\OpsAlerter;
use App\Monitoring\QueryStats;
use App\Monitoring\ReferenceId;
use App\Monitoring\SlowQueryMonitor;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Queue\Events\JobProcessed;
use Illuminate\Queue\Events\JobProcessing;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class MonitoringServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(OpsAlerter::class);
        $this->app->singleton(SlowQueryMonitor::class);
        $this->app->scoped(QueryStats::class, fn () => new QueryStats);
    }

    public function boot(): void
    {
        $this->app->make(SlowQueryMonitor::class)->register();

        Queue::before(function (JobProcessing $event): void {
            ReferenceId::assignForJob();

            if (! (bool) config('monitoring.slow_queries', false)) {
                return;
            }

            DB::resetTotalQueryDuration();
            DB::allowQueryDurationHandlersToRunAgain();
        });

        Queue::after(function (JobProcessed $event): void {
            ReferenceId::clear();
        });

        Queue::failing(function (JobFailed $event): void {
            $jobName = $event->job->resolveName();

            // Never re-enter OpsAlerter for the Discord delivery job itself —
            // that would queue another SendOpsDiscordAlert and loop.
            if ($jobName === SendOpsDiscordAlert::class
                || str_ends_with($jobName, '\\SendOpsDiscordAlert')) {
                Log::critical('ops.alert.fallback', [
                    'channel' => 'discord',
                    'kind' => 'critical',
                    'error_code' => ErrorCode::SERVER_ERROR,
                    'reference' => ReferenceId::current(),
                    'job' => $jobName,
                    'reason' => 'discord_alert_job_exhausted',
                ]);
                ReferenceId::clear();

                return;
            }

            $this->app->make(OpsAlerter::class)->report(
                kind: 'critical',
                errorCode: ErrorCode::SERVER_ERROR,
                summary: 'Queue job exhausted retries',
                context: [
                    'reference' => ReferenceId::current(),
                    'job' => $jobName,
                    'operation' => 'queue.failing',
                ],
            );

            ReferenceId::clear();
        });
    }

    public static function shouldReport(Throwable $throwable): bool
    {
        if ($throwable instanceof ValidationException
            || $throwable instanceof AuthenticationException
            || $throwable instanceof AuthorizationException
            || $throwable instanceof ModelNotFoundException) {
            return false;
        }

        if ($throwable instanceof HttpExceptionInterface) {
            $status = $throwable->getStatusCode();

            return $status >= 500;
        }

        return true;
    }
}
