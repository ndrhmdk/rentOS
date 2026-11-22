<?php

use App\Http\Middleware\EnforcePersonalAccessTokenScope;
use App\Http\Middleware\LogApiRequest;
use App\Monitoring\ErrorCode;
use App\Monitoring\OpsAlerter;
use App\Monitoring\ReferenceId;
use App\Providers\MonitoringServiceProvider;
use Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
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
        $middleware->trustProxies(at: '*');
        $middleware->appendToGroup('api', [LogApiRequest::class, EnforcePersonalAccessTokenScope::class]);
        $middleware->appendToPriorityList(AuthenticatesRequests::class, EnforcePersonalAccessTokenScope::class);
        $middleware->statefulApi();
        $middleware->redirectGuestsTo(fn () => rtrim(config('fortify.home'), '/').'/login');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->report(function (Throwable $throwable): void {
            if (! MonitoringServiceProvider::shouldReport($throwable)) {
                return;
            }

            $request = request();
            if (! $request instanceof Request) {
                // Exhausted jobs are reported from Queue::failing instead.
                return;
            }

            if (! $request->is('api/*') && ! $request->expectsJson()) {
                return;
            }

            $reference = ReferenceId::resolve($request);
            $matched = $request->route();
            $route = $matched !== null
                ? strtoupper($request->method()).' '.$matched->uri()
                : strtoupper($request->method()).' /'.$request->path();

            app(OpsAlerter::class)->report(
                kind: 'critical',
                errorCode: ErrorCode::fromThrowable($throwable),
                summary: 'Application failure',
                context: [
                    'reference' => $reference,
                    'route' => $route,
                    'user_id' => $request->user()?->getAuthIdentifier(),
                    'operation' => 'http.request',
                ],
            );
        });

        $exceptions->respond(function (Response $response, Throwable $exception, Request $request): Response {
            if ($request->is('api/*') && $response->getStatusCode() === Response::HTTP_FORBIDDEN) {
                $response->setContent(json_encode([
                    'message' => 'You do not have permission to perform this action.',
                ], JSON_THROW_ON_ERROR));
                $response->headers->set('Content-Type', 'application/json');
            }

            if ($request->is('api/v1/admin/*')) {
                $response->headers->set('Cache-Control', 'private, no-store');
            }

            if (! $request->is('api/*') || $response->getStatusCode() < 500) {
                return $response;
            }

            $reference = ReferenceId::resolve($request);
            $errorCode = ErrorCode::fromThrowable($exception);

            return new JsonResponse([
                'message' => ErrorCode::message($errorCode, $reference),
                'error_code' => $errorCode,
                'reference' => $reference,
            ], $response->getStatusCode(), [
                ReferenceId::HEADER => $reference,
            ]);
        });

        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
