<?php

return [
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),
    'allowed_origins' => array_filter(explode(',', env('FRONTEND_ORIGINS', 'http://localhost:3000'))),
    'token_expiry_days' => [1, 7, 30],
    'default_token_expiry_days' => 30,
    'password_confirmation_seconds' => 900,
    'pat_routes' => [
        'GET api/v1/me' => 'account:read',
        // Q&A-02 (Khai): M04 must supply real routes/Policies; this list grants no resource permission.
        'GET api/v1/favourite-properties' => 'favourites:read',
        'PUT api/v1/favourite-properties/*' => 'favourites:write',
        'DELETE api/v1/favourite-properties/*' => 'favourites:write',
    ],
    'token_abilities' => ['account:read', 'favourites:read', 'favourites:write'],
];
