# M01 Product requirements

## Purpose
Supabase identity, profile bootstrap, dual tenant/owner navigation and server resource authorization.

## Actors and permissions
Use actor/resource Policies from each FR below; UI guards never replace backend checks.

## Functional requirements

### FR01 Email registration
Priority: P0 Must. Actors: Guest. Dependencies: Shared identity/resource foundation.

Factors: Identity consistency; privilege escalation; privacy

Tools: Supabase Auth + Next.js auth client + Laravel JWT guard using project JWKS

Register through Supabase Auth, confirm email before protected product writes, and create one application profile keyed by Auth UUID. Users can act as both tenant and owner; no role selection or phone OTP is required.

Acceptance criteria:

- FR01-AC01 [Positive] Register a valid email/password and confirm email → One Auth identity and one profile exist; is_admin=false.
- FR01-AC02 [Validation] Invalid email or weak password → Provider errors are mapped to field feedback without creating a privileged profile.
- FR01-AC03 [Privacy] Register an already registered email → Handle provider response without promising disclosure of whether the account exists; offer sign-in/reset guidance.
- FR01-AC04 [Race] Two signup/profile callbacks run for the same Auth UUID → Unique profile PK/upsert creates one profile; retries do not reset an existing name or admin flag.

### FR02 Email login and session refresh
Priority: P0 Must. Actors: User. Dependencies: Shared identity/resource foundation.

Factors: Authentication; expiration; recovery

Tools: Supabase Auth + Next.js auth client + Laravel JWT guard using project JWKS

Sign in through Supabase Auth. Send its access token to Laravel; use provider refresh flow and protect private Next.js pages and API endpoints.

Acceptance criteria:

- FR02-AC01 [Positive] Confirmed user submits correct credentials → Protected dashboard loads the linked profile.
- FR02-AC02 [Negative] Wrong password or unconfirmed account → Clear safe error; no protected data returned.
- FR02-AC03 [Security] Expired token with valid refresh session → Refresh through Supabase then retry safe reads once; never blindly replay a non-idempotent write.
- FR02-AC04 [Negative] Refresh fails or session expires → Clear private client cache and require sign-in; API returns 401.

### FR03 Google sign in
Priority: P2 Defer. Actors: User. Dependencies: FR01 FR43.

Factors: Identity linking; callback integrity

Tools: Supabase Auth + Next.js auth client + Laravel JWT guard using project JWKS + Google OAuth

Optional Google sign in with configured redirect allowlist; map provider identity to one profile. Do not implement a second Laravel password store.

Acceptance criteria:

- FR03-AC01 [Positive] User completes allowed Google callback → Provider identity maps to one application profile.
- FR03-AC02 [Security] Invalid callback/state or attempted client-created admin flag → Reject flow or ignore forbidden privilege input.
- FR03-AC03 [Race] Callback is delivered twice → No duplicate profile or duplicated onboarding notification.

### FR04 Logout
Priority: P0 Must. Actors: User. Dependencies: Shared identity/resource foundation.

Factors: Session lifecycle; bearer-token limits

Tools: Supabase Auth + Next.js auth client + Laravel JWT guard using project JWKS

Sign out via Supabase and clear user-scoped Next.js/TanStack data. Document that a previously issued JWT may remain valid until expiry when Laravel validates it offline.

Acceptance criteria:

- FR04-AC01 [Positive] User logs out → Current browser loses credentials and private cached data; protected navigation requires sign-in.
- FR04-AC02 [Security] Another user signs in on same browser → No previous user private data appears.
- FR04-AC03 [Boundary] Previously copied unexpired access token is replayed → Do not claim instant token revocation; state expiry-bound behavior unless a server-side revocation check is deliberately added.

### FR05 Resource and admin authorization
Priority: P0 Must. Actors: User; Admin. Dependencies: Shared identity/resource foundation.

Factors: Ownership; least privilege; direct DB exposure

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL

Use is_admin on trusted profiles for moderation. Normal users act as tenant and owner through resource relationships. Backend checks every private read/write; frontend guards are only UX.

