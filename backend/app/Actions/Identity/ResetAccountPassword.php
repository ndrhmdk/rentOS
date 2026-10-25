<?php

namespace App\Actions\Identity;

use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Laravel\Fortify\Contracts\ResetsUserPasswords;

class ResetAccountPassword implements ResetsUserPasswords
{
    public function __construct(private RevokeCredentials $revoke) {}

    /** @param array<string, mixed> $input */
    public function reset(User $user, array $input): void
    {
        Validator::make(
            $input,
            ['password' => ['required',
                'string',
                Password::min(12)->letters()->mixedCase()->numbers(),
                'confirmed'],
            ]
        )->validate();
        $this->revoke->handle($user, 'account.password_reset', $input['password']);
    }
}
