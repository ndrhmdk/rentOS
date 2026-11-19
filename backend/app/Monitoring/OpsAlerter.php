<?php

namespace App\Monitoring;

use App\Jobs\SendOpsDiscordAlert;
use App\Mail\OpsAlertMail;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
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
        'total_ms',
        'query_count',
        'route',
        'job',
        'fingerprint',
        'sql',
        'occurrence_count',
    ];

    /** Kinds that email admins (DB-critical only). */
    private const EMAIL_KINDS = [
        'slow_query_critical',
        'db_time',
    ];

    /** Kinds that post to Discord. */
    private const DISCORD_KINDS = [
        'critical',
        'slow_query',
        'slow_query_critical',
        'db_time',
    ];

    /**
     * @param  array<string, mixed>  $context
     */
    public function report(string $kind, string $errorCode, string $summary, array $context = []): void
    {
        $topPatterns = [];
        if (isset($context['top_patterns']) && is_array($context['top_patterns'])) {
            $topPatterns = $context['top_patterns'];
        }

        $safeContext = $this->safeContext($context);
        $safeContext['error_code'] = $errorCode;
        $safeContext['reference'] = $safeContext['reference']
            ?? ReferenceId::current()
            ?? 'unknown';

        $fingerprint = $this->fingerprint($kind, $errorCode, $safeContext);
        $cacheKey = 'ops-alert:'.$kind.':'.$fingerprint;

        if (! Cache::add($cacheKey, true, (int) config('monitoring.dedupe_seconds', 600))) {
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

        if (in_array($kind, self::EMAIL_KINDS, true)) {
            $this->sendMail($kind, $errorCode, $summary, $safeContext, $topPatterns);
        }

        if (in_array($kind, self::DISCORD_KINDS, true)) {
            $this->queueDiscord($kind, $errorCode, $summary, $safeContext);
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
        if ($kind === 'slow_query' || $kind === 'slow_query_critical') {
            return hash('sha256', (string) ($context['fingerprint'] ?? $errorCode));
        }

        if ($kind === 'db_time') {
            $route = is_string($context['route'] ?? null) ? $context['route'] : 'unknown';

            return hash('sha256', $route.':db_time');
        }

        if (isset($context['job']) && is_string($context['job']) && $context['job'] !== '') {
            return hash('sha256', $context['job'].':'.$errorCode);
        }

        $route = is_string($context['route'] ?? null) ? $context['route'] : 'unknown';

        return hash('sha256', $route.':'.$errorCode);
    }

    /**
     * @param  array<string, mixed>  $context
     * @param  list<array{sql?: string, count?: int, total_ms?: float, max_ms?: float}>  $topPatterns
     */
    private function sendMail(
        string $kind,
        string $errorCode,
        string $summary,
        array $context,
        array $topPatterns = [],
    ): void {
        $recipients = $this->recipients();
        if ($recipients === []) {
            Log::warning('ops.alert.no_recipients', [
                'kind' => $kind,
                'error_code' => $errorCode,
                'reference' => $context['reference'] ?? null,
            ]);

            return;
        }

        try {
            foreach ($recipients as $recipient) {
                Mail::to($recipient)->send(new OpsAlertMail(
                    $kind,
                    $errorCode,
                    $summary,
                    $context,
                    $topPatterns,
                ));
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
    private function queueDiscord(string $kind, string $errorCode, string $summary, array $context): void
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

        SendOpsDiscordAlert::dispatch($content, [
            'kind' => $kind,
            'error_code' => $errorCode,
            'reference' => $context['reference'] ?? null,
        ]);
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
                        ->filter(fn ($email): bool => is_string($email) && $email !== '')
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
}
