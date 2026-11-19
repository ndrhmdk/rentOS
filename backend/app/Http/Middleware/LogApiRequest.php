<?php

namespace App\Http\Middleware;

use App\Monitoring\ReferenceId;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogApiRequest
{
    public function handle(Request $request, Closure $next): Response
    {
        $startedAt = hrtime(true);
        $reference = ReferenceId::resolve($request);

        $response = $next($request);
        $response->headers->set(ReferenceId::HEADER, $reference);

        if ($request->is('api/v1/health') || $request->is('up')) {
            return $response;
        }

        $user = $request->user();

        Log::info('api.request', [
            'method' => $request->method(),
            'path' => '/'.$request->path(),
            'status' => $response->getStatusCode(),
            'duration_ms' => round((hrtime(true) - $startedAt) / 1_000_000, 2),
            'request_id' => $reference,
            'reference' => $reference,
            'user_id' => $user?->getAuthIdentifier(),
        ]);

        return $response;
    }
}
