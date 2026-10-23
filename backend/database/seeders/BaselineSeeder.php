<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use LogicException;
use RuntimeException;

class BaselineSeeder extends Seeder
{
    public const int USER_COUNT = 10;

    public const int PROPERTY_COUNT = 20;

    public const int PUBLISHED_PROPERTY_COUNT = 16;

    public const string ADMIN_USER_ID = '10000000-0000-4000-8000-000000000001';

    public const string OWNER_USER_ID = '10000000-0000-4000-8000-000000000002';

    public const string TENANT_USER_ID = '10000000-0000-4000-8000-000000000007';

    public const string PUBLISHED_PROPERTY_ID = '20000000-0000-4000-8000-000000000001';

    public const string DRAFT_PROPERTY_ID = '20000000-0000-4000-8000-000000000017';

    public const string PUBLISHED_UNIT_ID = '30000000-0000-4000-8000-000000000001';

    public const string DRAFT_UNIT_ID = '30000000-0000-4000-8000-000000000017';

    public const string PROPERTY_COVER_MEDIA_ID = '40000000-0000-4000-8000-000000000001';

    public const string UNIT_MEDIA_ID = '41000000-0000-4000-8000-000000000001';

    public const string PUBLISHED_LISTING_ID = '50000000-0000-4000-8000-000000000001';

    public const string DRAFT_LISTING_ID = '50000000-0000-4000-8000-000000000017';

    public const string DEVELOPMENT_PASSWORD = 'password';

    private const string FIXED_TIMESTAMP = '2026-01-01 00:00:00+00';

    /**
     * @var array<int, string>
     */
    private const array DISTRICTS = ['Hai Chau', 'Thanh Khe', 'Son Tra', 'Ngu Hanh Son', 'Lien Chieu'];

    /**
     * @return array<int, string>
     */
    public static function userIds(): array
    {
        return self::ids('10000000', self::USER_COUNT);
    }

    /**
     * @return array<int, string>
     */
    public static function propertyIds(): array
    {
        return self::ids('20000000', self::PROPERTY_COUNT);
    }

    /**
     * @return array<int, string>
     */
    public static function unitIds(): array
    {
        return self::ids('30000000', self::PROPERTY_COUNT);
    }

    /**
     * @return array<int, string>
     */
    public static function listingIds(): array
    {
        return self::ids('50000000', self::PROPERTY_COUNT);
    }

    /**
     * @return array<int, string>
     */
    public static function mediaIds(): array
    {
        return array_column(self::mediaFixtures(), 'id');
    }

    /**
     * @return array<int, array{
     *     id: string,
     *     property_id: string,
     *     unit_id: ?string,
     *     client_operation_id: string,
     *     source_file: string,
     *     storage_path: string,
     *     caption: string,
     *     sort_order: int
     * }>
     */
    public static function mediaFixtures(): array
    {
        $fixtures = [];

        for ($number = 1; $number <= self::PUBLISHED_PROPERTY_COUNT; $number++) {
            $propertyId = self::id('20000000', $number);
            $fixtures[] = [
                'id' => self::id('40000000', $number),
                'property_id' => $propertyId,
                'unit_id' => null,
                'client_operation_id' => self::id('42000000', $number),
                'source_file' => 'published-property-gallery-01.png',
                'storage_path' => "properties/{$propertyId}/gallery-01.png",
                'caption' => "Shared view for demo property {$number}",
                'sort_order' => 0,
            ];
            $fixtures[] = [
                'id' => self::id('41000000', $number),
                'property_id' => $propertyId,
                'unit_id' => self::id('30000000', $number),
                'client_operation_id' => self::id('43000000', $number),
                'source_file' => 'published-property-unit-01.png',
                'storage_path' => "properties/{$propertyId}/unit-01.png",
                'caption' => "Unit photo for demo property {$number}",
                'sort_order' => 1,
            ];
        }

        return $fixtures;
    }

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (app()->isProduction()) {
            throw new LogicException('Baseline seeding is forbidden in production.');
        }

