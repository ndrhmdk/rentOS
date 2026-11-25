<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Support\PublicListingFixture;
use Tests\TestCase;

class OwnerUnitArchiveTest extends TestCase
{
    use RefreshDatabase;

    protected function beforeRefreshingDatabase(): void
    {
        $this->assertSame('pgsql', config('database.default'));
        $this->assertSame('rentos_test', config('database.connections.pgsql.database'));
    }

    public function test_owner_can_archive_unit_and_non_owner_or_invalid_payload_is_rejected(): void
    {
        $fixture = PublicListingFixture::published();
        $property = Property::findOrFail($fixture->propertyId);
        DB::table('properties')->where('id', $property->id)->update(['rental_arrangement' => 'SEPARATE_UNITS']);
        $property->refresh();
        $unit = Unit::where('property_id', $property->id)->firstOrFail();

        // Create a second unit so archiving one doesn't conflict with minimum unit rules if any
        $extraUnit = (array) DB::table('units')->where('id', $unit->id)->first();
        $extraUnit['id'] = (string) Str::uuid();
        $extraUnit['client_operation_id'] = (string) Str::uuid();
        $extraUnit['label'] = 'Unit To Archive';
        $extraUnit['is_marketed'] = false;
        DB::table('units')->insert($extraUnit);

        $targetUnitId = $extraUnit['id'];
        $url = "/api/v1/owner/properties/{$property->id}/units/{$targetUnitId}/archive";

        // Foreign owner gets 403
        $stranger = User::factory()->create();
        $this->actingAs($stranger, 'web')
            ->patchJson($url, ['expected_content_revision' => $property->content_revision])
            ->assertForbidden();

        // Prohibited fields get 422
        $this->app['auth']->forgetGuards();
        $this->actingAs($fixture->owner, 'web')
            ->patchJson($url, [
                'expected_content_revision' => $property->content_revision,
                'archived_at' => now()->toIso8601String(),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['archived_at']);

        // Valid archive succeeds
        $this->actingAs($fixture->owner, 'web')
            ->patchJson($url, [
                'expected_content_revision' => $property->content_revision,
            ])
            ->assertOk();

        $this->assertNotNull(Unit::findOrFail($targetUnitId)->archived_at);
    }
}
