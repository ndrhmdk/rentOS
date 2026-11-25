# UI evidence audit (before re-capture)

Capture rules for every replacement: production build (`next build && next start`, no Next dev badge), viewport 1440x900, same filename as the old image so existing links keep working, no real personal emails visible.

| File | Page | Verdict | Problem found | Action |
| --- | --- | --- | --- | --- |
| 01-landing-home.png | `/` | Replace | Next dev badge; duplicate "Tìm nhà ngay!" CTA; weak eyebrow contrast | Recapture after hero fix |
| 02-listings-search.png | `/listings` | Replace | Dev badge; card has no photo (grey placeholder); 1 result only | Recapture with seeded listings that have photos |
| 03-listing-detail-report.png | `/listings/[id]` + report modal | Replace | Dev badge; broken gallery image behind modal | Fix image/URL, recapture |
| 04-owner-dashboard.png | `/owner` | Replace | Dev badge; viewport 1920 (others 1440); highlighted KPI card without reason | Recapture at 1440x900 |
| 05-owner-property-units.png | `/owner/properties/[id]` | Replace | Dev badge; viewport 1920; form cut off, no units shown | Recapture showing units/photos tab |
| 06-owner-listing-pending.png | `/owner/listings/[id]` (pending) | Replace | Dev badge; back link touches the card; description without diacritics (seed data) | Recapture with clean seed text |
| 06b-owner-listing-published.png | same, published | Replace | Dev badge; different width/scrollbar from 06 | Recapture, same viewport as 06 |
| 08-tenant-dashboard.png | `/tenant` | Replace | Dev badge; KPI "0 hợp đồng" unit inconsistent with other cards | Recapture after KPI fix |
| 09-tenant-reports-fr72.png | `/tenant/reports` | Replace | Dev badge; badge restyled by `StatusBadge` | Recapture |
| 10-api-tokens-scopes.png | `/api-tokens` | Replace | Dev badge only | Recapture |
| 11-admin-review-queue.png | `/admin/review-queue` | Replace | Dev "Insight" badge covers admin avatar; sidebar label wraps | Recapture |
| 12-admin-reports-suspend.png | `/admin/reports` | Replace (required) | Badges wrapped onto 2 lines, filters uneven, heading inconsistent. Fixed by `StatusBadge` | Recapture |
| 13-mail-telescope.png | `/telescope/mail` | Keep | Third-party UI, evidence is valid | Optional: add a slow-query entry |
| 14-openapi-scramble.png | `/docs/api` | Replace | Overview only, shows no endpoint, bearer scheme or 409/422 example | Recapture on an expanded endpoint |
| 15-lighthouse-rentos-20-30-56.png | production Lighthouse | Keep, relabel | Mobile run | State "mobile" in summary |
| 16-lighthouse-rentos-20-32-00.png | production Lighthouse | Keep, relabel | Desktop run, not a repeat of 15 | State "desktop" in summary |

## Missing evidence (new files)

- 07-csrf-valid-and-rejected: a form submit that succeeds and one without the CSRF token that is rejected.
- 17-token-401-revoked: a cookie-free request with a revoked token returning 401.
- 18-netdata-dashboard / alert: CPU, memory, disk, network and a fired alert (T5d).
- 19-coverage-backend / 20-coverage-frontend: coverage summaries (94.2% and 75.81%).
- 21-admin-dashboard: `/admin`.
- 22-erd: rendered ERD from `docs/07-architecture/database-schema.mmd`.

## Pre-capture fixes (done)

1. Broken gallery image: caused by the local seed library not being served; `fixtures:media-upload` confirmed all 108 objects, listing 50000000-...001 now shows photos.
2. Hero duplicate CTA: left button now reads "Xem tất cả tin đăng".
3. Tenant KPI: first card shows a plain number like the others.
4. Seed data: `BaselineSeeder` (200 listings with photos); demo properties renamed to readable names.

## Re-capture status (production build, 1440x900, seeded accounts)

Recaptured: 01, 02, 03, 04, 05, 06, 06b, 08, 09, 10, 11, 12, 14.
Kept: 13 (Telescope), 15 (Lighthouse mobile), 16 (Lighthouse desktop).
New: 07 CSRF, 17 revoked-token 401, 19/20 coverage, 21 admin dashboard, 22 ERD.
Still missing: 18 Netdata. It runs on the VPS host (see `infrastructure/netdata/README.md`); it cannot be captured from the local machine without misrepresenting the environment, so take it from the VPS dashboard through the SSH tunnel and trigger one threshold alert.

Known leftovers: ui images 05/10 use demo data (property type "Nhà" for an apartment name; token has only `favourites:read`); the screenshots were taken with a puppeteer-driven Chrome, flows (report, approve, publish, resolve+suspend) were done through the real UI.
