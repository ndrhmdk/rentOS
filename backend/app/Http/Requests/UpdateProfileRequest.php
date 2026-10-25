<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->user());
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'], 'phone' => ['nullable', 'string', 'max:30', 'regex:/^[+0-9() .-]+$/'],
            'id' => ['prohibited'], 'is_admin' => ['prohibited'], 'account_status' => ['prohibited'],
            'email' => ['prohibited'], 'email_verified_at' => ['prohibited'], 'owner_id' => ['prohibited'],
            'user_id' => ['prohibited'], 'password' => ['prohibited'], 'credential_version' => ['prohibited'],
            // Q&A-01 (Khai): expected_revision stays disabled pending agreement on profile concurrency.
            'expected_revision' => ['prohibited'],
        ];
    }
}
