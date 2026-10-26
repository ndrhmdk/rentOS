<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'phone'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasUuids, Notifiable;

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'account_status' => 'ACTIVE',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
        ];
    }

    /**
     * Get the properties owned by this user.
     *
     * @return HasMany<Property, $this>
     */
    public function properties(): HasMany
    {
        return $this->hasMany(Property::class, 'owner_id');
    }

    /**
     * Get the tenancies where this user is the tenant.
     *
     * @return HasMany<Tenancy, $this>
     */
    public function tenancies(): HasMany
    {
        return $this->hasMany(Tenancy::class, 'tenant_id');
    }

    /**
     * Check if the user is a tenant with at least one tenancy.
     */
    public function isTenant(): bool
    {
        return DB::table('tenancies')->where('tenant_id', $this->id)->exists();
    }

    /**
     * Check if the user is an owner with at least one unarchived property.
     */
    public function isOwner(): bool
    {
        return DB::table('properties')
            ->where('owner_id', $this->id)
            ->whereNull('archived_at')
            ->exists();
    }

    /**
     * Check if the user is an administrator.
     */
    public function isAdmin(): bool
    {
        return (bool) $this->is_admin;
    }

    /**
     * Get the summarized role status for the user.
     *
     * @return array{is_admin: bool, is_tenant: bool, is_owner: bool, tenancies_count: int, properties_count: int, email_verified: bool}
     */
    public function getRoleStatus(): array
    {
        $tenanciesCount = DB::table('tenancies')->where('tenant_id', $this->id)->count();
        $propertiesCount = DB::table('properties')
            ->where('owner_id', $this->id)
            ->whereNull('archived_at')
            ->count();

        return [
            'is_admin' => $this->isAdmin(),
            'is_tenant' => $tenanciesCount > 0,
            'is_owner' => $propertiesCount > 0,
            'tenancies_count' => $tenanciesCount,
            'properties_count' => $propertiesCount,
            'email_verified' => $this->hasVerifiedEmail(),
        ];
    }
}
