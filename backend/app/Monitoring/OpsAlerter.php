<?php

namespace App\Monitoring;

use App\Mail\OpsAlertMail;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

final class OpsAlerter
{
    private const ALLOWED_CONTEXT = [
        'reference',
        'error_code',
        'user_id',
        'resource_id',
        'operation',
        'duration_ms',
        'route',
        'job',
        'fingerprint',
    ];

    /**
     * @param  array<string, mixed>  $context
     */
    public function report(string $kind, string $errorCode, string $summary, array $context = []): void
    {
        $safeContext = $this->safeContext($context);
        $safeContext['error_code'] = $errorCode;
        $safeContext['reference'] = $safeContext['reference']
            ?? ReferenceId::current()
            ?? 'unknown';

        $fingerprint = $this->fingerprint($kind, $errorCode, $safeContext);
        $cacheKey = 'ops-alert:' . $kind . ':' . $fingerprint;

        if (! Cache::add($cacheKey, true, (int) config('monitoring.dedupe_seconds', 900))) {
            Log::info('ops.alert.deduped', [
                'kind' => $kind,
                'error_code' => $errorCode,
                'fingerprint' => $fingerprint,
                'reference' => $safeContext['reference'],
            ]);

            return;
        }

        Log::critical('ops.alert', [
            'kind' => $kind,
            'summary' => $summary,
            ...$safeContext,
        ]);

        $this->sendMail($kind, $errorCode, $summary, $safeContext);

        if ($kind === 'critical' || $kind === 'slow_query') {
            $this->sendDiscord($kind, $errorCode, $summary, $safeContext);
        }
    }

    /**
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    private function safeContext(array $context): array
    {
        $safe = [];

        foreach (self::ALLOWED_CONTEXT as $key) {
            if (! array_key_exists($key, $context)) {
                continue;
            }

            $value = $context[$key];
            if (is_scalar($value) || $value === null) {
                $safe[$key] = $value;
            }
        }

        return $safe;
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function fingerprint(string $kind, string $errorCode, array $context): string
    {
        if ($kind === 'slow_query') {
            return hash('sha256', (string) ($context['fingerprint'] ?? $errorCode));
        }

        if (isset($context['job']) && is_string($context['job']) && $context['job'] !== '') {
            return hash('sha256', $context['job'] . ':' . $errorCode);
        }

        $route = is_string($context['route'] ?? null) ? $context['route'] : 'unknown';

        return hash('sha256', $route . ':' . $errorCode);
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function sendMail(string $kind, string $errorCode, string $summary, array $context): void
    {
        $recipients = $this->recipients();
        if ($recipients === []) {
            Log::warning('ops.alert.no_recipients', [
                'kind' => $kind,
                'error_code' => $errorCode,
                'reference' => $context['reference'] ?? null,
            ]);

            return;
        }

        $body = $this->body($kind, $errorCode, $summary, $context);

        try {
            foreach ($recipients as $recipient) {
                Mail::to($recipient)->send(new OpsAlertMail($kind, $errorCode, $body));
            }
        } catch (Throwable) {
            Log::critical('ops.alert.fallback', [
                'channel' => 'mail',
                'kind' => $kind,
                'error_code' => $errorCode,
                'reference' => $context['reference'] ?? null,
                'reason' => 'mail_delivery_failed',
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function sendDiscord(string $kind, string $errorCode, string $summary, array $context): void
    {
        $webhook = (string) config('monitoring.discord_webhook', '');
        if ($webhook === '') {
            return;
        }

        $content = sprintf(
            'rentOS %s `%s` route=%s reference=%s',
            $kind,
            $errorCode,
            (string) ($context['route'] ?? $context['job'] ?? 'unknown'),
            (string) ($context['reference'] ?? 'unknown'),
        );

        try {
            Http::timeout(5)->post($webhook, ['content' => $content]);
        } catch (Throwable) {
            Log::critical('ops.alert.fallback', [
                'channel' => 'discord',
                'kind' => $kind,
                'error_code' => $errorCode,
                'reference' => $context['reference'] ?? null,
                'reason' => 'discord_delivery_failed',
            ]);
        }
    }

    /**
     * @return list<string>
     */
    private function recipients(): array
    {
        try {
            /** @var list<string> $cached */
            $cached = Cache::remember(
                'ops-alert:admin-emails',
                (int) config('monitoring.admin_cache_seconds', 300),
                function (): array {
                    return User::query()
                        ->where('is_admin', true)
                        ->whereNotNull('email')
                        ->pluck('email')
                        ->filter(fn($email): bool => is_string($email) && $email !== '')
                        ->values()
                        ->all();
                },
            );

            if ($cached !== []) {
                return $cached;
            }
        } catch (Throwable) {
            // Fall through to the configured backup address.
        }

        $fallback = (string) config('monitoring.ops_alert_email', '');

        return $fallback !== '' ? [$fallback] : [];
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function body(string $kind, string $errorCode, string $summary, array $context): string
    {
        $lines = [
            'kind: ' . $kind,
            'error_code: ' . $errorCode,
            'summary: ' . $summary,
        ];

        foreach (['reference', 'route', 'job', 'operation', 'user_id', 'resource_id', 'duration_ms', 'fingerprint'] as $key) {
            if (! array_key_exists($key, $context) || $context[$key] === null || $context[$key] === '') {
                continue;
            }

            $lines[] = $key . ': ' . $context[$key];
        }

        return implode("\n", $lines);
    }
}