        DB::transaction(function (): void {
            $this->seedUsersAndProfiles();
            $this->seedProperties();
            $this->seedUnits();
            $this->seedMedia();
            $this->seedListings();
            $this->seedFavourites();
        });
    }

    private function seedUsersAndProfiles(): void
    {
        for ($number = 1; $number <= self::USER_COUNT; $number++) {
            $role = match (true) {
                $number === 1 => 'admin',
                $number <= 6 => 'owner',
                default => 'tenant',
            };
            $email = $role === 'tenant'
                ? 'tenant'.($number - 6).'@example.com'
                : ($role === 'admin' ? 'admin@rentos.test' : 'owner'.($number - 1).'@rentos.test');
            $name = match ($role) {
                'admin' => 'RentOS Admin',
                'owner' => 'Demo Owner '.($number - 1),
                default => 'Demo Tenant '.($number - 6),
            };
            $id = self::id('10000000', $number);
            $attributes = [
                'name' => $name,
                'email' => $email,
                'email_verified_at' => self::FIXED_TIMESTAMP,
                'updated_at' => self::FIXED_TIMESTAMP,
            ];

            if (DB::table('users')->where('id', $id)->exists()) {
                DB::table('users')->where('id', $id)->update($attributes);
            } else {
                DB::table('users')->insert($attributes + [
                    'id' => $id,
                    'password' => Hash::make(self::DEVELOPMENT_PASSWORD),
                    'created_at' => self::FIXED_TIMESTAMP,
                ]);
            }

            DB::table('user_profiles')->updateOrInsert(
                ['id' => $id],
                [
                    'full_name' => $name,
                    'phone' => sprintf('+849000000%02d', $number),
                    'is_admin' => $role === 'admin',
                    'account_status' => 'ACTIVE',
                    'created_at' => self::FIXED_TIMESTAMP,
                    'updated_at' => self::FIXED_TIMESTAMP,
                ],
            );
        }
    }

    private function seedProperties(): void
    {
        $amenities = json_encode([
            'schema_version' => 1,
            'standard' => ['wifi' => true],
            'custom' => [],
        ], JSON_THROW_ON_ERROR);
        $policies = json_encode([
            'schema_version' => 1,
            'pets' => 'WITH_APPROVAL',
            'smoking' => 'NOT_ALLOWED',
            'shared_rules' => ['Quiet hours after 22:00'],
        ], JSON_THROW_ON_ERROR);
        $ownerIds = array_map(
            fn (int $number): string => self::id('10000000', $number),
            range(2, 6),
        );

        for ($number = 1; $number <= self::PROPERTY_COUNT; $number++) {
            $published = $number <= self::PUBLISHED_PROPERTY_COUNT;

            DB::table('properties')->updateOrInsert(
                ['id' => self::id('20000000', $number)],
                [
                    'owner_id' => $ownerIds[($number - 1) % count($ownerIds)],
                    'client_operation_id' => self::id('21000000', $number),
                    'name' => sprintf('Demo Property %02d', $number),
                    'property_type' => $number % 2 === 0 ? 'APARTMENT' : 'HOUSE',
                    'rental_arrangement' => 'SEPARATE_UNITS',
                    'address_line' => $published ? "{$number} Bach Dang Street" : null,
                    'ward' => $published ? 'Hai Chau I' : null,
                    'district' => $published ? self::DISTRICTS[($number - 1) % count(self::DISTRICTS)] : null,
                    'city' => 'Da Nang',
                    'description' => $published
                        ? 'A complete demo rental property for local testing.'
                        : 'An intentionally incomplete draft property.',
                    'shared_amenities' => $amenities,
                    'policies' => $policies,
                    'content_revision' => 1,
                    'latitude' => $published ? 16.06 + ($number / 1000) : null,
                    'longitude' => $published ? 108.22 + ($number / 1000) : null,
                    'archived_at' => null,
                    'created_at' => self::FIXED_TIMESTAMP,
                    'updated_at' => self::FIXED_TIMESTAMP,
                ],
            );
        }
    }

    private function seedUnits(): void
    {
        $amenities = json_encode([
            'schema_version' => 1,
            'standard' => ['air_conditioning' => true],
            'custom' => [],
        ], JSON_THROW_ON_ERROR);

        for ($number = 1; $number <= self::PROPERTY_COUNT; $number++) {
            $published = $number <= self::PUBLISHED_PROPERTY_COUNT;

            DB::table('units')->updateOrInsert(
                ['id' => self::id('30000000', $number)],
                [
                    'property_id' => self::id('20000000', $number),
                    'client_operation_id' => self::id('31000000', $number),
                    'label' => 'Unit 101',
                    'unit_kind' => 'STUDIO',
                    'description' => $published ? 'Furnished demo unit ready to market.' : null,
                    'floor' => '1',
                    'area_m2' => $published ? 28 + $number : null,
                    'bedrooms' => 1,
                    'bathrooms' => 1,
                    'bathroom_arrangement' => 'PRIVATE',
                    'amenities' => $amenities,
                    'advertised_monthly_rent' => $published ? 5000000 + ($number * 100000) : null,
                    'deposit' => $published ? 5000000 : null,
                    'minimum_rental_months' => 3,
                    'max_occupants' => $published ? 2 : null,
                    'operational_status' => 'READY',
                    'is_marketed' => $published,
                    'policy_overrides' => '{}',
                    'archived_at' => null,
                    'created_at' => self::FIXED_TIMESTAMP,
                    'updated_at' => self::FIXED_TIMESTAMP,
                ],
            );
        }
    }

    private function seedMedia(): void
    {
        foreach (self::mediaFixtures() as $fixture) {
            $sourcePath = database_path('seeders/fixtures/media/'.$fixture['source_file']);

            if (! is_file($sourcePath)) {
                throw new RuntimeException("Baseline media fixture is missing: {$sourcePath}");
            }

            $mimeType = mime_content_type($sourcePath);
            $sha256 = hash_file('sha256', $sourcePath);
            $size = filesize($sourcePath);

            if ($mimeType !== 'image/png' || $sha256 === false || $size === false || $size < 1) {
                throw new RuntimeException("Baseline media fixture is invalid: {$sourcePath}");
            }

            DB::table('property_media')->updateOrInsert(
                ['id' => $fixture['id']],
                [
                    'property_id' => $fixture['property_id'],
                    'unit_id' => $fixture['unit_id'],
                    'uploaded_by' => self::OWNER_USER_ID,
                    'client_operation_id' => $fixture['client_operation_id'],
                    'storage_path' => $fixture['storage_path'],
                    'caption' => $fixture['caption'],
                    'sort_order' => $fixture['sort_order'],
                    'is_selected_for_listing' => true,
                    'purged_at' => null,
                    'created_at' => self::FIXED_TIMESTAMP,
                    'updated_at' => self::FIXED_TIMESTAMP,
                    'deleted_at' => null,
                    'sha256' => $sha256,
                    'mime_type' => $mimeType,
                    'size_bytes' => $size,
                ],
            );
        }
    }

    private function seedListings(): void
    {
        for ($number = 1; $number <= self::PROPERTY_COUNT; $number++) {
            $id = self::id('50000000', $number);
            $published = $number <= self::PUBLISHED_PROPERTY_COUNT;
            $base = [
                'property_id' => self::id('20000000', $number),
                'client_operation_id' => self::id('51000000', $number),
                'title' => sprintf('Demo Listing %02d', $number),
                'description' => $published
                    ? 'Published demo listing for local browsing.'
                    : 'Draft listing retained for owner editing.',
                'cover_media_id' => $published ? self::id('40000000', $number) : null,
                'review_reason' => null,
                'archived_at' => null,
                'admin_suspended_at' => null,
                'admin_suspended_by' => null,
                'suspension_reason' => null,
                'updated_at' => self::FIXED_TIMESTAMP,
            ];

            if (! $published) {
                DB::table('listings')->updateOrInsert(
                    ['id' => $id],
                    $base + [
                        'moderation_status' => 'DRAFT',
                        'publication_status' => 'DRAFT',
                        'submitted_revision' => null,
                        'submitted_at' => null,
                        'reviewed_by' => null,
                        'reviewed_at' => null,
                        'created_at' => self::FIXED_TIMESTAMP,
                        'submitted_content_revision' => null,
                        'approved_content_revision' => null,
                    ],
                );

                continue;
            }

            if (! DB::table('listings')->where('id', $id)->exists()) {
                DB::table('listings')->insert([
                    'id' => $id,
                    'property_id' => $base['property_id'],
                    'client_operation_id' => $base['client_operation_id'],
                    'title' => $base['title'],
                    'description' => $base['description'],
                    'cover_media_id' => null,
                    'moderation_status' => 'DRAFT',
                    'publication_status' => 'DRAFT',
                    'created_at' => self::FIXED_TIMESTAMP,
                    'updated_at' => self::FIXED_TIMESTAMP,
                ]);
                DB::table('listings')->where('id', $id)->update([
                    'cover_media_id' => self::id('40000000', $number),
                    'moderation_status' => 'PENDING',
                    'submitted_revision' => 1,
                    'submitted_at' => self::FIXED_TIMESTAMP,
                    'submitted_content_revision' => 1,
                ]);
                DB::table('listings')->where('id', $id)->update([
                    'moderation_status' => 'APPROVED',
                    'reviewed_by' => self::ADMIN_USER_ID,
                    'reviewed_at' => self::FIXED_TIMESTAMP,
                    'approved_content_revision' => 1,
                ]);
                DB::table('listings')->where('id', $id)->update([
                    'publication_status' => 'PUBLISHED',
                ]);
            } else {
                DB::table('listings')->where('id', $id)->update($base + [
                    'moderation_status' => 'APPROVED',
                    'publication_status' => 'PUBLISHED',
                    'submitted_revision' => 1,
                    'submitted_at' => self::FIXED_TIMESTAMP,
                    'reviewed_by' => self::ADMIN_USER_ID,
                    'reviewed_at' => self::FIXED_TIMESTAMP,
                    'submitted_content_revision' => 1,
                    'approved_content_revision' => 1,
                ]);
            }
        }
    }

    private function seedFavourites(): void
    {
        foreach (range(7, 10) as $userNumber) {
            DB::table('favourite_properties')->updateOrInsert(
                [
                    'user_id' => self::id('10000000', $userNumber),
                    'property_id' => self::id('20000000', $userNumber - 6),
                ],
                ['created_at' => self::FIXED_TIMESTAMP],
            );
        }
    }

    private static function id(string $prefix, int $number): string
    {
        return sprintf('%s-0000-4000-8000-%012d', $prefix, $number);
    }

    /**
     * @return array<int, string>
     */
    private static function ids(string $prefix, int $count): array
    {
        return array_map(
            fn (int $number): string => self::id($prefix, $number),
            range(1, $count),
        );
    }
}
