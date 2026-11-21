# RNT-14 Verification Record

Verification date: 2026-11-21  
Branch: `feat/rnt-14-verify-owner-property-listing-photos`

This note records checks run during the RNT-14 implementation and final review. It separates automated coverage from manual checks and records evidence gaps instead of inferring results.

## Automated checks

| Command | Result |
| --- | --- |
| `npm run lint` (frontend) | Passed |
| `npm run typecheck` (frontend) | Passed |
| `npm test` (frontend) | Passed: 22 Vitest files / 51 tests and 13 Node tests |
| `composer run lint` (backend) | Passed (Pint) |
| `composer run typecheck` (backend) | Passed (PHPStan, 0 errors) |
| `php artisan test --compact tests/Feature/OwnerPropertiesTest.php tests/Feature/OwnerListingsTest.php tests/Feature/OwnerPropertyMetadataTest.php tests/Feature/PropertyMediaSharedPathTest.php` | Passed: 62 tests, 369 assertions |
| `npx vitest run 'src/app/(portal)/owner/properties/property-photos.test.tsx' 'src/app/(portal)/owner/properties/unit-photos.test.tsx' 'src/app/(portal)/owner/listings/listing-editor.test.tsx' 'src/components/listings/listing-photo-grid.test.tsx'` | Passed: 4 files, 7 tests |

The frontend suite initially timed out one existing listing-detail test while other checks were running concurrently. Running that test file alone passed all 7 tests; rerunning the full frontend suite afterward passed.

The backend checks required an unrestricted local process because the restricted PHP process could not read `vendor/autoload.php` or `phpstan.neon`. PHPStan and the focused feature tests then completed successfully.

## Owner photo and listing preview check

Using the one current test photo on property `can ho test 2020` (listing `nakamura my fav`):

- The photo rendered in the owner property photo gallery and listing preview.
- The source Storage response was `image/jpeg`, 735 × 736 pixels, 43,050 bytes.
- The Next.js optimized 640-pixel response was 640 × 641 pixels, 26,198 bytes.
- The optimized response used about 39% fewer bytes than the source response. This compares the source file with the optimized response; it is not a before/after measurement of the application change.
- The browser gallery contained one current photo, so its reorder controls were disabled. Reordering, stale-revision recovery, removal recovery, and upload retry are covered by component tests. No photo was uploaded, removed, or reordered in the live account during this check.

Outdated seeded photo URLs that return 404 were excluded from this check, as requested.

## Query-count evidence

`OwnerPropertiesTest::test_owner_property_list_includes_current_listings_with_a_fixed_query_count` creates a controlled dataset of 25 properties, one listing and two units per property. For the same 20 properties, the previous page pattern ran the paginated property query with units (3 SQL reads), followed by a detail request and a listing request per property (100 SQL reads): 103 total SQL reads across 41 API requests. The eager-loaded endpoint returns the same relationships in 4 SQL reads and 1 API request, a 96.1% reduction in SQL reads for this fixture. The test now asserts both counts, plus the second-page query count.

PostgreSQL `EXPLAIN (ANALYZE, BUFFERS)` on the four current page queries showed:

- The owner property count and page query use `properties_owner_id_client_operation_id_unique`, with `archived_at IS NULL` as a filter; the page query sorts the matching owner rows by `created_at DESC` before applying the 20-row limit.
- The current listings lookup uses `listings_one_current_per_property_unique` for the 20 property IDs.
- The batched units lookup used a sequential scan on the small fixture table (40 rows matched, 10 filtered out). This is a single bounded query, not one query per property.

These plans and timings are from the local test database and small fixture, so they document query shape rather than production-scale latency.

## Scope exclusions and remaining manual evidence

- FR59 scheduled deletion and retention behavior from RNT-10 was excluded from this issue’s work, as requested.
- The live UI review confirmed the current valid photo renders in the owner photo gallery and listing preview at desktop size. At 390 px, the photo loaded in both the gallery and listing preview. The page body/document stayed at 375 px wide inside a 390 px viewport; the listings table uses its own horizontal scroll container. The gallery had only one valid current photo, so reordering was unavailable; no live upload, removal, or reorder was performed. Bulk unit entry and policy editing were not rechecked in this final review.
- `OwnerListingSuspensionConcurrencyTest` was invoked locally and skipped because the Windows PHP runtime does not provide `pcntl` and Unix socket pairs. Run it in Linux CI, where those features are available, to exercise the actual concurrent writes.

The focused query-count test passed after adding the same-fixture legacy comparison (1 test, 61 assertions). The full RNT-14 checks listed above passed. The manual and platform limitations above remain explicit; this note does not claim those flows were verified.
