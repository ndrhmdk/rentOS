<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $rental_arrangement
 */
class Property extends Model
{
    use HasUuids;

    protected $table = 'properties';

    protected $fillable = [
        'owner_id',
        'client_operation_id',
        'name',
        'property_type',
        'rental_arrangement',
        'address_line',
        'ward',
        'city',
        'description',
        'shared_amenities',
        'policies',
        'content_revision',
        'latitude',
        'longitude',
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
            'shared_amenities' => 'object',
            'policies' => 'array',
            'content_revision' => 'integer',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'archived_at' => 'datetime',
        ];
    }

    /**
     * Get the owner of the property.
     *
     * @return BelongsTo<User, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get the rentable units belonging to the property.
     *
     * @return HasMany<Unit, $this>
     */
    public function units(): HasMany
    {
        return $this->hasMany(Unit::class, 'property_id');
    }
}
