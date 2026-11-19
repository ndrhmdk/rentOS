<?php

namespace App\Monitoring;

use Illuminate\Database\Connection;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

final class SlowQueryMonitor
{
    public function __construct(private readonly OpsAlerter $alerter) {}

    public function register(): void
    {
        if (! (bool) config('monitoring.slow_queries', false)) {
            return;
        }

        DB::listen(function (QueryExecuted $query): void {
            if (! $this->shouldIgnore($query->sql)) {
                app(QueryStats::class)->record($query);
            }

            $this->handleQuery($query);
        });

        DB::whenQueryingForLongerThan(
            (float) config('monitoring.slow_request_db_ms', 2000),
            function (Connection $connection): void {
                $this->handleCumulativeDbTime($connection->totalQueryDuration());
            },
        );
    }

    public function handleQuery(QueryExecuted $query): void
    {
        if ($this->shouldIgnore($query->sql)) {
            return;
        }

        $threshold = (float) config('monitoring.slow_query_ms', 1000);
        if ($query->time < $threshold) {
            return;
        }

        $sql = $this->truncateSql($query->sql);
        $fingerprint = hash(
            'sha256',
            (string) $query->connectionName.':'.$sql
        );
        $route = $this->routePattern();

        Log::warning('ops.slow_query', [
            'fingerprint' => $fingerprint,
            'duration_ms' => $query->time,
            'sql' => $sql,
            'route' => $route,
            'reference' => ReferenceId::current(),
        ]);

        $criticalMs = (float) config('monitoring.slow_query_critical_ms', 5000);
        $context = [
            'reference' => ReferenceId::current(),
            'duration_ms' => $query->time,
            'route' => $route,
            'fingerprint' => $fingerprint,
            'sql' => $sql,
            'operation' => 'db.query',
        ];

        if ($query->time >= $criticalMs) {
            $this->alerter->report(
                kind: 'slow_query_critical',
                errorCode: 'slow_query',
                summary: sprintf('Critical slow query %.2fms', $query->time),
                context: $context,
            );

            return;
        }

        $count = $this->incrementWindowCounter(
            'ops:slow-count:'.$fingerprint,
            (int) config('monitoring.slow_query_discord_window_seconds', 300),
        );

        $escalateAt = (int) config('monitoring.slow_query_discord_count', 3);
        if ($count < $escalateAt) {
            return;
        }

        $this->alerter->report(
            kind: 'slow_query',
            errorCode: 'slow_query',
            summary: sprintf('Slow query repeated %d times (latest %.2fms)', $count, $query->time),
            context: [
                ...$context,
                'occurrence_count' => $count,
            ],
        );
    }

    public function handleCumulativeDbTime(float $totalMs): void
    {
        $stats = app(QueryStats::class);
        $route = $this->routePattern() ?? 'unknown';
        $topPatterns = $stats->topPatterns();

        Log::warning('ops.db_time.warning', [
            'total_ms' => $totalMs,
            'query_count' => $stats->count,
            'top_patterns' => $topPatterns,
            'route' => $route,
            'reference' => ReferenceId::current(),
        ]);

        $count = $this->incrementWindowCounter(
            'ops:db-time-count:'.hash('sha256', $route),
            (int) config('monitoring.db_time_discord_window_seconds', 600),
        );

        $escalateAt = (int) config('monitoring.db_time_discord_count', 5);
        if ($count < $escalateAt) {
            return;
        }

        $this->alerter->report(
            kind: 'db_time',
            errorCode: 'high_db_time',
            summary: sprintf(
                'High DB time %.2fms across %d queries (%d breaches on route)',
                $totalMs,
                $stats->count,
                $count,
            ),
            context: [
                'reference' => ReferenceId::current(),
                'total_ms' => $totalMs,
                'query_count' => $stats->count,
                'route' => $route,
                'operation' => 'db.request',
                'occurrence_count' => $count,
                'top_patterns' => $topPatterns,
            ],
        );
    }

    private function incrementWindowCounter(string $key, int $windowSeconds): int
    {
        Cache::add($key, 0, $windowSeconds);

        return (int) Cache::increment($key);
    }

    private function shouldIgnore(string $sql): bool
    {
        $normalized = strtolower(trim($sql));

        if ($normalized === '' || in_array($normalized, ['begin', 'commit', 'rollback', 'start transaction'], true)) {
            return true;
        }

        return str_contains($normalized, 'telescope_entries')
            || str_contains($normalized, 'schema_migrations');
    }

    private function truncateSql(string $sql): string
    {
        return Str::limit(preg_replace('/\s+/', ' ', trim($sql)) ?? $sql, 500, '');
    }

    private function routePattern(): ?string
    {
        $request = request();
        if ($request === null) {
            return null;
        }

        $route = $request->route();
        if ($route === null) {
            return strtoupper($request->method()).' /'.$request->path();
        }

        $uri = $route->uri();

        return strtoupper($request->method()).' '.$uri;
    }
}
