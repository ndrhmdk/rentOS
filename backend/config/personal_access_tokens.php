<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Personal access token scope
    |--------------------------------------------------------------------------
    |
    | Allow-list of authenticated API routes (by route name) that a personal
    | access token may call, and the ability the token needs for each one.
    | Every other authenticated API route rejects personal access tokens with
    | 403. Browser sessions are not affected by this list.
    |
    */

    'routes' => [
        'api.v1.me.show' => 'account:read',
        'api.v1.favourite-properties.index' => 'favourites:read',
        'api.v1.favourite-properties.count' => 'favourites:read',
        'api.v1.favourite-properties.ids' => 'favourites:read',
        'api.v1.owner.rental-requests.index' => 'rental-requests:read',
        'api.v1.owner.rental-requests.show' => 'rental-requests:read',
    ],

];
