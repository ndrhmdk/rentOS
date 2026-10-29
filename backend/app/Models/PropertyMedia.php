<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PropertyMedia extends Model
{
    use HasUuids;

    protected $table = 'property_media';

    protected $fillable = [
        'property_id',
        'unit_id',
        'uploaded_by',
        'client_operation_id',
        'storage_path',
        'caption',
        'sort_order',
        'is_selected_for_listing',
        'revision',
        'revision',
        'purged_at',
        'deleted_at',
        'sha256',
        'mime_type',
        'size_bytes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_selected_for_listing' => 'boolean',
            'revision' => 'integer',
            'revision' => 'integer',
            'size_bytes' => 'integer',
            'purged_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Property, $this>
     */
    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    /**
     * @return BelongsTo<Unit, $this>
     */
    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
