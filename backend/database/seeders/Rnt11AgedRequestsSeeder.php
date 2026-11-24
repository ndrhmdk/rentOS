<?php

namespace Database\Seeders;

use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use LogicException;
use RuntimeException;

/**
 * Seeder to inject standardized test cases for RNT-11 (FR85 15-day rule).
 *
 * Usage:
 *   Inject test data:  php artisan db:seed --class="Database\Seeders\Rnt11AgedRequestsSeeder"
 *   Clean up test data: php artisan db:seed --class="Database\Seeders\Rnt11AgedRequestsSeeder" -- --clean
 */
class Rnt11AgedRequestsSeeder extends Seeder
{
    public const string FIXTURE_KEY = 'RNT-11-aged-requests-v1';

    public function id(int $index): string
    {
        return sprintf('b1100000-0000-4000-8000-%012d', $index);
    }

    public function run(bool $clean = false): void
    {
        $connection = config('database.connections.'.config('database.default'));
        $host = is_array($connection) ? ($connection['host'] ?? null) : null;

        if (
            ! app()->environment(['local', 'testing', 'development'])
            || ! in_array($host, ['localhost', '127.0.0.1', 'rentos-rnt04-db', 'db'], true)
        ) {
            throw new LogicException('The RNT-11 demo fixture can only run against an isolated local PostgreSQL database.');
        }

        if ($clean || in_array('--clean', $_SERVER['argv'] ?? [], true)) {
            $this->cleanUp();

            return;
        }

        $this->seedFixture();
    }

    public function cleanUp(): void
    {
        $this->command?->info('Cleaning up RNT-11 test fixtures...');

        $requestIds = [
            $this->id(13), // Case 1 request
            $this->id(15), // Case 1 dummy tenancy request
            $this->id(24), // Case 2 request
            $this->id(26), // Case 2 dummy tenancy request
            $this->id(33), // Case 3 request
            $this->id(35), // Case 3 dummy tenancy request
            $this->id(43), // Case 4 request
            $this->id(45), // Case 4 dummy tenancy request
        ];

        $tenancyIds = [
            $this->id(14),
            $this->id(25),
            $this->id(34),
            $this->id(44),
        ];

        DB::statement('SET session_replication_role = replica;');

        try {
            // 1. Delete notifications
            DB::table('notifications')
                ->whereIn('resource_id', $requestIds)
                ->delete();

            // 2. Delete audit logs
            DB::table('audit_logs')
                ->where('entity_type', 'rental_request')
                ->whereIn('entity_id', $requestIds)
                ->delete();

            // 3. Delete tenancy contracts & renewal requests
            DB::table('tenancy_contracts')
                ->whereIn('tenancy_id', $tenancyIds)
                ->delete();

            DB::table('tenancy_renewal_requests')
                ->whereIn('tenancy_id', $tenancyIds)
                ->delete();

            // 4. Delete tenancies
            DB::table('tenancies')
                ->whereIn('id', $tenancyIds)
                ->delete();

            // 5. Delete rental requests
            DB::table('rental_requests')
                ->whereIn('id', $requestIds)
                ->delete();

            // 6. Delete listings
            DB::table('listings')
                ->whereIn('id', [
                    $this->id(12),
                    $this->id(23),
                    $this->id(32),
                    $this->id(42),
                ])
                ->delete();

            // 6b. Delete property media
            DB::table('property_media')
                ->whereIn('property_id', [
                    $this->id(10),
                    $this->id(20),
                    $this->id(30),
                    $this->id(40),
                ])
                ->delete();

            // 7. Delete units
            DB::table('units')
                ->whereIn('id', [
                    $this->id(11),
                    $this->id(21),
                    $this->id(22),
                    $this->id(31),
                    $this->id(41),
                ])
                ->delete();

            // 8. Delete properties
            DB::table('properties')
                ->whereIn('id', [
                    $this->id(10),
                    $this->id(20),
                    $this->id(30),
                    $this->id(40),
                ])
                ->delete();
        } finally {
            DB::statement('SET session_replication_role = DEFAULT;');
        }

        $this->command?->info('All RNT-11 test fixtures have been removed successfully.');
    }

