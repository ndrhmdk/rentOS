<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout', 'register', 'forgot-password', 'reset-password', 'email/*', 'user/*'],
    'allowed_methods' => ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'allowed_origins' => array_filter(explode(',', env('FRONTEND_ORIGINS', 'http://localhost:3000'))),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Accept', 'Content-Type', 'X-XSRF-TOKEN', 'X-CSRF-TOKEN', 'X-Requested-With', 'Authorization'],
    'exposed_headers' => ['Retry-After'],
    'max_age' => 600,
    'supports_credentials' => true,
];
