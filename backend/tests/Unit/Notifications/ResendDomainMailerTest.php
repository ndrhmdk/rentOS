<?php

namespace Tests\Unit\Notifications;

use App\Notifications\DomainMailException;
use App\Notifications\DomainMessage;
use App\Notifications\ResendDomainMailer;
use Mockery;
use Psr\Http\Client\ClientExceptionInterface;
use Resend\Exceptions\ErrorException;
use Resend\Exceptions\TransporterException;
use RuntimeException;
use Tests\TestCase;

class ResendDomainMailerTest extends TestCase
{
    public function test_throws_when_api_key_is_missing(): void
    {
        config(['services.resend.key' => '']);

        $mailer = new ResendDomainMailer;

        $this->expectException(DomainMailException::class);
        $mailer->send('evt-1', new DomainMessage('a@b.test', 'c@d.test', 'Subj', '<p>Hi</p>'));
    }

    public function test_sends_email_and_translates_resend_exceptions(): void
    {
        config(['services.resend.key' => 're_test_123']);

        $emailsMock = Mockery::mock();
        $emailsMock->shouldReceive('send')
            ->once()
            ->with(
                [
                    'from' => 'a@b.test',
                    'to' => ['c@d.test'],
                    'subject' => 'Subj',
                    'html' => '<p>Hi</p>',
                ],
                ['idempotency_key' => 'evt-ok'],
            );

        $emailsMock->shouldReceive('send')
            ->once()
            ->andThrow(new ErrorException(['message' => 'concurrent', 'type' => 'concurrent_idempotent_requests', 'code' => 409]));

        $emailsMock->shouldReceive('send')
            ->once()
            ->andThrow(new ErrorException(['message' => 'invalid', 'type' => 'invalid_idempotent_request', 'code' => 422]));

        $emailsMock->shouldReceive('send')
            ->once()
            ->andThrow(new ErrorException(['message' => 'other', 'type' => 'validation_error', 'code' => 400]));

        $clientException = new class('network down') extends RuntimeException implements ClientExceptionInterface {};
        $emailsMock->shouldReceive('send')
            ->once()
            ->andThrow(new TransporterException($clientException));

        $clientMock = (object) ['emails' => $emailsMock];
        $mailer = new ResendDomainMailer(static fn (string $key): object => $clientMock);
        $msg = new DomainMessage('a@b.test', 'c@d.test', 'Subj', '<p>Hi</p>');

        // 1. Happy path
        $mailer->send('evt-ok', $msg);

        // 2. Concurrent
        try {
            $mailer->send('evt-1', $msg);
            $this->fail('Expected DomainMailException');
        } catch (DomainMailException $e) {
            $this->assertSame('concurrent', $e->kind);
        }

        // 3. Invalid
        try {
            $mailer->send('evt-2', $msg);
            $this->fail('Expected DomainMailException');
        } catch (DomainMailException $e) {
            $this->assertSame('invalid', $e->kind);
        }

        // 4. Other ErrorException
        try {
            $mailer->send('evt-3', $msg);
            $this->fail('Expected DomainMailException');
        } catch (DomainMailException $e) {
            $this->assertSame('failed', $e->kind);
        }

        // 5. TransporterException
        try {
            $mailer->send('evt-4', $msg);
            $this->fail('Expected DomainMailException');
        } catch (DomainMailException $e) {
            $this->assertSame('failed', $e->kind);
        }
    }
}
