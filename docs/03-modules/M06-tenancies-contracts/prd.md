# M06 Product requirements

## Purpose
Exact unit allocation, immutable tenancy_contracts, embedded confirmations, correction chains, temporary holds and lifecycle actions. Member-C owns tenant/owner screens.

## Actors and permissions
Use actor/resource Policies from each FR below; UI guards never replace backend checks.

## Functional requirements

### FR33 Enforce nonoverlapping unit rental periods
Priority: P0 Must. Actors: System. Dependencies: Shared identity/resource foundation.

Factors: Concurrent occupancy; allocation granularity

Tools: Laravel FormRequest + Policies + DB transaction/lockForUpdate + PostgreSQL constraints + btree_gist exclusion constraint

PostgreSQL GiST exclusion constraint on tenancies(unit_id, daterange(blocked_start_date, blocked_end_date+1, [))) for PENDING_CONFIRMATION/CONFIRMED/ACTIVE. Different nonoverlapping future tenancies on one unit are permitted. Blocking envelope includes confirmed span plus any proposed renewal extension.

Acceptance criteria:

- FR33-AC01 [Race] Two transactions propose overlapping periods for same unit → At most one commits; other gets SQLSTATE 23P01 mapped to 409.
- FR33-AC02 [Positive] Same unit proposed for adjacent June30/July1 periods → Both may commit if each otherwise eligible.
- FR33-AC03 [Integrity] Direct SQL inserts overlapping blocking rows → Exclusion constraint rejects even if API locks are bypassed.
- FR33-AC04 [Race] Renewal expansion overlaps another future tenancy → Expansion fails atomically; current confirmed agreement remains.
- FR33-AC05 [Integrity] Old unique one-active-tenancy-per-unit index exists → Remove it; date exclusion replaces lifetime allocation restriction.

### FR34 Create tenancy proposal with temporary reservation
Priority: P0 Must. Actors: Owner. Dependencies: Shared identity/resource foundation.

Factors: Agreement recording; exact unit; snapshots

Tools: Laravel FormRequest + Policies + DB transaction/lockForUpdate + PostgreSQL constraints + Supabase private Storage

Owner chooses exact READY nonarchived unit in request property, enters final dates/rent/deposit, negotiated policy snapshot and private agreement document, then explicitly confirms version. Create one continuing tenancy with version 1, pending pointer and configured confirmation deadline. Default reservation 48h is a proposed configurable setting.

Acceptance criteria:

- FR34-AC01 [Positive] Owner proposes July1-December31 → PENDING_CONFIRMATION reserves only that period; enquiry ACCEPTED; tenant invited to review exact version.
- FR34-AC02 [Validation] Tenant mismatch, invalid dates/rent, original period below3calendar months (including month-end/leap-year boundaries), unit unavailable or missing private file → 422/409 and no accepted request.
- FR34-AC03 [Race] Two owners tabs propose same request → Unique rental_request_id permits one tenancy; idempotent identical replay returns it.
- FR34-AC04 [Race] Unit put in maintenance while proposal submitted → Shared property/unit locks and eligibility recheck prevent ineligible proposal.
- FR34-AC05 [Integrity] Move-in date arrives before both confirmations → No automatic activation; reservation expiry still applies.

### FR35 View tenancy timeline and contract versions
Priority: P0 Must. Actors: Owner; Tenant. Dependencies: Shared identity/resource foundation.

Factors: Privacy; effective periods

Tools: Next.js + React + Tailwind + TanStack Query + Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + private Storage

Owner and tenant can view all immutable version metadata/documents, each party confirmation/decline, proposed/current/upcoming terms, deadline and supersession links. Derive state from current pending pointer, confirmations and audit events; do not mark old versions confirmed by inference.

Acceptance criteria:

- FR35-AC01 [Positive] Version1 rejected, version2 confirmed → Both visible with distinct document/terms/decisions; current points to version2.
- FR35-AC02 [Security] Unrelated user requests document URL → 403/404; short-lived private download only after authorization.
- FR35-AC03 [Integrity] Future renewal is mutually confirmed → Show current original rent until renewal start, then renewal rent.
- FR35-AC04 [Boundary] Date beyond last confirmed term → Show no confirmed term for date; never substitute proposed rent.

