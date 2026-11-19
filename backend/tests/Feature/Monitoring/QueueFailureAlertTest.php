<?php

namespace Tests\Feature\Monitoring;

use App\Mail\OpsAlertMail;
use App\Models\User;
use App\Monitoring\ErrorCode;
use Illuminate\Contracts\Queue\Job as QueueJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class QueueFailureAlertTest extends TestCase
{
    use RefreshDatabase;

    public function test_exhausted_job_sends_critical_alert_without_notifications_row(): void
    {
        Mail::fake();
        Http::fake();
        Cache::flush();

        User::factory()->create([
            'email' => 'admin@example.test',
            'is_admin' => true,
        ]);

        config([
            'monitoring.discord_webhook' => 'https://discord.example.test/webhook',
            'monitoring.dedupe_seconds' => 900,
        ]);

        $job = Mockery::mock(QueueJob::class);
        $job->shouldReceive('resolveName')->andReturn('App\\Jobs\\DeliverNotification');

        Event::dispatch(new JobFailed(
            'database',
            $job,
            new RuntimeException('delivery exhausted'),
        ));

        Mail::assertSent(OpsAlertMail::class, function (OpsAlertMail $mail): bool {
            return $mail->kind === 'critical'
                && $mail->errorCode === ErrorCode::SERVER_ERROR
                && str_contains($mail->bodyText, 'DeliverNotification');
        });

        $this->assertDatabaseCount('notifications', 0);
    }
}
