# M05 Product requirements

## Purpose
Contact snapshots, pending enquiries, owner phone discussion, rejection/withdrawal and age15day availability outcome.

## Actors and permissions
Use actor/resource Policies from each FR below; UI guards never replace backend checks.

## Functional requirements

### FR25 Submit rental request with contact details
Priority: P0 Must. Actors: Tenant. Dependencies: Shared identity/resource foundation.

Factors: Eligibility; no reservation; duplicate semantics

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints + Next.js + React + Tailwind + TanStack Query

Authenticated tenant submits contact_name, contact_phone, desired_move_in_date, desired_end_date, optional preferred_unit_id and message. Store contact snapshots. Status PENDING throughout offline discussion. No calendar, manual discussion acceptance or unit reservation at enquiry creation.

Acceptance criteria:

- FR25-AC01 [Positive] Tenant submits valid three-month request → PENDING request stored and owner notified with private contact snapshots.
- FR25-AC02 [Validation] Missing/invalid phone or dates, own listing, or unit outside property → Reject with field errors; phone syntax validation is not verification.
- FR25-AC03 [Security] Other tenant reads contact details → Denied; only requester, owning manager and authorized admin may access.
- FR25-AC04 [Race] Same request submitted twice → Idempotency key and one PENDING tenant/listing index yield one thread.
- FR25-AC05 [Integrity] Tenant later changes profile phone → Submitted contact snapshot remains unchanged.

### FR26 Prevent duplicate pending rental requests
Priority: P0 Must. Actors: Tenant. Dependencies: Shared identity/resource foundation.

Factors: Concurrent duplication; usable threads

Tools: PostgreSQL partial unique index + shared action

At most one PENDING request per tenant/listing; accepted/rejected/withdrawn history remains. Unique partial index is authoritative; retries compare payload.

Acceptance criteria:

- FR26-AC01 [Race] Two independent connections submit same tenant/listing → One PENDING row; loser returns existing thread or 409.
- FR26-AC02 [Positive] Prior enquiry is terminal and user submits new valid one → New PENDING request permitted.
- FR26-AC03 [Integrity] Owner calls tenant or views message → Request remains PENDING; no implied acceptance or allocation.

### FR27 Tenant rental request dashboard
Priority: P0 Must. Actors: Tenant. Dependencies: Shared identity/resource foundation.

Factors: Private data; state clarity

Tools: Next.js + React + Tailwind + TanStack Query + Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL

Display private submitted contacts, desired dates, request status/outcome and linked tenancy confirmation state. ACCEPTED means proposal created, not that tenancy contract is mutually confirmed.

Acceptance criteria:

- FR27-AC01 [Positive] Proposal created from pending enquiry → Show ACCEPTED plus Awaiting your contract confirmation.
- FR27-AC02 [Integrity] Tenant rejects contract version later → Request acceptance history retained; tenancy shows Awaiting revision.
- FR27-AC03 [Security] Another tenant requests dashboard row → 403/404.
- FR27-AC04 [Positive] Owner discusses by phone → Request stays PENDING until proposal created.

### FR28 Withdraw pending rental request
Priority: P0 Must. Actors: Tenant. Dependencies: Shared identity/resource foundation.

Factors: Pending state transitions; withdrawal versus proposal race

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints

Tenant may withdraw own PENDING request with audit and owner notification. Accepted requests are handled through tenancy proposal actions instead.

Acceptance criteria:

- FR28-AC01 [Positive] Withdraw pending thread → WITHDRAWN; no unit to release.
- FR28-AC02 [Race] Withdraw competes with proposal creation → Same request lock; either withdrawn with no tenancy or accepted with tenancy, never both.
- FR28-AC03 [Validation] Withdraw accepted thread → 409 with link to tenancy workflow.

### FR29 Owner rental request inbox
Priority: P0 Must. Actors: Owner. Dependencies: Shared identity/resource foundation.

Factors: Ownership; meaningful lead state

Tools: Next.js + React + Tailwind + TanStack Query + Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL

Owner sees own property requests and private tenant contact snapshots, dates and preferred unit. Discuss offline while PENDING. Actions are Reject and Create tenancy proposal; no viewing/calendar or stand-alone Accept.

Acceptance criteria:

- FR29-AC01 [Positive] Owner opens pending enquiry → Phone/contact visible; no reservation created by reading/calling.
- FR29-AC02 [Security] Different owner accesses inbox row → 403/404.
- FR29-AC03 [Integrity] Owner records valid proposal → Request becomes ACCEPTED only within proposal transaction.
- FR29-AC04 [Race] Inbox stale after tenant withdraws → Create action rechecks request PENDING and fails safely.

### FR30 Accept request when tenancy proposal commits
Priority: P0 Must. Actors: Owner. Dependencies: Shared identity/resource foundation.

Factors: Atomic final acceptance; offline agreement

Tools: Laravel FormRequest + Policies + DB transaction/lockForUpdate + PostgreSQL constraints