### FR42 Rental request tenancy and renewal action APIs
Priority: P0 Must. Actors: Tenant; Owner. Dependencies: Shared identity/resource foundation.

Factors: Explicit transitions; idempotence

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints

Provide authenticated request submit/withdraw/reject, tenancy propose/correct/cancel/end/move-in, exact-version confirm/decline and renewal request/propose actions. Shared actions enforce policies, idempotency and transaction rules. No viewings endpoints.

Acceptance criteria:

- FR42-AC01 [Positive] Next.js invokes proposal/confirmation APIs → Documented statuses and UUID links returned; private resources authorized.
- FR42-AC02 [Security] User forges actor_role/version owner → Role derived from tenancy parties; 403.
- FR42-AC03 [Race] Client sends stale tenancy revision or superseded version UUID → 409 without changing confirmations or blocked span.
- FR42-AC04 [Integrity] Equivalent HTTP and worker actions run → Both use same business locks/constraints.

### FR66 Cancel proposals and end confirmed tenancies
Priority: P0 Must. Actors: Owner. Dependencies: Shared identity/resource foundation.

Factors: Actual occupancy; history; reopening

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints

Initial proposal decline releases reservation and sets AWAITING_REVISION; owner may issue corrected version under same tenancy after rechecking availability. Expired initial proposal becomes EXPIRED. Owner may cancel pre-start confirmed tenancy or record actual end with reason; preserve accepted enquiry/history and immutable agreements. Ending cancels pending renewal work and releases only the remaining blocked portion.

Acceptance criteria:

- FR66-AC01 [Positive] Initial proposed version declined → Record tenant decline; clear pending pointer/deadline and blocked dates; AWAITING_REVISION.
- FR66-AC02 [Positive] Confirmed occupancy ends early → Set ENDED and actual_ended_at; released future dates available if READY/marketed.
- FR66-AC03 [Race] Cancel/end races with final confirmation/renewal → One serialized legal outcome; no resurrected tenancy or orphan reservation.
- FR66-AC04 [Integrity] Request was ACCEPTED before proposal cancellation → Keep historical ACCEPTED; show linked cancelled/expired tenancy, not a fabricated completed rental.
- FR66-AC05 [Boundary] Contract date ends with no physical move-out confirmation → Do not fabricate actual_ended_at; scheduling follows agreed range. Overstay requires an explicit audited operational block/maintenance action.

### FR67 Record original immutable agreement version
Priority: P0 Must. Actors: Owner. Dependencies: Shared identity/resource foundation.

Factors: Document privacy; dated evidence

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints + private Storage

Store version_number, ORIGINAL type, dates/rent/deposit, negotiated policies, private unique document_path, SHA256, optional owner-reported signed_on and created_by/created_at. No signing service. Owner explicitly confirms exact version on submit; tenant must independently confirm same UUID/hash. Store owner_confirmed_at, tenant_confirmed_at, tenant_rejected_at and tenant_rejection_reason on tenancy_contracts; there is no separate confirmation entity.

Acceptance criteria:

- FR67-AC01 [Positive] Offline signed June20, uploaded June23, starts July1 → Keep signed_on, created_at and start_date distinct.
- FR67-AC02 [Validation] Signing date unknown → Allow null; never fabricate it from created_at.
- FR67-AC03 [Security] Update/delete terms or replace document bytes after version inserted → Database privileges/triggers reject; new version and new path required.
- FR67-AC04 [Race] Two inserts choose same tenancy version_number → Unique (tenancy_id,version_number) rejects duplicate; action retries safely.

### FR71 Keep immutable versions and effective agreement history
Priority: P0 Must. Actors: Owner; Tenant. Dependencies: Shared identity/resource foundation.

Factors: Historical truth; current vs future terms

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + Next.js + React + Tailwind + TanStack Query

