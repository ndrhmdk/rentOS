<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;

class StrictCsrf extends PreventRequestForgery
{
    /** Require the session token even when Laravel 13 trusts Sec-Fetch-Site. */
    protected function hasValidOrigin($request): bool
    {
        return false;
    }
}