    private function seedFixture(): void
    {
        // First ensure existing fixtures are cleaned
        $this->cleanUp();

        $owner = DB::table('users')->where('email', 'owner1@rentos.test')->first();
        $tenant = DB::table('users')->where('email', 'tenant1@example.com')->first();

        if ($owner === null || $tenant === null) {
            throw new RuntimeException('Baseline accounts (owner1@rentos.test, tenant1@example.com) not found. Run BaselineSeeder first.');
        }

        $now = CarbonImmutable::now();

        DB::statement('SET session_replication_role = replica;');

        try {
            // -------------------------------------------------------------------------
            // CASE 1: Aged >= 16 days, all units blocked -> EXPECTED: REJECTED (NO_AVAILABLE_UNIT)
            // -------------------------------------------------------------------------
            $this->createProperty($this->id(10), $owner->id, 'RNT11 Tòa nhà 1 - Hết phòng');
            $this->createUnit($this->id(11), $this->id(10), $owner->id, 'P.101', 5000000);
            $this->createListing($this->id(12), $this->id(10), $owner->id, $this->id(19), 'Căn hộ RNT11 Test Case 1');

            // Create rental request: 16 days old (desired interval: +5 days to +95 days)
            $this->createRentalRequest(
                id: $this->id(13),
                listingId: $this->id(12),
                tenantId: $tenant->id,
                createdAt: $now->subDays(16),
                moveIn: $now->addDays(5)->toDateString(),
                end: $now->addDays(95)->toDateString(),
            );

            // Block unit 11 with an active tenancy covering that interval
            $this->createBlockingTenancy(
                id: $this->id(14),
                unitId: $this->id(11),
                ownerId: $owner->id,
                tenantId: $tenant->id,
                dummyRequestId: $this->id(15),
                listingId: $this->id(12),
                status: 'ACTIVE',
                start: $now->addDays(1)->toDateString(),
                end: $now->addDays(180)->toDateString(),
            );

            // -------------------------------------------------------------------------
            // CASE 2: Aged >= 16 days, preferred unit blocked, but ALT UNIT FREE -> EXPECTED: PENDING_KEPT
            // -------------------------------------------------------------------------
            $this->createProperty($this->id(20), $owner->id, 'RNT11 Tòa nhà 2 - Còn phòng thay thế');
            $this->createUnit($this->id(21), $this->id(20), $owner->id, 'P.201 (Ưa thích)', 6000000);
            $this->createUnit($this->id(22), $this->id(20), $owner->id, 'P.202 (Trống thay thế)', 6200000);
            $this->createListing($this->id(23), $this->id(20), $owner->id, $this->id(29), 'Căn hộ RNT11 Test Case 2');

            $this->createRentalRequest(
                id: $this->id(24),
                listingId: $this->id(23),
                tenantId: $tenant->id,
                createdAt: $now->subDays(16),
                moveIn: $now->addDays(5)->toDateString(),
                end: $now->addDays(95)->toDateString(),
                preferredUnitId: $this->id(21),
            );

            // Block ONLY the preferred unit 21. Unit 22 remains FREE!
            $this->createBlockingTenancy(
                id: $this->id(25),
                unitId: $this->id(21),
                ownerId: $owner->id,
                tenantId: $tenant->id,
                dummyRequestId: $this->id(26),
                listingId: $this->id(23),
                status: 'CONFIRMED',
                start: $now->addDays(1)->toDateString(),
                end: $now->addDays(180)->toDateString(),
            );

            // -------------------------------------------------------------------------
            // CASE 3: Young request (7 days old), all units blocked -> EXPECTED: PENDING_KEPT (Not due)
            // -------------------------------------------------------------------------
            $this->createProperty($this->id(30), $owner->id, 'RNT11 Tòa nhà 3 - Yêu cầu mới 7 ngày');
            $this->createUnit($this->id(31), $this->id(30), $owner->id, 'P.301', 4500000);
            $this->createListing($this->id(32), $this->id(30), $owner->id, $this->id(39), 'Căn hộ RNT11 Test Case 3');

            $this->createRentalRequest(
                id: $this->id(33),
                listingId: $this->id(32),
                tenantId: $tenant->id,
                createdAt: $now->subDays(7), // Only 7 days old!
                moveIn: $now->addDays(5)->toDateString(),
                end: $now->addDays(95)->toDateString(),
            );

            $this->createBlockingTenancy(
                id: $this->id(34),
                unitId: $this->id(31),
                ownerId: $owner->id,
                tenantId: $tenant->id,
                dummyRequestId: $this->id(35),
                listingId: $this->id(32),
                status: 'ACTIVE',
                start: $now->addDays(1)->toDateString(),
                end: $now->addDays(180)->toDateString(),
            );

            // -------------------------------------------------------------------------
            // CASE 4: Aged >= 16 days, blocked by EXPIRED HOLD -> EXPECTED: Reap hold -> PENDING_KEPT
            // -------------------------------------------------------------------------
            $this->createProperty($this->id(40), $owner->id, 'RNT11 Tòa nhà 4 - Hold hết hạn');
            $this->createUnit($this->id(41), $this->id(40), $owner->id, 'P.401', 5500000);
            $this->createListing($this->id(42), $this->id(40), $owner->id, $this->id(49), 'Căn hộ RNT11 Test Case 4');

            $this->createRentalRequest(
                id: $this->id(43),
                listingId: $this->id(42),
                tenantId: $tenant->id,
                createdAt: $now->subDays(16),
                moveIn: $now->addDays(5)->toDateString(),
                end: $now->addDays(95)->toDateString(),
            );

            // Create expired hold tenancy: confirmation_expires_at was 2 hours ago
            $this->createBlockingTenancy(
                id: $this->id(44),
                unitId: $this->id(41),
                ownerId: $owner->id,
                tenantId: $tenant->id,
                dummyRequestId: $this->id(45),
                listingId: $this->id(42),
                status: 'PENDING_CONFIRMATION',
                start: $now->addDays(1)->toDateString(),
                end: $now->addDays(180)->toDateString(),
                confirmationExpiresAt: $now->subHours(2),
            );
        } finally {
            DB::statement('SET session_replication_role = DEFAULT;');
        }

        $this->command?->info('Injected 4 standardized RNT-11 test cases successfully:');
        $this->command?->table(
            ['Case', 'Request ID', 'Tuổi (ngày)', 'Trạng thái phòng', 'Kỳ vọng sau khi quét'],
            [
                ['Case 1', $this->id(13), '16 ngày', 'Tất cả phòng kín lịch', 'REJECTED (NO_AVAILABLE_UNIT)'],
                ['Case 2', $this->id(24), '16 ngày', 'Căn ưu tiên kín, căn P.202 trống', 'PENDING_KEPT (giữ nguyên PENDING)'],
                ['Case 3', $this->id(33), '7 ngày', 'Phòng kín nhưng chưa đủ 15 ngày', 'PENDING_KEPT (chưa đến hạn quét)'],
                ['Case 4', $this->id(43), '16 ngày', 'Phòng vướng hold đã hết hạn', 'PENDING_KEPT (thu hồi hold -> còn phòng)'],
            ]
        );
    }