tenancy_contracts stores immutable submitted agreement versions, agreed terms/document/hash and write-once participant confirmation metadata. ORIGINAL and consecutive RENEWAL segments represent agreed periods; corrections create new rows with supersedes_contract_id. Current agreed rent comes only from the mutually confirmed segment covering the date. No separate contract_confirmations table. Confirmed mid-term amendments remain deferred.

Acceptance criteria:

- FR71-AC01 [Positive] Original v1 rejected, corrected v2 mutually confirmed, renewal v3 later confirmed → Keep all three; v2 covers original dates; v3 covers continuation; v1 has no contractual effect.
- FR71-AC02 [Integrity] Owner edits advertised terms/policies → Existing version/document/hash/snapshot remains unchanged.
- FR71-AC03 [Security] Attempt database UPDATE/DELETE on contract terms or existing confirmation metadata → Denied by trigger/privileges, not API convention alone.
- FR71-AC04 [Boundary] No confirmed segment covers queried date → Show no confirmed terms for this date; proposed terms separately labeled.

### FR74 Idempotent writes and stale revisions
Priority: P0 Must. Actors: System. Dependencies: Shared identity/resource foundation.

Factors: Retry safety; optimistic concurrency

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints + PostgreSQL unique keys

Use client_operation_id UUID on creates and revision checks on mutable resources. Scope operation key to actor/parent. Reusing key with different canonical payload returns409; terminal action replay never repeats side effects.

Acceptance criteria:

- FR74-AC01 [Race] Network retry after successful commit → Existing resource/result returned without duplicate audit or notification intent.
- FR74-AC02 [Security] Other actor uses guessed operation UUID → No cross-actor result disclosure.
- FR74-AC03 [Race] Two updates with same expected revision → Only one succeeds; losing write409.
- FR74-AC04 [Integrity] Concurrency acceptance tests run → Use independent PostgreSQL connections/barrier, not only sequential mocks.

### FR75 Transactional locking audit and consistency
Priority: P0 Must. Actors: System. Dependencies: Shared identity/resource foundation.

Factors: Deadlocks; coordinated critical paths

Tools: Laravel FormRequest + Policies + DB transaction/lockForUpdate + PostgreSQL constraints

All writes use shared Laravel actions, fixed lock order property then units sorted by UUID then rental request/tenancy/renewal rows. Persist domain/audit/outbox/idempotency in same transaction. Direct clients cannot write application tables. Cross-table invariants use composite FKs and deferred constraint triggers as specified.

Acceptance criteria:

- FR75-AC01 [Race] Two proposal/renewal/expiry actions use independent connections → Consistent locks avoid lost changes; deadlocks retried boundedly.
- FR75-AC02 [Failure] Action fails after adding version before reservation acceptance → Whole action rolls back; only staged orphan file may remain.
- FR75-AC03 [Integrity] Direct SQL attempts invalid pending pointer or confirmation actor → Composite FK/check/constraint trigger rejects invalid committed state.
- FR75-AC04 [Security] Frontend anon key attempts app table writes → Denied by grants/RLS; Laravel verified actions enforce domain rules.

### FR80 Confirm move-in after mutual contract confirmation
Priority: P0 Must. Actors: Owner. Dependencies: Shared identity/resource foundation.

Factors: Lifecycle clarity; no duplicate allocation

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints + Next.js + React + Tailwind + TanStack Query

Owner records move-in on/after first confirmed start date for CONFIRMED tenancy, changes to ACTIVE and audits. PENDING_CONFIRMATION never activates on date arrival. Future nonoverlapping tenancies remain permitted; activation does not extend blocked range.

Acceptance criteria:

- FR80-AC01 [Positive] Both parties confirmed v2, start date reached → Owner marks ACTIVE, same UUID/confirmed span; no duplicate acceptance.
- FR80-AC02 [Validation] Version unconfirmed, before start, or tenancy cancelled → 409/422; no activation.
- FR80-AC03 [Race] Move-in races with cancel/end → One legal transition commits.
- FR80-AC04 [Integrity] Date arrives without move-in action → Show awaiting move-in; do not invent actual occupancy.

