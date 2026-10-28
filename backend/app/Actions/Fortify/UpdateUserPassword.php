<?php

namespace App\Actions\Fortify;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\UpdatesUserPasswords;

class UpdateUserPassword implements UpdatesUserPasswords
{
    use PasswordValidationRules;

    /**
     * Validate and update the user's password.
     *
     * @param  array<string, string>  $input
     *
     * @throws ValidationException
     */
    public function update(User $user, array $input): void
    {
        Validator::make($input, [
            'current_password' => ['bail', 'required', 'string', 'current_password:web'],
            'password' => $this->passwordRules(),
        ], [
            'current_password.current_password' => __('The provided password does not match your current password.'),
        ])->validateWithBag('updatePassword');

        DB::transaction(function () use ($user, $input): void {
            $user = User::query()->lockForUpdate()->findOrFail($user->getKey());
            if (! Hash::check($input['current_password'], $user->password)) {
                throw ValidationException::withMessages([
                    'current_password' => __('The provided password does not match your current password.'),
                ])->errorBag('updatePassword');
            }

            $user->forceFill([
                'password' => Hash::make($input['password']),
                'remember_token' => Str::random(60),
            ])->save();

            DB::table(config('session.table'))
                ->where('user_id', $user->getAuthIdentifier())
                ->delete();

            $user->tokens()->delete();
        });
    }
}
