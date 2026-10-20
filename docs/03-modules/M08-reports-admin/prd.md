# M08 Product requirements

## Purpose
Admin report table/detail, review queues, required-reason forms, reporter outcome and bounded UI tests; backend transition/policy actions owned by Member-B with Member-A review.

## Actors and permissions
Member-D owns bounded presentation/forms/UI tests; Member-B owns state-changing admin backend actions, with Member-A reviewing privilege and transaction logic.

## Functional requirements

### FR36 Submit tenancy based review
Priority: P2 Defer. Actors: Tenant. Dependencies: FR35 FR79.

Factors: Eligibility; abuse; uniqueness

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + Next.js + React + Tailwind + TanStack Query

Optional one property review per ACTIVE/ENDED tenancy; rating1–5 and comment. Reviews pending manual moderation if enabled.

Acceptance criteria:

- FR36-AC01 [Positive] Eligible tenant submits valid review → PENDING review linked to tenancy/property.
- FR36-AC02 [Security] Non-tenant or invalid rating → Reject.
- FR36-AC03 [Race] Two submissions for same tenancy → Unique tenancy_id permits one review.

### FR37 Display approved property reviews
Priority: P2 Defer. Actors: Guest; User. Dependencies: FR36 FR79.

Factors: Moderated visibility; aggregates

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + Next.js + React + Tailwind + TanStack Query

Only display reviews when review feature exists; show approved reviews and consistent rating aggregate.

Acceptance criteria:

- FR37-AC01 [Positive] Approved review exists → Shown with correct aggregate; pending/rejected excluded.
- FR37-AC02 [Race] Review hidden while aggregate cached → Invalidate aggregate and details; no fabricated reviews.

### FR38 Report public listing
Priority: P0 Must. Actors: Authenticated user. Dependencies: Shared identity/resource foundation.

Factors: Abuse limits; synchronous persistence

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + queued notification

Submit reason code and description for suspicious published listing. Save OPEN report synchronously; queue admin alert after commit. Do not use Kafka/RabbitMQ for report creation.

Acceptance criteria:

- FR38-AC01 [Positive] Authenticated user reports visible listing → Report, reporter and listing recorded; not auto-hidden solely from one report.
- FR38-AC02 [Security] Guest submits or client forges reporter/status → 401/restricted input rejected.
- FR38-AC03 [Validation] Invalid reason/empty required explanation → 422.
- FR38-AC04 [Race] Same reporter concurrently reports same listing → At most one OPEN/REVIEWING report; unique constraint returns existing/conflict.
- FR38-AC05 [Race] Listing hidden between view and submit → 404/unavailable; existing reports preserved; server rechecks eligibility under property lock.

### FR39 Investigate reports and suspend listings
Priority: P0 Must. Actors: Admin. Dependencies: Shared identity/resource foundation.

Factors: Resolution history; fair moderation

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints + Next.js + React + Tailwind + TanStack Query

Admin moves OPEN report to REVIEWING then RESOLVED/DISMISSED with required reason. An optional suspension is atomic with resolution and audit; notify reporter with sanitized outcome. Restoration is an explicit admin restriction action, not a new ordinary property/photo review.

Acceptance criteria:

- FR39-AC01 [Positive] Admin resolves valid report and suspends listing → Report outcome, suspension fields, audit and notice intent commit together.
- FR39-AC02 [Validation] Final decision lacks reason → 422; unchanged.
- FR39-AC03 [Race] Two admins resolve/dismiss report → One terminal outcome; second stale action gets409.
- FR39-AC04 [Race] Owner publishes while admin suspends → Shared lock retains suspension; owner cannot clear it.

### FR72 Reporter outcome and rate limits
Priority: P0 Must. Actors: Authenticated reporter; Admin. Dependencies: Shared identity/resource foundation.

Factors: Abuse prevention; confidentiality

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + Laravel rate limiter + Notifications

Reporter can view own reports and sanitized status/outcome. Admin notes remain private. Enforce configured per-user/IP submission limits and one live report per reporter/listing.

Acceptance criteria:

- FR72-AC01 [Positive] Reporter views resolved report → Own status and safe outcome only.
- FR72-AC02 [Security] Reporter guesses another report or requests internal notes → 403/404; notes omitted.
- FR72-AC03 [Abuse] Configured limit exceeded → 429 without creating report/outbox.
- FR72-AC04 [Race] Duplicate report while report is REVIEWING → Return existing live report/conflict; no duplicate.

### FR79 Moderate optional property reviews
Priority: P2 Defer. Actors: Admin. Dependencies: FR36.

Factors: Public content consistency

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + Next.js + React + Tailwind + TanStack Query

If reviews are implemented, approve/reject exact submitted revision and allow reported harmful review removal. Required rejection/removal reasons.

Acceptance criteria:

- FR79-AC01 [Positive] Approve PENDING review → Visible and included in aggregate.
- FR79-AC02 [Race] Review edited during moderation → Expected revision prevents stale approval.
- FR79-AC03 [Security] Normal user moderates review → 403.

## Data and API boundary
Use the shared data dictionary and versioned API contract; do not invent tables/enums to suit one screen. Every issue identifies exact routes, schema fields, stale-state behavior and cache invalidation that it changes.

## Failure and concurrency
Admin UI is not the authorization boundary; protected actions remain reviewed backend work. Ordinary permission/validation/empty/network states are part of completion, alongside the specific race cases above. PostgreSQL invariants require real database tests.

## Definition of done
UI and API integrated where applicable; unit and integration tests; private/public DTO checks; Scramble and source docs synchronized; audit/outbox only where required; issue-linked PR and reviewer evidence. No implementation is claimed here.

## Out of scope
Property reviews deferred. Member-D must not implement role-granting, suspension authorization or transaction rules alone.