Acceptance criteria:

- FR05-AC01 [Security] Owner B guesses Owner A property/unit/request UUID → Return 403/404 without private data or mutation.
- FR05-AC02 [Security] Normal user submits is_admin or another owner_id → Reject restricted input; actor comes from verified identity.
- FR05-AC03 [Security] Normal user calls an admin moderation endpoint → 403; no audit outcome or notification is committed.
- FR05-AC04 [Security] Browser directly calls Supabase Data API/storage → Business tables are not writable/readable through unintended grants; storage rules restrict private files. Laravel authorization remains enforced even if DB connection bypasses RLS.

### FR06 Profile and dual dashboards
Priority: P0 Must. Actors: User. Dependencies: Shared identity/resource foundation.

Factors: Data minimization; stale edits

Tools: Next.js + React + Tailwind + TanStack Query + Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL

View/update permitted name and contact information and navigate between tenant area and Manage rentals. Phone is contact information, not verified ownership. Avatar/DOB are optional later scope.

Acceptance criteria:

- FR06-AC01 [Positive] User edits allowed contact fields → Validated values saved; dashboard uses current profile.
- FR06-AC02 [Security] Profile PATCH includes admin flag, identity UUID or verification fields → Rejected; privilege fields unchanged.
- FR06-AC03 [Race] Two tabs edit the same profile version → Expected version rejects stale write with 409 rather than silently overwriting.

### FR43 Verify Supabase JWT in Laravel
Priority: P0 Must. Actors: API client. Dependencies: Shared identity/resource foundation.

Factors: Signature and claims; single identity authority

Tools: Supabase Auth + Next.js auth client + Laravel JWT guard using project JWKS

Validate Supabase access JWT using allowed asymmetric algorithm and project JWKS; verify issuer, audience, expiry, subject and account/profile eligibility. Use trusted sub as profile UUID. No Sanctum personal_access_tokens in chosen auth path.

Acceptance criteria:

- FR43-AC01 [Positive] Valid project access token → Laravel resolves current profile and then runs Policies.
- FR43-AC02 [Security] Tampered payload, alg none, wrong issuer/audience/key or expired token → 401, no protected action.
- FR43-AC03 [Security] Body contains a different user_id → Never replaces verified sub.
- FR43-AC04 [Failure] Unknown kid/key rotation or JWKS refresh failure → Bounded key refresh, fail closed and safe error; no arbitrary token-supplied key URL.
- FR43-AC05 [Race] Multiple first API calls bootstrap same confirmed profile → One profile row with no overwritten privilege flags.

### FR49 Password reset and email confirmation
Priority: P0 Must. Actors: User. Dependencies: Shared identity/resource foundation.

Factors: Account recovery; provider-managed credentials

Tools: Supabase Auth + Next.js auth client + Laravel JWT guard using project JWKS

Use Supabase confirmation/recovery links with configured allowed redirects. Reset password through provider; never store plaintext or recovery tokens in application tables.

Acceptance criteria:

- FR49-AC01 [Positive] User follows valid recovery link and chooses valid password → Provider resets password; user can authenticate normally.
- FR49-AC02 [Security] Expired/replayed recovery link or disallowed redirect → Rejected by provider/application; no arbitrary account reset.
- FR49-AC03 [Privacy] Reset requested for an unknown email → Generic response avoids account enumeration.

## Data and API boundary
Use the shared data dictionary and versioned API contract; do not invent tables/enums to suit one screen. Every issue identifies exact routes, schema fields, stale-state behavior and cache invalidation that it changes.

## Failure and concurrency
JWT verification, account/session isolation and admin privilege boundaries. Ordinary permission/validation/empty/network states are part of completion, alongside the specific race cases above. PostgreSQL invariants require real database tests.

## Definition of done
UI and API integrated where applicable; unit and integration tests; private/public DTO checks; Scramble and source docs synchronized; audit/outbox only where required; issue-linked PR and reviewer evidence. No implementation is claimed here.

## Out of scope
No second password store; Google OAuth is deferred; Sanctum rubric substitution is unresolved.
