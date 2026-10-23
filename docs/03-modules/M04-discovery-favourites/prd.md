# Landing page, location/date search and private favourites — PRD

## Outcome

Visitors browse safe public advertisements; location and all unit/date filters must match an eligible unit for the entire requested interval.

## Scope and screens/actions

- Landing page/search/cards/detail; address/ward/district/city query, preserved filter URLs and pagination; no map/GPS/radius/geocoding in MVP.
- Count and rent range come from the same qualifying unit set. Without dates, label the per-unit minimum-term default. Search never reserves properties and units.
- Authenticated property-level heart saves are private, persistent and idempotent; hidden targets become generic removable placeholders. No contact/reservation side effect.

## Functional requirements

### FR19 — Search listings by location and date-based availability

**Priority:** P0 Must. **Actors:** Guest; User. **Delivery:** Primary: RNT-06.

Search public eligible listings by text/address and paginated filters. Query units whose full desired interval has no blocking tenancy overlap. Without dates use today through each unit minimum rental term; label this default. Never use property RENTED or a stored availability count. Include a location input searching stored property address, ward, district and city. Trim/collapse whitespace and match case-insensitively while preserving Vietnamese text. Combine location AND other filters; dates/unit filters must match one eligible unit throughout the requested interval. Preserve filters in URL/pagination; clear location independently. Maps/GPS/radius/geocoding remain deferred.

Acceptance: [6 cases for FR19](../../06-acceptance/test-scenarios.md#fr19); IDs FR19-AC01, FR19-AC02, FR19-AC03, FR19-AC04, FR19-AC05, FR19-AC06.

### FR20 — Filter eligible units for the full requested interval

**Priority:** P0 Must. **Actors:** Guest; User. **Delivery:** Primary: RNT-06.

Support price, area, type, amenities, occupants and controlled policy filters on the same available unit. Start/end dates are both required when filtering dates; inclusive end is converted to [start,end+1day). Amenity filters use canonical catalog keys with enabled=true on eligible units/property scope; distinguish shared laundry from an in-unit washing machine. Custom descriptions never automatically match standard filters (FR87).

Acceptance: [4 cases for FR20](../../06-acceptance/test-scenarios.md#fr20); IDs FR20-AC01, FR20-AC02, FR20-AC03, FR20-AC04.

### FR21 — Display listing details and eligible unit cards

**Priority:** P0 Must. **Actors:** Guest; User. **Delivery:** Primary: RNT-06.

Show shared photos, advertised rules, unit photos/specifications/prices and date-qualified availability. Owner contact rental request form has contact name/phone/message and desired date range. Never display agreement documents or other prospects contact details. Display canonical localized amenity labels with owner details, separating shared property facilities, private unit features and additional custom text (FR87).

Acceptance: [4 cases for FR21](../../06-acceptance/test-scenarios.md#fr21); IDs FR21-AC01, FR21-AC02, FR21-AC03, FR21-AC04.

### FR22 — Interactive listing map

**Priority:** P2 Defer. **Actors:** Guest; User. **Delivery:** Deferred — no MVP implementation.

Optional map of eligible listings with valid approximate/public coordinates. Keep exact private information out of marker payloads.

Acceptance: [2 cases for FR22](../../06-acceptance/test-scenarios.md#fr22); IDs FR22-AC01, FR22-AC02.

### FR23 — Synchronize map and filters

**Priority:** P2 Defer. **Actors:** Guest; User. **Delivery:** Deferred — no MVP implementation.

Use same normalized filter service for map and list; map bounding changes have explicit URL/query state.

Acceptance: [2 cases for FR23](../../06-acceptance/test-scenarios.md#fr23); IDs FR23-AC01, FR23-AC02.

### FR24 — Geocode address

**Priority:** P2 Defer. **Actors:** System; Owner. **Delivery:** Deferred — no MVP implementation.

Optional asynchronous address-to-coordinate conversion after saving address. Manual address remains authoritative when provider fails.

Acceptance: [3 cases for FR24](../../06-acceptance/test-scenarios.md#fr24); IDs FR24-AC01, FR24-AC02, FR24-AC03.

### FR40 — Public listing REST resources

**Priority:** P0 Must. **Actors:** Guest; API client. **Delivery:** Primary: RNT-06.

Expose GET listing collection/detail using one public eligibility service; include safe unit/media/policy DTOs, pagination and errors.

Acceptance: [3 cases for FR40](../../06-acceptance/test-scenarios.md#fr40); IDs FR40-AC01, FR40-AC02, FR40-AC03.

### FR46 — Cache public listing content with fresh visibility checks

**Priority:** P1 Should. **Actors:** System. **Delivery:** Primary: RNT-11.

Next.js/TanStack Query may cache public reads. Invalidate on content, media, policy, suspension and allocation changes. Public detail/API must gate current hidden/suspended status; availability remains indicative until transactional proposal creation.

Acceptance: [3 cases for FR46](../../06-acceptance/test-scenarios.md#fr46); IDs FR46-AC01, FR46-AC02, FR46-AC03.

### FR77 — Calculate availability counts and rent ranges

**Priority:** P0 Must. **Actors:** System. **Delivery:** Primary: RNT-06.

For each selected interval, eligible unit has complete required listing data, is READY, marketed, nonarchived, minimum-duration compliant and has no overlap with blocking tenancy envelope. Pending-confirmation holds count as blocked until explicit expiry release. Count and rent range derive from same qualifying query. Without dates use each unit minimum term from today.

Acceptance: [4 cases for FR77](../../06-acceptance/test-scenarios.md#fr77); IDs FR77-AC01, FR77-AC02, FR77-AC03, FR77-AC04.

### FR88 — Save and manage favourite properties

**Priority:** P0 Must. **Actors:** Authenticated user. **Delivery:** Primary: RNT-07.

Private authenticated property-level persistent saves, idempotent intended-state writes, safe hidden placeholders and private list/count. Saving creates no rental request/reservation.

Acceptance: [10 cases for FR88](../../06-acceptance/test-scenarios.md#fr88); IDs FR88-AC01, FR88-AC02, FR88-AC03, FR88-AC04, FR88-AC05, FR88-AC06, FR88-AC07, FR88-AC08, FR88-AC09, FR88-AC10.

## API, validation and failure behavior

Private product routes require `auth:sanctum`, the allowed action ability and the current resource Policy. Public GET routes serialize safe fields only. Use FormRequests and Resources. Deny forged actors/foreign references; preserve documented 401/403/404/409/422 behavior. Show loading/empty/network/field/revision/session feedback in the related UI.

State-changing domain actions use agreed revision/idempotency/lock order and audit/outbox transaction rules. External storage failure is handled without pretending an upload or queued delivery already completed. See [API design](../../07-architecture/api-design.md).

## Tests and completion

Each feature owner writes meaningful unit/component and API/PostgreSQL integration tests, including denied, invalid, retry/stale and concurrency cases where relevant. Use a short manual checklist for changed screens; automated browser/E2E suites are not required. Record actual commands/results and evidence; current case specifications are not passed tests.
