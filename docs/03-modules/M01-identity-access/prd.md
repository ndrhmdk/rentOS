# Identity, profiles and API permissions — PRD

## Outcome

Register/sign in through Supabase; exchange verified identity for a finite Sanctum token. Private Laravel APIs require auth:sanctum, required token abilities and ownership/participant/admin Policies.

## Scope and screens/actions

- Registration, email confirmation, sign-in/recovery, profile and tenant/owner navigation.
- Rate-limited identity verification and token issuance; scope selection, rotation and logout revocation.
- A signed-in user can rent and own simultaneously; admin privilege comes from current trusted user_profiles.is_admin.

## Functional requirements

### FR01 — Email registration

**Priority:** P0 Must. **Actors:** Guest. **Delivery:** Primary: RNT-03.

Register through Supabase Auth, confirm email before protected product writes, and create one application profile keyed by Auth UUID. Users can act as both tenant and owner; no role selection or phone OTP is required.

Acceptance: [4 cases for FR01](../../06-acceptance/test-scenarios.md#fr01); IDs FR01-AC01, FR01-AC02, FR01-AC03, FR01-AC04.

### FR02 — Sign in and obtain Sanctum API access

**Priority:** P0 Must. **Actors:** User. **Delivery:** Primary: RNT-03.

Sign in through Supabase Auth, then verify its JWT at Laravel token issuance to obtain a finite-lived Sanctum API token. Private product endpoints use the Sanctum bearer token; refresh provider identity then rotate the client session’s Laravel token.

Acceptance: [4 cases for FR02](../../06-acceptance/test-scenarios.md#fr02); IDs FR02-AC01, FR02-AC02, FR02-AC03, FR02-AC04.

### FR03 — Google sign in

**Priority:** P2 Defer. **Actors:** User. **Delivery:** Deferred — no MVP implementation.

Optional Google sign in with configured redirect allowlist; map provider identity to one profile. Do not implement a second Laravel password store.

Acceptance: [3 cases for FR03](../../06-acceptance/test-scenarios.md#fr03); IDs FR03-AC01, FR03-AC02, FR03-AC03.

### FR04 — Sign out and revoke Sanctum API access

**Priority:** P0 Must. **Actors:** User. **Delivery:** Primary: RNT-03.

Successful logout revokes the current client-session Sanctum token, signs out via Supabase and clears account-specific client data. Handle offline revocation failures explicitly; issued tokens have finite expiry. Do not promise instant provider JWT revocation detection with offline signature checks.

Acceptance: [3 cases for FR04](../../06-acceptance/test-scenarios.md#fr04); IDs FR04-AC01, FR04-AC02, FR04-AC03.

### FR05 — Enforce Sanctum abilities and resource authorization

**Priority:** P0 Must. **Actors:** User; Admin. **Delivery:** Primary: RNT-03.

Private product APIs require auth:sanctum, required token abilities and resource Policies. Use trusted current user_profiles.is_admin for admin actions and ownership/participant relationships for resources. An ability never grants access to another user’s records.

Acceptance: [4 cases for FR05](../../06-acceptance/test-scenarios.md#fr05); IDs FR05-AC01, FR05-AC02, FR05-AC03, FR05-AC04.

### FR06 — Profile and dual dashboards

**Priority:** P0 Must. **Actors:** User. **Delivery:** Primary: RNT-03.

View/update permitted name and contact information and navigate between tenant area and Manage rentals. Phone is contact information, not verified ownership. Avatar/DOB are optional later scope.

Acceptance: [3 cases for FR06](../../06-acceptance/test-scenarios.md#fr06); IDs FR06-AC01, FR06-AC02, FR06-AC03.

### FR43 — Verify Supabase identity and secure APIs with Sanctum

**Priority:** P0 Must. **Actors:** API client. **Delivery:** Primary: RNT-03.

Verify the Supabase JWT only at the protected identity-to-token issuance boundary. Issue hashed, expiring Laravel Sanctum tokens linked to the same UUID profile; enforce auth:sanctum, server-approved token abilities, rotation and revocation on private product APIs. Supabase JWT alone is not accepted there. No second password store.

Acceptance: [8 cases for FR43](../../06-acceptance/test-scenarios.md#fr43); IDs FR43-AC01, FR43-AC02, FR43-AC03, FR43-AC04, FR43-AC05, FR43-AC06, FR43-AC07, FR43-AC08.

### FR49 — Password reset and email confirmation

**Priority:** P0 Must. **Actors:** User. **Delivery:** Primary: RNT-03.

Use Supabase confirmation/recovery links with configured allowed redirects. Reset password through provider; never store plaintext or recovery tokens in application tables. After confirmed password recovery, revoke the profile’s Sanctum tokens through an authenticated server action; require fresh sign-in/token issuance. Never use recovery links as product API bearer tokens.

Acceptance: [3 cases for FR49](../../06-acceptance/test-scenarios.md#fr49); IDs FR49-AC01, FR49-AC02, FR49-AC03.

## API, validation and failure behavior

Private product routes require `auth:sanctum`, the allowed action ability and the current resource Policy. Public GET routes serialize safe fields only. Use FormRequests and Resources. Deny forged actors/foreign references; preserve documented 401/403/404/409/422 behavior. Show loading/empty/network/field/revision/session feedback in the related UI.

State-changing domain actions use agreed revision/idempotency/lock order and audit/outbox transaction rules. External storage failure is handled without pretending an upload or queued delivery already completed. See [API design](../../07-architecture/api-design.md).

## Tests and completion

Each feature owner writes meaningful unit/component and API/PostgreSQL integration tests, including denied, invalid, retry/stale and concurrency cases where relevant. Use a short manual checklist for changed screens; automated browser/E2E suites are not required. Record actual commands/results and evidence; current case specifications are not passed tests.
