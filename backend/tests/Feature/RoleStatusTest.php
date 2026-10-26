<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class RoleStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_role_status(): void
    {
        $response = $this->getJson('/api/v1/me/role-status');
        $response->assertUnauthorized();
    }

    public function test_new_user_has_no_roles_by_default(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/v1/me/role-status');

        $response->assertOk()
            ->assertJson([
                'data' => [
                    'is_admin' => false,
                    'is_tenant' => false,
                    'is_owner' => false,
                    'tenancies_count' => 0,
                    'properties_count' => 0,
                    'email_verified' => true,
                ],
            ]);
    }

    public function test_unverified_user_reflects_in_role_status(): void
    {
        $user = User::factory()->unverified()->create();

        $response = $this->actingAs($user)->getJson('/api/v1/me/role-status');

        $response->assertOk()
            ->assertJsonPath('data.email_verified', false);
    }

    public function test_admin_user_has_admin_role(): void
    {
        $user = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($user)->getJson('/api/v1/me/role-status');

        $response->assertOk()
            ->assertJsonPath('data.is_admin', true);
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

    public function test_user_with_property_is_an_owner(): void
    {
        $user = User::factory()->create();

        DB::table('properties')->insert([
            'id' => Str::uuid()->toString(),
            'owner_id' => $user->id,
            'client_operation_id' => Str::uuid()->toString(),
            'name' => 'Can ho cao cap Landmark',
            'property_type' => 'APARTMENT',
            'rental_arrangement' => 'WHOLE_SPACE',
            'city' => 'Ho Chi Minh',
            'policies' => $this->validPolicies(),
            'archived_at' => null,
        ]);

        $response = $this->actingAs($user)->getJson('/api/v1/me/role-status');

        $response->assertOk()
            ->assertJson([
                'data' => [
                    'is_owner' => true,
                    'properties_count' => 1,
                    'is_tenant' => false,
                ],
            ]);
    }

    public function test_user_with_archived_property_only_is_not_an_active_owner(): void
    {
        $user = User::factory()->create();

        DB::table('properties')->insert([
            'id' => Str::uuid()->toString(),
            'owner_id' => $user->id,
            'client_operation_id' => Str::uuid()->toString(),
            'name' => 'Nha da luu tru',
            'property_type' => 'APARTMENT',
            'rental_arrangement' => 'WHOLE_SPACE',
            'city' => 'Ho Chi Minh',
            'policies' => $this->validPolicies(),
            'archived_at' => now(),
        ]);

        $response = $this->actingAs($user)->getJson('/api/v1/me/role-status');

        $response->assertOk()
            ->assertJson([
                'data' => [
                    'is_owner' => false,
                    'properties_count' => 0,
                ],
            ]);
    }

    public function test_user_with_tenancy_is_a_tenant(): void
    {
        $owner = User::factory()->create();
        $tenant = User::factory()->create();

        $propertyId = Str::uuid()->toString();
        DB::table('properties')->insert([
            'id' => $propertyId,
            'owner_id' => $owner->id,
            'client_operation_id' => Str::uuid()->toString(),
            'name' => 'Nha cho thue',
            'property_type' => 'APARTMENT',
            'rental_arrangement' => 'WHOLE_SPACE',
            'city' => 'Ha Noi',
            'policies' => $this->validPolicies(),
            'archived_at' => null,
        ]);

        $unitId = Str::uuid()->toString();
        DB::table('units')->insert([
            'id' => $unitId,
            'property_id' => $propertyId,
            'client_operation_id' => Str::uuid()->toString(),
            'label' => 'Phong 101',
            'unit_kind' => 'APARTMENT',
            'bedrooms' => 1,
            'bathrooms' => 1,
            'bathroom_arrangement' => 'PRIVATE',
            'minimum_rental_months' => 6,
        ]);

        $listingId = Str::uuid()->toString();
        DB::table('listings')->insert([
            'id' => $listingId,
            'property_id' => $propertyId,
            'client_operation_id' => Str::uuid()->toString(),
            'title' => 'Can ho cho thue',
            'description' => 'Mo ta chi tiet can ho',
            'moderation_status' => 'APPROVED',
            'publication_status' => 'PUBLISHED',
        ]);

        $rentalRequestId = Str::uuid()->toString();
        DB::table('rental_requests')->insert([
            'id' => $rentalRequestId,
            'listing_id' => $listingId,
            'tenant_id' => $tenant->id,
            'preferred_unit_id' => $unitId,
            'client_operation_id' => Str::uuid()->toString(),
            'desired_move_in_date' => '2026-11-01',
            'desired_end_date' => '2027-05-01',
            'message' => 'Toi muon thue can ho nay',
            'contact_name' => 'Nguoi Thue Test',
            'contact_phone' => '0901234567',
            'status' => 'ACCEPTED',
            'closed_at' => now(),
        ]);

        DB::table('tenancies')->insert([
            'id' => Str::uuid()->toString(),
            'unit_id' => $unitId,
            'tenant_id' => $tenant->id,
            'owner_id' => $owner->id,
            'rental_request_id' => $rentalRequestId,
            'client_operation_id' => Str::uuid()->toString(),
            'status' => 'AWAITING_REVISION',
        ]);

        $response = $this->actingAs($tenant)->getJson('/api/v1/me/role-status');

        $response->assertOk()
            ->assertJson([
                'data' => [
                    'is_tenant' => true,
                    'tenancies_count' => 1,
                    'is_owner' => false,
                ],
            ]);
    }
}
