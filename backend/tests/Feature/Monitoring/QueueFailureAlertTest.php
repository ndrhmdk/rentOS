<?php

namespace Tests\Feature\Monitoring;

use App\Jobs\SendOpsDiscordAlert;
use App\Mail\OpsAlertMail;
use App\Models\User;
use Illuminate\Contracts\Queue\Job as QueueJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class QueueFailureAlertTest extends TestCase
{
    use RefreshDatabase;

    public function test_exhausted_job_queues_discord_without_email(): void
    {
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
}
