<?php

namespace App\Logging;

use Monolog\LogRecord;
use Throwable;

class RedactCredentials
{
    public function __invoke(LogRecord $record): LogRecord
    {
        return $record->with(message: isset($record->context['exception']) ? 'Application error; see exception type/code.' : $this->cleanString($record->message), context: $this->clean($record->context), extra: $this->clean($record->extra));
    }

    /** @param array<string|int, mixed> $values @return array<string|int, mixed> */
    private function clean(array $values): array
    {
        foreach ($values as $key => $value) {
            if (preg_match('/password|token|cookie|authorization|secret|credential|signature/i', (string) $key)) {
                $values[$key] = '[REDACTED]';
            } elseif ($value instanceof Throwable) {
                $values[$key] = ['type' => $value::class, 'code' => $value->getCode()];
            } elseif (is_array($value)) {
                $values[$key] = $this->clean($value);
            } elseif (is_string($value)) {
                $values[$key] = $this->cleanString($value);
            } elseif (is_object($value)) {
                // Never implicitly serialize a User, notification, request, or token model into logs.
                $values[$key] = ['type' => $value::class];
            }
        }

        return $values;
    }

    private function cleanString(string $value): string
    {
        $value = preg_replace('/Bearer\s+\S+|\$2[ayb]\$\S+|\$argon2\S+|[A-Za-z0-9+\/=]{32,}/', '[REDACTED]', $value);

        return preg_replace('/((?:password|token|signature|cookie|authorization|secret)\s*[=:]\s*)[^\s&,;]+/i', '$1[REDACTED]', $value);
    }
}
