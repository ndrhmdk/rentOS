<?php

namespace App\Logging;

use Illuminate\Log\Logger;

class ApplyCredentialRedaction
{
    public function __invoke(Logger $logger): void
    {
        $logger->pushProcessor(new RedactCredentials);
    }
}
