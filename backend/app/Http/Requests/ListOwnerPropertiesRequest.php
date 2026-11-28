<?php

namespace App\Http\Requests;

use App\Domain\Rentals\OwnerPropertyFilters;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListOwnerPropertiesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'include_archived' => ['sometimes', 'boolean'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'occupancy' => [
                'sometimes',
                'string',
                Rule::in(['all', ...OwnerPropertyFilters::OCCUPANCY]),
            ],
            'listing_status' => ['sometimes', 'array'],
            'listing_status.*' => [
                'string',
                Rule::in(OwnerPropertyFilters::LISTING_STATUS),
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        $statuses = $this->input('listing_status');
        if (is_string($statuses)) {
            $this->merge([
                'listing_status' => array_values(array_filter(
                    array_map('trim', explode(',', $statuses)),
                )),
            ]);
        }
    }
}
