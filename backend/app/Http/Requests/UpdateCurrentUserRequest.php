<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateCurrentUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::guard('web')->check() && $this->user()->account_status === 'ACTIVE';
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:64'],
            'id' => ['prohibited'],
            'email' => ['prohibited'],
            'email_verified_at' => ['prohibited'],
            'is_admin' => ['prohibited'],
            'account_status' => ['prohibited'],
            'password' => ['prohibited'],
            'remember_token' => ['prohibited'],
        ];
    }
}
