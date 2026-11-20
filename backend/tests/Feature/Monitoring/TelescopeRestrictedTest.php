<?php

namespace Tests\Feature\Monitoring;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Tests\TestCase;

class TelescopeRestrictedTest extends TestCase
{
    use RefreshDatabase;

    public function test_telescope_is_unavailable_while_disabled(): void
    {
        config(['telescope.enabled' => false]);

        $this->get('/telescope')->assertNotFound();
    }

    public function test_view_telescope_gate_requires_active_verified_admin(): void
    {
        $admin = User::factory()->create([
            'is_admin' => true,
            'account_status' => 'ACTIVE',
            'email_verified_at' => now(),
        ]);
        $unverifiedAdmin = User::factory()->create([
            'is_admin' => true,
            'account_status' => 'ACTIVE',
            'email_verified_at' => null,
        ]);
        $inactiveAdmin = User::factory()->create([
            'is_admin' => true,
            'account_status' => 'SUSPENDED',
            'email_verified_at' => now(),
        ]);
        $tenant = User::factory()->create([
            'is_admin' => false,
            'account_status' => 'ACTIVE',
            'email_verified_at' => now(),
        ]);

        $this->assertTrue(Gate::forUser($admin)->allows('viewTelescope'));
        $this->assertFalse(Gate::forUser($unverifiedAdmin)->allows('viewTelescope'));
        $this->assertFalse(Gate::forUser($inactiveAdmin)->allows('viewTelescope'));
        $this->assertFalse(Gate::forUser($tenant)->allows('viewTelescope'));
    }
}
