<?php

namespace App\Providers;

use App\Monitoring\ErrorCode;
use App\Monitoring\OpsAlerter;
use App\Monitoring\ReferenceId;
use App\Monitoring\SlowQueryMonitor;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Queue\Events\JobProcessing;
use Illuminate\Support\Facades\DB;
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
    }

    public function boot(): void
    {
        $this->app->make(SlowQueryMonitor::class)->register();

        Queue::before(function (JobProcessing $event): void {
            if (! (bool) config('monitoring.slow_queries', false)) {
                return;
            }

            DB::resetTotalQueryDuration();
            DB::allowQueryDurationHandlersToRunAgain();
        });

        Queue::failing(function (JobFailed $event): void {
            $this->app->make(OpsAlerter::class)->report(
                kind: 'critical',
                errorCode: ErrorCode::SERVER_ERROR,
                summary: 'Queue job exhausted retries',
                context: [
                    'reference' => ReferenceId::current(),
                    'job' => $event->job->resolveName(),
                    'operation' => 'queue.failing',
                ],
            );
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
