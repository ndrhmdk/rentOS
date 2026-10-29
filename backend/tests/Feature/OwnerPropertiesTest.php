<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class OwnerPropertiesTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_owner_properties(): void
    {
        $response = $this->getJson('/api/v1/owner/properties');
        $response->assertUnauthorized();
    }

    public function test_guest_cannot_create_property(): void
    {
        $this->postJson('/api/v1/owner/properties', $this->validProperty())
            ->assertUnauthorized();
    }

    public function test_unverified_owner_cannot_create_property(): void
    {
        $owner = User::factory()->unverified()->create();

        $this->actingAs($owner)
            ->postJson('/api/v1/owner/properties', $this->validProperty())
            ->assertForbidden();

        $this->assertDatabaseCount('properties', 0);
    }

    public function test_owner_can_create_incomplete_whole_space_property_atomically(): void
    {
        $owner = User::factory()->create();
        $attributes = $this->validProperty();

        $response = $this->actingAs($owner)
            ->postJson('/api/v1/owner/properties', $attributes);

        $response->assertCreated()
            ->assertJsonPath('data.owner_id', $owner->id)
            ->assertJsonPath('data.content_revision', 1)
            ->assertJsonPath('data.address_line', null)
            ->assertJsonCount(1, 'data.units')
            ->assertJsonPath('data.units.0.label', 'Entire apartment')
            ->assertJsonPath('data.units.0.is_marketed', false);

        $propertyId = $response->json('data.id');
        $this->assertDatabaseCount('properties', 1);
        $this->assertDatabaseCount('units', 1);
        $this->assertDatabaseHas('properties', [
            'id' => $propertyId,
            'owner_id' => $owner->id,
            'client_operation_id' => $attributes['client_operation_id'],
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'entity_type' => 'property',
            'entity_id' => $propertyId,
            'action' => 'property.created',
        ]);
        $this->assertDatabaseHas('idempotency_records', [
            'actor_id' => $owner->id,
            'action' => 'property.create',
            'client_operation_id' => $attributes['client_operation_id'],
        ]);
    }

    public function test_separate_unit_property_does_not_create_an_automatic_unit(): void
    {
        $owner = User::factory()->create();
        $attributes = $this->validProperty(['rental_arrangement' => 'SEPARATE_UNITS']);

        $this->actingAs($owner)
            ->postJson('/api/v1/owner/properties', $attributes)
            ->assertCreated()
            ->assertJsonCount(0, 'data.units');

        $this->assertDatabaseCount('properties', 1);
        $this->assertDatabaseCount('units', 0);
    }

    public function test_replaying_property_create_returns_same_result_without_duplicates(): void
    {
        $owner = User::factory()->create();
        $attributes = $this->validProperty();

        $first = $this->actingAs($owner)->postJson('/api/v1/owner/properties', $attributes);
        $first->assertCreated();

        $this->actingAs($owner)
            ->postJson('/api/v1/owner/properties', $attributes)
            ->assertOk()
            ->assertJsonPath('data.id', $first->json('data.id'));

        $this->assertDatabaseCount('properties', 1);
        $this->assertDatabaseCount('units', 1);
        $this->assertDatabaseCount('audit_logs', 1);
    }

    public function test_reusing_property_operation_id_with_changed_payload_returns_conflict(): void
    {
        $owner = User::factory()->create();
        $attributes = $this->validProperty();
        $this->actingAs($owner)->postJson('/api/v1/owner/properties', $attributes)->assertCreated();

        $attributes['name'] = 'Changed name';
        $this->actingAs($owner)
            ->postJson('/api/v1/owner/properties', $attributes)
            ->assertConflict();

        $this->assertDatabaseCount('properties', 1);
        $this->assertDatabaseCount('units', 1);
    }

    public function test_owner_cannot_forge_property_owner_or_submit_removed_district_field(): void
    {
        $owner = User::factory()->create();
        $attributes = $this->validProperty(['owner_id' => (string) Str::uuid()]);

        $this->actingAs($owner)
            ->postJson('/api/v1/owner/properties', $attributes)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('owner_id');

        unset($attributes['owner_id']);
        $attributes['district'] = 'District 1';
        $this->actingAs($owner)
            ->postJson('/api/v1/owner/properties', $attributes)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('district');

        $this->assertDatabaseCount('properties', 0);
    }

    public function test_personal_access_token_cannot_create_owner_property(): void
    {
        $owner = User::factory()->create();
        $token = $owner->createToken('owner script', ['account:read'], now()->addHour())->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/v1/owner/properties', $this->validProperty())
            ->assertForbidden();

        $this->assertDatabaseCount('properties', 0);
    }

    public function test_user_without_properties_returns_empty_array(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/v1/owner/properties');

        $response->assertOk()
            ->assertJson([
                'data' => [],
            ])
            ->assertJsonMissing(['is_tenant', 'is_owner', 'tenancies_count']);
    }

    private function validPolicies(): string
    {
        return json_encode([
            'schema_version' => 1,
            'pets' => 'ALLOWED',
            'smoking' => 'NOT_ALLOWED',
            'shared_rules' => [],
        ], JSON_THROW_ON_ERROR);
    }

    private function createProperty(
        string $ownerId, 
        ?string $archivedAt = null,
        string $rentalArrangement = 'WHOLE_SPACE'): string
    {
        $propertyId = Str::uuid()->toString();

        DB::table('properties')->insert([
            'id' => $propertyId,
            'owner_id' => $ownerId,
            'client_operation_id' => Str::uuid()->toString(),
            'name' => 'Can ho Landmark '.Str::random(4),
            'property_type' => 'APARTMENT',
            'rental_arrangement' => $rentalArrangement,
            'city' => 'Ho Chi Minh',
            'policies' => $this->validPolicies(),
            'archived_at' => $archivedAt,
        ]);

        return $propertyId;
    }

    public function test_active_properties_are_returned(): void
    {
        $owner = User::factory()->create();

        $prop1 = $this->createProperty($owner->id, null);
        $prop2 = $this->createProperty($owner->id, null);

        $response = $this->actingAs($owner)->getJson('/api/v1/owner/properties');

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonMissing(['is_tenant', 'is_owner', 'tenancies_count']);

        $returnedIds = collect($response->json('data'))->pluck('id')->all();
        $this->assertContains($prop1, $returnedIds);
        $this->assertContains($prop2, $returnedIds);
    }

    public function test_archived_properties_are_excluded(): void
    {
        $owner = User::factory()->create();

        $activePropId = $this->createProperty($owner->id, null);
        $this->createProperty($owner->id, now()->toIso8601String());

        $response = $this->actingAs($owner)->getJson('/api/v1/owner/properties');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $activePropId);
    }

    public function test_user_cannot_view_other_owners_properties(): void
    {
        $ownerA = User::factory()->create();
        $ownerB = User::factory()->create();

        $this->createProperty($ownerA->id, null);

        $response = $this->actingAs($ownerB)->getJson('/api/v1/owner/properties');

        $response->assertOk()
            ->assertJsonCount(0, 'data')
            ->assertJson(['data' => []]);
    }

    public function test_owner_can_view_one_property_and_foreign_owner_cannot(): void
    {
        $owner = User::factory()->create();
        $otherOwner = User::factory()->create();
        $propertyId = $this->createProperty($owner->id);

        $this->actingAs($owner)
            ->getJson("/api/v1/owner/properties/{$propertyId}")
            ->assertOk()
            ->assertJsonPath('data.id', $propertyId);

        $this->actingAs($otherOwner)
            ->getJson("/api/v1/owner/properties/{$propertyId}")
            ->assertForbidden();
    }

    public function test_owner_can_update_property_with_current_content_revision(): void
    {
        $owner = User::factory()->create();
        $propertyId = $this->createProperty($owner->id);

        $this->actingAs($owner)
            ->patchJson("/api/v1/owner/properties/{$propertyId}", [
                'name' => 'Updated apartment',
                'expected_content_revision' => 1,
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated apartment')
            ->assertJsonPath('data.content_revision', 2);

        $this->assertDatabaseHas('properties', [
            'id' => $propertyId,
            'name' => 'Updated apartment',
            'content_revision' => 2,
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'entity_type' => 'property',
            'entity_id' => $propertyId,
            'action' => 'property.updated',
        ]);
    }

    public function test_stale_property_update_returns_conflict_without_overwriting_data(): void
    {
        $owner = User::factory()->create();
        $propertyId = $this->createProperty($owner->id);

        $this->actingAs($owner)->patchJson("/api/v1/owner/properties/{$propertyId}", [
            'name' => 'First edit',
            'expected_content_revision' => 1,
        ])->assertOk();

        $this->actingAs($owner)->patchJson("/api/v1/owner/properties/{$propertyId}", [
            'name' => 'Stale edit',
            'expected_content_revision' => 1,
        ])->assertConflict();

        $this->assertDatabaseHas('properties', [
            'id' => $propertyId,
            'name' => 'First edit',
            'content_revision' => 2,
        ]);
    }

    public function test_foreign_owner_cannot_update_or_archive_property(): void
    {
        $owner = User::factory()->create();
        $otherOwner = User::factory()->create();
        $propertyId = $this->createProperty($owner->id);

        $this->actingAs($otherOwner)->patchJson("/api/v1/owner/properties/{$propertyId}", [
            'name' => 'Forged update',
            'expected_content_revision' => 1,
        ])->assertForbidden();

        $this->actingAs($otherOwner)->patchJson("/api/v1/owner/properties/{$propertyId}/archive", [
            'expected_content_revision' => 1,
        ])->assertForbidden();

        $this->assertDatabaseHas('properties', [
            'id' => $propertyId,
            'owner_id' => $owner->id,
            'archived_at' => null,
        ]);
    }

    public function test_archiving_preserves_property_and_units_and_removes_property_from_active_list(): void
    {
        $owner = User::factory()->create();
        $propertyId = $this->createProperty($owner->id);
        DB::table('units')->insert([
            'id' => (string) Str::uuid(),
            'property_id' => $propertyId,
            'client_operation_id' => (string) Str::uuid(),
            'label' => 'Unit 101',
            'unit_kind' => 'APARTMENT',
            'bedrooms' => 1,
            'bathrooms' => 1,
            'bathroom_arrangement' => 'PRIVATE',
            'minimum_rental_months' => 3,
        ]);

        $response = $this->actingAs($owner)
            ->patchJson("/api/v1/owner/properties/{$propertyId}/archive", ['expected_content_revision' => 1])
            ->assertOk();
        $this->assertNotNull($response->json('data.archived_at'));

        $this->actingAs($owner)->getJson('/api/v1/owner/properties')->assertOk()->assertJsonCount(0, 'data');
        $this->actingAs($owner)->getJson("/api/v1/owner/properties/{$propertyId}")->assertOk();
        $this->assertDatabaseCount('units', 1);
        $this->assertDatabaseHas('properties', ['id' => $propertyId, 'content_revision' => 2]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function validProperty(array $overrides = []): array
    {
        return array_merge([
            'client_operation_id' => (string) Str::uuid(),
            'name' => 'Can ho Landmark',
            'property_type' => 'APARTMENT',
            'rental_arrangement' => 'WHOLE_SPACE',
        ], $overrides);
    }
    public function test_owner_can_create_unit_for_separate_unit_property(): void
    {
        $owner = User::factory()->create();
        $propertyId = $this->createProperty(
            $owner->id,
            rentalArrangement: 'SEPARATE_UNITS',
        );

        $operationId = (string) Str::uuid();

        $response = $this->actingAs($owner)->postJson(
            "/api/v1/owner/properties/{$propertyId}/units",
            [
                'client_operation_id' => $operationId,
                'label' => 'Room 101',
                'unit_kind' => 'ROOM',
                'bedrooms' => 1,
                'bathrooms' => 1,
                'bathroom_arrangement' => 'PRIVATE',
                'minimum_rental_months' => 3,
            ],
        );

        $response->assertCreated()
            ->assertJsonPath('data.property_id', $propertyId)
            ->assertJsonPath('data.label', 'Room 101')
            ->assertJsonPath('data.operational_status', 'READY')
            ->assertJsonPath('data.is_marketed', false);

        $unitId = $response->json('data.id');

        $this->assertDatabaseHas('units', [
            'id' => $unitId,
            'property_id' => $propertyId,
            'client_operation_id' => $operationId,
            'label' => 'Room 101',
        ]);

        $this->assertDatabaseHas('properties', [
            'id' => $propertyId,
            'content_revision' => 2,
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'entity_type' => 'unit',
            'entity_id' => $unitId,
            'action' => 'unit.created',
        ]);
    }

    public function test_foreign_owner_cannot_create_unit_for_another_owners_property(): void
    {
        $owner = User::factory()->create();
        $otherOwner = User::factory()->create();
        $propertyId = $this->createProperty(
            $owner->id,
            rentalArrangement: 'SEPARATE_UNITS',
        );

        $this->actingAs($otherOwner)->postJson(
            "/api/v1/owner/properties/{$propertyId}/units",
            [
                'client_operation_id' => (string) Str::uuid(),
                'label' => 'Room 101',
                'unit_kind' => 'ROOM',
                'bedrooms' => 1,
                'bathrooms' => 1,
                'bathroom_arrangement' => 'PRIVATE',
                'minimum_rental_months' => 3,
            ],
        )->assertForbidden();

        $this->assertDatabaseCount('units', 0);
    }

    public function test_owner_cannot_create_duplicate_unit_label(): void
    {
        $owner = User::factory()->create();
        $propertyId = $this->createProperty(
            $owner->id,
            rentalArrangement: 'SEPARATE_UNITS',
        );

        $payload = [
            'label' => 'Room 101',
            'unit_kind' => 'ROOM',
            'bedrooms' => 1,
            'bathrooms' => 1,
            'bathroom_arrangement' => 'PRIVATE',
            'minimum_rental_months' => 3,
        ];

        $this->actingAs($owner)->postJson(
            "/api/v1/owner/properties/{$propertyId}/units",
            ['client_operation_id' => (string) Str::uuid(), ...$payload],
        )->assertCreated();

        $this->actingAs($owner)->postJson(
            "/api/v1/owner/properties/{$propertyId}/units",
            ['client_operation_id' => (string) Str::uuid(), ...$payload],
        )->assertUnprocessable()
            ->assertJsonValidationErrors('label');

        $this->assertDatabaseCount('units', 1);
    }

    public function test_owner_can_update_unit_and_change_operational_status(): void
    {
        $owner = User::factory()->create();
        $propertyId = $this->createProperty(
            $owner->id,
            rentalArrangement: 'SEPARATE_UNITS'
        );
        $unitId = (string) Str::uuid();

        DB::table('units')->insert([
            'id' => $unitId,
            'property_id' => $propertyId,
            'client_operation_id' => (string) Str::uuid(),
            'label' => 'Room 101',
            'unit_kind' => 'ROOM',
            'bedrooms' => 1,
            'bathrooms' => 1,
            'bathroom_arrangement' => 'PRIVATE',
            'minimum_rental_months' => 3,
        ]);

        $this->actingAs($owner)
            ->patchJson("/api/v1/owner/properties/{$propertyId}/units/{$unitId}", [
                'expected_content_revision' => 1,
                'operational_status' => 'MAINTENANCE',
            ])
            ->assertOk()
            ->assertJsonPath('data.id', $unitId)
            ->assertJsonPath('data.operational_status', 'MAINTENANCE');

        $this->assertDatabaseHas('properties', [
            'id' => $propertyId,
            'content_revision' => 2,
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'entity_type' => 'unit',
            'entity_id' => $unitId,
            'action' => 'unit.updated'
        ]);
    }

    public function test_stale_unit_update_returns_conflict_without_overwriting_date(): void
    {
        $owner = User::factory()->create();
        $propertyId = $this->createProperty(
            $owner->id,
            rentalArrangement: 'SEPARATE_UNITS',
        );
        $unitId = (string) Str::uuid();

        DB::table('units')->insert([
            'id' => $unitId,
            'property_id' => $propertyId,
            'client_operation_id' => (string) Str::uuid(),
            'label' => 'Room 101',
            'unit_kind' => 'ROOM',
            'bedrooms' => 1,
            'bathrooms' => 1,
            'bathroom_arrangement' => 'PRIVATE',
            'minimum_rental_months' => 3,
        ]);

        $this->actingAs($owner)
            ->patchJson("/api/v1/owner/properties/{$propertyId}/units/{$unitId}", [
                'expected_content_revision' => 1,
                'operational_status' => 'MAINTENANCE',
            ])
            ->assertOk();

        $this->actingAs($owner)
            ->patchJson("/api/v1/owner/properties/{$propertyId}/units/{$unitId}", [
                'expected_content_revision' => 1,
                'operational_status' => 'RETIRED',
            ])
            ->assertConflict();

        $this->assertDatabaseHas('units', [
            'id' => $unitId,
            'operational_status' => 'MAINTENANCE',
        ]);
    }

    public function test_foreign_owner_cannot_update_unit(): void
    {
        $owner = User::factory()->create();
        $otherOwner = User::factory()->create();
        $propertyId = $this->createProperty(
            $owner->id,
            rentalArrangement: 'SEPARATE_UNITS',
        );
        $unitId = (string) Str::uuid();

        DB::table('units')->insert([
            'id' => $unitId,
            'property_id' => $propertyId,
            'client_operation_id' => (string) Str::uuid(),
            'label' => 'Room 101',
            'unit_kind' => 'ROOM',
            'bedrooms' => 1,
            'bathrooms' => 1,
            'bathroom_arrangement' => 'PRIVATE',
            'minimum_rental_months' => 3,
        ]);

        $this->actingAs($otherOwner)
            ->patchJson("/api/v1/owner/properties/{$propertyId}/units/{$unitId}", [
                'expected_content_revision' => 1,
                'operational_status' => 'MAINTENANCE',
            ])
            ->assertForbidden();

        $this->assertDatabaseHas('units', [
            'id' => $unitId,
            'operational_status' => 'READY',
        ]);
    }
}
