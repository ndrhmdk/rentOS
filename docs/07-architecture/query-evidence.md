# Query evidence (RNT-17)

Measured on 2026-11-24 for [RNT-17](../../planning/issues/RNT-17.md) (#136). Every number below came from a real run; nothing is estimated.

## Setup

- PostgreSQL 17.11 (local Supabase), PHP 8.5, Laravel 13.
- A separate scratch database `rentos_evidence`, so the dev and test databases were not touched.
- Data: `BaselineSeeder` (200 published listings) plus `BulkDataSeeder` run with `run(1000, 20)`. That gives 1,200 properties, 4,200 units and **20,000 rental requests** in every status, aged 0–40 days.
- Plans come from `EXPLAIN (ANALYZE, BUFFERS)` after `ANALYZE`. Each time is the median of 5 warm runs.
- **Before** is the database with [`2026_11_24_155112_add_availability_and_scan_indexes`](../../backend/database/migrations/2026_11_24_155112_add_availability_and_scan_indexes.php) rolled back, and **after** is the same data with it applied.
- The SQL was taken from the application with `toRawSql()`, not typed by hand.

## Rental-request scans

| Query (where it runs) | Before | After | Change |
|---|---|---|---|
| Count of pending requests aged ≥ 15 days (`rentals:reject-aged`, hourly) | Seq Scan on 20,000 rows, 445 buffers, **3.35 ms** | Index Only Scan `rental_requests_pending_created_at_index`, 34 buffers, **1.00 ms** | 3.4× faster, 13× fewer pages |
| Next page of 100 aged requests (`lazyById`, ordered by `id`) | Index Scan `rental_requests_pkey`, 10 buffers, 0.11 ms | Same plan, 0.12 ms | No change (see note) |
| Owner inbox status counts (`OwnerRentalRequestsController@index`) | Seq Scan on 20,000 rows, 466 buffers, **3.94 ms** | Index Only Scan `rental_requests_listing_status_created_at_index`, 32 buffers, **0.22 ms** | 18× faster |
| Owner inbox page of 15 PENDING, ordered by `created_at` | Scan of the unrelated `(tenant_id, listing_id)` index, 288 buffers, **1.02 ms** | Index Scan on `(listing_id, status)`, 52 buffers, **0.29 ms** | 3.5× faster |

**Note on the paged walk:** `lazyById()` orders by `id`, so PostgreSQL keeps using the primary key and filters on status and age as it goes. That step was already cheap (10 buffers per page). The new partial index helps the count and keeps the scan bounded as old requests pile up. Changing the command to walk by `created_at` would let it use the index too. That's left as is, because ordering by `id` is what makes retries resumable.

## Tenancy indexes (no volume measurement)

`tenancies_confirmation_expiry_index` (every-minute `tenancies:expire-confirmations` scan) and `tenancies_tenant_id_created_at_index` (tenant tenancy list) were added for the query shapes they serve. They were **not** measured at volume: tenancies need contracts that pass the `validate_tenancy` triggers, and there is no tenancy factory that builds those yet. Unit availability overlap was already served by the existing `tenancies_no_overlapping_blocked_ranges` GiST index, so no index was added for it.

## Queries per public request

Same dataset, array cache store, with queries counted using `DB::listen` around one HTTP request each:

| Request | Queries | Server cache | Result |
|---|---|---|---|
| `GET /api/v1/listings?per_page=20`, first call | **9** | MISS | 200 |
| Same search again | **1** | HIT | 200 (only the fresh visibility check on the cached ids) |
| `GET /api/v1/listings/{id}`, first call | **9** | MISS | 200 |
| Same detail again | **1** | HIT | 200 (only the fresh visibility check) |
| Same detail with `If-None-Match` | **1** | HIT | **304**, empty body |

The query count on a miss is constant: 20 cards still take 9 queries, so search has no N+1. Strict Eloquent mode (see [antipatterns.md](antipatterns.md)) keeps it that way.

## Pagination bound

`per_page` is capped at 20 by `PublicListingIndexRequest`. `per_page=1000` and `per_page=0` return 422, which `PublicListingSearchTest::test_listings_index_rejects_page_sizes_above_the_cap` checks. `test_listings_index_paginates_with_sql_limit_and_reports_full_total` checks that paging returns no duplicates.

## Reproduce

```bash
createdb -h 127.0.0.1 -p 54322 -U postgres rentos_evidence
cd backend
DB_DATABASE=rentos_evidence php artisan migrate
DB_DATABASE=rentos_evidence php artisan migrate:rollback --step=1      # "before"
DB_DATABASE=rentos_evidence php artisan tinker --execute '(new Database\Seeders\BulkDataSeeder)->run(1000, 20);'
# EXPLAIN (ANALYZE, BUFFERS) the queries, then:
DB_DATABASE=rentos_evidence php artisan migrate                        # "after"
```
