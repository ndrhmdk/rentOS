<?php

namespace Tests\Feature\Monitoring;

use App\Jobs\SendOpsDiscordAlert;
use App\Monitoring\ErrorCode;
use App\Monitoring\ReferenceId;
use Illuminate\Cache\ArrayStore;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use League\Flysystem\UnableToWriteFile;
use RuntimeException;
use Tests\TestCase;

class SafeApiErrorResponsesTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
        Mail::fake();
        Queue::fake();
        config([
            'monitoring.discord_webhook' => 'https://discord.example.test/webhook',
            'monitoring.dedupe_seconds' => 600,
        ]);

        Route::middleware('api')->prefix('api')->group(function (): void {
            Route::get('/v1/__monitoring/boom', function (): never {
                throw new RuntimeException('secret password=hunter2 token=abc');
            });

            Route::get('/v1/__monitoring/storage', function (): never {
                throw UnableToWriteFile::atLocation('photos/a.jpg', 'storage timeout');
            });

            Route::post('/v1/__monitoring/validate', function (): never {
                throw ValidationException::withMessages([
                    'email' => ['The email field is required.'],
                ]);
            });
        });
    }

    public function test_api_500_returns_safe_body_with_reference_header(): void
    {
        $response = $this->getJson('/api/v1/__monitoring/boom');

        $response->assertStatus(500)
            ->assertJsonPath('error_code', ErrorCode::SERVER_ERROR)
            ->assertJsonMissingPath('exception')
            ->assertJsonMissing(['message' => 'secret password=hunter2 token=abc']);

        $reference = $response->json('reference');
        $this->assertIsString($reference);
        $this->assertNotSame('', $reference);
        $this->assertStringContainsString($reference, (string) $response->json('message'));
        $this->assertSame($reference, $response->headers->get(ReferenceId::HEADER));
        $this->assertStringContainsString('Đã có lỗi', (string) $response->json('message'));
    }

    public function test_storage_failure_uses_storage_failed_code(): void
    {
        $response = $this->getJson('/api/v1/__monitoring/storage');

        $response->assertStatus(500)
            ->assertJsonPath('error_code', ErrorCode::STORAGE_FAILED);

        $this->assertStringContainsString('Không thể tải ảnh lên', (string) $response->json('message'));
    }

    public function test_validation_failure_stays_422_without_error_code(): void
    {
        $response = $this->postJson('/api/v1/__monitoring/validate', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email'])
            ->assertJsonMissingPath('error_code')
            ->assertJsonMissingPath('reference');
    }

    public function test_incoming_request_id_is_preserved(): void
    {
        $reference = '11111111-2222-3333-4444-555555555555';

        $response = $this->withHeader(ReferenceId::HEADER, $reference)
            ->getJson('/api/v1/__monitoring/boom');

        $response->assertStatus(500)
            ->assertJsonPath('reference', $reference);
        $this->assertSame($reference, $response->headers->get(ReferenceId::HEADER));
    }

    public function test_invalid_or_oversized_request_id_is_replaced(): void
    {
        foreach (["not-a-uuid\nforged=1", str_repeat('a', 10_000)] as $header) {
            $response = $this->withHeader(ReferenceId::HEADER, $header)
                ->getJson('/api/v1/__monitoring/boom');

            $reference = $response->assertStatus(500)->json('reference');

            $this->assertTrue(Str::isUuid($reference));
            $this->assertNotSame($header, $reference);
            $this->assertSame($reference, $response->headers->get(ReferenceId::HEADER));
        }
    }

    public function test_dedupe_cache_outage_keeps_safe_500_and_still_alerts(): void
    {
        Cache::extend('failing', fn () => Cache::repository(new class extends ArrayStore
        {
            public function add($key, $value, $seconds): bool
            {
                throw new RuntimeException('cache store unavailable');
            }
        }));
        config(['cache.stores.failing' => ['driver' => 'failing'], 'cache.default' => 'failing']);
        Cache::forgetDriver('failing');

        $response = $this->getJson('/api/v1/__monitoring/boom');

        $response->assertStatus(500)
            ->assertJsonPath('error_code', ErrorCode::SERVER_ERROR)
            ->assertJsonMissing(['message' => 'cache store unavailable']);

        $reference = $response->json('reference');
        $this->assertTrue(Str::isUuid($reference));
        Queue::assertPushed(
            SendOpsDiscordAlert::class,
            fn (SendOpsDiscordAlert $job): bool => ($job->meta['reference'] ?? null) === $reference,
        );
    }

    public function test_api_500_queues_discord_alert_with_matching_reference(): void
    {
        $response = $this->getJson('/api/v1/__monitoring/boom');

        $response->assertStatus(500);
        $reference = $response->json('reference');
        $this->assertIsString($reference);

        Mail::assertNothingSent();
        Queue::assertPushed(SendOpsDiscordAlert::class, function (SendOpsDiscordAlert $job) use ($reference): bool {
            return str_contains($job->content, 'critical')
                && str_contains($job->content, (string) $reference)
                && ($job->meta['reference'] ?? null) === $reference;
        });
    }
}
