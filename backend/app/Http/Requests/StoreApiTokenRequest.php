<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreApiTokenRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('manageTokens', $this->user());
    }

    protected function prepareForValidation(): void
    {
        if (! $this->exists('expiry_days')) {
            $this->merge(['expiry_days' => config('identity.default_token_expiry_days')]);
        }
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'abilities' => ['required', 'array', 'min:1', 'max:3'],
            'abilities.*' => ['required', 'string', 'distinct', Rule::in(config('identity.token_abilities'))],
            'expiry_days' => ['required', 'integer', Rule::in(config('identity.token_expiry_days'))],
            'user_id' => ['prohibited'], 'tokenable_id' => ['prohibited'], 'tokenable_type' => ['prohibited'],
        ];
    }
}
