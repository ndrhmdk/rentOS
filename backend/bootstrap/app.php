<?php

use App\Http\Middleware\AccountAccess;
use App\Http\Middleware\AtomicPasswordReset;
use App\Http\Middleware\BrowserSecurity;
use App\Http\Middleware\CredentialMode;
use App\Http\Middleware\RequireAdmin;
use App\Http\Middleware\RequireRecentPassword;
use App\Http\Middleware\SessionOnly;
use App\Http\Middleware\StrictCsrf;
use App\Support\FrontendUrl;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(BrowserSecurity::class);
        $middleware->statefulApi();
        $middleware->web(replace: [PreventRequestForgery::class => StrictCsrf::class], append: [AtomicPasswordReset::class]);
        // Private by default. Public discovery routes must explicitly remove these controls.
        $middleware->api(append: ['auth:sanctum', AccountAccess::class, CredentialMode::class]);
        $middleware->alias(['account.active' => AccountAccess::class, 'account.admin' => RequireAdmin::class, 'session.only' => SessionOnly::class, 'password.recent' => RequireRecentPassword::class]);
        $middleware->redirectGuestsTo(fn (Request $request): string => FrontendUrl::make('/login'));
        $middleware->redirectUsersTo(fn (Request $request): string => FrontendUrl::make('/'));
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(fn (Request $request): bool => $request->is('api/*') || $request->expectsJson());
        $exceptions->dontFlash(['current_password', 'password', 'password_confirmation', 'token', 'plain_text_token']);
        $exceptions->respond(function (Response $response): Response {
            if ($response instanceof JsonResponse && $response->getStatusCode() >= 400) {
                $data = $response->getData(true);
                $safe = ['message' => $response->getStatusCode() >= 500 ? 'Unable to complete the request.' : ($data['message'] ?? 'Request rejected.')];
                if ($response->getStatusCode() === 422 && isset($data['errors'])) {
                    $safe['errors'] = $data['errors'];
                }
                $response->setData($safe);
            }
            // Includes error responses so expired sessions/secrets cannot reach shared caches.
            $response->headers->set('Cache-Control', 'no-store, private');
            $response->headers->set('Referrer-Policy', 'no-referrer');
            $response->headers->set('X-Content-Type-Options', 'nosniff');

            return $response;
        });
    })->create();
