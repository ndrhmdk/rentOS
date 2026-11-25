# Scalability and performance anti-patterns

How rentOS finds and prevents common anti-patterns (CSB35050 Task 6d). Each row points to the code and to the evidence for it.

## Found and fixed

| Anti-pattern | Where | Fix | Evidence |
|---|---|---|---|
| N+1: tenancy blocks and media loaded once per listing card | `ListingPresentation::cardsFor()` | Loaded once per page (RNT-11, `af303e5`) | 9 queries for a 20-card page ([query-evidence.md](query-evidence.md)) |
| N+1: owner listing summaries and photo thumbnails | Owner property list | Eager loading and smaller thumbnails (RNT-14, `89e4eb9`, `9b6406a`) | Query-count tests on the paginated owner list (`2b36f17`) |
| Sequential scans on the rental-request table | `rentals:reject-aged`, owner request inbox | Partial and composite indexes (RNT-17) | Owner inbox counts 3.94 ms → 0.22 ms on 20,000 rows ([query-evidence.md](query-evidence.md)) |
| Repeated work on every public read | Public search and detail | Server cache with version-bump invalidation, plus browser `Cache-Control`/`ETag` (RNT-11, RNT-17) | A cache hit takes 1 query; an unchanged detail returns `304` with no body |
| The same header copied into many places | About 40 hand-written `Cache-Control: private, no-store` calls in controllers, Resources, `EnsureAdminSession` and `bootstrap/app.php` | One `PrivateNoStore` middleware; private is the default and routes opt in to public caching | `PrivateResponseCachingTest`, `PublicHttpCachingTest` |
| Unbounded page sizes | `GET /api/v1/listings` | `per_page` capped at 20 | `test_listings_index_rejects_page_sizes_above_the_cap` |
| Slow I/O inside the request | Notification email, Discord alerts | Queued jobs with retries and backoff (`DeliverNotification`, `SendOpsDiscordAlert`) | `NotificationDeliveryTest`, `QueueFailureAlertTest` |

## What strict Eloquent mode found (RNT-17)

`Model::preventLazyLoading()`, `preventSilentlyDiscardingAttributes()` and `preventAccessingMissingAttributes()` are now on outside production (`AppServiceProvider::configureEloquentStrictness()`). With them on, the full backend suite found **no lazy-loading (N+1) violations**. It did find four attribute bugs that had been failing silently:

1. **Photo ids didn't match their storage path.** `PropertyWriteService` builds the storage path `properties/{property}/media/{mediaId}.ext` from a pre-generated UUID and passes it as the row `id`. Because `id` isn't fillable, Laravel dropped it and generated a different UUID, so every uploaded photo's id differed from its file name. **Fix:** `forceCreate()`. **Regression check:** `OwnerPropertiesTest::test_owner_can_upload_a_property_photo_to_storage` now asserts that the stored path contains the row id. It fails against the old code.
2. **In-memory users were missing database defaults.** A user created in PHP had no `is_admin` or `phone` until it was reloaded. **Fix:** the `User::$attributes` defaults now match the columns.
3. **`preview_url` and `assigned_unit_ids` were read when never attached.** `PropertyMediaResource` now checks `hasAttribute()` first and keeps the same `null` / `[]` output.
4. **A test passed fields that don't exist.** A cache test sent `room_count` (not a column) and listing fields to the property writer. The test now sends real property fields.

## Detection in production

| Signal | Mechanism | Where it goes |
|---|---|---|
| Lazy loading (N+1) | Kept on in production; the handler logs instead of throwing | `ops.lazy_loading` log entry with model, relation and request reference |
| Slow single query, and slow total DB time per request | `App\Monitoring\SlowQueryMonitor` (RNT-12) | `ops.slow_query` log, plus Discord/email alert at the critical threshold |
| Exhausted queue jobs | `Queue::failing` in `MonitoringServiceProvider` | Ops alert |
| Server metrics | Netdata on the VPS host | [infrastructure/netdata](../../infrastructure/netdata/README.md) |
| Request profiling (development) | Telescope, admin only | `/telescope` |
