<?php

namespace App\Http\Requests;

use App\Models\Property;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        $property = $this->route('property');

        return $property instanceof Property
            && $property->rental_arrangement === 'SEPARATE_UNITS'
            && $this->user()?->can('update', $property) === true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'client_operation_id' => ['required', 'uuid'],
            'label' => [
                'required', 'string', 'max:120',
                Rule::unique('units', 'label')
                    ->where('property_id', $this->route('property')?->id)
                    ->whereNull('archived_at'),
            ],
            'unit_kind' => ['required', Rule::in(['ROOM', 'STUDIO', 'APARTMENT', 'HOUSE'])],
            'description' => ['nullable', 'string', 'max:5000'],
            'floor' => ['nullable', 'string', 'max:100'],
            'area_m2' => ['nullable', 'numeric', 'gt:0'],
            'bedrooms' => ['required', 'integer', 'min:0'],
            'bathrooms' => ['required', 'numeric', 'min:0'],
            'bathroom_arrangement' => ['required', Rule::in(['PRIVATE', 'SHARED'])],
            'advertised_monthly_rent' => ['nullable', 'integer', 'gt:0'],
            'deposit' => ['nullable', 'integer', 'min:0'],
            'minimum_rental_months' => ['required', 'integer', 'min:3'],
            'max_occupants' => ['nullable', 'integer', 'min:1'],
            'operational_status' => ['sometimes', Rule::in(['READY', 'MAINTENANCE', 'RETIRED'])],
            'is_marketed' => ['sometimes', 'boolean'],
            'amenities' => ['sometimes', 'array'],
            'amenities.schema_version' => ['required_with:amenities', 'integer', Rule::in([1])],
            'amenities.standard' => ['required_with:amenities', 'array'],
            'amenities.custom' => ['required_with:amenities', 'array', 'max:50'],
            'amenities.custom.*' => ['string', 'max:120'],
            'policy_overrides' => ['sometimes', 'array'],
            'policy_overrides.*' => ['string'],
        ];
    }
}