<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\OwnerProperties\AmenityCatalog as OwnerAmenityCatalog;
use App\Domain\Amenities\AmenityCatalog;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AmenitiesController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = $request->validate([
            'q' => ['sometimes', 'nullable', 'string', 'max:80'],
        ])['q'] ?? null;

        if ($query !== null) {
            return response()->json([
                'data' => OwnerAmenityCatalog::search($query),
            ]);
        }

        $ownerItems = collect(OwnerAmenityCatalog::search())
            ->keyBy('key');
        $data = collect(AmenityCatalog::publicCatalog())
            ->map(function (array $item) use ($ownerItems): array {
                $ownerItem = $ownerItems->get($item['key']);

                return [
                    ...$item,
                    'label' => $ownerItem['label'] ?? $item['label_vi'],
                    'scopes' => $ownerItem['scopes'] ?? [$item['scope'] === 'PROPERTY' ? 'shared' : 'unit'],
                ];
            });

        foreach ($ownerItems as $key => $item) {
            if (! array_key_exists($key, AmenityCatalog::KEYS)) {
                $scope = in_array('shared', $item['scopes'], true) ? 'PROPERTY' : 'UNIT';
                $data->push([
                    'key' => $key,
                    'scope' => $scope,
                    'label_vi' => $item['label'],
                    'label' => $item['label'],
                    'scopes' => $item['scopes'],
                ]);
            }
        }

        return response()->json([
            'data' => $data->values(),
        ]);
    }
}