Create tenancy, immutable ORIGINAL contract version, explicit owner confirmation, temporary reservation, audit and outbox; change rental request PENDING to ACCEPTED in the same transaction. Tenant confirmation follows separately.

Acceptance criteria:

- FR30-AC01 [Positive] Owner submits valid proposal with explicit confirmation → One PENDING_CONFIRMATION tenancy; request ACCEPTED; owner confirmation refers to exact version.
- FR30-AC02 [Failure] Database overlap constraint or file validation fails → Rollback acceptance, tenancy/version, audit/outbox and reservation.
- FR30-AC03 [Race] Reject/withdraw competes with proposal → One valid terminal request transition; no accepted request without tenancy.
- FR30-AC04 [Integrity] Other requests concern same or alternative units → Do not immediately reject them; apply 15-day availability policy.

### FR31 Reject pending rental request
Priority: P0 Must. Actors: Owner. Dependencies: Shared identity/resource foundation.

Factors: Explainability; cancellation

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints

Owner can reject PENDING enquiry with reason; no viewing cancellation or automatic rejection merely because another enquiry was accepted. System auto-rejection uses FR85.

Acceptance criteria:

- FR31-AC01 [Positive] Owner rejects with reason → REJECTED, history and tenant notice committed.
- FR31-AC02 [Validation] Blank reason or terminal request → 422/409; unchanged.
- FR31-AC03 [Race] Reject races with Create tenancy proposal → One terminal transition; no duplicate tenancy/outcome.

### FR32 Audit request and tenancy outcomes
Priority: P0 Must. Actors: System. Dependencies: Shared identity/resource foundation.

Factors: Durable business history; transaction consistency

Tools: PostgreSQL audit_logs + shared Laravel actions

Append-only audit events record request status, proposal/confirmation/version changes and automatic decisions with actor/system identity, safe before/after, reason and correlation UUID.

Acceptance criteria:

- FR32-AC01 [Positive] Request accepted through proposal → Audit links request, tenancy and version identities.
- FR32-AC02 [Integrity] Proposal later rejected/expired → Acceptance event retained; separate tenancy outcome appended.
- FR32-AC03 [Failure] Business transaction rolls back → No success audit/outbox survives.
- FR32-AC04 [Security] User tries editing/deleting audit event → Denied by API and database privilege/trigger policy.

### FR85 Apply 15-day rejection using actual availability
Priority: P0 Must. Actors: Owner; Tenant. Dependencies: Shared identity/resource foundation.

Factors: Authorization; immutable versions; concurrent transitions

Tools: Laravel Scheduler + database queue worker + shared availability query + Laravel FormRequest + Policies + DB transaction/lockForUpdate + PostgreSQL constraints

Assumption: a PENDING rental request becomes eligible for auto-rejection at created_at+15 days. Reject with NO_AVAILABLE_UNIT only if no READY/marketed/nonarchived eligible unit in the listing property covers the complete desired interval. A preferred unit is a preference, so consider alternatives. Do not reject only because request aged15 days or another request accepted. Exclude admin/publication visibility from physical availability test; hiding is not occupation.

Acceptance criteria:

- FR85-AC01 [Boundary] Request age14d23h59m and all units blocked → Keep PENDING; not due.
- FR85-AC02 [Positive] Age>=15d and no qualifying unit for complete requested period → REJECTED with system reason and availability evaluation timestamp; audit/notify once.
- FR85-AC03 [Positive] Age>=15d and alternative unit available although preferred unit blocked → Keep PENDING.
- FR85-AC04 [Positive] Age>=15d and reservation just expired → Reap expired hold under lock; retain request if unit now available.
- FR85-AC05 [Race] Scheduler rejects while owner creates proposal or tenant withdraws → Shared property/unit/request locks; one terminal transition; no rejected accepted request.
- FR85-AC06 [Race] New unit or maintenance release competes with availability scan → Property lock across inventory-changing actions produces a coherent decision.
- FR85-AC07 [Integrity] Listing manually hidden but suitable unit available → Do not infer no availability from publication state; keep request pending.
- FR85-AC08 [Boundary] Desired move-in already in past → Do not silently shift dates; use stored interval, flag for discussion. Stale-date expiry is deferred.

## Data and API boundary
Use the shared data dictionary and versioned API contract; do not invent tables/enums to suit one screen. Every issue identifies exact routes, schema fields, stale-state behavior and cache invalidation that it changes.

## Failure and concurrency
Request acceptance atomic with tenancy proposal; one pending thread; cron versus withdrawal/create races. Ordinary permission/validation/empty/network states are part of completion, alongside the specific race cases above. PostgreSQL invariants require real database tests.

## Definition of done
UI and API integrated where applicable; unit and integration tests; private/public DTO checks; Scramble and source docs synchronized; audit/outbox only where required; issue-linked PR and reviewer evidence. No implementation is claimed here.

## Out of scope
No calendar, chat or separate manual Accept. Another acceptance does not immediately reject other prospects.
