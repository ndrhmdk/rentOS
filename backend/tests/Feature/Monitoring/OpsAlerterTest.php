<?php

namespace Tests\Feature\Monitoring;

use App\Mail\OpsAlertMail;
use App\Models\User;
use App\Monitoring\ErrorCode;
use App\Monitoring\OpsAlerter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class OpsAlerterTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'monitoring.dedupe_seconds' => 900,
            'monitoring.discord_webhook' => 'https://discord.example.test/webhook',
            'monitoring.ops_alert_email' => '',
        ]);

        Cache::flush();
        Http::fake([
            'discord.example.test/*' => Http::response(['ok' => true], 204),
        ]);
    }

    public function test_critical_alert_emails_admin_and_posts_discord_once(): void
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

        Mail::assertSent(OpsAlertMail::class, 1);
        Mail::assertSent(OpsAlertMail::class, function (OpsAlertMail $mail): bool {
            return $mail->hasTo('admin@example.test')
                && ! $mail->hasTo('tenant@example.test')
                && $mail->errorCode === ErrorCode::STORAGE_FAILED
                && str_contains($mail->bodyText, 'ref-1');
        });
        Http::assertSentCount(1);
        Http::assertSent(function ($request): bool {
            $body = $request->data();

            return $request->url() === 'https://discord.example.test/webhook'
                && str_contains((string) ($body['content'] ?? ''), 'storage_failed')
                && str_contains((string) ($body['content'] ?? ''), 'ref-1')
                && ! str_contains((string) ($body['content'] ?? ''), 'password');
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

        Mail::assertSent(OpsAlertMail::class, 2);
        Http::assertSentCount(2);
    }

    public function test_slow_query_does_not_post_discord(): void
    {
        Mail::fake();

        User::factory()->create([
            'email' => 'admin@example.test',
            'is_admin' => true,
        ]);

        app(OpsAlerter::class)->report('slow_query', ErrorCode::SERVER_ERROR, 'Slow query 800ms', [
            'reference' => 'ref-slow',
            'fingerprint' => 'abc',
            'duration_ms' => 800,
        ]);

        Mail::assertSent(OpsAlertMail::class, 1);
        Http::assertNothingSent();
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

        app(OpsAlerter::class)->report('critical', ErrorCode::SERVER_ERROR, 'Application failure', [
            'reference' => 'ref-fallback',
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

        app(OpsAlerter::class)->report('critical', ErrorCode::SERVER_ERROR, 'Application failure', [
            'reference' => 'ref-backup',
            'route' => 'GET api/v1/boom',
        ]);

        Mail::assertSent(OpsAlertMail::class, function (OpsAlertMail $mail): bool {
            return $mail->hasTo('backup-admin@example.test');
        });
    }

    public function test_redacts_disallowed_context_keys(): void
    {
        Mail::fake();

        User::factory()->create([
            'email' => 'admin@example.test',
            'is_admin' => true,
        ]);

        app(OpsAlerter::class)->report('critical', ErrorCode::SERVER_ERROR, 'Application failure', [
            'reference' => 'ref-safe',
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
