<?php

namespace Tests\Feature\Monitoring;

use App\Jobs\SendOpsDiscordAlert;
use App\Mail\OpsAlertMail;
use App\Models\User;
use App\Monitoring\ErrorCode;
use App\Monitoring\OpsAlerter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Mockery;
use ReflectionMethod;
use RuntimeException;
use Tests\TestCase;

class OpsAlerterTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'monitoring.dedupe_seconds' => 600,
            'monitoring.discord_webhook' => 'https://discord.example.test/webhook',
            'monitoring.ops_alert_email' => '',
        ]);

        Cache::flush();
        Queue::fake();
    }

    public function test_critical_alert_posts_discord_without_email(): void
    {
        Mail::fake();

        User::factory()->create([
            'email' => 'admin@example.test',
            'is_admin' => true,
        ]);
        User::factory()->create([
            'email' => 'tenant@example.test',
            'is_admin' => false,
        ]);

        $alerter = app(OpsAlerter::class);

        $alerter->report('critical', ErrorCode::STORAGE_FAILED, 'Application failure', [
            'reference' => 'ref-1',
            'route' => 'POST listings/{listing}/photos',
        ]);
        $alerter->report('critical', ErrorCode::STORAGE_FAILED, 'Application failure', [
            'reference' => 'ref-2',
            'route' => 'POST listings/{listing}/photos',
        ]);

        Mail::assertNothingSent();
        Queue::assertPushed(SendOpsDiscordAlert::class, 1);
        Queue::assertPushed(SendOpsDiscordAlert::class, function (SendOpsDiscordAlert $job): bool {
            return str_contains($job->content, 'storage_failed')
                && str_contains($job->content, 'ref-1')
                && ! str_contains($job->content, 'password');
        });
    }

    public function test_different_error_code_on_same_route_sends_again(): void
    {
        Mail::fake();

        User::factory()->create([
            'email' => 'admin@example.test',
            'is_admin' => true,
        ]);

        $alerter = app(OpsAlerter::class);
        $alerter->report('critical', ErrorCode::STORAGE_FAILED, 'A', [
            'reference' => 'ref-a',
            'route' => 'POST listings/{listing}/photos',
        ]);
        $alerter->report('critical', ErrorCode::SERVER_ERROR, 'B', [
            'reference' => 'ref-b',
            'route' => 'POST listings/{listing}/photos',
        ]);

        Mail::assertNothingSent();
        Queue::assertPushed(SendOpsDiscordAlert::class, 2);
    }

    public function test_slow_query_escalation_queues_discord_without_email(): void
    {
        Mail::fake();

        User::factory()->create([
            'email' => 'admin@example.test',
            'is_admin' => true,
        ]);

        app(OpsAlerter::class)->report('slow_query', 'slow_query', 'Slow query repeated 3 times', [
            'reference' => 'ref-slow',
            'fingerprint' => 'abc',
            'duration_ms' => 1200,
        ]);

        Mail::assertNothingSent();
        Queue::assertPushed(SendOpsDiscordAlert::class, 1);
    }

    public function test_slow_query_critical_emails_admin_and_queues_discord(): void
    {
        Mail::fake();

        User::factory()->create([
            'email' => 'admin@example.test',
            'is_admin' => true,
        ]);

        app(OpsAlerter::class)->report('slow_query_critical', 'slow_query', 'Critical slow query 5200ms', [
            'reference' => 'ref-crit',
            'fingerprint' => 'fp-1',
            'duration_ms' => 5200,
            'sql' => 'select * from listings where id = ?',
        ]);

        Mail::assertSent(OpsAlertMail::class, 1);
        Mail::assertSent(OpsAlertMail::class, function (OpsAlertMail $mail): bool {
            return $mail->hasTo('admin@example.test')
                && $mail->kind === 'slow_query_critical'
                && str_contains($mail->bodyText, 'ref-crit');
        });
        Queue::assertPushed(SendOpsDiscordAlert::class, 1);
    }

    public function test_discord_sync_fallback_posts_webhook(): void
    {
        Http::fake([
            'discord.example.test/*' => Http::response(['ok' => true], 204),
        ]);

        $alerter = app(OpsAlerter::class);
        $method = new ReflectionMethod(OpsAlerter::class, 'deliverDiscordSynchronously');

        $method->invoke($alerter, 'rentOS critical `server_error` route=x reference=ref-sync', [
            'kind' => 'critical',
            'error_code' => ErrorCode::SERVER_ERROR,
            'reference' => 'ref-sync',
        ]);

        Http::assertSent(function ($request): bool {
            $body = $request->data();

            return $request->url() === 'https://discord.example.test/webhook'
                && str_contains((string) ($body['content'] ?? ''), 'ref-sync');
        });
    }

    public function test_discord_sync_fallback_logs_when_http_fails(): void
    {
        Http::fake([
            'discord.example.test/*' => Http::response('down', 500),
        ]);
        Log::spy();

        $alerter = app(OpsAlerter::class);
        $method = new ReflectionMethod(OpsAlerter::class, 'deliverDiscordSynchronously');

        $method->invoke($alerter, 'rentOS critical `server_error` route=x reference=ref-fail', [
            'kind' => 'critical',
            'error_code' => ErrorCode::SERVER_ERROR,
            'reference' => 'ref-fail',
        ]);

        Log::shouldHaveReceived('critical')
            ->withArgs(function (string $message, array $context): bool {
                return $message === 'ops.alert.fallback'
                    && ($context['channel'] ?? null) === 'discord'
                    && ($context['reason'] ?? null) === 'discord_enqueue_and_sync_failed'
                    && ($context['reference'] ?? null) === 'ref-fail';
            })
            ->atLeast()
            ->once();
    }

    public function test_mail_failure_writes_fallback_log_without_throwing(): void
    {
        User::factory()->create([
            'email' => 'admin@example.test',
            'is_admin' => true,
        ]);

        Log::spy();

        $pending = Mockery::mock();
        $pending->shouldReceive('send')->once()->andThrow(new RuntimeException('resend down'));
        Mail::shouldReceive('to')->once()->with('admin@example.test')->andReturn($pending);

        app(OpsAlerter::class)->report('slow_query_critical', 'slow_query', 'Critical slow query', [
            'reference' => 'ref-fallback',
            'fingerprint' => 'fp-mail',
            'route' => 'GET api/v1/boom',
        ]);

        Log::shouldHaveReceived('critical')
            ->withArgs(function (string $message, array $context): bool {
                return $message === 'ops.alert.fallback'
                    && ($context['channel'] ?? null) === 'mail'
                    && ($context['reference'] ?? null) === 'ref-fallback';
            })
            ->atLeast()
            ->once();
    }

    public function test_uses_ops_alert_email_when_admin_lookup_unavailable(): void
    {
        Mail::fake();
        config(['monitoring.ops_alert_email' => 'backup-admin@example.test']);

        app(OpsAlerter::class)->report('db_time', 'high_db_time', 'High DB time', [
            'reference' => 'ref-backup',
            'route' => 'GET api/v1/boom',
            'query_count' => 12,
            'total_ms' => 2400,
        ]);

        Mail::assertSent(OpsAlertMail::class, function (OpsAlertMail $mail): bool {
            return $mail->hasTo('backup-admin@example.test')
                && $mail->kind === 'db_time';
        });
    }

    public function test_redacts_disallowed_context_keys(): void
    {
        Mail::fake();

        User::factory()->create([
            'email' => 'admin@example.test',
            'is_admin' => true,
        ]);

        app(OpsAlerter::class)->report('slow_query_critical', 'slow_query', 'Critical slow query', [
            'reference' => 'ref-safe',
            'fingerprint' => 'fp-safe',
            'route' => 'GET api/v1/boom',
            'password' => 'hunter2',
            'Authorization' => 'Bearer secret',
            'signed_url' => 'https://example.test/file?signature=abc',
        ]);

        Mail::assertSent(OpsAlertMail::class, function (OpsAlertMail $mail): bool {
            return str_contains($mail->bodyText, 'ref-safe')
                && ! str_contains($mail->bodyText, 'hunter2')
                && ! str_contains($mail->bodyText, 'Bearer secret')
                && ! str_contains($mail->bodyText, 'signature=abc');
        });
    }
}
