<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OpsAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $bodyText;

    /**
     * @param  array<string, mixed>  $context
     * @param  list<array{sql?: string, count?: int, total_ms?: float, max_ms?: float}>  $topPatterns
     */
    public function __construct(
        public string $kind,
        public string $errorCode,
        public string $summary,
        public array $context = [],
        public array $topPatterns = [],
    ) {
        $this->bodyText = $this->plainBody();
    }

    public function envelope(): Envelope
    {
        $label = match ($this->kind) {
            'slow_query_critical' => 'Critical slow query',
            'db_time' => 'Critical high DB time',
            default => $this->kind,
        };

        return new Envelope(
            subject: '[rentOS] '.$label.': '.$this->errorCode,
        );
    }

    public function content(): Content
    {
        return new Content(
            html: 'mail.ops-alert',
            text: 'mail.ops-alert-text',
            with: [
                'kind' => $this->kind,
                'errorCode' => $this->errorCode,
                'summary' => $this->summary,
                'context' => $this->context,
                'topPatterns' => $this->topPatterns,
                'title' => $this->title(),
                'badge' => $this->badge(),
                'bodyText' => $this->bodyText,
            ],
        );
    }

    private function plainBody(): string
    {
        $lines = [
            'kind: '.$this->kind,
            'error_code: '.$this->errorCode,
            'summary: '.$this->summary,
        ];

        foreach (['reference', 'route', 'job', 'operation', 'duration_ms', 'total_ms', 'query_count', 'fingerprint', 'sql', 'occurrence_count'] as $key) {
            if (! array_key_exists($key, $this->context) || $this->context[$key] === null || $this->context[$key] === '') {
                continue;
            }

            $lines[] = $key.': '.$this->context[$key];
        }

        foreach ($this->topPatterns as $index => $pattern) {
            $n = $index + 1;
            $lines[] = sprintf(
                'top_pattern_%d: count=%s total_ms=%s max_ms=%s sql=%s',
                $n,
                $pattern['count'] ?? '?',
                $pattern['total_ms'] ?? '?',
                $pattern['max_ms'] ?? '?',
                $pattern['sql'] ?? '',
            );
        }

        return implode("\n", $lines);
    }

    private function title(): string
    {
        return match ($this->kind) {
            'slow_query_critical' => 'Critical slow query',
            'db_time' => 'Critical high DB time',
            default => 'Ops alert',
        };
    }

    private function badge(): string
    {
        return match ($this->kind) {
            'slow_query_critical' => 'Slow query',
            'db_time' => 'High DB time',
            default => 'Alert',
        };
    }
}
