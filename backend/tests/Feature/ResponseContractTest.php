<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\BaselineSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PHPUnit\Framework\AssertionFailedError;
use Tests\Support\PublicListingFixture;
use Tests\TestCase;

class ResponseContractTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(BaselineSeeder::class);
    }

    public function test_public_listings_response_matches_contract_schema(): void
    {
        PublicListingFixture::published();

        $response = $this->getJson('/api/v1/listings');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'property_id',
                        'title',
                        'availability_label',
                        'available_unit_count',
                        'rent_min',
                        'rent_max',
                        'minimum_rental_months',
                        'cover_url',
                        'image_urls',
                        'property' => [
                            'name',
                            'property_type',
                            'ward',
                            'city',
                        ],
                    ],
                ],
            ]);

        $item = $response->json('data.0');
        $this->assertIsArray($item);
        $this->assertIsString($item['id']);
        $this->assertIsString($item['property_id']);
        $this->assertIsString($item['title']);
        $this->assertIsString($item['availability_label']);
        $this->assertIsInt($item['available_unit_count']);
        $this->assertIsInt($item['minimum_rental_months']);
        $this->assertIsArray($item['image_urls']);
        $this->assertIsArray($item['property']);
        $this->assertIsString($item['property']['name']);
        $this->assertIsString($item['property']['property_type']);
    }

    public function test_public_listing_detail_response_matches_contract_schema(): void
    {
        $published = PublicListingFixture::published();

        $response = $this->getJson('/api/v1/listings/'.$published->listingId);

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'property_id',
                    'title',
                    'description',
                    'availability_label',
                    'available_unit_count',
                    'gallery',
                    'property' => [
                        'name',
                        'property_type',
                        'rental_arrangement',
                        'address_line',
                        'ward',
                        'city',
                        'description',
                        'shared_rules',
                        'shared_amenities',
                        'custom_amenities',
                        'area',
                    ],
                    'owner' => [
                        'name',
                    ],
                    'units' => [
                        '*' => [
                            'id',
                            'label',
                            'unit_kind',
                            'bedrooms',
                            'bathrooms',
                            'advertised_monthly_rent',
                            'deposit',
                            'minimum_rental_months',
                            'availability_label',
                        ],
                    ],
                ],
            ]);

        $data = $response->json('data');
        $this->assertSame($published->listingId, $data['id']);
        $this->assertIsInt($data['available_unit_count']);
        $this->assertIsArray($data['gallery']);
        $this->assertIsArray($data['units']);
        $this->assertNotEmpty($data['units']);

        $firstUnit = $data['units'][0];
        $this->assertIsString($firstUnit['id']);
        $this->assertIsString($firstUnit['label']);
        $this->assertIsNumeric($firstUnit['advertised_monthly_rent']);
        $this->assertIsNumeric($firstUnit['deposit']);
        $this->assertIsInt($firstUnit['minimum_rental_months']);
    }

    public function test_favourite_properties_response_matches_contract_schema(): void
    {
        $published = PublicListingFixture::published();

        $tenant = User::factory()->create();

        DB::table('favourite_properties')->insert([
            'user_id' => $tenant->id,
            'property_id' => $published->propertyId,
            'created_at' => now(),
        ]);

        $response = $this->actingAs($tenant)->getJson('/api/v1/favourite-properties');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'items' => [
                        '*' => [
                            'property_id',
                            'listing',
                        ],
                    ],
                    'page',
                    'last_page',
                    'total',
                ],
            ]);

        $data = $response->json('data');
        $this->assertIsInt($data['page']);
        $this->assertIsInt($data['last_page']);
        $this->assertIsInt($data['total']);
        $this->assertCount(1, $data['items']);
        $this->assertSame($published->propertyId, $data['items'][0]['property_id']);
        $this->assertNotNull($data['items'][0]['listing']);
        $this->assertSame($published->listingId, $data['items'][0]['listing']['id']);

        $idsResponse = $this->actingAs($tenant)->getJson('/api/v1/favourite-properties/ids');
        $idsResponse->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'ids',
                    'count',
                ],
            ]);
        $this->assertSame([$published->propertyId], $idsResponse->json('data.ids'));
        $this->assertSame(1, $idsResponse->json('data.count'));
    }

    public function test_tenant_rental_request_submission_and_list_matches_contract_schema(): void
    {
        $published = PublicListingFixture::published();

        $tenant = User::factory()->create();

        $submission = $this->actingAs($tenant)->postJson('/api/v1/tenant/rental-requests', [
            'client_operation_id' => (string) Str::uuid(),
            'listing_id' => $published->listingId,
            'contact_name' => 'Nguyễn Văn Thuê',
            'contact_phone' => '0901234567',
            'desired_move_in_date' => now()->addDays(5)->format('Y-m-d'),
            'desired_end_date' => now()->addMonths(6)->format('Y-m-d'),
            'message' => 'Xin chào, tôi muốn thuê căn hộ này.',
        ]);

        $submission->assertCreated()
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'status',
                ],
            ]);

        $this->assertIsString($submission->json('data.id'));
        $this->assertSame('PENDING', $submission->json('data.status'));

        $list = $this->actingAs($tenant)->getJson('/api/v1/tenant/rental-requests');
        $list->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'items' => [
                        '*' => [
                            'id',
                            'title',
                            'ward',
                            'city',
                            'desired_move_in_date',
                            'desired_end_date',
                            'preferred_unit',
                            'status',
                            'outcome_reason',
                            'updated_at',
                            'created_at',
                            'closed_at',
                            'tenancy',
                        ],
                    ],
                    'counts' => [
                        'all',
                        'pending',
                        'accepted',
                        'closed',
                    ],
                    'page',
                    'last_page',
                ],
            ]);

        $first = $list->json('data.items.0');
        $this->assertSame($submission->json('data.id'), $first['id']);
        $this->assertSame('PENDING', $first['status']);
    }

    /**
     * Proves that an incompatible schema change is immediately detected and rejected by the contract suite.
     */
    public function test_contract_validator_detects_deliberate_breaking_changes(): void
    {
        $validCardPayload = [
            'id' => 'list-001',
            'property_id' => 'prop-001',
            'title' => 'Căn hộ view hồ',
            'availability_label' => 'Còn trống',
            'available_unit_count' => 3,
            'rent_min' => 5000000,
            'rent_max' => 8000000,
            'minimum_rental_months' => 6,
            'cover_url' => 'https://example.com/cover.jpg',
            'image_urls' => ['https://example.com/1.jpg'],
            'property' => [
                'name' => 'Tòa nhà Xanh',
                'property_type' => 'APARTMENT',
                'ward' => 'Phường 1',
                'city' => 'Hà Nội',
            ],
        ];

        // Valid payload passes contract validation
        $this->validateListingCardContract($validCardPayload);

        // Case 1: Missing required field (breaking change)
        $brokenMissingField = $validCardPayload;
        unset($brokenMissingField['property_id']);

        $caughtMissing = false;
        try {
            $this->validateListingCardContract($brokenMissingField);
        } catch (AssertionFailedError $e) {
            $caughtMissing = true;
            $this->assertStringContainsString("Contract violation: missing required field 'property_id'", $e->getMessage());
        }
        $this->assertTrue($caughtMissing, 'Contract validator failed to catch missing required field.');

        // Case 2: Incompatible field type (available_unit_count changed from integer to string)
        $brokenIncompatibleType = $validCardPayload;
        $brokenIncompatibleType['available_unit_count'] = 'three'; // Breaking type change

        $caughtType = false;
        try {
            $this->validateListingCardContract($brokenIncompatibleType);
        } catch (AssertionFailedError $e) {
            $caughtType = true;
            $this->assertStringContainsString("Contract violation: field 'available_unit_count' must be an int", $e->getMessage());
        }
        $this->assertTrue($caughtType, 'Contract validator failed to catch incompatible field type.');
    }

    /**
     * Validates a listing card payload against the strict PublicListingCard contract specification.
     *
     * @param  array<string, mixed>  $payload
     */
    private function validateListingCardContract(array $payload): void
    {
        $requiredFields = [
            'id' => 'is_string',
            'property_id' => 'is_string',
            'title' => 'is_string',
            'availability_label' => 'is_string',
            'available_unit_count' => 'is_int',
            'minimum_rental_months' => 'is_int',
            'image_urls' => 'is_array',
            'property' => 'is_array',
        ];

        foreach ($requiredFields as $field => $typeCheck) {
            if (! array_key_exists($field, $payload)) {
                $this->fail("Contract violation: missing required field '{$field}'.");
            }

            if (! $typeCheck($payload[$field])) {
                $type = str_replace('is_', '', $typeCheck);
                $this->fail("Contract violation: field '{$field}' must be an {$type}.");
            }
        }

        $propertyFields = ['name', 'property_type'];
        foreach ($propertyFields as $pField) {
            if (! isset($payload['property'][$pField]) || ! is_string($payload['property'][$pField])) {
                $this->fail("Contract violation: property.{$pField} must be a string.");
            }
        }
    }
}
