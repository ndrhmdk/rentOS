<?php

namespace App\Support;

use LogicException;

class FrontendUrl
{
    public static function make(string $path): string
    {
        $base = rtrim(config('identity.frontend_url'), '/');
        $parts = parse_url($base);
        if (! in_array($parts['scheme'] ?? '', ['http', 'https'], true) || (isset($parts['user']) || isset($parts['pass'])) || ! in_array($base, config('identity.allowed_origins'), true)) {
            throw new LogicException('FRONTEND_URL must be an allowlisted origin.');
        }

        return $base.'/'.ltrim($path, '/');
    }
}
