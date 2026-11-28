<?php

namespace App\Actions\Fortify;

use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\CreatesNewUsers;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     *
     * @throws ValidationException
     */
    public function create(array $input): User
    {
        $throttleKey = 'register|'.(request()->ip() ?? 'unknown');
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            throw new TooManyRequestsHttpException(
                RateLimiter::availableIn($throttleKey),
                'Bạn thao tác quá nhanh. Vui lòng chờ rồi thử lại.',
            );
        }
        RateLimiter::hit($throttleKey, 60);

        if (is_string($input['email'] ?? null)) {
            $input['email'] = mb_strtolower(trim($input['email']));
        }
        if (is_string($input['name'] ?? null)) {
            $input['name'] = trim($input['name']);
        }

        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'bail',
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email'),
            ],
            'password' => $this->passwordRules(),
        ])->validate();

        try {
            return User::create([
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => Hash::make($input['password']),
            ]);
        } catch (UniqueConstraintViolationException $exception) {
            throw ValidationException::withMessages([
                'email' => __('The email has already been taken.'),
            ]);
        }
    }
}
