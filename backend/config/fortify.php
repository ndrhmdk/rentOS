<?php

use App\Http\Middleware\NormalizeAuthInput;
use Laravel\Fortify\Features;

return [
    'guard' => 'web',
    'passwords' => 'users',
    'username' => 'email',
    'email' => 'email',
    'lowercase_usernames' => true,
    'views' => false,
    'home' => '/',
    'prefix' => '',
    'domain' => null,
    'middleware' => ['web', NormalizeAuthInput::class, 'throttle:auth-forms'],
    'auth_middleware' => 'auth',
    'limiters' => ['login' => 'login', 'verification' => 'verification'],
    'features' => [Features::registration(), Features::resetPasswords(), Features::emailVerification(), Features::updatePasswords()],
];
