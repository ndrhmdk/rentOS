# M03 Product requirements

## Purpose
Property-level draft, first package review, owner publication and independent admin suspension. Member-D builds admin screens against reviewed endpoints.

## Actors and permissions
Use actor/resource Policies from each FR below; UI guards never replace backend checks.

## Functional requirements

### FR10 Create property-level listing draft
Priority: P0 Must. Actors: Owner. Dependencies: Shared identity/resource foundation.

Factors: Source data reuse; one current advertisement

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + Next.js + React + Tailwind + TanStack Query

Choose own nonarchived property, market selected units, enter title/description and choose cover from existing selected media. Reuse property address/policies and unit specifications/photos. One nonarchived listing per property.

Acceptance criteria:

- FR10-AC01 [Positive] Complete property with several units → Draft references existing records without duplicating images or policies.
- FR10-AC02 [Validation] Property is incomplete → Draft may save; submission identifies missing details.
- FR10-AC03 [Race] Two creates target same property → Partial unique index permits one current listing.
- FR10-AC04 [Security] Owner selects another property photo as cover → Reject invalid scope.

### FR11 Edit listing without reapproval after initial approval
Priority: P0 Must. Actors: Owner. Dependencies: Shared identity/resource foundation.

Factors: Stale approvals; public consistency

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints + Next.js + React + Tailwind + TanStack Query

After first APPROVED decision, owner may update property, units, policies, media and listing wording immediately without resetting approval. Changes are audited and remain reportable. Edits before approval invalidate the submitted content revision. Admin suspension is independent and cannot be cleared by an edit.

Acceptance criteria:

- FR11-AC01 [Positive] Approved published listing title/photos/policies edited → Valid changes appear; initial approval remains; audit records before/after.
- FR11-AC02 [Race] Admin approves while owner edits a pending submission → Content revision check rejects stale approval; admin reloads latest complete package.
- FR11-AC03 [Race] Owner edit races with admin suspension → Suspension wins public eligibility regardless of successful content save.
- FR11-AC04 [Validation] Update removes required cover/last unit data → Reject invalid published update or explicitly hide it; no invalid public listing.

### FR12 Submit initial listing package
Priority: P0 Must. Actors: Owner. Dependencies: Shared identity/resource foundation.

Factors: Completeness; idempotence

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints + queued notification

First publication requires admin review of listing plus linked property, marketed units, selected media and policies as one package. Validate required address, unit details, at least one shared photo and photo per marketed unit. Capture property content_revision and listing submitted_revision. Rejected initial submissions may be corrected/resubmitted.

Acceptance criteria:

- FR12-AC01 [Positive] Complete draft submitted → Initial moderation PENDING; no separate property/image approval.
- FR12-AC02 [Validation] Missing required address, image, unit or policy values → 422 with field issues; not publicly published.
- FR12-AC03 [Race] Linked unit/photo changes during submit → Property content lock/revision ensures submission refers to one consistent package.
- FR12-AC04 [Integrity] Already initially approved listing updated → Do not submit to initial moderation again; retain audit/reporting flow.

### FR13 Review initial listing packages
Priority: P0 Must. Actors: Admin. Dependencies: Shared identity/resource foundation.

Factors: Initial package completeness; current content revision; admin authorization

Tools: Next.js + React + Tailwind + TanStack Query + Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL

Admin queue displays only initial PENDING listings with property/unit details, selected gallery, policies and captured revisions. Show owner and completeness; admin approves or rejects with reason.

Acceptance criteria:

- FR13-AC01 [Positive] Admin opens pending listing → All linked advertised content is visible in one review screen.
- FR13-AC02 [Security] Non-admin opens queue → 403; no private review data.
- FR13-AC03 [Race] Content changes after admin opens screen → Approval compares both listing and property revisions; stale decision returns 409.

### FR14 Approve initial listing package
Priority: P0 Must. Actors: Admin. Dependencies: Shared identity/resource foundation.

Factors: Exact content approval; separate publication

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints

Admin approves the exact submitted listing/property content revisions. Store reviewer/time and approved_content_revision. Approval permits publication but does not publish automatically.

Acceptance criteria:

- FR14-AC01 [Positive] Admin approves unchanged pending package → APPROVED and approval metadata saved; owner may publish.
- FR14-AC02 [Race] Property/unit/media/policy edit precedes decision commit → Stale revision rejected; no approval of unreviewed initial content.
- FR14-AC03 [Race] Two admins approve/reject concurrently → Only first legal transition commits; second gets current result/409.
- FR14-AC04 [Integrity] Approved listing edited later → Approval retained; no perpetual equality requirement with current revision.

