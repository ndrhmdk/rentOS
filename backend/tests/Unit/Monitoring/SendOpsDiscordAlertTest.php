<?php

namespace Tests\Unit\Monitoring;

use App\Jobs\SendOpsDiscordAlert;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Tests\TestCase;

class SendOpsDiscordAlertTest extends TestCase
{
    public function test_backoff_returns_expected_intervals(): void
    {
        $job = new SendOpsDiscordAlert('Alert content', ['kind' => 'db_time', 'error_code' => 'ERR_DB', 'reference' => 'ref-1']);
        $this->assertSame([10, 30, 60], $job->backoff());
    }

    public function test_handle_skips_when_webhook_is_empty(): void
    {
        Http::fake();
        config(['monitoring.discord_webhook' => '']);

        (new SendOpsDiscordAlert('Alert content', ['kind' => 'db_time', 'error_code' => 'ERR_DB', 'reference' => 'ref-1']))->handle();

        Http::assertNothingSent();
    }

    public function test_handle_posts_content_to_discord_webhook_and_throws_on_failure(): void
    {
        config(['monitoring.discord_webhook' => 'https://discord.test/api/webhooks/123']);

        Http::fake([
            'https://discord.test/*' => Http::sequence()
                ->push('', 204)
                ->push('Server Error', 500),
        ]);

        (new SendOpsDiscordAlert('Alert content', ['kind' => 'db_time', 'error_code' => 'ERR_DB', 'reference' => 'ref-1']))->handle();

        Http::assertSent(fn ($request) => $request->url() === 'https://discord.test/api/webhooks/123'
            && $request['content'] === 'Alert content');

        $this->expectException(RequestException::class);
        (new SendOpsDiscordAlert('Alert content 2', ['kind' => 'db_time', 'error_code' => 'ERR_DB', 'reference' => 'ref-2']))->handle();
    }

    public function test_failed_logs_critical_fallback(): void
    {
        Log::spy();

        $job = new SendOpsDiscordAlert('Alert content', [
            'kind' => 'slow_query_critical',
            'error_code' => 'ERR_SQL',
            'reference' => 'ref-99',
        ]);
        $job->failed(new RuntimeException('Webhook unreachable'));

        Log::shouldHaveReceived('critical')->once()->with('ops.alert.fallback', [
            'channel' => 'discord',
            'kind' => 'slow_query_critical',
            'error_code' => 'ERR_SQL',
            'reference' => 'ref-99',
            'reason' => 'discord_delivery_failed',
        ]);
    }
}
