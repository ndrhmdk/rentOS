<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Indexes for the hot read paths that had no supporting index.
 *
 * - rental_requests_pending_created_at_index: hourly `rentals:reject-aged` scan
 *   (status = PENDING AND created_at <= cutoff, walked by id).
 * - rental_requests_listing_status_created_at_index: owner request inbox and its
 *   status counts (join on listing_id, filter by status, order by created_at).
 * - tenancies_confirmation_expiry_index: every-minute `tenancies:expire-confirmations`
 *   scan for pending contracts whose confirmation window has passed.
 * - tenancies_tenant_id_created_at_index: tenant tenancy list (owner_id is already
 *   covered by the (owner_id, client_operation_id) unique index).
 *
 * Unit availability overlap is already served by the tenancies_no_overlapping_blocked_ranges
 * GiST index, so it is not duplicated here.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement("CREATE INDEX rental_requests_pending_created_at_index ON rental_requests (created_at, id) WHERE status = 'PENDING'");
        DB::statement('CREATE INDEX rental_requests_listing_status_created_at_index ON rental_requests (listing_id, status, created_at, id)');
        DB::statement('CREATE INDEX tenancies_confirmation_expiry_index ON tenancies (confirmation_expires_at, id) WHERE pending_contract_id IS NOT NULL AND confirmation_expires_at IS NOT NULL');
        DB::statement('CREATE INDEX tenancies_tenant_id_created_at_index ON tenancies (tenant_id, created_at)');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS tenancies_tenant_id_created_at_index');
        DB::statement('DROP INDEX IF EXISTS tenancies_confirmation_expiry_index');
        DB::statement('DROP INDEX IF EXISTS rental_requests_listing_status_created_at_index');
        DB::statement('DROP INDEX IF EXISTS rental_requests_pending_created_at_index');
    }
};
