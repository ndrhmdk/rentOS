<?php

namespace Tests\Feature\Monitoring;

use App\Jobs\SendOpsDiscordAlert;
use App\Mail\OpsAlertMail;
use App\Models\User;
use App\Monitoring\QueryStats;
use App\Monitoring\SlowQueryMonitor;
use Illuminate\Database\Connection;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
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
            'monitoring.slow_query_ms' => 1000,
            'monitoring.slow_query_critical_ms' => 5000,
            'monitoring.slow_query_discord_count' => 3,
            'monitoring.slow_query_discord_window_seconds' => 300,
            'monitoring.slow_request_db_ms' => 2000,
            'monitoring.db_time_discord_count' => 5,
            'monitoring.db_time_discord_window_seconds' => 600,
            'monitoring.dedupe_seconds' => 600,
            'monitoring.discord_webhook' => 'https://discord.example.test/webhook',
        ]);

        Cache::flush();
        Mail::fake();
        Queue::fake();

        User::factory()->create([
            'email' => 'admin@example.test',
            'is_admin' => true,
        ]);
    }

    public function test_fast_query_does_not_alert(): void
    {
        app(SlowQueryMonitor::class)->handleQuery($this->queryEvent('select 1', [], 12.0));

        Mail::assertNothingSent();
        Queue::assertNothingPushed();
    }

    public function test_slow_query_below_critical_logs_only_until_count_reaches_three(): void
    {
        Log::spy();
        $monitor = app(SlowQueryMonitor::class);
        $sql = 'select * from listings where city = ? and status = ?';

        $monitor->handleQuery($this->queryEvent($sql, ['Da Nang', 'published'], 1200.0));
        $monitor->handleQuery($this->queryEvent($sql, ['Hue', 'published'], 1300.0));

        Mail::assertNothingSent();
        Queue::assertNothingPushed();

        $monitor->handleQuery($this->queryEvent($sql, ['Hanoi', 'draft'], 1400.0));

        Mail::assertNothingSent();
        Queue::assertPushed(SendOpsDiscordAlert::class, 1);

        Log::shouldHaveReceived('warning')
            ->withArgs(fn (string $message, array $context): bool => $message === 'ops.slow_query'
                && ! str_contains((string) ($context['sql'] ?? ''), 'Da Nang'))
            ->atLeast()
            ->once();
    }

    public function test_same_sql_template_shares_fingerprint_across_bindings(): void
    {
        $monitor = app(SlowQueryMonitor::class);
        $sql = 'select * from units where id = ?';

        $monitor->handleQuery($this->queryEvent($sql, [101], 1100.0));
        $monitor->handleQuery($this->queryEvent($sql, [102], 1100.0));
        $monitor->handleQuery($this->queryEvent($sql, [103], 1100.0));

        Queue::assertPushed(SendOpsDiscordAlert::class, 1);

        $monitor->handleQuery($this->queryEvent($sql, [104], 1100.0));
        Queue::assertPushed(SendOpsDiscordAlert::class, 1);
    }

    public function test_critical_slow_query_emails_and_queues_discord_once_per_cooldown(): void
    {
        $monitor = app(SlowQueryMonitor::class);
        $event = $this->queryEvent(
            'select * from listings where city = ? and status = ?',
            ['Da Nang', 'published'],
            5200.0,
        );

        $monitor->handleQuery($event);
        $monitor->handleQuery($event);

        Mail::assertSent(OpsAlertMail::class, 1);
        Mail::assertSent(OpsAlertMail::class, function (OpsAlertMail $mail): bool {
            return $mail->kind === 'slow_query_critical'
                && str_contains($mail->summary, 'Critical slow query')
                && ! str_contains($mail->bodyText, 'Da Nang')
                && ! str_contains($mail->bodyText, 'published');
        });
        Queue::assertPushed(SendOpsDiscordAlert::class, 1);
    }

    public function test_telescope_queries_are_ignored(): void
    {
        app(SlowQueryMonitor::class)->handleQuery($this->queryEvent(
            'insert into telescope_entries (uuid) values (?)',
            ['x'],
            9000.0,
        ));

        Mail::assertNothingSent();
        Queue::assertNothingPushed();
    }

    public function test_cumulative_db_time_logs_every_breach_and_alerts_on_fifth(): void
    {
        Log::spy();
        $monitor = app(SlowQueryMonitor::class);
        $stats = app(QueryStats::class);

        $stats->record($this->queryEvent('select * from tenancies where unit_id = ?', [1], 25.0));
        $stats->record($this->queryEvent('select * from tenancies where unit_id = ?', [2], 25.0));

        for ($i = 0; $i < 4; $i++) {
            $monitor->handleCumulativeDbTime(2100.0 + $i);
        }

        Mail::assertNothingSent();
        Queue::assertNothingPushed();

        $monitor->handleCumulativeDbTime(2500.0);

        Mail::assertSent(OpsAlertMail::class, 1);
        Mail::assertSent(OpsAlertMail::class, function (OpsAlertMail $mail): bool {
            return $mail->kind === 'db_time'
                && ($mail->context['query_count'] ?? null) === 2
                && $mail->topPatterns !== [];
        });
        Queue::assertPushed(SendOpsDiscordAlert::class, 1);

        Log::shouldHaveReceived('warning')
            ->withArgs(fn (string $message, array $context): bool => $message === 'ops.db_time.warning'
                && array_key_exists('query_count', $context)
                && array_key_exists('top_patterns', $context))
            ->atLeast()
            ->once();

        $monitor->handleCumulativeDbTime(2600.0);
        Mail::assertSent(OpsAlertMail::class, 1);
        Queue::assertPushed(SendOpsDiscordAlert::class, 1);
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
