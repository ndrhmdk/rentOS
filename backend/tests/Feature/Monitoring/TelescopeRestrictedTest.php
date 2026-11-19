<?php

namespace Tests\Feature\Monitoring;

use Tests\TestCase;

class TelescopeRestrictedTest extends TestCase
{
    public function test_telescope_is_unavailable_while_disabled(): void
    {
        config(['telescope.enabled' => false]);

        $this->get('/telescope')->assertNotFound();
    }
}
