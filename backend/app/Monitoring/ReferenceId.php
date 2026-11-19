<?php

namespace App\Monitoring;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

final class ReferenceId
{
    public const HEADER = 'X-Request-Id';

    public const REQUEST_ATTRIBUTE = 'monitoring.reference';

    public static function resolve(Request $request): string
    {
        $existing = $request->attributes->get(self::REQUEST_ATTRIBUTE);
        if (is_string($existing) && $existing !== '') {
            return $existing;
        }

        $header = $request->headers->get(self::HEADER);
        $reference = is_string($header) && $header !== ''
            ? $header
            : (string) Str::uuid();

        $request->attributes->set(self::REQUEST_ATTRIBUTE, $reference);
        Log::shareContext(['reference' => $reference]);

        return $reference;
    }

    public static function current(?Request $request = null): ?string
    {
        $request ??= request();

        if (! $request instanceof Request) {
            $shared = Log::sharedContext();

            return is_string($shared['reference'] ?? null) ? $shared['reference'] : null;
        }

        $attribute = $request->attributes->get(self::REQUEST_ATTRIBUTE);
        if (is_string($attribute) && $attribute !== '') {
            return $attribute;
        }

        $shared = Log::sharedContext();

        return is_string($shared['reference'] ?? null) ? $shared['reference'] : null;
    }
}