    private function createProperty(string $id, string $ownerId, string $name): void
    {
        DB::table('properties')->insert([
            'id' => $id,
            'owner_id' => $ownerId,
            'client_operation_id' => (string) Str::uuid(),
            'name' => $name,
            'property_type' => 'APARTMENT',
            'rental_arrangement' => 'SEPARATE_UNITS',
            'address_line' => '123 Đường Test RNT-11',
            'city' => 'Đà Nẵng',
            'description' => 'Mô tả bất động sản test RNT-11.',
            'policies' => json_encode([
                'schema_version' => 1,
                'pets' => 'NOT_ALLOWED',
                'smoking' => 'NOT_ALLOWED',
                'shared_rules' => [],
            ], JSON_THROW_ON_ERROR),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function createUnit(string $id, string $propertyId, string $ownerId, string $label, int $rent): void
    {
        DB::table('units')->insert([
            'id' => $id,
            'property_id' => $propertyId,
            'client_operation_id' => (string) Str::uuid(),
            'label' => $label,
            'unit_kind' => 'STUDIO',
            'description' => 'Căn hộ thử nghiệm RNT-11.',
            'floor' => '1',
            'area_m2' => 35,
            'bedrooms' => 1,
            'bathrooms' => 1,
            'bathroom_arrangement' => 'PRIVATE',
            'amenities' => json_encode([
                'schema_version' => 1,
                'standard' => new \stdClass,
                'custom' => [],
            ], JSON_THROW_ON_ERROR),
            'advertised_monthly_rent' => $rent,
            'deposit' => $rent,
            'minimum_rental_months' => 3,
            'max_occupants' => 2,
            'operational_status' => 'READY',
            'is_marketed' => true,
            'policy_overrides' => '{}',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->createMedia((string) Str::uuid(), $propertyId, $ownerId, $id);
    }

    private function createMedia(string $id, string $propertyId, string $ownerId, ?string $unitId = null): void
    {
        DB::table('property_media')->insert([
            'id' => $id,
            'property_id' => $propertyId,
            'unit_id' => $unitId,
            'uploaded_by' => $ownerId,
            'client_operation_id' => (string) Str::uuid(),
            'storage_path' => "listings/{$id}.jpg",
            'caption' => $unitId ? 'Ảnh phòng' : 'Ảnh bìa',
            'sort_order' => 0,
            'is_selected_for_listing' => true,
            'sha256' => hash('sha256', $id),
            'mime_type' => 'image/jpeg',
            'size_bytes' => 12000,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function createListing(string $id, string $propertyId, string $ownerId, string $mediaId, string $title): void
    {
        $this->createMedia($mediaId, $propertyId, $ownerId);

        DB::table('listings')->insert([
            'id' => $id,
            'property_id' => $propertyId,
            'client_operation_id' => (string) Str::uuid(),
            'title' => $title,
            'description' => 'Tin đăng thử nghiệm RNT-11.',
            'cover_media_id' => $mediaId,
            'moderation_status' => 'APPROVED',
            'publication_status' => 'PUBLISHED',
            'submitted_revision' => 1,
            'submitted_at' => now(),
            'reviewed_by' => $ownerId,
            'reviewed_at' => now(),
            'submitted_content_revision' => 1,
            'approved_content_revision' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function createRentalRequest(
        string $id,
        string $listingId,
        string $tenantId,
        CarbonImmutable $createdAt,
        string $moveIn,
        string $end,
        ?string $preferredUnitId = null,
    ): void {
        DB::table('rental_requests')->insert([
            'id' => $id,
            'listing_id' => $listingId,
            'tenant_id' => $tenantId,
            'preferred_unit_id' => $preferredUnitId,
            'client_operation_id' => (string) Str::uuid(),
            'desired_move_in_date' => $moveIn,
            'desired_end_date' => $end,
            'message' => 'Yêu cầu thuê thử nghiệm RNT-11.',
            'contact_name' => 'Nguyễn Văn Tenant',
            'contact_phone' => '0901234567',
            'status' => 'PENDING',
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);
    }

    private function createBlockingTenancy(
        string $id,
        string $unitId,
        string $ownerId,
        string $tenantId,
        string $dummyRequestId,
        string $listingId,
        string $status,
        string $start,
        string $end,
        ?CarbonImmutable $confirmationExpiresAt = null,
    ): void {
        // Create a dummy closed rental request so foreign key in tenancies is satisfied
        DB::table('rental_requests')->insert([
            'id' => $dummyRequestId,
            'listing_id' => $listingId,
            'tenant_id' => $tenantId,
            'client_operation_id' => (string) Str::uuid(),
            'desired_move_in_date' => $start,
            'desired_end_date' => $end,
            'message' => 'Dummy request for blocking tenancy.',
            'contact_name' => 'Dummy',
            'contact_phone' => '0900000000',
            'status' => 'ACCEPTED',
            'closed_at' => now()->subMonths(1),
            'created_at' => now()->subMonths(1),
            'updated_at' => now()->subMonths(1),
        ]);

        $pendingContractId = $confirmationExpiresAt ? (string) Str::uuid() : null;

        DB::table('tenancies')->insert([
            'id' => $id,
            'unit_id' => $unitId,
            'tenant_id' => $tenantId,
            'owner_id' => $ownerId,
            'rental_request_id' => $dummyRequestId,
            'client_operation_id' => (string) Str::uuid(),
            'status' => $status,
            'confirmed_start_date' => in_array($status, ['CONFIRMED', 'ACTIVE'], true) ? $start : null,
            'confirmed_end_date' => in_array($status, ['CONFIRMED', 'ACTIVE'], true) ? $end : null,
            'blocked_start_date' => $start,
            'blocked_end_date' => $end,
            'pending_contract_id' => $pendingContractId,
            'confirmation_expires_at' => $confirmationExpiresAt,
            'moved_in_at' => $status === 'ACTIVE' ? now() : null,
            'created_at' => now()->subDays(5),
            'updated_at' => now()->subDays(5),
        ]);

        if ($pendingContractId !== null) {
            DB::table('tenancy_contracts')->insert([
                'id' => $pendingContractId,
                'tenancy_id' => $id,
                'version_number' => 1,
                'type' => 'ORIGINAL',
                'start_date' => $start,
                'end_date' => $end,
                'monthly_rent' => 5000000,
                'deposit_amount' => 5000000,
                'policies_snapshot' => json_encode([
                    'schema_version' => 1,
                    'pets' => 'NOT_ALLOWED',
                    'smoking' => 'NOT_ALLOWED',
                    'shared_rules' => [],
                ], JSON_THROW_ON_ERROR),
                'document_path' => 'contracts/'.$pendingContractId.'.pdf',
                'document_sha256' => hash('sha256', $pendingContractId),
                'created_by' => $ownerId,
                'owner_confirmed_at' => now()->subDays(2),
                'tenant_confirmed_at' => null,
                'tenant_rejected_at' => null,
                'created_at' => now()->subDays(2),
            ]);
        }
    }
}
