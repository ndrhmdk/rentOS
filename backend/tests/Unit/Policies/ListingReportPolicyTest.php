<?php

namespace Tests\Unit\Policies;

use App\Models\ListingReport;
use App\Models\User;
use App\Policies\ListingReportPolicy;
use PHPUnit\Framework\TestCase;

class ListingReportPolicyTest extends TestCase
{
    private ListingReportPolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new ListingReportPolicy;
    }

    public function test_view_allows_admin_and_reporter_only(): void
    {
        $admin = new User;
        $admin->id = 'admin-1';
        $admin->is_admin = true;

        $reporter = new User;
        $reporter->id = 'user-1';
        $reporter->is_admin = false;

        $other = new User;
        $other->id = 'user-2';
        $other->is_admin = false;

        $report = new ListingReport;
        $report->reporter_id = 'user-1';

        $this->assertTrue($this->policy->view($admin, $report));
        $this->assertTrue($this->policy->view($reporter, $report));
        $this->assertFalse($this->policy->view($other, $report));
    }

    public function test_create_requires_active_account_status(): void
    {
        $activeUser = new User;
        $activeUser->account_status = 'ACTIVE';

        $suspendedUser = new User;
        $suspendedUser->account_status = 'SUSPENDED';

        $this->assertTrue($this->policy->create($activeUser));
        $this->assertFalse($this->policy->create($suspendedUser));
    }

    public function test_investigate_and_suspend_listing_require_admin(): void
    {
        $admin = new User;
        $admin->setDateFormat('Y-m-d H:i:s');
        $admin->is_admin = true;
        $admin->account_status = 'ACTIVE';
        $admin->email_verified_at = '2026-11-25 12:00:00';

        $unverifiedAdmin = new User;
        $unverifiedAdmin->setDateFormat('Y-m-d H:i:s');
        $unverifiedAdmin->is_admin = true;
        $unverifiedAdmin->account_status = 'ACTIVE';

        $suspendedAdmin = new User;
        $suspendedAdmin->setDateFormat('Y-m-d H:i:s');
        $suspendedAdmin->is_admin = true;
        $suspendedAdmin->account_status = 'SUSPENDED';
        $suspendedAdmin->email_verified_at = '2026-11-25 12:00:00';

        $regular = new User;
        $regular->setDateFormat('Y-m-d H:i:s');
        $regular->is_admin = false;
        $regular->account_status = 'ACTIVE';
        $regular->email_verified_at = '2026-11-25 12:00:00';

        $this->assertTrue($this->policy->investigate($admin));
        $this->assertFalse($this->policy->investigate($unverifiedAdmin));
        $this->assertFalse($this->policy->investigate($suspendedAdmin));
        $this->assertFalse($this->policy->investigate($regular));

        $this->assertTrue($this->policy->suspendListing($admin));
        $this->assertFalse($this->policy->suspendListing($unverifiedAdmin));
        $this->assertFalse($this->policy->suspendListing($suspendedAdmin));
        $this->assertFalse($this->policy->suspendListing($regular));
    }
}