### FR15 Reject initial listing with reason
Priority: P0 Must. Actors: Admin. Dependencies: Shared identity/resource foundation.

Factors: Explainable decisions; terminal transitions

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints

Admin rejects initial submission with a required reason. Owner corrects data and resubmits; later content violations use suspension rather than resetting initial approval.

Acceptance criteria:

- FR15-AC01 [Positive] Admin rejects incomplete/misleading package → REJECTED; owner sees reason; no public publication.
- FR15-AC02 [Validation] Reason empty → 422; unchanged.
- FR15-AC03 [Race] Approve and reject compete → One decision commits with matching audit/outbox.

### FR16 Dedicated changes requested state
Priority: P2 Defer. Actors: Admin. Dependencies: FR15.

Factors: Scope control

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL

Defer a distinct CHANGES_REQUESTED state. MVP uses rejection with a reason plus edit/resubmit.

Acceptance criteria:

- FR16-AC01 [Scope] Admin requests changes in MVP → Use FR15 and owner resubmission; no unsupported state in API/UI.

### FR17 Publish initially approved listing
Priority: P0 Must. Actors: Owner. Dependencies: Shared identity/resource foundation.

Factors: Inventory eligibility; fresh DB checks

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints

Owner may publish only an initially approved, nonarchived, complete listing belonging to a nonarchived property and not admin-suspended. Require at least one READY, marketed unit with availability for the selected date query. Search without dates defaults to today for the unit minimum duration. No property/image approval conditions.

Acceptance criteria:

- FR17-AC01 [Positive] Initially approved complete listing has available unit → Publication PUBLISHED; public search/details can return it.
- FR17-AC02 [Validation] Initial moderation not approved or admin_suspended_at present → Reject publication.
- FR17-AC03 [Race] Publish races with suspension or last unit reservation → Recheck locked current state; unavailable listing never shown as available.
- FR17-AC04 [Boundary] Future tenancy leaves a nonoverlapping earlier period → Unit may qualify only if entire requested interval fits.

### FR18 Hide or archive listing
Priority: P0 Must. Actors: Owner; Admin. Dependencies: Shared identity/resource foundation.

Factors: Visibility; cache invalidation

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints + Laravel Cache

Owner can hide or archive own listing. Admin suspension is a separate control with required reason. Republishing an owner-hidden listing retains initial approval and must pass current eligibility; owner cannot remove admin suspension.

Acceptance criteria:

- FR18-AC01 [Positive] Owner hides listing → Remove from public search and normal public details; preserve enquiries/contracts.
- FR18-AC02 [Security] Owner attempts to clear admin suspension → 403/422.
- FR18-AC03 [Race] Publish competes with hide/archive → Revision and shared locks produce consistent final state; stale cache does not expose hidden content.

### FR78 Suspend and restore listings after reports or inspection
Priority: P0 Must. Actors: Admin. Dependencies: Shared identity/resource foundation.

Factors: Reports supplement prior review; immediate safety

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints

Admin can suspend published listing directly after inspection or authenticated report with reason, audit and notice. admin_suspended_at/by/reason independent of initial moderation/publication. Owner edits cannot remove suspension. Admin may explicitly restore after checking corrections; no repeated ordinary content approval process.

Acceptance criteria:

- FR78-AC01 [Positive] Admin sees harmful new image → Suspend whole listing immediately; no media review-status machinery.
- FR78-AC02 [Race] Owner edits/republishes while admin suspends → Admin flag remains; all normal public listing routes deny exposure.
- FR78-AC03 [Security] Owner clears suspension field → Reject by field allowlist/policy.
- FR78-AC04 [Positive] Admin restores after investigation → Clear suspension with audit; public visibility still requires owner PUBLISHED and all eligibility gates.
- FR78-AC05 [Integrity] Previously public photo URL was downloaded → Normal public listing hidden; remove offending object if needed. Do not claim ability to recall downloaded copies.

## Data and API boundary
Use the shared data dictionary and versioned API contract; do not invent tables/enums to suit one screen. Every issue identifies exact routes, schema fields, stale-state behavior and cache invalidation that it changes.

## Failure and concurrency
Stale initial approval, owner edits versus suspension and shared visibility gate. Ordinary permission/validation/empty/network states are part of completion, alongside the specific race cases above. PostgreSQL invariants require real database tests.

## Definition of done
UI and API integrated where applicable; unit and integration tests; private/public DTO checks; Scramble and source docs synchronized; audit/outbox only where required; issue-linked PR and reviewer evidence. No implementation is claimed here.

## Out of scope
After initial approval edits do not reapprove; owner cannot clear suspension; CHANGES_REQUESTED extension deferred.
