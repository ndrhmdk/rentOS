<?php

namespace App\Actions\OwnerProperties;

use App\Domain\Media\PublicStorageUrl;
use App\Models\User;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use stdClass;

class ReadOwnerPropertyPreview
{
    /**
     * @return list<array{
     *     id: string, name: string, ward: ?string, city: ?string, rental_arrangement: string,
     *     unit_count: int, photo_url: ?string, moderation_status: ?string,
     *     publication_status: ?string, suspended: bool
     * }>
     */
    public function handle(User $owner, PublicStorageUrl $storage): array
    {
        $fallbackPhoto = DB::table('property_media')
            ->whereColumn('property_media.property_id', 'properties.id')
            ->whereNull('unit_id')->whereNull('deleted_at')->whereNull('purged_at')
            ->orderBy('sort_order')->orderBy('id')->select('storage_path')->limit(1);

        $unitCount = DB::table('units')
            ->whereColumn('units.property_id', 'properties.id')
            ->whereNull('archived_at')->selectRaw('count(*)');

        return array_values(DB::table('properties')
            ->leftJoin('listings', function (JoinClause $join): void {
                $join->on('listings.property_id', '=', 'properties.id')->whereNull('listings.archived_at');
            })
            ->leftJoin('property_media as cover', function (JoinClause $join): void {
                $join->on('cover.id', '=', 'listings.cover_media_id')
                    ->on('cover.property_id', '=', 'properties.id')
                    ->whereNull('cover.deleted_at')->whereNull('cover.purged_at');
            })
            ->where('properties.owner_id', $owner->id)->whereNull('properties.archived_at')
            ->orderByDesc('properties.created_at')->orderByDesc('properties.id')->limit(3)
            ->select([
                'properties.id', 'properties.name', 'properties.ward', 'properties.city',
                'properties.rental_arrangement', 'cover.storage_path as cover_path',
                'listings.moderation_status', 'listings.publication_status', 'listings.admin_suspended_at',
            ])
            ->addSelect(['fallback_path' => $fallbackPhoto, 'unit_count' => $unitCount])
            ->get()->map(fn (stdClass $row): array => [
                'id' => $row->id,
                'name' => $row->name,
                'ward' => $row->ward,
                'city' => $row->city,
                'rental_arrangement' => $row->rental_arrangement,
                'unit_count' => (int) $row->unit_count,
                'photo_url' => $this->photoUrl($storage, $row->cover_path ?? $row->fallback_path),
                'moderation_status' => $row->moderation_status,
                'publication_status' => $row->publication_status,
                'suspended' => $row->admin_suspended_at !== null,
            ])->all());
    }

    private function photoUrl(PublicStorageUrl $storage, ?string $path): ?string
    {
        if ($path === null) {
            return null;
        }

        try {
            return $storage->forPath($path);
        } catch (RuntimeException) {
            return null;
        }
    }
}
