<?php

namespace App\Monitoring;

use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;

final class SlowQueryMonitor
{
    public function __construct(private readonly OpsAlerter $alerter) {}

    public function register(): void
    {
        if (! (bool) config('monitoring.slow_queries', false)) {
            return;
        }

        DB::listen(function (QueryExecuted $query): void {
            $this->handleQuery($query);
        });

        DB::whenQueryingForLongerThan(
            (float) config('monitoring.slow_request_db_ms', 2000),
            function (): void {
                Log::warning('ops.db_time.warning', [
                    'total_ms' => DB::totalQueryDuration(),
                    'reference' => ReferenceId::current(),
                ]);
            },
        );
    }

    public function handleQuery(QueryExecuted $query): void
    {
        if ($this->shouldIgnore($query->sql)) {
            return;
        }

        $threshold = (float) config('monitoring.slow_query_ms', 500);
        if ($query->time < $threshold) {
            return;
        }

        $sql = $this->truncateSql($query->sql);
        $fingerprint = hash('sha256', $sql);
        $route = $this->routePattern();

        if (! Cache::add($fingerprint, true, (int) config('monitoring.dedupe_seconds', 900))) {
            Log::info('slow_query deduped: ');
            return;
        }

        Log::info('sql: '.$sql);
        Log::info('route: '.$route);

        // $this->alerter->report(
        //     kind: 'slow_query',
        //     errorCode: ErrorCode::SERVER_ERROR,
        //     summary: sprintf('Slow query %.2fms', $query->time),
        //     context: [
        //         'reference' => ReferenceId::current(),
        //         'duration_ms' => $query->time,
        //         'route' => $route,
        //         'fingerprint' => $fingerprint,
        //         'operation' => 'db.query',
        //     ],
        // );
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
