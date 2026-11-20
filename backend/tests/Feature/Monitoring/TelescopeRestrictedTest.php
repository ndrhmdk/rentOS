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

    public function test_view_telescope_gate_allows_admins_only(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $tenant = User::factory()->create(['is_admin' => false]);

        $this->assertTrue(Gate::forUser($admin)->allows('viewTelescope'));
        $this->assertFalse(Gate::forUser($tenant)->allows('viewTelescope'));
    }
}
