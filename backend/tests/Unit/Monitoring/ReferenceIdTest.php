<?php

namespace Tests\Unit\Monitoring;

use App\Monitoring\ReferenceId;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class ReferenceIdTest extends TestCase
{
    public function test_assign_for_job_replaces_stale_http_reference(): void
    {
        Log::flushSharedContext();
        Log::shareContext(['reference' => 'http-request-ref']);

        $this->assertSame('http-request-ref', ReferenceId::current());

        $jobRef = ReferenceId::assignForJob();

        $this->assertNotSame('http-request-ref', $jobRef);
        $this->assertSame($jobRef, ReferenceId::current());
        $this->assertSame($jobRef, Log::sharedContext()['reference'] ?? null);
    }

    public function test_clear_drops_shared_reference(): void
    {
        ReferenceId::assignForJob();
        $this->assertNotNull(ReferenceId::current());

        ReferenceId::clear();

        $this->assertNull(ReferenceId::current(new Request));
        $this->assertArrayNotHasKey('reference', Log::sharedContext());
    }
}
