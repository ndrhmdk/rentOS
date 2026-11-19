<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class SendOpsDiscordAlert implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /**
     * @param  array{kind?: string, error_code?: string, reference?: string|null}  $meta
     */
    public function __construct(
        public string $content,
        public array $meta = [],
    ) {}

    /**
     * @return list<int>
     */
    public function backoff(): array
    {
        return [10, 30, 60];
    }

    public function handle(): void
    {
        $webhook = (string) config('monitoring.discord_webhook', '');
        if ($webhook === '') {
            return;
        }

        Http::timeout(5)->post($webhook, ['content' => $this->content])->throw();
    }

    public function failed(?Throwable $exception): void
    {
        Log::critical('ops.alert.fallback', [
            'channel' => 'discord',
            'kind' => $this->meta['kind'] ?? null,
            'error_code' => $this->meta['error_code'] ?? null,
            'reference' => $this->meta['reference'] ?? null,
            'reason' => 'discord_delivery_failed',
        ]);
    }
}
