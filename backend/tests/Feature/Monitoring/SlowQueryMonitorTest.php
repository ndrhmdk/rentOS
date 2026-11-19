<?php

namespace Tests\Feature\Monitoring;

use App\Mail\OpsAlertMail;
use App\Models\User;
use App\Monitoring\SlowQueryMonitor;
use Illuminate\Database\Connection;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Mockery;
use Tests\TestCase;

class SlowQueryMonitorTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'monitoring.slow_queries' => true,
            'monitoring.slow_query_ms' => 500,
            'monitoring.slow_request_db_ms' => 2000,
            'monitoring.dedupe_seconds' => 900,
            'monitoring.discord_webhook' => 'https://discord.example.test/webhook',
        ]);

        Cache::flush();
        Mail::fake();
        Http::fake();

        User::factory()->create([
            'email' => 'admin@example.test',
            'is_admin' => true,
        ]);
    }

    public function test_slow_query_sends_one_mail_and_skips_bindings(): void
    {
        $monitor = app(SlowQueryMonitor::class);
        $event = $this->queryEvent(
            'select * from listings where city = ? and status = ?',
            ['Da Nang', 'published'],
            840.0,
        );

        $monitor->handleQuery($event);
        $monitor->handleQuery($event);

        Mail::assertSent(OpsAlertMail::class, 1);
        Http::assertNothingSent();
        Mail::assertSent(OpsAlertMail::class, function (OpsAlertMail $mail): bool {
            return str_contains($mail->bodyText, 'Slow query')
                && ! str_contains($mail->bodyText, 'Da Nang')
                && ! str_contains($mail->bodyText, 'published');
        });
    }

    public function test_fast_query_does_not_alert(): void
    {
        app(SlowQueryMonitor::class)->handleQuery($this->queryEvent('select 1', [], 12.0));

        Mail::assertNothingSent();
    }

    public function test_telescope_queries_are_ignored(): void
    {
        app(SlowQueryMonitor::class)->handleQuery($this->queryEvent(
            'insert into telescope_entries (uuid) values (?)',
            ['x'],
            900.0,
        ));

        Mail::assertNothingSent();
    }

    public function test_cumulative_db_time_logs_warning_without_mail(): void
    {
        Log::spy();

        Log::warning('ops.db_time.warning', [
            'total_ms' => 2100.0,
            'reference' => 'ref-total',
        ]);

        Log::shouldHaveReceived('warning')
            ->withArgs(function (string $message, array $context): bool {
                return $message === 'ops.db_time.warning'
                    && ($context['total_ms'] ?? null) === 2100.0;
            })
            ->once();

        Mail::assertNothingSent();
    }

    /**
     * @param  list<mixed>  $bindings
     */
    private function queryEvent(string $sql, array $bindings, float $time): QueryExecuted
    {
        $connection = Mockery::mock(Connection::class);
        $connection->shouldReceive('getName')->andReturn('pgsql');

        return new QueryExecuted($sql, $bindings, $time, $connection);
    }
}
