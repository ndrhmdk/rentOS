<?php

namespace Tests\Feature\Monitoring;

use App\Jobs\SendOpsDiscordAlert;
use App\Models\User;
use Illuminate\Contracts\Queue\Job as QueueJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class QueueFailureAlertTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        Queue::fake();
        Cache::flush();

        User::factory()->create([
            'email' => 'admin@example.test',
            'is_admin' => true,
        ]);

        config([
            'monitoring.discord_webhook' => 'https://discord.example.test/webhook',
            'monitoring.dedupe_seconds' => 600,
        ]);
    }

    public function test_exhausted_job_queues_discord_without_email(): void
    {
        $job = Mockery::mock(QueueJob::class);
        $job->shouldReceive('resolveName')->andReturn('App\\Jobs\\DeliverNotification');

        Event::dispatch(new JobFailed(
            'database',
            $job,
            new RuntimeException('delivery exhausted'),
        ));

        Mail::assertNothingSent();
        Queue::assertPushed(SendOpsDiscordAlert::class, function (SendOpsDiscordAlert $job): bool {
            return str_contains($job->content, 'critical')
                && str_contains($job->content, 'DeliverNotification');
        });

        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_exhausted_discord_alert_job_does_not_requeue_alert(): void
    {
        Log::spy();

        $job = Mockery::mock(QueueJob::class);
        $job->shouldReceive('resolveName')->andReturn(SendOpsDiscordAlert::class);

        Event::dispatch(new JobFailed(
            'database',
            $job,
            new RuntimeException('webhook down'),
        ));

        Mail::assertNothingSent();
        Queue::assertNothingPushed();

        Log::shouldHaveReceived('critical')
            ->withArgs(function (string $message, array $context): bool {
                return $message === 'ops.alert.fallback'
                    && ($context['reason'] ?? null) === 'discord_alert_job_exhausted'
                    && ($context['channel'] ?? null) === 'discord';
            })
            ->atLeast()
            ->once();
    }
}
