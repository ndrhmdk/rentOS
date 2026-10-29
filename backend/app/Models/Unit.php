<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $property_id
 */
class Unit extends Model
{
    use HasUuids;

    protected $table = 'units';

    protected $fillable = [
        'property_id',
        'client_operation_id',
        'label',
        'unit_kind',
        'description',
        'floor',
        'area_m2',
        'bedrooms',
        'bathrooms',
        'bathroom_arrangement',
        'amenities',
        'advertised_monthly_rent',
        'deposit',
        'minimum_rental_months',
        'max_occupants',
        'operational_status',
        'is_marketed',
        'policy_overrides',
        'archived_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amenities' => 'object',
            'policy_overrides' => 'object',
            'operational_status' => 'string',
            'area_m2' => 'decimal:2',
            'bathrooms' => 'decimal:2',
            'advertised_monthly_rent' => 'integer',
            'deposit' => 'integer',
            'bedrooms' => 'integer',
            'minimum_rental_months' => 'integer',
            'max_occupants' => 'integer',
            'is_marketed' => 'boolean',
            'archived_at' => 'datetime',
        ];
    }

    /**
     * Get the property that owns the unit.
     *
     * @return BelongsTo<Property, $this>
     */
    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class, 'property_id');
    }
}
