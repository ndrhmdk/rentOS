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

    public const int PROPERTY_COUNT = 100;

    public const int PUBLISHED_PROPERTY_COUNT = 100;

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
     * Stable demo people. Emails stay fixed so teammates can sign in with the documented accounts.
     *
     * @var array<int, array{name: string, email: string, phone: string}>
     */
    private const array PEOPLE = [
        1 => ['name' => 'Mai Anh Tran', 'email' => 'admin@rentos.test', 'phone' => '+84905111201'],
        2 => ['name' => 'Quoc Huy Le', 'email' => 'owner1@rentos.test', 'phone' => '+84913120418'],
        3 => ['name' => 'Thu Ha Nguyen', 'email' => 'owner2@rentos.test', 'phone' => '+84935670822'],
        4 => ['name' => 'Minh Khoa Pham', 'email' => 'owner3@rentos.test', 'phone' => '+84907884516'],
        5 => ['name' => 'Bao Ngoc Vo', 'email' => 'owner4@rentos.test', 'phone' => '+84983881207'],
        6 => ['name' => 'Duc Thinh Hoang', 'email' => 'owner5@rentos.test', 'phone' => '+84965440931'],
        7 => ['name' => 'Lan Chi Dang', 'email' => 'tenant1@example.com', 'phone' => '+84902337654'],
        8 => ['name' => 'Hoang Nam Bui', 'email' => 'tenant2@example.com', 'phone' => '+84914559028'],
        9 => ['name' => 'Thanh Tam Ly', 'email' => 'tenant3@example.com', 'phone' => '+84936772190'],
        10 => ['name' => 'Gia Han Truong', 'email' => 'tenant4@example.com', 'phone' => '+84981220463'],
    ];

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
            $place = self::place($number);
            $fixtures[] = [
                'id' => self::id('40000000', $number),
                'property_id' => $propertyId,
                'unit_id' => null,
                'client_operation_id' => self::id('42000000', $number),
                'source_file' => 'published-property-gallery-01.png',
                'storage_path' => "properties/{$propertyId}/gallery-01.png",
                'caption' => "Street view of {$place['name']}",
                'sort_order' => 0,
            ];
            $fixtures[] = [
                'id' => self::id('41000000', $number),
                'property_id' => $propertyId,
                'unit_id' => self::id('30000000', $number),
                'client_operation_id' => self::id('43000000', $number),
                'source_file' => 'published-property-unit-01.png',
                'storage_path' => "properties/{$propertyId}/unit-01.png",
                'caption' => "{$place['unit_label']} at {$place['name']}",
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
            $this->seedUsers();
            $this->seedProperties();
            $this->seedUnits();
            $this->seedMedia();
            $this->seedListings();
            $this->seedFavourites();
        });
    }

    private function seedUsers(): void
    {
        for ($number = 1; $number <= self::USER_COUNT; $number++) {
            $person = self::PEOPLE[$number];
            $id = self::id('10000000', $number);
            $attributes = [
                'name' => $person['name'],
                'email' => $person['email'],
                'email_verified_at' => self::FIXED_TIMESTAMP,
                'phone' => $person['phone'],
                'is_admin' => $number === 1,
                'account_status' => 'ACTIVE',
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
        }
    }

    private function seedProperties(): void
    {
        $ownerIds = array_map(
            fn (int $number): string => self::id('10000000', $number),
            range(2, 6),
        );

        for ($number = 1; $number <= self::PROPERTY_COUNT; $number++) {
            $place = self::place($number);
            $published = $number <= self::PUBLISHED_PROPERTY_COUNT;

            DB::table('properties')->updateOrInsert(
                ['id' => self::id('20000000', $number)],
                [
                    'owner_id' => $ownerIds[($number - 1) % count($ownerIds)],
                    'client_operation_id' => self::id('21000000', $number),
                    'name' => $place['name'],
                    'property_type' => $place['property_type'],
                    'rental_arrangement' => $place['rental_arrangement'],
                    'address_line' => $published ? $place['address_line'] : null,
                    'ward' => $published ? $place['ward'] : null,
                    'city' => $place['city'],
                    'description' => $place['description'],
                    'shared_amenities' => json_encode([
                        'schema_version' => 1,
                        'standard' => array_map(
                            static fn (bool $enabled): array => ['enabled' => $enabled],
                            $place['shared_amenities'],
                        ),
                        'custom' => [],
                    ], JSON_THROW_ON_ERROR),
                    'policies' => json_encode([
                        'schema_version' => 1,
                        'pets' => $place['pets'],
                        'smoking' => $place['smoking'],
                        'shared_rules' => $place['rules'],
                    ], JSON_THROW_ON_ERROR),
                    'content_revision' => 1,
                    'latitude' => $published ? $place['latitude'] : null,
                    'longitude' => $published ? $place['longitude'] : null,
                    'archived_at' => null,
                    'created_at' => self::FIXED_TIMESTAMP,
                    'updated_at' => self::FIXED_TIMESTAMP,
                ],
            );
        }
    }

    private function seedUnits(): void
    {
        for ($number = 1; $number <= self::PROPERTY_COUNT; $number++) {
            $place = self::place($number);
            $published = $number <= self::PUBLISHED_PROPERTY_COUNT;

            DB::table('units')->updateOrInsert(
                ['id' => self::id('30000000', $number)],
                [
                    'property_id' => self::id('20000000', $number),
                    'client_operation_id' => self::id('31000000', $number),
                    'label' => $place['unit_label'],
                    'unit_kind' => $place['unit_kind'],
                    'description' => $published ? $place['unit_description'] : null,
                    'floor' => $place['floor'],
                    'area_m2' => $published ? $place['area_m2'] : null,
                    'bedrooms' => $place['bedrooms'],
                    'bathrooms' => $place['bathrooms'],
                    'bathroom_arrangement' => $place['bathroom_arrangement'],
                    'amenities' => json_encode([
                        'schema_version' => 1,
                        'standard' => array_map(
                            static fn (bool $enabled): array => ['enabled' => $enabled],
                            $place['unit_amenities'],
                        ),
                        'custom' => [],
                    ], JSON_THROW_ON_ERROR),
                    'advertised_monthly_rent' => $published ? $place['rent'] : null,
                    'deposit' => $published ? $place['deposit'] : null,
                    'minimum_rental_months' => $place['minimum_rental_months'],
                    'max_occupants' => $published ? $place['max_occupants'] : null,
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
            $place = self::place($number);
            $id = self::id('50000000', $number);
            $published = $number <= self::PUBLISHED_PROPERTY_COUNT;
            $base = [
                'property_id' => self::id('20000000', $number),
                'client_operation_id' => self::id('51000000', $number),
                'title' => $place['listing_title'],
                'description' => $place['listing_description'],
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

    /**
     * Neighbourhood anchors spread across Vietnam. Four properties are placed around each one.
     *
     * @var array<int, array{city: string, district: string, ward: string, street: string, latitude: float, longitude: float, rent_base: int}>
     */
    private const array AREAS = [
        ['city' => 'Ha Noi', 'district' => 'Hoan Kiem', 'ward' => 'Hang Bac', 'street' => 'Hang Bac', 'latitude' => 21.0285, 'longitude' => 105.8542, 'rent_base' => 12000000],
        ['city' => 'Ha Noi', 'district' => 'Tay Ho', 'ward' => 'Quang An', 'street' => 'Quang An', 'latitude' => 21.0583, 'longitude' => 105.8230, 'rent_base' => 15000000],
        ['city' => 'Ha Noi', 'district' => 'Cau Giay', 'ward' => 'Dich Vong', 'street' => 'Xuan Thuy', 'latitude' => 21.0362, 'longitude' => 105.7906, 'rent_base' => 11000000],
        ['city' => 'Ha Noi', 'district' => 'Dong Da', 'ward' => 'Kham Thien', 'street' => 'Kham Thien', 'latitude' => 21.0150, 'longitude' => 105.8270, 'rent_base' => 9000000],
        ['city' => 'Hai Phong', 'district' => 'Ngo Quyen', 'ward' => 'May To', 'street' => 'Le Hong Phong', 'latitude' => 20.8561, 'longitude' => 106.6822, 'rent_base' => 7000000],
        ['city' => 'Ha Long', 'district' => 'Bai Chay', 'ward' => 'Bai Chay', 'street' => 'Ha Long', 'latitude' => 20.9560, 'longitude' => 107.0440, 'rent_base' => 8000000],
        ['city' => 'Hue', 'district' => 'Phu Hoi', 'ward' => 'Phu Hoi', 'street' => 'Chu Van An', 'latitude' => 16.4637, 'longitude' => 107.5909, 'rent_base' => 6000000],
        ['city' => 'Hue', 'district' => 'Thuan Hoa', 'ward' => 'Thuan Hoa', 'street' => 'Nguyen Hue', 'latitude' => 16.4760, 'longitude' => 107.5480, 'rent_base' => 5500000],
        ['city' => 'Da Nang', 'district' => 'Hai Chau', 'ward' => 'Hai Chau I', 'street' => 'Bach Dang', 'latitude' => 16.0678, 'longitude' => 108.2208, 'rent_base' => 8000000],
        ['city' => 'Da Nang', 'district' => 'Son Tra', 'ward' => 'Phuoc My', 'street' => 'Vo Nguyen Giap', 'latitude' => 16.0830, 'longitude' => 108.2460, 'rent_base' => 10000000],
        ['city' => 'Da Nang', 'district' => 'Lien Chieu', 'ward' => 'Hoa Khanh Bac', 'street' => 'Nguyen Luong Bang', 'latitude' => 16.0740, 'longitude' => 108.1500, 'rent_base' => 4500000],
        ['city' => 'Da Nang', 'district' => 'Ngu Hanh Son', 'ward' => 'Hoa Hai', 'street' => 'Truong Sa', 'latitude' => 15.9950, 'longitude' => 108.2650, 'rent_base' => 9000000],
        ['city' => 'Hoi An', 'district' => 'Minh An', 'ward' => 'Minh An', 'street' => 'Nguyen Thai Hoc', 'latitude' => 15.8771, 'longitude' => 108.3260, 'rent_base' => 8500000],
        ['city' => 'Hoi An', 'district' => 'Cam An', 'ward' => 'Cam An', 'street' => 'Cua Dai', 'latitude' => 15.8890, 'longitude' => 108.3530, 'rent_base' => 7500000],
        ['city' => 'Quang Ngai', 'district' => 'Quang Ngai', 'ward' => 'Tran Phu', 'street' => 'Hung Vuong', 'latitude' => 15.1214, 'longitude' => 108.8044, 'rent_base' => 4000000],
        ['city' => 'Quy Nhon', 'district' => 'Quy Nhon', 'ward' => 'Nguyen Van Cu', 'street' => 'Xuan Dieu', 'latitude' => 13.7820, 'longitude' => 109.2190, 'rent_base' => 5500000],
        ['city' => 'Nha Trang', 'district' => 'Loc Tho', 'ward' => 'Loc Tho', 'street' => 'Tran Phu', 'latitude' => 12.2388, 'longitude' => 109.1967, 'rent_base' => 9000000],
        ['city' => 'Nha Trang', 'district' => 'Vinh Hoa', 'ward' => 'Vinh Hoa', 'street' => 'Pham Van Dong', 'latitude' => 12.2700, 'longitude' => 109.1980, 'rent_base' => 7000000],
        ['city' => 'Da Lat', 'district' => 'Da Lat', 'ward' => 'Ward 1', 'street' => 'Tran Phu', 'latitude' => 11.9404, 'longitude' => 108.4583, 'rent_base' => 8000000],
        ['city' => 'Phan Thiet', 'district' => 'Phan Thiet', 'ward' => 'Duc Thang', 'street' => 'Nguyen Tat Thanh', 'latitude' => 10.9289, 'longitude' => 108.1021, 'rent_base' => 6000000],
        ['city' => 'Vung Tau', 'district' => 'Vung Tau', 'ward' => 'Ward 1', 'street' => 'Thuy Van', 'latitude' => 10.3460, 'longitude' => 107.0843, 'rent_base' => 10000000],
        ['city' => 'Ho Chi Minh City', 'district' => 'District 1', 'ward' => 'Ben Nghe', 'street' => 'Nguyen Hue', 'latitude' => 10.7769, 'longitude' => 106.7009, 'rent_base' => 18000000],
        ['city' => 'Ho Chi Minh City', 'district' => 'District 3', 'ward' => 'Vo Thi Sau', 'street' => 'Vo Van Tan', 'latitude' => 10.7840, 'longitude' => 106.6840, 'rent_base' => 14000000],
        ['city' => 'Ho Chi Minh City', 'district' => 'Thu Duc', 'ward' => 'Linh Trung', 'street' => 'Hoang Dieu 2', 'latitude' => 10.8500, 'longitude' => 106.7700, 'rent_base' => 9000000],
        ['city' => 'Ho Chi Minh City', 'district' => 'District 7', 'ward' => 'Tan Phong', 'street' => 'Nguyen Van Linh', 'latitude' => 10.7290, 'longitude' => 106.7220, 'rent_base' => 16000000],
        ['city' => 'Can Tho', 'district' => 'Ninh Kieu', 'ward' => 'An Hoi', 'street' => 'Hai Ba Trung', 'latitude' => 10.0340, 'longitude' => 105.7880, 'rent_base' => 5000000],
    ];

    /**
     * @return array{
     *     name: string,
     *     listing_title: string,
     *     listing_description: string,
     *     property_type: string,
     *     rental_arrangement: string,
     *     address_line: string,
     *     ward: string,
     *     city: string,
     *     description: string,
     *     latitude: string,
     *     longitude: string,
     *     pets: string,
     *     smoking: string,
     *     rules: array<int, string>,
     *     shared_amenities: array<string, bool>,
     *     unit_label: string,
     *     unit_kind: string,
     *     unit_description: string,
     *     floor: string,
     *     area_m2: int,
     *     bedrooms: int,
     *     bathrooms: int,
     *     bathroom_arrangement: string,
     *     unit_amenities: array<string, bool>,
     *     rent: int,
     *     deposit: int,
     *     minimum_rental_months: int,
     *     max_occupants: int
     * }
     */
    private static function place(int $number): array
    {
        $areas = self::AREAS;
        $index = $number - 1;
        $area = $areas[$index % count($areas)];
        $slot = intdiv($index, count($areas));
        $houseNumber = 12 + (($number * 17) % 160);
        $latitude = $area['latitude'] + ($slot * 0.018) + ((($number % 3) - 1) * 0.007);
        $longitude = $area['longitude'] + ($slot * 0.021) + ((($number % 4) - 1) * 0.008);
        $propertyType = ['HOUSE', 'APARTMENT', 'APARTMENT_BUILDING'][$number % 3];
        $whole = $number % 2 === 0;
        $unitKind = match ($propertyType) {
            'HOUSE' => $whole ? 'HOUSE' : 'ROOM',
            'APARTMENT_BUILDING' => $number % 4 === 0 ? 'APARTMENT' : 'STUDIO',
            default => $whole ? 'APARTMENT' : 'STUDIO',
        };
        $bedrooms = match ($unitKind) {
            'STUDIO' => 0,
            'ROOM' => 1,
            'APARTMENT' => 1 + ($number % 2),
            default => 2 + ($number % 2),
        };
        $areaM2 = match ($unitKind) {
            'ROOM' => 16 + ($number % 8),
            'STUDIO' => 24 + ($number % 12),
            'APARTMENT' => 48 + ($number % 25),
            default => 80 + ($number % 40),
        };
        $rent = $area['rent_base'] + ($slot * 700000) + (($number % 5) * 250000);
        $label = match ($unitKind) {
            'HOUSE' => 'Whole house',
            'ROOM' => 'Room '.chr(65 + ($number % 4)),
            'STUDIO' => 'Studio '.(($number % 12) + 1),
            default => 'Flat '.(($number % 20) + 101),
        };
        $name = "{$houseNumber} {$area['street']}, {$area['district']}";

        return [
            'name' => $name,
            'listing_title' => "{$label} on {$area['street']}, {$area['city']}",
            'listing_description' => "A {$unitKind} rental at {$houseNumber} {$area['street']}, {$area['ward']}, {$area['city']}.",
            'property_type' => $propertyType,
            'rental_arrangement' => $whole ? 'WHOLE_SPACE' : 'SEPARATE_UNITS',
            'address_line' => "{$houseNumber} {$area['street']}",
            'ward' => $area['ward'],
            'city' => $area['city'],
            'description' => "Rental property in {$area['ward']}, {$area['district']}, {$area['city']}.",
            'latitude' => number_format($latitude, 7, '.', ''),
            'longitude' => number_format($longitude, 7, '.', ''),
            'pets' => ['NOT_ALLOWED', 'WITH_APPROVAL', 'ALLOWED'][$number % 3],
            'smoking' => $number % 4 === 0 ? 'OUTDOOR_ONLY' : 'NOT_ALLOWED',
            'rules' => ['Quiet hours after 22:00'],
            'shared_amenities' => ['wifi' => true, 'parking' => $number % 2 === 0],
            'unit_label' => $label,
            'unit_kind' => $unitKind,
            'unit_description' => "{$label} with {$bedrooms} bedroom(s) at {$name}.",
            'floor' => (string) (1 + ($number % 15)),
            'area_m2' => $areaM2,
            'bedrooms' => $bedrooms,
            'bathrooms' => $bedrooms === 0 ? 1 : min($bedrooms, 2),
            'bathroom_arrangement' => $unitKind === 'ROOM' ? 'SHARED' : 'PRIVATE',
            'unit_amenities' => ['air_conditioning' => true, 'washing_machine' => $areaM2 >= 40],
            'rent' => $rent,
            'deposit' => $rent * ($number % 2 === 0 ? 2 : 1),
            'minimum_rental_months' => [3, 6, 12][$number % 3],
            'max_occupants' => max(1, $bedrooms === 0 ? 2 : $bedrooms + 1),
        ];
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