### FR81 Confirm the exact contract version mutually
Priority: P0 Must. Actors: Owner; Tenant. Dependencies: Shared identity/resource foundation.

Factors: Authorization; immutable versions; concurrent transitions

Tools: Laravel FormRequest + Policies + DB transaction/lockForUpdate + PostgreSQL constraints

Both parties acknowledge the same tenancy_contracts.id and immutable document_sha256. owner_confirmed_at is set only through explicit owner submission; tenant_confirmed_at is set once by the related tenant before deadline on the current pending contract. Tenant may instead set tenant_rejected_at with reason, never both outcomes. The final confirmation promotes confirmed dates and clears the pending pointer/deadline atomically. A new contract version requires fresh confirmation fields.

Acceptance criteria:

- FR81-AC01 [Positive] Owner confirmed v2; tenant confirms v2/hash → Both confirmation timestamps; initial tenancy CONFIRMED; confirmed dates set; no pending deadline.
- FR81-AC02 [Validation] Owner confirmed v1 but tenant confirms v2 → No agreement until both independently confirm v2; never mix version decisions.
- FR81-AC03 [Race] Tenant confirms v1 while owner publishes corrected v2 → Same tenancy lock yields one winner; superseded confirmation rejected 409 or correction disallowed after agreement.
- FR81-AC04 [Race] Final confirm competes with deadline worker → Compare server now under lock; at/after deadline no confirmation. Worker cannot undo already confirmed agreement.
- FR81-AC05 [Race] Double-click confirmation → Write-once confirmation fields gives one write-once decision; same replay returns result.
- FR81-AC06 [Integrity] Renewal final confirmation succeeds → Renewal request ACCEPTED and confirmed end extended in same transaction; old documents remain.

### FR82 Decline and correct unconfirmed versions
Priority: P0 Must. Actors: Owner; Tenant. Dependencies: Shared identity/resource foundation.

Factors: Authorization; immutable versions; concurrent transitions

Tools: Laravel FormRequest + Policies + DB transaction/lockForUpdate + PostgreSQL constraints

Tenant can decline exact current version with reason. Initial tenancy becomes AWAITING_REVISION and releases hold; renewal decline keeps confirmed tenancy/range and request PENDING. Owner creates corrected immutable version linked to superseded version, obtains new explicit owner confirmation and new reservation/deadline after rechecking availability. No correction of already mutually confirmed terms in MVP.

Acceptance criteria:

- FR82-AC01 [Positive] Tenant spots wrong rent in v1 and declines → Record REJECTED decision/reason; immutable v1 retained; release proposed span only.
- FR82-AC02 [Positive] Owner corrects rent as v2 → New UUID/hash/version_number; new owner confirmation; tenant must confirm v2.
- FR82-AC03 [Race] Correction tries reacquiring dates now reserved elsewhere → 409; no new active hold or false acceptance.
- FR82-AC04 [Validation] Owner attempts correction after mutual confirmation → Reject; amendments to confirmed terms are deferred.
- FR82-AC05 [Race] Tenant confirms while owner corrects → Same pending pointer/revision lock; no mismatched version or retroactive change.

### FR83 Expire temporary confirmation reservations
Priority: P0 Must. Actors: Owner; Tenant. Dependencies: Shared identity/resource foundation.

Factors: Authorization; immutable versions; concurrent transitions

Tools: Laravel Scheduler + Queue Workers + Laravel FormRequest + Policies + DB transaction/lockForUpdate + PostgreSQL constraints

Store confirmation_expires_at using server clock; proposed default48h configurable. Scheduler scans due holds and action paths reap them under locks. No now() in exclusion predicate. Initial expiry sets EXPIRED and clears hold; pending renewal expiry restores confirmed envelope, clears pending pointer and leaves renewal request PENDING for discussion. Accepted enquiry history stays accepted.

Acceptance criteria:

