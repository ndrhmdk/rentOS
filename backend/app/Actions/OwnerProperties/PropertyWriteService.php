<?php

namespace App\Actions\OwnerProperties;

use App\Models\Property;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PropertyWriteService
{
    /**
     * Create a property draft and, for WHOLE_SPACE, its initial unit atomically.
     *
     * @param  array<string, mixed>  $attributes
     * @return array{property: Property, replayed: bool}
     */
    public function create(User $owner, array $attributes): array
    {
        $operationId = $attributes['client_operation_id'];
        $requestHash = hash('sha256', json_encode($this->canonicalize($attributes), JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE));

        return DB::transaction(function () use ($owner, $attributes, $operationId, $requestHash): array {
            $owner = $this->lockActiveOwner($owner);

            $existingOperation = DB::table('idempotency_records')
                ->where('actor_id', $owner->id)
                ->where('action', 'property.create')
                ->where('client_operation_id', $operationId)
                ->first();

            if ($existingOperation !== null) {
                abort_unless(hash_equals($existingOperation->request_hash, $requestHash), 409);

                $property = Property::query()
                    ->with('units')
                    ->where('owner_id', $owner->id)
                    ->where('client_operation_id', $operationId)
                    ->firstOrFail();

                return ['property' => $property, 'replayed' => true];
            }

            abort_if(
                Property::query()
                    ->where('owner_id', $owner->id)
                    ->where('client_operation_id', $operationId)
                    ->exists(),
                409,
            );

            $property = Property::query()->create([
                'owner_id' => $owner->id,
                'client_operation_id' => $operationId,
                'content_revision' => 1,
                'name' => $attributes['name'],
                'property_type' => $attributes['property_type'],
                'rental_arrangement' => $attributes['rental_arrangement'],
                'address_line' => $attributes['address_line'] ?? null,
                'ward' => $attributes['ward'] ?? null,
                'city' => $attributes['city'] ?? null,
                'description' => $attributes['description'] ?? null,
                'shared_amenities' => $this->amenitiesObject($attributes['shared_amenities'] ?? []),
                'policies' => $attributes['policies'] ?? self::defaultPolicies(),
                'latitude' => $attributes['latitude'] ?? null,
                'longitude' => $attributes['longitude'] ?? null,
            ]);

            $units = [];
            if ($property->rental_arrangement === 'WHOLE_SPACE') {
                $units[] = $property->units()->create([
                    'client_operation_id' => (string) Str::uuid(),
                    'label' => $this->wholeSpaceLabel($property->property_type),
                    'unit_kind' => $this->wholeSpaceKind($property->property_type),
                    'bedrooms' => 0,
                    'bathrooms' => 0,
                    'bathroom_arrangement' => 'PRIVATE',
                    'minimum_rental_months' => 3,
                    'amenities' => self::emptyAmenities(),
                    'policy_overrides' => new \stdClass(),
                ]);
            }

            $correlationId = $operationId;
            $afterValues = [
                'name' => $property->name,
                'property_type' => $property->property_type,
                'rental_arrangement' => $property->rental_arrangement,
                'content_revision' => $property->content_revision,
                'unit_ids' => array_map(static fn (Unit $unit): string => $unit->id, $units),
            ];

            $this->writeAudit(
                actorId: $owner->id,
                entityType: 'property',
                entityId: $property->id,
                action: 'property.created',
                before: null,
                after: $afterValues,
                correlationId: $correlationId,
            );

            $unitIds = array_map(static fn (Unit $unit): string => $unit->id, $units);
            $resultIds = [$property->id, ...$unitIds];
            $resultArray = implode(',', array_map(static fn (string $id): string => "'{$id}'::uuid", $resultIds));

            DB::table('idempotency_records')->insert([
                'id' => (string) Str::uuid(),
                'actor_id' => $owner->id,
                'action' => 'property.create',
                'client_operation_id' => $operationId,
                'request_hash' => $requestHash,
                'result_resource_type' => 'property',
                'result_ids' => DB::raw("ARRAY[{$resultArray}]::uuid[]"),
                'response_status' => 201,
                'created_at' => now(),
            ]);

            return ['property' => $property->load('units'), 'replayed' => false];
        }, 3);
    }

    /**
     * Update property content only when the expected content revision is current.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function update(User $owner, Property $property, array $attributes): Property
    {
        return DB::transaction(function () use ($owner, $property, $attributes): Property {
            $property = Property::query()->whereKey($property->id)->lockForUpdate()->firstOrFail();
            $owner = $this->lockActiveOwner($owner);
            Gate::authorize('update', $property);

            abort_unless($property->content_revision === (int) $attributes['expected_content_revision'], 409);

            $before = $this->auditSnapshot($property);
            unset($attributes['expected_content_revision']);
            $this->validatePublishedPropertyEdit($property, $attributes);
            if (array_key_exists('shared_amenities', $attributes)) {
                $attributes['shared_amenities'] = $this->amenitiesObject($attributes['shared_amenities']);
            }
            $property->fill($attributes);

            if (! $property->isDirty()) {
                return $property->load('units');
            }

            $property->content_revision++;
            $property->save();

            $correlationId = (string) Str::uuid();
            $invalidatedListingIds = $this->invalidatePendingListings($property);

            $this->writeAudit(
                actorId: $owner->id,
                entityType: 'property',
                entityId: $property->id,
                action: 'property.updated',
                before: $before,
                after: $this->auditSnapshot($property),
                correlationId: $correlationId,
            );

            $this->auditInvalidatedListings($owner->id, $invalidatedListingIds, $correlationId);

            return $property->load('units');
        }, 3);
    }

    /**
     * Archive a property without deleting units, listings, requests, or tenancy history.
     */
    public function archive(User $owner, Property $property, int $expectedContentRevision): Property
    {
        return DB::transaction(function () use ($owner, $property, $expectedContentRevision): Property {
            $property = Property::query()->whereKey($property->id)->lockForUpdate()->firstOrFail();
            $owner = $this->lockActiveOwner($owner);
            Gate::authorize('archive', $property);

            if ($property->archived_at !== null) {
                return $property->load('units');
            }

            abort_unless($property->content_revision === $expectedContentRevision, 409);

            $before = $this->auditSnapshot($property);
            $property->archived_at = now();
            $property->content_revision++;
            $property->save();

            $correlationId = (string) Str::uuid();
            $invalidatedListingIds = $this->invalidatePendingListings($property);
            $publishedListingIds = DB::table('listings')
                ->where('property_id', $property->id)
                ->whereNull('archived_at')
                ->where('publication_status', 'PUBLISHED')
                ->pluck('id')
                ->all();

            if ($publishedListingIds !== []) {
                DB::table('listings')->whereIn('id', $publishedListingIds)->update([
                    'publication_status' => 'HIDDEN',
                    'updated_at' => now(),
                ]);
            }

            $this->writeAudit(
                actorId: $owner->id,
                entityType: 'property',
                entityId: $property->id,
                action: 'property.archived',
                before: $before,
                after: $this->auditSnapshot($property),
                correlationId: $correlationId,
            );

            $this->auditInvalidatedListings($owner->id, $invalidatedListingIds, $correlationId);
            foreach ($publishedListingIds as $listingId) {
                $this->writeAudit(
                    actorId: $owner->id,
                    entityType: 'listing',
                    entityId: $listingId,
                    action: 'listing.hidden_by_property_archive',
                    before: ['publication_status' => 'PUBLISHED'],
                    after: ['publication_status' => 'HIDDEN'],
                    correlationId: $correlationId,
                );
            }

            return $property->load('units');
        }, 3);
    }

    /**
     * @return array<string, mixed>
     */
    private static function emptyAmenities(): object
    {
        return (object) ['schema_version' => 1, 'standard' => new \stdClass(), 'custom' => []];
    }

    /**
     * @param  array<string, mixed>  $amenities
     */
    private function amenitiesObject(array $amenities): object
    {
        return (object) [
            'schema_version' => 1,
            'standard' => (object) ($amenities['standard'] ?? []),
            'custom' => $amenities['custom'] ?? [],
        ];
    }

    /**
     * @return array{schema_version: int, pets: string, smoking: string, shared_rules: array<int, string>}
     */
    private static function defaultPolicies(): array
    {
        return [
            'schema_version' => 1,
            'pets' => 'NOT_ALLOWED',
            'smoking' => 'NOT_ALLOWED',
            'shared_rules' => [],
        ];
    }

    private function wholeSpaceLabel(string $propertyType): string
    {
        return match ($propertyType) {
            'HOUSE' => 'Entire house',
            'APARTMENT_BUILDING' => 'Entire building',
            default => 'Entire apartment',
        };
    }

    private function wholeSpaceKind(string $propertyType): string
    {
        return $propertyType === 'HOUSE' ? 'HOUSE' : 'APARTMENT';
    }

    private function lockActiveOwner(User $owner): User
    {
        $owner = User::query()->whereKey($owner->id)->lockForUpdate()->firstOrFail();
        abort_unless($owner->account_status === 'ACTIVE' && $owner->email_verified_at !== null, 403);

        return $owner;
    }

    /**
     * @return array<string, mixed>
     */
    private function auditSnapshot(Property $property): array
    {
        return [
            'name' => $property->name,
            'property_type' => $property->property_type,
            'rental_arrangement' => $property->rental_arrangement,
            'address_line' => $property->address_line,
            'ward' => $property->ward,
            'city' => $property->city,
            'description' => $property->description,
            'shared_amenities' => $property->shared_amenities,
            'policies' => $property->policies,
            'content_revision' => $property->content_revision,
            'archived_at' => $property->archived_at?->toISOString(),
        ];
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function validatePublishedPropertyEdit(Property $property, array $attributes): void
    {
        $hasPublishedListing = DB::table('listings')
            ->where('property_id', $property->id)
            ->whereNull('archived_at')
            ->where('publication_status', 'PUBLISHED')
            ->exists();

        if (! $hasPublishedListing) {
            return;
        }

        foreach (['address_line', 'city', 'description'] as $field) {
            $value = array_key_exists($field, $attributes) ? $attributes[$field] : $property->{$field};
            if (! is_string($value) || trim($value) === '') {
                throw ValidationException::withMessages([
                    $field => 'This field is required while the property has a published listing.',
                ]);
            }
        }
    }

    /**
     * @return array<int, string>
     */
    private function invalidatePendingListings(Property $property): array
    {
        $listingIds = DB::table('listings')
            ->where('property_id', $property->id)
            ->where('moderation_status', 'PENDING')
            ->pluck('id')
            ->all();

        if ($listingIds !== []) {
            DB::table('listings')->whereIn('id', $listingIds)->update([
                'moderation_status' => 'DRAFT',
                'submitted_at' => null,
                'submitted_revision' => null,
                'submitted_content_revision' => null,
                'updated_at' => now(),
            ]);
        }

        return $listingIds;
    }

    /**
     * @param  array<int, string>  $listingIds
     */
    private function auditInvalidatedListings(string $actorId, array $listingIds, string $correlationId): void
    {
        foreach ($listingIds as $listingId) {
            $this->writeAudit(
                actorId: $actorId,
                entityType: 'listing',
                entityId: $listingId,
                action: 'listing.submission_invalidated',
                before: ['moderation_status' => 'PENDING'],
                after: ['moderation_status' => 'DRAFT'],
                correlationId: $correlationId,
            );
        }
    }

    /**
     * @param  array<string, mixed>|null  $before
     * @param  array<string, mixed>|null  $after
     */
    private function writeAudit(
        string $actorId,
        string $entityType,
        string $entityId,
        string $action,
        ?array $before,
        ?array $after,
        string $correlationId,
    ): void {
        DB::table('audit_logs')->insert([
            'id' => (string) Str::uuid(),
            'actor_id' => $actorId,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'action' => $action,
            'before_values' => $before === null ? null : json_encode($before, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
            'after_values' => $after === null ? null : json_encode($after, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
            'correlation_id' => $correlationId,
            'created_at' => now(),
        ]);
    }

    private function canonicalize(mixed $value): mixed
    {
        if (! is_array($value)) {
            return $value;
        }

        if (array_is_list($value)) {
            return array_map(fn (mixed $item): mixed => $this->canonicalize($item), $value);
        }

        ksort($value);

        foreach ($value as $key => $item) {
            $value[$key] = $this->canonicalize($item);
        }

        return $value;
    }
}
