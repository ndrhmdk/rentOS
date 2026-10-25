<?php

namespace App\Actions\Identity;

use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateAccount implements CreatesNewUsers
{
    /** @param array<string, mixed> $input */
    public function create(array $input): User
    {
        if (is_string($input['email'] ?? null)) {
            $input['email'] = Str::lower(trim($input['email']));
        }
        $data = Validator::make($input, [
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:254', 'unique:users,email'],
            'password' => ['required', 'string', Password::min(12)->letters()->mixedCase()->numbers(), 'confirmed'],
            'is_admin' => ['prohibited'], 'account_status' => ['prohibited'], 'id' => ['prohibited'],
            'email_verified_at' => ['prohibited'], 'owner_id' => ['prohibited'], 'user_id' => ['prohibited'],
        ], ['email.unique' => 'Unable to register. Try signing in or resetting your password.'])->validate();
        try {
            return DB::transaction(fn (): User => User::create(['name' => $data['name'], 'email' => $data['email'], 'password' => $data['password']]));
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages(['email' => 'Unable to register. Try signing in or resetting your password.']);
        }
    }
}
