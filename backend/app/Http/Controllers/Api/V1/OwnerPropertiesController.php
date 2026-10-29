<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\OwnerProperties\PropertyWriteService;
use App\Http\Controllers\Controller;
use App\Http\Requests\ArchivePropertyRequest;
use App\Http\Requests\StorePropertyRequest;
use App\Http\Requests\StoreUnitRequest;
use App\Http\Requests\UpdatePropertyRequest;
use App\Http\Resources\PropertyResource;
use App\Http\Resources\UnitResource;
use App\Models\Property;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Laravel\Sanctum\PersonalAccessToken;

class OwnerPropertiesController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($user->account_status === 'ACTIVE' && $user->email_verified_at !== null, 403);
        abort_if($user->currentAccessToken() instanceof PersonalAccessToken, 403);
        Gate::authorize('viewAny', Property::class);

        $properties = Property::query()
            ->where('owner_id', $user->id)
            ->whereNull('archived_at')
            ->orderByDesc('created_at')
            ->with('units')
            ->paginate(20);

        return PropertyResource::collection($properties);
    }

    public function store(StorePropertyRequest $request, PropertyWriteService $propertyWriter): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $result = $propertyWriter->create($user, $request->validated());

        return (new PropertyResource($result['property']))
            ->response()
            ->setStatusCode($result['replayed'] ? 200 : 201);
    }

    public function show(Request $request, Property $property): PropertyResource
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($user->account_status === 'ACTIVE' && $user->email_verified_at !== null, 403);
        abort_if($user->currentAccessToken() instanceof PersonalAccessToken, 403);
        Gate::authorize('view', $property);

        return new PropertyResource($property->load('units'));
    }

    public function update(
        UpdatePropertyRequest $request,
        Property $property,
        PropertyWriteService $propertyWriter,
    ): PropertyResource {
        /** @var User $user */
        $user = $request->user();

        return new PropertyResource($propertyWriter->update($user, $property, $request->validated()));
    }

    public function archive(
        ArchivePropertyRequest $request,
        Property $property,
        PropertyWriteService $propertyWriter,
    ): PropertyResource {
        /** @var User $user */
        $user = $request->user();

        return new PropertyResource($propertyWriter->archive(
            $user,
            $property,
            (int) $request->validated('expected_content_revision'),
        ));
    }

    public function storeUnit(StoreUnitRequest $request, Property $property, PropertyWriteService $propertyWriter): JsonResponse {
        $unit = $propertyWriter->createUnit(
            $request->user(),
            $property,
            $request->validated()
        );

        return (new UnitResource($unit))
            ->response()
            ->setStatusCode(201);
    }
}
