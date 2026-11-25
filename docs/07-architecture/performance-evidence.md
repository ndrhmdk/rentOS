# Caching and resource-loading evidence (RNT-17)

Evidence for CSB35050 Task 6b (resource loading) and 6c (caching), from [RNT-17](../../planning/issues/RNT-17.md) (#136). Query-level evidence is in [query-evidence.md](query-evidence.md).

## Caching layers

A public listing read can be answered at four layers. Each one is bounded so a hidden or suspended listing is never shown (FR46).

| Layer | What it holds | Lifetime | How it is kept fresh |
|---|---|---|---|
| TanStack Query (in memory, per tab) | Search results and the amenity catalogue | `staleTime` 5 min | Refetched after mutations; cleared on logout |
| Browser HTTP cache | Public API responses | Search `max-age=30` (+60s stale-while-revalidate); detail `no-cache` (revalidated every time); amenities and locations `max-age=3600` | Weak `ETag`; a matching `If-None-Match` returns `304` with no body |
| Laravel server cache | Search pages and listing detail payloads | 1 hour | Version bump or key removal after commit, on every listing, property, unit, media and tenancy change (`ListingCacheService`) |
| PostgreSQL | Source of truth | — | Every cache hit still runs the fresh visibility check |

### Headers by route

| Route | `Cache-Control` | Validator |
|---|---|---|
| `GET /api/v1/listings` | `public, max-age=30, stale-while-revalidate=60` | Weak ETag, 304 |
| `GET /api/v1/listings/{id}` | `public, no-cache` | Weak ETag, 304; 404 (never 304) once hidden |
| `GET /api/v1/amenities`, `/api/v1/locations/*` | `public, max-age=3600, stale-while-revalidate=86400` | Weak ETag, 304 |
| Any public error (4xx/5xx) | `private, no-store` | none |
| Every other web/API response (account, session, CSRF, login, password reset, tokens, admin) | `private, no-store` (the default, from `PrivateNoStore`) | none |

Public routes skip Sanctum's stateful middleware, so they never set a session or XSRF cookie and are safe for a shared cache or CDN. If a public response ever does carry `Set-Cookie`, `PublicCacheHeaders` downgrades it to `private`.

The frontend's public reads (`publicGet` in `src/features/discovery/listings-api.ts`) send no credentials and use `cache: "default"`, so the browser follows these headers. Private calls through `src/lib/http/client.ts` stay `no-store` with `credentials: "include"`.

**Tests:** `PublicHttpCachingTest` (7), `PrivateResponseCachingTest` (11), `Unit/Http/PublicCacheHeadersTest` (4), plus `listings-api.test.ts` on the frontend.

## Resource loading

| Change | Before | After |
|---|---|---|
| Report and rental-request dialogs moved to `next/dynamic` (they only render after a click) | Listing detail initial JS: **176,468 B** in 7 chunks | **142,481 B** in 7 chunks (**−33,987 B, −19%**, uncompressed). The dialogs now load on demand as two chunks of 13,075 B and 21,845 B. |
| LCP hero images | Deprecated `priority` prop | `preload` on the home hero and the auth hero (the LCP image on each page) |
| Header logo (every page) | `priority`, which competed with each page's real LCP image | `loading="eager"` |
| Admin review photos (private blob URLs, which Next's image proxy can't fetch) | Loaded eagerly | `loading="lazy"`, `decoding="async"` |

Numbers come from `.next/server/app/listings/[id]/page_client-reference-manifest.js` after `npm run build`, comparing `HEAD` with this branch.

### Already in place (no change needed)

- **Image formats:** `next/image` serves **WebP** by default. AVIF was considered and not enabled: this Next.js version's docs still recommend WebP for most sites, because AVIF encodes about 50% slower and doubles the optimised-image cache.
- **Lazy images:** `next/image` lazy-loads by default, and every `fill` image has a `sizes` value.
- **Raw `<img>`:** the remaining six are small fixed-size SVG icons. `frontend/AGENTS.md` allows raw `<img>` only for small SVGs, and `next/image` does not optimise SVG.
- **Code-splitting:** the Leaflet map was already loaded with `next/dynamic` (`ssr: false`).
- **Prefetching:** `<Link>` prefetches route code for cards in the viewport, and `partialPrefetching` is on in `next.config.ts`. Listing detail data is not prefetched on hover, because detail is `no-cache` on purpose (it must revalidate), so a prefetch would not save the round trip.
- **Favourite state:** loaded from the private `favourite-properties/ids` endpoint, with loading, error and retry states (`favourites-store.ts` and its tests), and never part of a public response.

## Still to capture (manual, for the README and video)

These need a running app and a real browser, so they are left for the RNT-16 owner:

1. **DevTools → Network** on a repeated search: the first request is 200, the repeat within 30 s shows `(disk cache)`, and after 30 s it is `304`. Show the `Cache-Control`, `ETag` and `X-Cache` headers.
2. **Hidden listing:** open a listing, hide it as the owner, then reload. The response is `404`, not `304`.
3. **Lighthouse (mobile)** in Chrome DevTools for `/`, `/listings` and one listing detail page, on `develop` and on this branch.
