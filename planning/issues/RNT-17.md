

# RNT-17: Cache public API responses, close RNT-11 cache gaps, and optimise queries, seed data and resource loading

## Outcome

Public discovery responses can be cached by browsers (and safely by shared caches) without ever showing hidden or suspended listings. Private and auth responses are never cached. Listing availability stays fresh after every tenancy change. Queries are indexed and guarded against N+1. Seed data is built from factories, and the frontend loads only what each page needs.

## Ownership and order

- Phase 4 (after RNT-11 was merged in PR #134 and #135).
- Implementation: **Khai**.
- Reviewer: **Team**.
- Prerequisites: [RNT-11](RNT-11.md), [RNT-12](RNT-12.md), [RNT-14](RNT-14.md).
- Delivery: **one branch** `feat/rnt-17-performance-caching-hardening` from `develop` and **one PR**, with commits in the order WS2 → WS1 → WS6 → WS4 → WS7 → WS5.
- Detailed plan: [next-steps-plan.md](../next-steps-plan.md). Gap source: [RNT-11 PR review](../reviews/RNT-11-pr-review.md).
- Publication: Published as [ndrhmdk/rentOS#136](https://github.com/ndrhmdk/rentOS/issues/136).

## Scope boundaries

- **Not in scope:**
  - [RNT-15](RNT-15.md) owns test coverage over 70%, checking responses against OpenAPI, and stale or out-of-order search responses.
  - [RNT-16](RNT-16.md) owns the README, ERD, demo video, setup rehearsal and admin UI fixes.
- This issue writes tests for its own changes, and they count toward RNT-15's coverage. It produces the evidence docs RNT-16 links from the README.

## Functional requirements

- **FR46: Cache public listing content with fresh visibility checks**. This issue completes the HTTP layer and the remaining invalidation triggers.
  - [All 3 acceptance cases](../../docs/06-acceptance/test-scenarios.md#fr46)

## Backend deliverables

### WS2: RNT-11 leftovers

- [ ] Call `ListingCacheService::invalidateUnit()` after commit in `DeclineTenancyContract`, `CloseTenancy`, `CorrectTenancyProposal`, `ProposeTenancyRenewal`, `CorrectTenancyRenewalProposal` and `ResolveTenancyRenewalRequest`.
- [ ] Add a `PrivateNoStore` middleware on `auth:sanctum` groups, Fortify routes and `/sanctum/csrf-cookie`. Remove the hand-written `private, no-store` headers in controllers and Resources.
- [ ] Add an index migration for the availability and aged-request lookups, e.g. `tenancies(unit_id, status)`, `rental_requests(status, created_at)` and `units(property_id, status)`. Confirm the choices with `EXPLAIN`.
- [ ] Add `docs/07-architecture/query-evidence.md` with `EXPLAIN (ANALYZE, BUFFERS)` and query counts for search, detail and the aged-request scan, before and after the indexes, on the same seed.
- [ ] Bound `per_page` and verify that paging has no duplicates.
- [ ] Add Scramble docblocks for `NO_AVAILABLE_UNIT`, `availability_checked_at`, `X-Cache`, `ETag` and `304`.

### WS1: Public HTTP caching

- [ ] Add a `PublicCacheHeaders` middleware. It applies only to GET/HEAD 200 responses, sets a weak body-hash `ETag`, returns `304` on `If-None-Match`, sends `no-store` on errors, and downgrades `public` to `private` when the response sets cookies. It also adds `Vary: Origin`.
- [ ] Wire it to the routes:
  - search: `public, max-age=30, stale-while-revalidate=60`
  - detail: `public, no-cache` (always revalidate)
  - amenities and locations: `public, max-age=3600, stale-while-revalidate=86400`
- [ ] Remove `private, no-store` from `AmenitiesController` and the hardcoded header in `LocationsController`.
- [ ] Optional: drop the session middleware on public routes so they never set cookies and stay CDN-cacheable.

### WS6: Anti-pattern guard

- [ ] Add `Model::shouldBeStrict(! app()->isProduction())`, and log lazy-load violations in production. Fix every violation the suite reveals.
- [ ] Add `docs/07-architecture/antipatterns.md`, mapping each anti-pattern to where it was, how it was fixed, and the evidence.

### WS4: Factories and seeders

- [ ] Add factories with states: Property, Unit, PropertyMedia, Tenancy, ListingReport and Notification.
- [ ] `BaselineSeeder` uses the factories for bulk data and keeps the curated demo fixtures. Extend `BaselineSeederTest`.

### WS5: Explicit REST resources

- [ ] Replace the hand-written CRUD routes for owner properties, units, tokens and favourites with `Route::apiResource(...)->except/only(...)`. Route names and PAT ability mapping must stay the same.
- [ ] Add a docblock noting that delete is a soft archive.

## Frontend deliverables

### WS1 (frontend part)

- [ ] `src/lib/http/client.ts`: add a `cache` option to `request()`, defaulting to `"no-store"`. Public listing, amenity and location fetches pass `"default"`.

### WS7: Resource loading

- [ ] Convert the remaining raw `<img>` in `app/page.tsx`, `features/guide/guide-screen.tsx`, `components/listings/listing-detail.tsx` and `components/admin/admin-private-image.tsx` to `next/image`, or add lazy loading, dimensions and `srcset`.
- [ ] Set `images.formats: ['image/avif','image/webp']`, and `priority` only on the LCP image.
- [ ] Lazy-load the admin review panels, report dialog and contract viewer with `next/dynamic`, after checking `@next/bundle-analyzer`.
- [ ] Prefetch listing detail on card hover (`queryClient.prefetchQuery`).
- [ ] Load the favourite (heart) state from the private `ids` endpoint after the public card, with loading, failure and retry states. It must never be part of a public response.
- [ ] Add `docs/07-architecture/performance-evidence.md` with Lighthouse (mobile) results for the home page, `/listings` and detail, before and after, the bundle treemap, and the caching-layers table.

## Acceptance criteria

- [ ] Repeating a public search within 30s is served from the browser cache, and after that it gets a `304` when nothing changed. The DevTools screenshot is attached.
- [ ] After a listing edit, hide, suspend or archive, or any tenancy change listed in WS2, the next request returns `200` with a new ETag and `X-Cache: MISS`. It never returns a `304` with stale content.
- [ ] A hidden or suspended listing returns `404` even when the request sends the old ETag.
- [ ] No auth, CSRF, token or private account response is cacheable (`private, no-store`), and no `public` response carries `Set-Cookie`.
- [ ] Query plans before and after use the new indexes, and query counts for search and detail are recorded on the same seed.
- [ ] The full backend suite passes with strict Eloquent mode on.
- [ ] `php artisan db:seed` builds bulk data through factories, and `BaselineSeederTest` passes.
- [ ] No raw `<img>` remains on public pages without lazy loading and dimensions, and Lighthouse numbers before and after are recorded.
- [ ] Route names and PAT scopes are unchanged after the `apiResource` refactor; the existing owner and token tests pass.

## Tests/evidence owned by this issue

- [ ] `tests/Feature/PublicHttpCachingTest.php`: headers, 304, a new ETag after invalidation, 404 for a hidden listing with an old ETag, `no-store` on errors, and no `public` together with `Set-Cookie`.
- [ ] `tests/Unit/Http/PublicCacheHeadersTest.php`: parameter parsing, HEAD, and non-200 responses.
- [ ] A test that each tenancy action in WS2 makes the next request a cache MISS.
- [ ] A data-provider test for `no-store` on private, auth and token routes.
- [ ] Pagination bounds test and idempotent aged-rejection retry test.
- [ ] Frontend vitest: public fetches use `cache: "default"`, private fetches keep `"no-store"`, and the favourite state covers failure and retry.
- [ ] Evidence docs: `query-evidence.md`, `antipatterns.md` and `performance-evidence.md` under `docs/07-architecture/`.

## NFRs, boundaries and coordination

NFR-01, NFR-02, NFR-03, NFR-05, NFR-07; T2b, T4a, T6b, T6c, T6d

Send the evidence doc links to the RNT-16 owner for the README and video. Tell the RNT-15 owner when the PR merges so the new tests count toward coverage.

## Definition of done

- [ ] Implement related frontend, backend and meaningful unit/component/API/PostgreSQL integration tests; all feature owners test their own changes.
- [ ] Private routes use auth:sanctum and current account/resource Policies. Browser writes require CSRF; approved PAT endpoints additionally enforce abilities. Session-only endpoints reject PAT-only callers.
- [ ] Update FormRequests/Resources/OpenAPI and explicit frontend types.
- [ ] Use reviewed migrations locally; never reset/reseed a hosted environment.
- [ ] Use a short manual changed-screen checklist; no required automated browser/E2E suite.
- [ ] Attach actual test commands/results and relevant evidence to the PR; specifications do not prove implementation.

## Delivery notes (2026-11-24)

Where the implementation differs from the checklist above, and why:

- **Indexes:** unit availability was already covered by the `tenancies_no_overlapping_blocked_ranges` GiST index, so the new indexes target the aged-request scan, the owner inbox, the confirmation-expiry scan and the tenant tenancy list. The tenancy indexes weren't measured at volume (no tenancy factory yet).
- **Factories:** Property and Unit factories, plus Listing and RentalRequest states. PropertyMedia, Tenancy and ListingReport factories weren't built, because their database triggers need contracts or published listings. There is no Notification model.
- **Seeders:** `BaselineSeeder` stays deterministic for the demo; the new `BulkDataSeeder`, run from `DatabaseSeeder`, builds factory data.
- **`apiResource`:** owner properties only. Favourites (idempotent `PUT` store) and tokens (`{tokenId}`, extra throttle) keep explicit routes.
- **Images:** the remaining raw `<img>` are small SVG icons, which `frontend/AGENTS.md` allows. WebP (the Next.js default) was kept instead of AVIF, following the framework docs. `priority` moved to `preload`.
- **Lazy loading:** the listing report and rental-request dialogs are code-split. The admin review panels and contract viewer weren't.
- **Not done here:** prefetching listing detail on hover (detail is `no-cache` on purpose, so it would save nothing). The favourite state already had loading, error and retry states. Lighthouse and DevTools screenshots are manual steps for RNT-16 (see `docs/07-architecture/performance-evidence.md`).
- **Found by strict mode:** uploaded photo ids didn't match their storage path. Fixed, with a regression check.

RNT-17 is a planning key, not a GitHub number. Deleted issues are not reused.
