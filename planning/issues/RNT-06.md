<!-- rentos-backlog-v2: RNT-06 -->

# RNT-06: Build the landing page, browse/search listings and view listing details

## Outcome

Visitors use the landing page to browse public rental listings, search by location and dates, filter results and view listing details and available units.

## Ownership and order

- Phase 2: Listing browsing, rental requests, contracts and reports
- Implementation: **Khai** (frontend + backend + own tests).
- Reviewer: **Kien**.
- Prerequisites for final integration: [RNT-02](RNT-02.md) (GitHub #100), [RNT-03](RNT-03.md) (GitHub #98), [RNT-04](RNT-04.md) (GitHub #99).
- Publication: Draft; delivery: Planned; actual GitHub URL: https://github.com/ndrhmdk/rentOS/issues/101.

A prerequisite gates closure/integration, not all early work: use agreed contracts, factories and local fixtures after the shared schema/auth checkpoint. This is one grouped issue; internal checklists/multiple PRs do not require extra micro-issues.

## Functional requirements

- **FR19 — Search listings by location and date-based availability** (P0 Must): Search public eligible listings by text/address and paginated filters. Query units whose full desired interval has no blocking tenancy overlap. Without dates use today through each unit minimum rental term; label this default. Never use property RENTED or a stored availability count. Include a location input searching stored property address, ward, district and city. Trim/collapse whitespace and match case-insensitively while preserving Vietnamese text. Combine location AND other filters; dates/unit filters must match one eligible unit throughout the requested interval. Preserve filters in URL/pagination; clear location independently. Maps/GPS/radius/geocoding remain deferred.
  - Full cases: [FR19 (6 cases)](../../docs/06-acceptance/test-scenarios.md#fr19)
- **FR20 — Filter eligible units for the full requested interval** (P0 Must): Support price, area, type, amenities, occupants and controlled policy filters on the same available unit. Start/end dates are both required when filtering dates; inclusive end is converted to [start,end+1day). Amenity filters use canonical catalog keys with enabled=true on eligible units/property scope; distinguish shared laundry from an in-unit washing machine. Custom descriptions never automatically match standard filters (FR87).
  - Full cases: [FR20 (4 cases)](../../docs/06-acceptance/test-scenarios.md#fr20)
- **FR21 — Display listing details and eligible unit cards** (P0 Must): Show shared photos, advertised rules, unit photos/specifications/prices and date-qualified availability. Owner contact rental request form has contact name/phone/message and desired date range. Never display agreement documents or other prospects contact details. Display canonical localized amenity labels with owner details, separating shared property facilities, private unit features and additional custom text (FR87).
  - Full cases: [FR21 (4 cases)](../../docs/06-acceptance/test-scenarios.md#fr21)
- **FR40 — Public listing REST resources** (P0 Must): Expose GET listing collection/detail using one public eligibility service; include safe unit/media/policy DTOs, pagination and errors.
  - Full cases: [FR40 (3 cases)](../../docs/06-acceptance/test-scenarios.md#fr40)
- **FR77 — Calculate availability counts and rent ranges** (P0 Must): For each selected interval, eligible unit has complete required listing data, is READY, marketed, nonarchived, minimum-duration compliant and has no overlap with blocking tenancy envelope. Pending-confirmation holds count as blocked until explicit expiry release. Count and rent range derive from same qualifying query. Without dates use each unit minimum term from today.
  - Full cases: [FR77 (4 cases)](../../docs/06-acceptance/test-scenarios.md#fr77)

## Backend deliverables

- [ ] Implement public search/detail Resources with text/address, price/capacity/canonical amenity filters on the SAME eligible unit for the WHOLE interval. Compute eligible counts/rent ranges from READY operational state and blocking tenancy dates; bounded pagination/eager loading.
- [ ] Implement server-side location search over existing property address/locality fields (address, ward, district, city where stored). Trim/collapse whitespace and match case-insensitively while preserving Vietnamese text. Combine location AND all selected filters; date/unit criteria must match the same unit for the entire interval. Bind query parameters; keep counts/pagination consistent.
- [ ] Use one public visibility rule shared with owner listing publication and admin suspension; return only safe public fields. Kien owns listing write endpoints in RNT-02.

## Frontend deliverables

- [ ] Build the public landing page, navigation, search entry and listing cards. Link Manage rentals to the signed-in owner area and preserve compatible existing design/assets.
- [ ] Build responsive public search/filter/cards/details and eligible unit selector with clear loading/empty/error states, preserved filter URLs and accessible navigation.
- [ ] Add a labeled location input/filter to public discovery; preserve location with other filters/date range in URL state and pagination. Show selected location, clear/reset and loading/error/no-results states on desktop.

## Acceptance criteria

- [ ] Owner-hidden/archived/suspended/unapproved content is excluded from public routes, and restore does not automatically republish an owner-hidden listing.
- [ ] A unit must satisfy all selected filters and be available for the entire interval; different units cannot jointly satisfy one filter result.
- [ ] Adjacent bookings remain eligible, while overlapping reservations/confirmed periods and maintenance/retired units are excluded.
- [ ] Displayed availability counts and price range are based on the filtered eligible set, not all units or a permanent RENTED flag.
- [ ] Searching a stored district/ward/address returns only matching public properties. Leading/trailing whitespace and letter case do not change results; blank location removes only the location condition.
- [ ] Location AND price/amenity/unit/date filters are applied together. A property in the right district with no same-unit full-interval match is excluded; hidden listings remain excluded.
- [ ] Location persists across pagination/reload/back navigation; clearing it preserves other filters, and unknown locations show an empty state. MVP scope is address/locality search, without GPS, maps, radius or geocoding.
- [ ] The landing page and listing search/detail pages work on mobile and desktop with actual Laravel data, loading/error/no-results states and keyboard-accessible controls.

## Tests/evidence owned by this member

- [ ] Unit/component tests for landing-page search, filters, cards, date selection, location input and navigation.
- [ ] PostgreSQL/API tests for public visibility/privacy, full-period availability, same-unit filters, counts/prices and pagination.
- [ ] Manual UI check: landing page -> location/date search -> filtered results -> listing detail. Unapproved, hidden, archived or suspended listings never appear.
- [ ] Location normalization/query tests plus API/component tests and manual UI checks for address/ward/district/city match, wrong locality, empty/unknown input, Vietnamese text, parameter binding, combined same-unit/full-date filters and URL/pagination/reset behavior.

## NFRs, boundaries and coordination

NFR-01, NFR-02, NFR-03, NFR-04, NFR-07; T3e, T4a, T3g, T4d
Khai owns the complete browsing frontend/API/tests. Kien owns owner listing create/edit/submit/publish actions in RNT-02; Tri owns admin approval in RNT-04. Location means stored address/ward/district/city search; maps/GPS/radius/geocoding stay deferred. Browsing creates no reservation. RNT-11 improves search performance and applies the 15-day rule.

## Definition of done

- [ ] Implement the related frontend, backend and meaningful unit/component/API integration tests under this issue; test PostgreSQL constraints/concurrency on actual PostgreSQL.
- [ ] Private product routes require auth:sanctum, approved abilities and resource Policies. Test actual bearer expiry/revocation/permission behavior where relevant.
- [ ] Update FormRequests/Resources/API docs and explicit frontend response types with contract changes. Future TypeScript generation is documentation only.
- [ ] Apply shared transaction/revision/idempotency/audit rules to the affected actions. Schema changes are new reviewed migrations tested locally; never reset/reseed a hosted environment.
- [ ] Use a short manual checklist for changed screens; automated browser/E2E suites are not required.
- [ ] Attach actual test commands/results and relevant screenshots/provider/query/alert evidence; record personal sprint contribution. A document or fixture screenshot is not proof of implemented behavior.

RNT-06 is a planning key, not a GitHub issue number. Deleted issues are not reused.
