<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

/**
 * Deny-by-default gate for personal access tokens: an authenticated API route
 * accepts a token only when config('personal_access_tokens.routes') lists the
 * route name and the token holds the mapped ability.
 */
class EnforcePersonalAccessTokenScope
{
    public function handle(Request $request, Closure $next): Response
    {
        $route = $request->route();

        if ($route === null || ! in_array('auth:sanctum', $route->gatherMiddleware(), true)) {
            return $next($request);
        }

        $token = $request->user('sanctum')?->currentAccessToken();

        if ($token instanceof PersonalAccessToken) {
            $ability = self::abilityFor($route->getName());

            abort_if($ability === null || ! $token->can($ability), 403);
        }

        return $next($request);
    }

    /**
     * @return list<string>
     */
    public static function abilities(): array
    {
        return array_values(array_unique(config('personal_access_tokens.routes', [])));
    }

    private static function abilityFor(?string $routeName): ?string
    {
        $ability = config('personal_access_tokens.routes', [])[$routeName ?? ''] ?? null;

        return is_string($ability) ? $ability : null;
    }
}