- FR83-AC01 [Boundary] Server time reaches deadline exactly → Confirmation disallowed; due hold released transactionally.
- FR83-AC02 [Race] Two workers expire same hold → One state change/audit/outbox event; retries no-op.
- FR83-AC03 [Race] Expiry competes with final confirmation or correction → Lock/recheck exact pending version/deadline; stale worker cannot expire newer hold.
- FR83-AC04 [Failure] Scheduler delayed → Hold remains conservatively blocked until reaped; proposal path can reap due conflicts under locks before retry.
- FR83-AC05 [Integrity] Renewal expires → Original confirmed range/rent unchanged; release extension only.

### FR84 Reserve renewal extension without releasing current occupancy
Priority: P0 Must. Actors: Owner; Tenant. Dependencies: Shared identity/resource foundation.

Factors: Authorization; immutable versions; concurrent transitions

Tools: Laravel FormRequest + Policies + DB transaction/lockForUpdate + PostgreSQL constraints

tenancies stores confirmed_start/end and blocked_start/end as transactional projections. Original unconfirmed proposal has only blocked dates. Confirmed tenancy with pending renewal expands blocked_end while confirmed_end stays unchanged. Decline/cancel/expiry restores blocked span to confirmed span; successful agreement promotes confirmed span.

Acceptance criteria:

- FR84-AC01 [Positive] Confirmed ends June30; pending renewal ends Dec31 → Block Jan1-Dec31 envelope while original confirmed ends June30.
- FR84-AC02 [Race] Another tenant requests July1-Dec31 while renewal pending → Exclusion denies overlapping second tenancy.
- FR84-AC03 [Integrity] Renewal rejected/expired → Restore Jan1-June30 only; keep original agreement and status.
- FR84-AC04 [Race] Two future adjacent bookings and renewal compete → Database exclusion decides valid committed schedule; no renewal overrides existing booking.

### FR86 Enforce immutable contract terms and write-once confirmations
Priority: P0 Must. Actors: Owner; Tenant. Dependencies: Shared identity/resource foundation.

Factors: Authorization; immutable versions; concurrent transitions

Tools: PostgreSQL FKs/CHECKs/UNIQUE/GiST + deferred constraint triggers + Laravel migrations

Database triggers protect tenancy_contracts terms/document/hash from update/delete while permitting one authorized null-to-value tenant confirmation or rejection update. Existing confirmation timestamps and reasons cannot be overwritten. Composite FKs keep pending/latest/superseded/basis contract references in the same tenancy. Deferred invariant checks enforce exact-contract mutual confirmation, request outcomes and date projections. No separate confirmation table.

Acceptance criteria:

- FR86-AC01 [Integrity] Direct SQL changes version rent/document or overwrites a recorded confirmation → Database trigger denies write.
- FR86-AC02 [Integrity] Direct insert points tenancy to another tenancy version → Composite FK rejects.
- FR86-AC03 [Integrity] Direct insert confirmation by unrelated profile or conflicting confirmation/rejection → Party-validation/write-once trigger rejects.
- FR86-AC04 [Integrity] Transaction commits ACCEPTED request without tenancy or confirmed span without matching mutual versions → Deferred constraint trigger rejects inconsistent committed state.
- FR86-AC05 [Race] Two transactions mutate pointers/confirmations → Unique constraints, row locks and commit-time invariant checks preserve one current workflow.

## Data and API boundary
Use the shared data dictionary and versioned API contract; do not invent tables/enums to suit one screen. Every issue identifies exact routes, schema fields, stale-state behavior and cache invalidation that it changes.

## Failure and concurrency
GiST exclusion, participant/hash/version agreement, deadline races, projections and write-once metadata. Ordinary permission/validation/empty/network states are part of completion, alongside the specific race cases above. PostgreSQL invariants require real database tests.

## Definition of done
UI and API integrated where applicable; unit and integration tests; private/public DTO checks; Scramble and source docs synchronized; audit/outbox only where required; issue-linked PR and reviewer evidence. No implementation is claimed here.

## Out of scope
No contract_versions or contract_confirmations table; no legal signature engine; no confirmed mid-term amendment.
