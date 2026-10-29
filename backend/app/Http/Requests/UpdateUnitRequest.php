<?php

namespace App\Http\Requests;

use App\Models\Property;
use App\Models\Unit;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        $property = $this->route('property');
        $unit = $this->route('unit');

        return $property instanceof Property
            && $unit instanceof Unit
            && $unit->property_id === $property->id
            && $this->user()?->can('update', $property) === true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'expected_content_revision' => ['required', 'integer', 'min:1'],
            'client_operation_id' => ['prohibited'],

            'label' => ['sometimes', 'required', 'string', 'max:120'],
            'unit_kind' => ['sometimes', 'required', Rule::in([
                'ROOM', 'STUDIO', 'APARTMENT', 'HOUSE',
            ])],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'floor' => ['sometimes', 'nullable', 'string', 'max:100'],
            'area_m2' => ['sometimes', 'nullable', 'numeric', 'gt:0'],
            'bedrooms' => ['sometimes', 'required', 'integer', 'min:0'],
            'bathrooms' => ['sometimes', 'required', 'numeric', 'min:0'],
            'bathroom_arrangement' => ['sometimes', 'required', Rule::in([
                'PRIVATE', 'SHARED',
            ])],
            'advertised_monthly_rent' => ['sometimes', 'nullable', 'integer', 'gt:0'],
            'deposit' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'minimum_rental_months' => ['sometimes', 'required', 'integer', 'min:3'],
            'max_occupants' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'operational_status' => ['sometimes', Rule::in([
                'READY', 'MAINTENANCE', 'RETIRED',
            ])],
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