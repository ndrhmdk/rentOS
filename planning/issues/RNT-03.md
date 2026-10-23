<!-- rentos-backlog-v2: RNT-03 -->

# RNT-03: Register/sign in, issue Sanctum tokens and protect APIs with token permissions

## Outcome

Use Supabase for sign-in/email verification/recovery, then exchange verified identity for a Laravel Sanctum token. All private Laravel product endpoints require Sanctum token authentication plus permissions and resource authorization.

## Ownership and order

- Phase 1: Shared setup, accounts, properties and admin approval
- Implementation: **Hien** (frontend + backend + own tests).
- Reviewer: **Kien**.
- Prerequisites for final integration: [RNT-01](RNT-01.md) (GitHub #97).
- Publication: Draft; delivery: Planned; actual GitHub URL: https://github.com/ndrhmdk/rentOS/issues/98.

A prerequisite gates closure/integration, not all early work: use agreed contracts, factories and local fixtures after the shared schema/auth checkpoint. This is one grouped issue; internal checklists/multiple PRs do not require extra micro-issues.

## Functional requirements

- **FR01 — Email registration** (P0 Must): Register through Supabase Auth, confirm email before protected product writes, and create one application profile keyed by Auth UUID. Users can act as both tenant and owner; no role selection or phone OTP is required.
  - Full cases: [FR01 (4 cases)](../../docs/06-acceptance/test-scenarios.md#fr01)
- **FR02 — Sign in and obtain Sanctum API access** (P0 Must): Sign in through Supabase Auth, then verify its JWT at Laravel token issuance to obtain a finite-lived Sanctum API token. Private product endpoints use the Sanctum bearer token; refresh provider identity then rotate the client session’s Laravel token.
  - Full cases: [FR02 (4 cases)](../../docs/06-acceptance/test-scenarios.md#fr02)
- **FR04 — Sign out and revoke Sanctum API access** (P0 Must): Successful logout revokes the current client-session Sanctum token, signs out via Supabase and clears account-specific client data. Handle offline revocation failures explicitly; issued tokens have finite expiry. Do not promise instant provider JWT revocation detection with offline signature checks.
  - Full cases: [FR04 (3 cases)](../../docs/06-acceptance/test-scenarios.md#fr04)
- **FR05 — Enforce Sanctum abilities and resource authorization** (P0 Must): Private product APIs require auth:sanctum, required token abilities and resource Policies. Use trusted current user_profiles.is_admin for admin actions and ownership/participant relationships for resources. An ability never grants access to another user’s records.
  - Full cases: [FR05 (4 cases)](../../docs/06-acceptance/test-scenarios.md#fr05)
- **FR06 — Profile and dual dashboards** (P0 Must): View/update permitted name and contact information and navigate between tenant area and Manage rentals. Phone is contact information, not verified ownership. Avatar/DOB are optional later scope.
  - Full cases: [FR06 (3 cases)](../../docs/06-acceptance/test-scenarios.md#fr06)
- **FR43 — Verify Supabase identity and secure APIs with Sanctum** (P0 Must): Verify the Supabase JWT only at the protected identity-to-token issuance boundary. Issue hashed, expiring Laravel Sanctum tokens linked to the same UUID profile; enforce auth:sanctum, server-approved token abilities, rotation and revocation on private product APIs. Supabase JWT alone is not accepted there. No second password store.
  - Full cases: [FR43 (8 cases)](../../docs/06-acceptance/test-scenarios.md#fr43)
- **FR49 — Password reset and email confirmation** (P0 Must): Use Supabase confirmation/recovery links with configured allowed redirects. Reset password through provider; never store plaintext or recovery tokens in application tables. After confirmed password recovery, revoke the profile’s Sanctum tokens through an authenticated server action; require fresh sign-in/token issuance. Never use recovery links as product API bearer tokens.
  - Full cases: [FR49 (3 cases)](../../docs/06-acceptance/test-scenarios.md#fr49)

## Backend deliverables

- [ ] Implement a rate-limited token-issuance endpoint protected by verified Supabase access JWT: allowed algorithm/JWKS/signature, issuer, audience, expiry, subject and account/email eligibility. Resolve one profile keyed by the trusted subject; never accept client-supplied admin identity. Supabase JWT is accepted here for identity verification, not as a fallback on private product routes.
- [ ] Issue real Sanctum personal access tokens using HasApiTokens/createToken and the UUID-compatible storage from RNT-01. Store hashes only. Assign a server-controlled ability allowlist such as profile:read/profile:update, properties:manage, rental-requests:manage and admin:moderate. Grant admin abilities only from trusted current is_admin; never accept arbitrary requested scopes or a default wildcard.
- [ ] Protect private profile/property/listing/request/tenancy/report/notification APIs with auth:sanctum and explicit ability/abilities middleware or tokenCan checks. Every resource still uses Policies for actor ownership/participant access and current admin privilege; an ability alone never authorizes another user’s resource. Keep public listing GET routes public.
- [ ] Implement finite configured token expiry no later than the identity JWT expiry, per-client-session rotation/revocation and authenticated logout revocation. Refresh Supabase identity, then obtain a replacement Sanctum token for that session; revoke the previous session token. Logout revokes Laravel token before provider sign-out and clears client caches/tokens; if network revocation fails, show failure and bound remaining validity by expiry. Do not claim offline provider JWT validation instantly notices provider revocation.
- [ ] Expose own-profile read/update and account endpoints with FormRequests/Resources. Document the issuance, refresh, revocation, 401 and 403 contracts in Scramble and publish the early auth:sanctum/ability convention for other feature owners.

## Frontend deliverables

- [ ] Implement Supabase signup/email verification/sign-in/recovery and editable profile with tenant/owner navigation. After sign-in, send the Supabase access JWT to the Laravel issuance endpoint; use the returned Sanctum bearer token for private Laravel calls.
- [ ] Keep the two token purposes explicit; no tokens in logs, URLs, analytics or shared query caches. Use a documented secure client-token transport/storage approach without assuming unrelated frontend/API domains share session cookies. Handle token refresh/rotation once for safe reads; never blindly replay non-idempotent writes.
- [ ] On logout revoke the current Laravel token, sign out of Supabase and clear account data. Show useful expired-session and permission-denied feedback; a normal user cannot access admin pages/actions.

## Acceptance criteria

- [ ] Signup/sign-in/verification/reset/profile actions work with one Supabase identity and one UUID profile; Laravel stores no second password.
- [ ] A valid verified Supabase JWT obtains a finite-lived Sanctum token; expired, forged, wrong-project or ineligible identity JWTs fail issuance. A Supabase JWT alone cannot call private product endpoints.
- [ ] Private APIs enforce auth:sanctum. Missing/invalid/expired/revoked Sanctum tokens return 401. A valid token missing the required ability returns 403.
- [ ] Demonstrate scope enforcement using a read-only token that reads the allowed resource but cannot write. Client-forged admin scopes are rejected; current admin/ownership Policies remain effective even with an ability-bearing token.
- [ ] A user with properties:manage cannot edit another owner’s property; a tenant cannot view another tenancy or contact list. Public listing browsing remains available without a token.
- [ ] Refresh rotates only the authenticated client session’s Laravel token; the previous token stops working. Successful logout revokes that Laravel token. Other sessions follow the explicitly documented revocation policy.
- [ ] Integration tests exercise actual issued Sanctum token headers and database records, not only actingAs helpers. Verify hashed storage, finite expiry, revocation, 401/403 and safe error responses.
- [ ] Scramble documents Supabase identity verification at issuance separately from Sanctum bearer security on product routes. Submit real token-management and permission evidence for course criterion T4b; no Sanctum waiver is assumed.

## Tests/evidence owned by this member

- [ ] Unit tests for identity-claim validation, allowed ability selection, expiry bounds and client token/session state.
- [ ] API/PostgreSQL integration tests for verified identity issuance, hashed UUID-linked token storage, real auth:sanctum bearer requests, read-only versus write permissions, denied admin scopes and ownership/participant checks.
- [ ] API tests for expired/revoked/rotated tokens and logout revocation; component tests for sign-in, refresh/permission errors, logout and account switching. Manual UI checks only; no required E2E suite.

## NFRs, boundaries and coordination

NFR-02, NFR-03, NFR-04, NFR-06, NFR-07; T3b, T3c, T4b, T4a, T3g, T4d
Hien implements Sanctum issuance, auth:sanctum endpoint protection, ability rules and token lifecycle under this existing grouped issue. Khai installs/configures the package/model/storage/test setup in RNT-01. Supabase remains the identity/password provider. Other members protect their own private routes and write their authorization tests using these conventions. Sanctum is mandatory under the teacher’s Task 4 rubric.

## Definition of done

- [ ] Implement the related frontend, backend and meaningful unit/component/API integration tests under this issue; test PostgreSQL constraints/concurrency on actual PostgreSQL.
- [ ] Private product routes require auth:sanctum, approved abilities and resource Policies. Test actual bearer expiry/revocation/permission behavior where relevant.
- [ ] Update FormRequests/Resources/API docs and explicit frontend response types with contract changes. Future TypeScript generation is documentation only.
- [ ] Apply shared transaction/revision/idempotency/audit rules to the affected actions. Schema changes are new reviewed migrations tested locally; never reset/reseed a hosted environment.
- [ ] Use a short manual checklist for changed screens; automated browser/E2E suites are not required.
- [ ] Attach actual test commands/results and relevant screenshots/provider/query/alert evidence; record personal sprint contribution. A document or fixture screenshot is not proof of implemented behavior.

RNT-03 is a planning key, not a GitHub issue number. Deleted issues are not reused.
