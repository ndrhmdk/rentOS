<?php

namespace Tests\Unit\Models;

use App\Models\Tenancy;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Tests\TestCase;

class TenancyTest extends TestCase
{
    public function test_tenancy_and_user_tenancies_relations_are_properly_configured(): void
    {
        $tenancy = new Tenancy;

        $tenantRel = $tenancy->tenant();
        $this->assertInstanceOf(BelongsTo::class, $tenantRel);
        $this->assertSame('tenant_id', $tenantRel->getForeignKeyName());

        $ownerRel = $tenancy->owner();
        $this->assertInstanceOf(BelongsTo::class, $ownerRel);
        $this->assertSame('owner_id', $ownerRel->getForeignKeyName());

        $user = new User;
        $tenanciesRel = $user->tenancies();
        $this->assertInstanceOf(HasMany::class, $tenanciesRel);
        $this->assertSame('tenant_id', $tenanciesRel->getForeignKeyName());
    }
}
