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

    private function createProperty(string $ownerId, ?string $archivedAt = null): string
    {
        $propertyId = Str::uuid()->toString();

        DB::table('properties')->insert([
            'id' => $propertyId,
            'owner_id' => $ownerId,
            'client_operation_id' => Str::uuid()->toString(),
            'name' => 'Can ho Landmark '.Str::random(4),
            'property_type' => 'APARTMENT',
            'rental_arrangement' => 'WHOLE_SPACE',
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
}
