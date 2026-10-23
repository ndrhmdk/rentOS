<?php

namespace App\Console\Commands;

use Database\Seeders\BaselineSeeder;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

#[Signature('fixtures:media-upload')]
#[Description('Upsert committed baseline media fixtures to private Supabase Storage')]
class FixturesMediaUpload extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if (! app()->environment(['local', 'development', 'staging', 'testing'])) {
            $this->components->error(
                'Media fixtures may only be uploaded in local, development, staging, or testing.',
            );

            return self::FAILURE;
        }

        $supabaseUrl = $this->requiredConfiguration(
            'services.supabase.url',
            'SUPABASE_URL',
        );
        $serviceRoleKey = $this->requiredConfiguration(
            'services.supabase.service_role_key',
            'SUPABASE_SERVICE_ROLE_KEY',
        );
        $bucket = $this->requiredConfiguration(
            'services.supabase.storage.bucket',
            'SUPABASE_STORAGE_BUCKET',
        );
        $fixtureDirectory = config('services.supabase.storage.fixture_directory');

        if ($supabaseUrl === null || $serviceRoleKey === null || $bucket === null) {
            return self::FAILURE;
        }

        if (! is_string($fixtureDirectory) || trim($fixtureDirectory) === '') {
            $this->components->error('The media fixture directory is not configured.');

            return self::FAILURE;
        }

        if (! preg_match('/^[A-Za-z0-9._-]+$/', $bucket)) {
            $this->components->error('SUPABASE_STORAGE_BUCKET contains unsupported characters.');

            return self::FAILURE;
        }

        $validatedFixtures = $this->validateFixtures($fixtureDirectory);

        if ($validatedFixtures === null) {
            return self::FAILURE;
        }

        foreach ($validatedFixtures as $fixture) {
            $uploadUrl = rtrim($supabaseUrl, '/').'/storage/v1/object/'
                .rawurlencode($bucket).'/'.$this->encodeStoragePath($fixture['storage_path']);

            try {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer '.$serviceRoleKey,
                    'apikey' => $serviceRoleKey,
                    'x-upsert' => 'true',
                ])
                    ->connectTimeout((int) config('services.supabase.storage.connect_timeout', 5))
                    ->timeout((int) config('services.supabase.storage.timeout', 30))
                    ->withBody($fixture['bytes'], $fixture['mime_type'])
                    ->post($uploadUrl);
            } catch (ConnectionException) {
                $this->components->error(
                    "Storage connection failed for {$fixture['storage_path']}.",
                );

                return self::FAILURE;
            }

            if (! $response->successful()) {
                $this->components->error(
                    "Storage upload failed with HTTP {$response->status()} for {$fixture['storage_path']}.",
                );

                return self::FAILURE;
            }
        }

        $this->components->info('Uploaded '.count($validatedFixtures).' media fixtures with upsert semantics.');

        return self::SUCCESS;
    }

    private function requiredConfiguration(string $key, string $environmentName): ?string
    {
        $value = config($key);

        if (! is_string($value) || trim($value) === '') {
            $this->components->error("{$environmentName} is required.");

            return null;
        }

        return trim($value);
    }

    /**
     * @return array<int, array{storage_path: string, mime_type: string, bytes: string}>|null
     */
    private function validateFixtures(string $fixtureDirectory): ?array
    {
        $validated = [];

        foreach (BaselineSeeder::mediaFixtures() as $fixture) {
            $sourcePath = rtrim($fixtureDirectory, DIRECTORY_SEPARATOR)
                .DIRECTORY_SEPARATOR.$fixture['source_file'];

            if (! is_file($sourcePath) || ! is_readable($sourcePath)) {
                $this->components->error("Fixture file is missing or unreadable: {$fixture['source_file']}.");

                return null;
            }

            $bytes = file_get_contents($sourcePath);
            $sha256 = hash_file('sha256', $sourcePath);
            $size = filesize($sourcePath);
            $mimeType = mime_content_type($sourcePath);

            if (
                $bytes === false
                || $sha256 === false
                || $size === false
                || $size < 1
                || ! is_string($mimeType)
            ) {
                $this->components->error("Fixture file is invalid: {$fixture['source_file']}.");

                return null;
            }

            $media = DB::table('property_media')->where('id', $fixture['id'])->first();

            if ($media === null) {
                $this->components->error("Missing property_media row {$fixture['id']}; run Part A first.");

                return null;
            }

            if (
                $media->property_id !== $fixture['property_id']
                || $media->unit_id !== $fixture['unit_id']
                || $media->uploaded_by !== BaselineSeeder::OWNER_USER_ID
                || $media->client_operation_id !== $fixture['client_operation_id']
                || $media->storage_path !== $fixture['storage_path']
                || $media->sha256 !== $sha256
                || $media->mime_type !== $mimeType
                || $media->size_bytes !== $size
                || ! $media->is_selected_for_listing
                || $media->deleted_at !== null
                || $media->purged_at !== null
            ) {
                $this->components->error(
                    "The property_media metadata does not match fixture {$fixture['source_file']}.",
                );

                return null;
            }

            $validated[] = [
                'storage_path' => $fixture['storage_path'],
                'mime_type' => $mimeType,
                'bytes' => $bytes,
            ];
        }

        return $validated;
    }

    private function encodeStoragePath(string $storagePath): string
    {
        return implode('/', array_map(rawurlencode(...), explode('/', $storagePath)));
    }
}
