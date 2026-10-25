<?php

namespace App\Actions\Identity;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\UpdatesUserPasswords;

class ChangeAccountPassword implements UpdatesUserPasswords
{
    public function __construct(private RevokeCredentials $revoke) {}

    /** @param array<string, mixed> $input */
    public function update(User $user, array $input): void
    {
        Validator::make($input, [
            'current_password' => ['required', 'string', 'current_password:web'],
            'password' => ['required', 'string', Password::min(12)->letters()->mixedCase()->numbers(), 'confirmed'],
        ])->validate();
        DB::transaction(function () use ($user, $input): void {
            $current = User::query()->lockForUpdate()->findOrFail($user->id);
            abort_unless($current->account_status === 'ACTIVE' && $current->credential_version === $user->credential_version, 403);
            if (! Hash::check($input['current_password'], $current->password)) {
                throw ValidationException::withMessages(['current_password' => 'The password is incorrect.']);
            }
            $this->revoke->handle($current, 'account.password_changed', $input['password']);
        });
    }
}
