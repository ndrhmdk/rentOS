# Baseline database and media fixtures

The baseline is a development aid, not production data. Use this flow only when `APP_ENV` is `local`, `development`, `staging`, or `testing`, and only against an isolated database and private Storage bucket. `BaselineSeeder` blocks production; `fixtures:media-upload` refuses every environment outside the explicit allowlist.

## Prerequisites

1. Complete the [database bootstrap and migrations](database-connection.md).
2. Create a **private** Supabase Storage bucket. The default bucket name is `property-media`.
3. Obtain the project URL and service-role key from the server-side Supabase project settings.
4. Confirm the database and bucket are isolated development or staging resources.

The service-role key bypasses Storage access controls. Keep it in the backend environment only. Never commit it, log it, send it to a browser, or expose it through a `NEXT_PUBLIC_*` variable.

Configure `backend/.env`:

```dotenv
APP_ENV=local
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<backend-only-service-role-key>
SUPABASE_STORAGE_BUCKET=property-media
```

Then clear cached configuration:

```bash
php artisan config:clear
```

## Part A: seed the database

Run migrations first, then seed the stable baseline:

```bash
php artisan migrate
php artisan db:seed --class='Database\Seeders\BaselineSeeder' --no-interaction
```

The seeder upserts only its stable UUID rows and retains unrelated data. It creates verified admin, owner, and tenant users; trigger-backed profiles; two properties and units; a draft listing; a complete approved/published listing; two `property_media` rows; and one favourite. It does not seed `audit_logs`, `idempotency_records`, or `notification_outbox`.

Development-only sign-in credentials are documented in the [seeder README](../../database/seeders/README.md).

## Part B: upload the Storage objects

After Part A succeeds, upload the committed bytes:

```bash
php artisan fixtures:media-upload
```

The command validates all files and matching database rows before the first request. It then sends authenticated server-side uploads with `x-upsert: true`; rerunning replaces the same object paths rather than creating duplicates. It never prints the service-role key.

Fixture mapping:

- `published-property-gallery-01.png` → `properties/20000000-0000-4000-8000-000000000001/gallery-01.png`
- `published-property-unit-01.png` → `properties/20000000-0000-4000-8000-000000000001/unit-01.png`

Hashes, licensing, and source details are in the [fixture README](../../database/seeders/fixtures/media/README.md).

## Reruns, cleanup, and 404 responses

- Part A is idempotent: stable IDs and operation IDs are retained, baseline fields are restored, and no arbitrary existing rows are deleted.
- Part B is an idempotent upsert at the two exact bucket paths.
- Neither part deletes Storage objects. To remove the fixture completely, delete only the two mapped objects from the development bucket and remove only the documented baseline rows in foreign-key order, or rebuild a confirmed disposable database. Do not use broad cleanup commands against shared data.
- A `property_media.storage_path` is metadata, not proof that an object exists. If Part A ran without Part B, an application or signed-URL request can return `404 Object not found` even though the database row exists. Run Part B and verify the configured private bucket and project URL.

The staging allowance is intended for controlled demo fixture setup. Production remains prohibited even when credentials are present.
