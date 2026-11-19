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

    public function __construct(
        public string $kind,
        public string $errorCode,
        public string $bodyText,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '[rentOS] '.$this->kind.': '.$this->errorCode,
        );
    }

    public function content(): Content
    {
        return new Content(
            text: 'mail.ops-alert-text',
            with: [
                'bodyText' => $this->bodyText,
            ],
        );
    }
}
