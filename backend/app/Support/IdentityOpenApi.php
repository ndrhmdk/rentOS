<?php

namespace App\Support;

use Dedoc\Scramble\Support\Generator\OpenApi;
use Dedoc\Scramble\Support\Generator\SecurityRequirement;
use Dedoc\Scramble\Support\Generator\SecurityScheme;

class IdentityOpenApi
{
    public function __invoke(OpenApi $document): void
    {
        $document->components->addSecurityScheme('browserSession', SecurityScheme::apiKey('cookie', config('session.cookie'))->setDescription('HttpOnly Laravel session. Obtain /sanctum/csrf-cookie and sign in through Fortify; browser writes require X-XSRF-TOKEN.'));
        $document->components->addSecurityScheme('csrf', SecurityScheme::apiKey('header', 'X-XSRF-TOKEN')->setDescription('URL-decoded XSRF-TOKEN cookie value; required for browser mutations.'));
        $document->components->addSecurityScheme('personalToken', SecurityScheme::http('bearer')->setDescription('Cookie-free non-browser PAT only. me: account:read; favourites GET: favourites:read; favourites PUT/DELETE: favourites:write. Every other private endpoint is session-only.'));
        foreach ($document->paths as $path) {
            foreach ($path->operations as $method => $operation) {
                $isWrite = ! in_array(strtolower($method), ['get', 'head', 'options'], true);
                $operation->security = [new SecurityRequirement($isWrite ? ['browserSession' => [], 'csrf' => []] : ['browserSession' => []])];
                if (trim($path->path, '/') === 'health') {
                    $operation->security = [];
                } elseif (trim($path->path, '/') === 'v1/me' && strtolower($method) === 'get') {
                    $operation->security[] = new SecurityRequirement(['personalToken' => []]);
                }
            }
        }
    }
}
