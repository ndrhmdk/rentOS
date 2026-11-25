<?php

namespace Tests\Unit\Monitoring;

use App\Mail\OpsAlertMail;
use Tests\TestCase;

class OpsAlertMailTest extends TestCase
{
    public function test_envelope_content_and_render_cover_all_kinds_and_patterns(): void
    {
        $patterns = [
            ['sql' => 'SELECT * FROM listings', 'total_ms' => 450.5, 'max_ms' => 120.0, 'count' => 12],
            ['count' => 3], // missing keys to cover ?? fallback
        ];

        $kinds = [
            'slow_query_critical' => 'Critical slow query',
            'db_time' => 'Critical high DB time',
            'custom_alert' => 'custom_alert',
        ];

        foreach ($kinds as $kind => $expectedLabel) {
            $mail = new OpsAlertMail(
                kind: $kind,
                errorCode: 'ERR_PERF',
                summary: 'High latency detected',
                context: ['endpoint' => '/api/v1/listings', 'ms' => 520],
                topPatterns: $patterns,
            );

            $envelope = $mail->envelope();
            $this->assertStringContainsString($expectedLabel, $envelope->subject);

            $content = $mail->content();
            $this->assertSame('mail.ops-alert', $content->html);
            $this->assertSame('mail.ops-alert-text', $content->text);
            $this->assertNotEmpty($content->with['title']);
            $this->assertNotEmpty($content->with['badge']);
            $this->assertStringContainsString('SELECT * FROM listings', $mail->bodyText);

            $rendered = $mail->render();
            $this->assertStringContainsString('ERR_PERF', $rendered);
        }
    }
}
