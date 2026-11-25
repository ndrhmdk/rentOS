<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tenancy extends Model
{
    use HasUuids;

    protected $table = 'tenancies';

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'confirmed_start_date' => 'date',
            'confirmed_end_date' => 'date',
            'blocked_start_date' => 'date',
            'blocked_end_date' => 'date',
            'confirmation_expires_at' => 'datetime',
            'moved_in_at' => 'datetime',
            'actual_ended_at' => 'datetime',
        ];
    }

    /**
     * Get the tenant user.
     *
     * @return BelongsTo<User, $this>
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tenant_id');
    }

    /**
     * Get the owner user.
     *
     * @return BelongsTo<User, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get the unit for this tenancy.
     *
     * @return BelongsTo<Unit, $this>
     */
    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }
}
