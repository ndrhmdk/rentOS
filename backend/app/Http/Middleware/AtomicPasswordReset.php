<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class AtomicPasswordReset
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->isMethod('POST') || ! $request->is('reset-password')) {
            return $next($request);
        }

        return DB::transaction(function () use ($request, $next): Response {
            // Serialize broker redemption + token consumption, including concurrent replay.
            DB::select('SELECT pg_advisory_xact_lock(hashtextextended(?, 0))', ['identity.reset.'.Str::lower(trim((string) $request->input('email')))]);

            return $next($request);
        });
    }
}
