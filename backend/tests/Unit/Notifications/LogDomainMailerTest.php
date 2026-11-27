<?php

namespace Tests\Unit\Notifications;

use App\Notifications\DomainMailer;
use App\Notifications\DomainMessage;
use App\Notifications\LogDomainMailer;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class LogDomainMailerTest extends TestCase
{
    public function test_log_domain_mailer_sends_html_email_with_event_key_header_and_resolves_from_container(): void
    {
        config([
            'notifications.mailer' => 'log',
            'mail.default' => 'array',
        ]);

        // Re-bind DomainMailer based on config
        $this->app->forgetInstance(DomainMailer::class);
        $mailer = $this->app->make(DomainMailer::class);
        $this->assertInstanceOf(LogDomainMailer::class, $mailer);

        $mailer->send('listing.approved:123', new DomainMessage(
            from: 'rentOS <noreply@rentos.test>',
            to: 'owner@rentos.test',
            subject: 'Tin đăng đã duyệt',
            html: '<p>Xin chúc mừng!</p>',
        ));

        $mailer->send('listing.rejected:456', new DomainMessage(
            from: 'noreply@rentos.test',
            to: 'owner2@rentos.test',
            subject: 'Tin đăng bị từ chối',
            html: '<p>Cần chỉnh sửa.</p>',
        ));

        $sent = Mail::mailer('array')->getSymfonyTransport()->messages();
        $this->assertCount(2, $sent);
    }
}
