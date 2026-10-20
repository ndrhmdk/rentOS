# Functional requirements catalogue

Workbook version3 supplies80 active entries. FR88 is the authorised favourite-properties addition20October2026. Product priority is not course delivery priority.

## FR01 Email registration

Module: `M01-identity-access`. Priority: P0 Must. Actors: Guest. Dependencies: Shared foundation.

Factors: Identity consistency; privilege escalation; privacy

Tools: Supabase Auth + Next.js auth client + Laravel JWT guard using project JWKS

Register through Supabase Auth, confirm email before protected product writes, and create one application profile keyed by Auth UUID. Users can act as both tenant and owner; no role selection or phone OTP is required.

- FR01-AC01 [Positive] Register a valid email/password and confirm email → One Auth identity and one profile exist; is_admin=false.
- FR01-AC02 [Validation] Invalid email or weak password → Provider errors are mapped to field feedback without creating a privileged profile.
- FR01-AC03 [Privacy] Register an already registered email → Handle provider response without promising disclosure of whether the account exists; offer sign-in/reset guidance.
- FR01-AC04 [Race] Two signup/profile callbacks run for the same Auth UUID → Unique profile PK/upsert creates one profile; retries do not reset an existing name or admin flag.

## FR02 Email login and session refresh

Module: `M01-identity-access`. Priority: P0 Must. Actors: User. Dependencies: Shared foundation.

Factors: Authentication; expiration; recovery

Tools: Supabase Auth + Next.js auth client + Laravel JWT guard using project JWKS

Sign in through Supabase Auth. Send its access token to Laravel; use provider refresh flow and protect private Next.js pages and API endpoints.

- FR02-AC01 [Positive] Confirmed user submits correct credentials → Protected dashboard loads the linked profile.
- FR02-AC02 [Negative] Wrong password or unconfirmed account → Clear safe error; no protected data returned.
- FR02-AC03 [Security] Expired token with valid refresh session → Refresh through Supabase then retry safe reads once; never blindly replay a non-idempotent write.
- FR02-AC04 [Negative] Refresh fails or session expires → Clear private client cache and require sign-in; API returns 401.

## FR03 Google sign in

Module: `M01-identity-access`. Priority: P2 Defer. Actors: User. Dependencies: FR01 FR43.

Factors: Identity linking; callback integrity

Tools: Supabase Auth + Next.js auth client + Laravel JWT guard using project JWKS + Google OAuth

Optional Google sign in with configured redirect allowlist; map provider identity to one profile. Do not implement a second Laravel password store.

- FR03-AC01 [Positive] User completes allowed Google callback → Provider identity maps to one application profile.
- FR03-AC02 [Security] Invalid callback/state or attempted client-created admin flag → Reject flow or ignore forbidden privilege input.
- FR03-AC03 [Race] Callback is delivered twice → No duplicate profile or duplicated onboarding notification.

## FR04 Logout

Module: `M01-identity-access`. Priority: P0 Must. Actors: User. Dependencies: Shared foundation.

Factors: Session lifecycle; bearer-token limits

Tools: Supabase Auth + Next.js auth client + Laravel JWT guard using project JWKS

Sign out via Supabase and clear user-scoped Next.js/TanStack data. Document that a previously issued JWT may remain valid until expiry when Laravel validates it offline.

- FR04-AC01 [Positive] User logs out → Current browser loses credentials and private cached data; protected navigation requires sign-in.
- FR04-AC02 [Security] Another user signs in on same browser → No previous user private data appears.
- FR04-AC03 [Boundary] Previously copied unexpired access token is replayed → Do not claim instant token revocation; state expiry-bound behavior unless a server-side revocation check is deliberately added.

## FR05 Resource and admin authorization

Module: `M01-identity-access`. Priority: P0 Must. Actors: User; Admin. Dependencies: Shared foundation.

Factors: Ownership; least privilege; direct DB exposure

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL

Use is_admin on trusted profiles for moderation. Normal users act as tenant and owner through resource relationships. Backend checks every private read/write; frontend guards are only UX.

- FR05-AC01 [Security] Owner B guesses Owner A property/unit/request UUID → Return 403/404 without private data or mutation.
- FR05-AC02 [Security] Normal user submits is_admin or another owner_id → Reject restricted input; actor comes from verified identity.
- FR05-AC03 [Security] Normal user calls an admin moderation endpoint → 403; no audit outcome or notification is committed.
- FR05-AC04 [Security] Browser directly calls Supabase Data API/storage → Business tables are not writable/readable through unintended grants; storage rules restrict private files. Laravel authorization remains enforced even if DB connection bypasses RLS.

## FR06 Profile and dual dashboards

Module: `M01-identity-access`. Priority: P0 Must. Actors: User. Dependencies: Shared foundation.

Factors: Data minimization; stale edits

Tools: Next.js + React + Tailwind + TanStack Query + Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL

View/update permitted name and contact information and navigate between tenant area and Manage rentals. Phone is contact information, not verified ownership. Avatar/DOB are optional later scope.

- FR06-AC01 [Positive] User edits allowed contact fields → Validated values saved; dashboard uses current profile.
- FR06-AC02 [Security] Profile PATCH includes admin flag, identity UUID or verification fields → Rejected; privilege fields unchanged.
- FR06-AC03 [Race] Two tabs edit the same profile version → Expected version rejects stale write with 409 rather than silently overwriting.

## FR07 Create property draft without moderation

Module: `M02-property-units-media`. Priority: P0 Must. Actors: Owner. Dependencies: Shared foundation.

Factors: Physical inventory; owner linkage

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + Next.js + React + Tailwind + TanStack Query

Owner creates physical property, address, amenities and controlled policies. WHOLE_SPACE atomically creates one backend unit; SEPARATE_UNITS uses explicit unit creation. Incomplete drafts can be saved. No property approval state or mandatory ownership evidence/phone verification in MVP. Amenities use properties.shared_amenities JSONB with schema_version, allowlisted standard key/object entries and custom text array; select or add custom features directly in the property form (FR87).

- FR07-AC01 [Positive] Owner creates whole apartment → One property and one Entire apartment unit are saved atomically.
- FR07-AC02 [Validation] Owner saves incomplete draft → Save permitted; initial listing submission later validates completeness.
- FR07-AC03 [Security] Caller supplies owner_id belonging to another user → Ignore/reject forged ownership; derive owner from verified JWT.
- FR07-AC04 [Race] Repeated create with same operation UUID → One property/unit result, or 409 if payload changed.

## FR08 Manage and archive own property

Module: `M02-property-units-media`. Priority: P0 Must. Actors: Owner. Dependencies: Shared foundation.

Factors: History preservation; optimistic concurrency

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + Next.js + React + Tailwind + TanStack Query

Owner edits own property and archives unused resources. Existing tenancy, request, contract and audit references are preserved. Archive prevents new marketing/proposals but does not erase active agreements.

- FR08-AC01 [Positive] Owner archives property → Its listing leaves public scope; history remains accessible to participants.
- FR08-AC02 [Security] Different owner edits property → 403/404 without changing records.
- FR08-AC03 [Race] Archive competes with proposal creation → Common property lock gives one valid serial outcome; proposal cannot commit against archived property.
- FR08-AC04 [Integrity] Property has referenced units or agreements → No destructive cascading deletion of business history.

## FR09 Upload property and unit photos

Module: `M02-property-units-media`. Priority: P0 Must. Actors: Owner. Dependencies: Shared foundation.

Factors: Validation; private staging; durable file references

Tools: Next.js upload UI + Laravel validation/Policies + Supabase Storage

Upload validated images and create one property_media row with optional same-property unit_id. No review_status, approval, replacement chain or admin photo queue. Upload completes before media becomes selectable. Initial listing review sees selected photos; later additions appear directly when selected on an eligible listing.

- FR09-AC01 [Positive] Owner uploads valid room image → Completed object linked to correct unit; selected image appears without per-photo reapproval.
- FR09-AC02 [Validation] Wrong MIME, undecodable file or configured size/count exceeded → Reject; no broken gallery row. Validate bytes, not extension alone.
- FR09-AC03 [Security] Upload references another owner property/unit → 403/422; no cross-property association.
- FR09-AC04 [Race] Upload retry uses same operation UUID → One media record; partial object failure never creates a public broken record.

## FR10 Create property-level listing draft

Module: `M03-listings-moderation`. Priority: P0 Must. Actors: Owner. Dependencies: Shared foundation.

Factors: Source data reuse; one current advertisement

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + Next.js + React + Tailwind + TanStack Query

Choose own nonarchived property, market selected units, enter title/description and choose cover from existing selected media. Reuse property address/policies and unit specifications/photos. One nonarchived listing per property.

- FR10-AC01 [Positive] Complete property with several units → Draft references existing records without duplicating images or policies.
- FR10-AC02 [Validation] Property is incomplete → Draft may save; submission identifies missing details.
- FR10-AC03 [Race] Two creates target same property → Partial unique index permits one current listing.
- FR10-AC04 [Security] Owner selects another property photo as cover → Reject invalid scope.

## FR11 Edit listing without reapproval after initial approval

Module: `M03-listings-moderation`. Priority: P0 Must. Actors: Owner. Dependencies: Shared foundation.

Factors: Stale approvals; public consistency

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints + Next.js + React + Tailwind + TanStack Query

After first APPROVED decision, owner may update property, units, policies, media and listing wording immediately without resetting approval. Changes are audited and remain reportable. Edits before approval invalidate the submitted content revision. Admin suspension is independent and cannot be cleared by an edit.

- FR11-AC01 [Positive] Approved published listing title/photos/policies edited → Valid changes appear; initial approval remains; audit records before/after.
- FR11-AC02 [Race] Admin approves while owner edits a pending submission → Content revision check rejects stale approval; admin reloads latest complete package.
- FR11-AC03 [Race] Owner edit races with admin suspension → Suspension wins public eligibility regardless of successful content save.
- FR11-AC04 [Validation] Update removes required cover/last unit data → Reject invalid published update or explicitly hide it; no invalid public listing.

## FR12 Submit initial listing package

Module: `M03-listings-moderation`. Priority: P0 Must. Actors: Owner. Dependencies: Shared foundation.

Factors: Completeness; idempotence

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints + queued notification

First publication requires admin review of listing plus linked property, marketed units, selected media and policies as one package. Validate required address, unit details, at least one shared photo and photo per marketed unit. Capture property content_revision and listing submitted_revision. Rejected initial submissions may be corrected/resubmitted.

- FR12-AC01 [Positive] Complete draft submitted → Initial moderation PENDING; no separate property/image approval.
- FR12-AC02 [Validation] Missing required address, image, unit or policy values → 422 with field issues; not publicly published.
- FR12-AC03 [Race] Linked unit/photo changes during submit → Property content lock/revision ensures submission refers to one consistent package.
- FR12-AC04 [Integrity] Already initially approved listing updated → Do not submit to initial moderation again; retain audit/reporting flow.

## FR13 Review initial listing packages

Module: `M03-listings-moderation`. Priority: P0 Must. Actors: Admin. Dependencies: Shared foundation.

Factors: Initial package completeness; current content revision; admin authorization

Tools: Next.js + React + Tailwind + TanStack Query + Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL

Admin queue displays only initial PENDING listings with property/unit details, selected gallery, policies and captured revisions. Show owner and completeness; admin approves or rejects with reason.

- FR13-AC01 [Positive] Admin opens pending listing → All linked advertised content is visible in one review screen.
- FR13-AC02 [Security] Non-admin opens queue → 403; no private review data.
- FR13-AC03 [Race] Content changes after admin opens screen → Approval compares both listing and property revisions; stale decision returns 409.

## FR14 Approve initial listing package

Module: `M03-listings-moderation`. Priority: P0 Must. Actors: Admin. Dependencies: Shared foundation.

Factors: Exact content approval; separate publication

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints

Admin approves the exact submitted listing/property content revisions. Store reviewer/time and approved_content_revision. Approval permits publication but does not publish automatically.

- FR14-AC01 [Positive] Admin approves unchanged pending package → APPROVED and approval metadata saved; owner may publish.
- FR14-AC02 [Race] Property/unit/media/policy edit precedes decision commit → Stale revision rejected; no approval of unreviewed initial content.
- FR14-AC03 [Race] Two admins approve/reject concurrently → Only first legal transition commits; second gets current result/409.
- FR14-AC04 [Integrity] Approved listing edited later → Approval retained; no perpetual equality requirement with current revision.

## FR15 Reject initial listing with reason

Module: `M03-listings-moderation`. Priority: P0 Must. Actors: Admin. Dependencies: Shared foundation.

Factors: Explainable decisions; terminal transitions

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints

Admin rejects initial submission with a required reason. Owner corrects data and resubmits; later content violations use suspension rather than resetting initial approval.

- FR15-AC01 [Positive] Admin rejects incomplete/misleading package → REJECTED; owner sees reason; no public publication.
- FR15-AC02 [Validation] Reason empty → 422; unchanged.
- FR15-AC03 [Race] Approve and reject compete → One decision commits with matching audit/outbox.

## FR16 Dedicated changes requested state

Module: `M03-listings-moderation`. Priority: P2 Defer. Actors: Admin. Dependencies: FR15.

Factors: Scope control

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL

Defer a distinct CHANGES_REQUESTED state. MVP uses rejection with a reason plus edit/resubmit.

- FR16-AC01 [Scope] Admin requests changes in MVP → Use FR15 and owner resubmission; no unsupported state in API/UI.

## FR17 Publish initially approved listing

Module: `M03-listings-moderation`. Priority: P0 Must. Actors: Owner. Dependencies: Shared foundation.

Factors: Inventory eligibility; fresh DB checks

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints

Owner may publish only an initially approved, nonarchived, complete listing belonging to a nonarchived property and not admin-suspended. Require at least one READY, marketed unit with availability for the selected date query. Search without dates defaults to today for the unit minimum duration. No property/image approval conditions.

- FR17-AC01 [Positive] Initially approved complete listing has available unit → Publication PUBLISHED; public search/details can return it.
- FR17-AC02 [Validation] Initial moderation not approved or admin_suspended_at present → Reject publication.
- FR17-AC03 [Race] Publish races with suspension or last unit reservation → Recheck locked current state; unavailable listing never shown as available.
- FR17-AC04 [Boundary] Future tenancy leaves a nonoverlapping earlier period → Unit may qualify only if entire requested interval fits.

## FR18 Hide or archive listing

Module: `M03-listings-moderation`. Priority: P0 Must. Actors: Owner; Admin. Dependencies: Shared foundation.

Factors: Visibility; cache invalidation

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints + Laravel Cache

Owner can hide or archive own listing. Admin suspension is a separate control with required reason. Republishing an owner-hidden listing retains initial approval and must pass current eligibility; owner cannot remove admin suspension.

- FR18-AC01 [Positive] Owner hides listing → Remove from public search and normal public details; preserve enquiries/contracts.
- FR18-AC02 [Security] Owner attempts to clear admin suspension → 403/422.
- FR18-AC03 [Race] Publish competes with hide/archive → Revision and shared locks produce consistent final state; stale cache does not expose hidden content.

## FR19 Search listings by date-based availability

Module: `M04-discovery-favourites`. Priority: P0 Must. Actors: Guest; User. Dependencies: Shared foundation.

Factors: Eligibility; pagination; cost

Tools: Next.js + React + Tailwind + TanStack Query + Laravel Eloquent + PostgreSQL FTS/indexes

Search public eligible listings by text/address and paginated filters. Query units whose full desired interval has no blocking tenancy overlap. Without dates use today through each unit minimum rental term; label this default. Never use property RENTED or a stored availability count.

- FR19-AC01 [Positive] Two units, one occupied for requested interval → Return listing with only qualifying unit count/prices.
- FR19-AC02 [Boundary] Unit booked July onward and search requests April-June → Return if operational/marketing conditions and minimum term are met.
- FR19-AC03 [Integrity] One unit meets price and another meets room filter → Listing qualifies only if the same eligible unit meets combined filters.
- FR19-AC04 [Race] Reservation commits between search and proposal → Search is indicative; proposal rechecks database exclusion and returns conflict if needed.

## FR20 Filter eligible units for the full requested interval

Module: `M04-discovery-favourites`. Priority: P0 Must. Actors: Guest; User. Dependencies: Shared foundation.

Factors: Same-unit semantics; client response order

Tools: Next.js + React + Tailwind + TanStack Query + Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL

Support price, area, type, amenities, occupants and controlled policy filters on the same available unit. Start/end dates are both required when filtering dates; inclusive end is converted to [start,end+1day). Amenity filters use canonical catalog keys with enabled=true on eligible units/property scope; distinguish shared laundry from an in-unit washing machine. Custom descriptions never automatically match standard filters (FR87).

- FR20-AC01 [Positive] User filters pets allowed and rent below 5m → Apply inherited effective pet policy and rent to same eligible unit.
- FR20-AC02 [Validation] Missing one boundary, reversed dates or period below unit minimum → Return clear validation/empty qualification as applicable.
- FR20-AC03 [Boundary] One tenancy ends June30 and next starts July1 → Adjacent intervals do not overlap.
- FR20-AC04 [Race] Operational status changes during pagination → Fresh query respects new status; no authoritative reservation inferred.

## FR21 Display listing details and eligible unit cards

Module: `M04-discovery-favourites`. Priority: P0 Must. Actors: Guest; User. Dependencies: Shared foundation.

Factors: Accurate linked data; privacy

Tools: Next.js + React + Tailwind + TanStack Query + next/image + Laravel Resources

Show shared gallery, advertised rules, unit photos/specifications/prices and date-qualified availability. Owner contact enquiry form has contact name/phone/message and desired date range. Never display agreement documents or other prospects contact details. Display canonical localized amenity labels with owner details, separating shared property facilities, private unit features and additional custom text (FR87).

- FR21-AC01 [Positive] Open published listing for date range → Show qualifying unit cards and effective policies; dates visible.
- FR21-AC02 [Security] Direct URL targets suspended/hidden/unapproved listing → 404 or unavailable page with no hidden content payload.
- FR21-AC03 [Integrity] Current advertised policies differ from signed contract → Label advertising separately; no rewrite of contractual rules.
- FR21-AC04 [Race] Listing suspended after cache was populated → Public resource gate checks current visibility before returning sensitive/hidden listing data.

## FR22 Interactive listing map

Module: `M04-discovery-favourites`. Priority: P2 Defer. Actors: Guest; User. Dependencies: FR19 FR24.

Factors: Location privacy; scope

Tools: Next.js + React + Tailwind + TanStack Query + map provider SDK

Optional map of eligible listings with valid approximate/public coordinates. Keep exact private information out of marker payloads.

- FR22-AC01 [Positive] Map enabled with valid coordinates → Only eligible filtered properties displayed.
- FR22-AC02 [Failure] Provider unavailable or coordinates missing → List search remains usable.

## FR23 Synchronize map and filters

Module: `M04-discovery-favourites`. Priority: P2 Defer. Actors: Guest; User. Dependencies: FR22 FR20.

Factors: Consistent query scope

Tools: Next.js + React + Tailwind + TanStack Query + map SDK + shared Laravel search action

Use same normalized filter service for map and list; map bounding changes have explicit URL/query state.

- FR23-AC01 [Positive] Filters change → Map/list apply identical visibility and unit criteria.
- FR23-AC02 [Race] Map requests finish out of order → Stale result discarded.

## FR24 Geocode address

Module: `M02-property-units-media`. Priority: P2 Defer. Actors: System; Owner. Dependencies: FR07.

Factors: External service failure; stale jobs

Tools: Laravel Queue database driver + geocoding API

Optional asynchronous address-to-coordinate conversion after saving address. Manual address remains authoritative when provider fails.

- FR24-AC01 [Positive] Geocode succeeds for current address revision → Save valid latitude/longitude.
- FR24-AC02 [Race] Old address job completes after newer edit → Discard stale result using revision.
- FR24-AC03 [Failure] Rate limit/provider failure → Address remains saved; retry bounded and logged.

## FR25 Submit rental request with contact details

Module: `M05-rental-requests`. Priority: P0 Must. Actors: Tenant. Dependencies: Shared foundation.

Factors: Eligibility; no reservation; duplicate semantics

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints + Next.js + React + Tailwind + TanStack Query

Authenticated tenant submits contact_name, contact_phone, desired_move_in_date, desired_end_date, optional preferred_unit_id and message. Store contact snapshots. Status PENDING throughout offline discussion. No calendar, manual discussion acceptance or unit reservation at enquiry creation.

- FR25-AC01 [Positive] Tenant submits valid three-month request → PENDING request stored and owner notified with private contact snapshots.
- FR25-AC02 [Validation] Missing/invalid phone or dates, own listing, or unit outside property → Reject with field errors; phone syntax validation is not verification.
- FR25-AC03 [Security] Other tenant reads contact details → Denied; only requester, owning manager and authorized admin may access.
- FR25-AC04 [Race] Same request submitted twice → Idempotency key and one PENDING tenant/listing index yield one thread.
- FR25-AC05 [Integrity] Tenant later changes profile phone → Submitted contact snapshot remains unchanged.

## FR26 Prevent duplicate pending rental requests

Module: `M05-rental-requests`. Priority: P0 Must. Actors: Tenant. Dependencies: Shared foundation.

Factors: Concurrent duplication; usable threads

Tools: PostgreSQL partial unique index + shared action

At most one PENDING request per tenant/listing; accepted/rejected/withdrawn history remains. Unique partial index is authoritative; retries compare payload.

- FR26-AC01 [Race] Two independent connections submit same tenant/listing → One PENDING row; loser returns existing thread or 409.
- FR26-AC02 [Positive] Prior enquiry is terminal and user submits new valid one → New PENDING request permitted.
- FR26-AC03 [Integrity] Owner calls tenant or views message → Request remains PENDING; no implied acceptance or allocation.

## FR27 Tenant rental request dashboard

Module: `M05-rental-requests`. Priority: P0 Must. Actors: Tenant. Dependencies: Shared foundation.

Factors: Private data; state clarity

Tools: Next.js + React + Tailwind + TanStack Query + Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL

Display private submitted contacts, desired dates, request status/outcome and linked tenancy confirmation state. ACCEPTED means proposal created, not that tenancy contract is mutually confirmed.

- FR27-AC01 [Positive] Proposal created from pending enquiry → Show ACCEPTED plus Awaiting your contract confirmation.
- FR27-AC02 [Integrity] Tenant rejects contract version later → Request acceptance history retained; tenancy shows Awaiting revision.
- FR27-AC03 [Security] Another tenant requests dashboard row → 403/404.
- FR27-AC04 [Positive] Owner discusses by phone → Request stays PENDING until proposal created.

## FR28 Withdraw pending rental request

Module: `M05-rental-requests`. Priority: P0 Must. Actors: Tenant. Dependencies: Shared foundation.

Factors: Pending state transitions; withdrawal versus proposal race

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints

Tenant may withdraw own PENDING request with audit and owner notification. Accepted requests are handled through tenancy proposal actions instead.

- FR28-AC01 [Positive] Withdraw pending thread → WITHDRAWN; no unit to release.
- FR28-AC02 [Race] Withdraw competes with proposal creation → Same request lock; either withdrawn with no tenancy or accepted with tenancy, never both.
- FR28-AC03 [Validation] Withdraw accepted thread → 409 with link to tenancy workflow.

## FR29 Owner rental request inbox

Module: `M05-rental-requests`. Priority: P0 Must. Actors: Owner. Dependencies: Shared foundation.

Factors: Ownership; meaningful lead state

Tools: Next.js + React + Tailwind + TanStack Query + Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL

Owner sees own property requests and private tenant contact snapshots, dates and preferred unit. Discuss offline while PENDING. Actions are Reject and Create tenancy proposal; no viewing/calendar or stand-alone Accept.

- FR29-AC01 [Positive] Owner opens pending enquiry → Phone/contact visible; no reservation created by reading/calling.
- FR29-AC02 [Security] Different owner accesses inbox row → 403/404.
- FR29-AC03 [Integrity] Owner records valid proposal → Request becomes ACCEPTED only within proposal transaction.
- FR29-AC04 [Race] Inbox stale after tenant withdraws → Create action rechecks request PENDING and fails safely.

## FR30 Accept request when tenancy proposal commits

Module: `M05-rental-requests`. Priority: P0 Must. Actors: Owner. Dependencies: Shared foundation.

Factors: Atomic final acceptance; offline agreement

Tools: Laravel FormRequest + Policies + DB transaction/lockForUpdate + PostgreSQL constraints

Create tenancy, immutable ORIGINAL contract version, explicit owner confirmation, temporary reservation, audit and outbox; change rental request PENDING to ACCEPTED in the same transaction. Tenant confirmation follows separately.

- FR30-AC01 [Positive] Owner submits valid proposal with explicit confirmation → One PENDING_CONFIRMATION tenancy; request ACCEPTED; owner confirmation refers to exact version.
- FR30-AC02 [Failure] Database overlap constraint or file validation fails → Rollback acceptance, tenancy/version, audit/outbox and reservation.
- FR30-AC03 [Race] Reject/withdraw competes with proposal → One valid terminal request transition; no accepted request without tenancy.
- FR30-AC04 [Integrity] Other requests concern same or alternative units → Do not immediately reject them; apply 15-day availability policy.

## FR31 Reject pending rental request

Module: `M05-rental-requests`. Priority: P0 Must. Actors: Owner. Dependencies: Shared foundation.

Factors: Explainability; cancellation

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints

Owner can reject PENDING enquiry with reason; no viewing cancellation or automatic rejection merely because another enquiry was accepted. System auto-rejection uses FR85.

- FR31-AC01 [Positive] Owner rejects with reason → REJECTED, history and tenant notice committed.
- FR31-AC02 [Validation] Blank reason or terminal request → 422/409; unchanged.
- FR31-AC03 [Race] Reject races with Create tenancy proposal → One terminal transition; no duplicate tenancy/outcome.

## FR32 Audit request and tenancy outcomes

Module: `M05-rental-requests`. Priority: P0 Must. Actors: System. Dependencies: Shared foundation.

Factors: Durable business history; transaction consistency

Tools: PostgreSQL audit_logs + shared Laravel actions

Append-only audit events record request status, proposal/confirmation/version changes and automatic decisions with actor/system identity, safe before/after, reason and correlation UUID.

- FR32-AC01 [Positive] Request accepted through proposal → Audit links request, tenancy and version identities.
- FR32-AC02 [Integrity] Proposal later rejected/expired → Acceptance event retained; separate tenancy outcome appended.
- FR32-AC03 [Failure] Business transaction rolls back → No success audit/outbox survives.
- FR32-AC04 [Security] User tries editing/deleting audit event → Denied by API and database privilege/trigger policy.

## FR33 Enforce nonoverlapping unit rental periods

Module: `M06-tenancies-contracts`. Priority: P0 Must. Actors: System. Dependencies: Shared foundation.

Factors: Concurrent occupancy; allocation granularity

Tools: Laravel FormRequest + Policies + DB transaction/lockForUpdate + PostgreSQL constraints + btree_gist exclusion constraint

PostgreSQL GiST exclusion constraint on tenancies(unit_id, daterange(blocked_start_date, blocked_end_date+1, [))) for PENDING_CONFIRMATION/CONFIRMED/ACTIVE. Different nonoverlapping future tenancies on one unit are permitted. Blocking envelope includes confirmed span plus any proposed renewal extension.

- FR33-AC01 [Race] Two transactions propose overlapping periods for same unit → At most one commits; other gets SQLSTATE 23P01 mapped to 409.
- FR33-AC02 [Positive] Same unit proposed for adjacent June30/July1 periods → Both may commit if each otherwise eligible.
- FR33-AC03 [Integrity] Direct SQL inserts overlapping blocking rows → Exclusion constraint rejects even if API locks are bypassed.
- FR33-AC04 [Race] Renewal expansion overlaps another future tenancy → Expansion fails atomically; current confirmed agreement remains.
- FR33-AC05 [Integrity] Old unique one-active-tenancy-per-unit index exists → Remove it; date exclusion replaces lifetime allocation restriction.

## FR34 Create tenancy proposal with temporary reservation

Module: `M06-tenancies-contracts`. Priority: P0 Must. Actors: Owner. Dependencies: Shared foundation.

Factors: Agreement recording; exact unit; snapshots

Tools: Laravel FormRequest + Policies + DB transaction/lockForUpdate + PostgreSQL constraints + Supabase private Storage

Owner chooses exact READY nonarchived unit in request property, enters final dates/rent/deposit, negotiated policy snapshot and private agreement document, then explicitly confirms version. Create one continuing tenancy with version 1, pending pointer and configured confirmation deadline. Default reservation 48h is a proposed configurable setting.

- FR34-AC01 [Positive] Owner proposes July1-December31 → PENDING_CONFIRMATION reserves only that period; enquiry ACCEPTED; tenant invited to review exact version.
- FR34-AC02 [Validation] Tenant mismatch, invalid dates/rent, original period below3calendar months (including month-end/leap-year boundaries), unit unavailable or missing private file → 422/409 and no accepted request.
- FR34-AC03 [Race] Two owners tabs propose same request → Unique rental_request_id permits one tenancy; idempotent identical replay returns it.
- FR34-AC04 [Race] Unit put in maintenance while proposal submitted → Shared property/unit locks and eligibility recheck prevent ineligible proposal.
- FR34-AC05 [Integrity] Move-in date arrives before both confirmations → No automatic activation; reservation expiry still applies.

## FR35 View tenancy timeline and contract versions

Module: `M06-tenancies-contracts`. Priority: P0 Must. Actors: Owner; Tenant. Dependencies: Shared foundation.

Factors: Privacy; effective periods

Tools: Next.js + React + Tailwind + TanStack Query + Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + private Storage

Owner and tenant can view all immutable version metadata/documents, each party confirmation/decline, proposed/current/upcoming terms, deadline and supersession links. Derive state from current pending pointer, confirmations and audit events; do not mark old versions confirmed by inference.

- FR35-AC01 [Positive] Version1 rejected, version2 confirmed → Both visible with distinct document/terms/decisions; current points to version2.
- FR35-AC02 [Security] Unrelated user requests document URL → 403/404; short-lived private download only after authorization.
- FR35-AC03 [Integrity] Future renewal is mutually confirmed → Show current original rent until renewal start, then renewal rent.
- FR35-AC04 [Boundary] Date beyond last confirmed term → Show no confirmed term for date; never substitute proposed rent.

## FR36 Submit tenancy based review

Module: `M08-reports-admin`. Priority: P2 Defer. Actors: Tenant. Dependencies: FR35 FR79.

Factors: Eligibility; abuse; uniqueness

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + Next.js + React + Tailwind + TanStack Query

Optional one property review per ACTIVE/ENDED tenancy; rating1–5 and comment. Reviews pending manual moderation if enabled.

- FR36-AC01 [Positive] Eligible tenant submits valid review → PENDING review linked to tenancy/property.
- FR36-AC02 [Security] Non-tenant or invalid rating → Reject.
- FR36-AC03 [Race] Two submissions for same tenancy → Unique tenancy_id permits one review.

## FR37 Display approved property reviews

Module: `M08-reports-admin`. Priority: P2 Defer. Actors: Guest; User. Dependencies: FR36 FR79.

Factors: Moderated visibility; aggregates

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + Next.js + React + Tailwind + TanStack Query

Only display reviews when review feature exists; show approved reviews and consistent rating aggregate.

- FR37-AC01 [Positive] Approved review exists → Shown with correct aggregate; pending/rejected excluded.
- FR37-AC02 [Race] Review hidden while aggregate cached → Invalidate aggregate and details; no fabricated reviews.

## FR38 Report public listing

Module: `M08-reports-admin`. Priority: P0 Must. Actors: Authenticated user. Dependencies: Shared foundation.

Factors: Abuse limits; synchronous persistence

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + queued notification

Submit reason code and description for suspicious published listing. Save OPEN report synchronously; queue admin alert after commit. Do not use Kafka/RabbitMQ for report creation.

- FR38-AC01 [Positive] Authenticated user reports visible listing → Report, reporter and listing recorded; not auto-hidden solely from one report.
- FR38-AC02 [Security] Guest submits or client forges reporter/status → 401/restricted input rejected.
- FR38-AC03 [Validation] Invalid reason/empty required explanation → 422.
- FR38-AC04 [Race] Same reporter concurrently reports same listing → At most one OPEN/REVIEWING report; unique constraint returns existing/conflict.
- FR38-AC05 [Race] Listing hidden between view and submit → 404/unavailable; existing reports preserved; server rechecks eligibility under property lock.

## FR39 Investigate reports and suspend listings

Module: `M08-reports-admin`. Priority: P0 Must. Actors: Admin. Dependencies: Shared foundation.

Factors: Resolution history; fair moderation

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints + Next.js + React + Tailwind + TanStack Query

Admin moves OPEN report to REVIEWING then RESOLVED/DISMISSED with required reason. An optional suspension is atomic with resolution and audit; notify reporter with sanitized outcome. Restoration is an explicit admin restriction action, not a new ordinary property/photo review.

- FR39-AC01 [Positive] Admin resolves valid report and suspends listing → Report outcome, suspension fields, audit and notice intent commit together.
- FR39-AC02 [Validation] Final decision lacks reason → 422; unchanged.
- FR39-AC03 [Race] Two admins resolve/dismiss report → One terminal outcome; second stale action gets409.
- FR39-AC04 [Race] Owner publishes while admin suspends → Shared lock retains suspension; owner cannot clear it.

## FR40 Public listing REST resources

Module: `M04-discovery-favourites`. Priority: P0 Must. Actors: Guest; API client. Dependencies: Shared foundation.

Factors: Consistent DTO; pagination

Tools: Laravel Resource Controllers + API Resources + OpenAPI

Expose GET listing collection/detail using one public eligibility service; include safe unit/media/policy DTOs, pagination and errors.

- FR40-AC01 [Positive] Valid search/detail requests → 200 and documented JSON shape.
- FR40-AC02 [Negative] Unavailable/nonexistent UUID → 404; invalid filter422.
- FR40-AC03 [Security] Public response serialized → No private documents, tokens, admin flags or tenant contacts.

## FR41 Property and unit REST CRUD

Module: `M02-property-units-media`. Priority: P0 Must. Actors: Owner; Admin where explicitly allowed. Dependencies: Shared foundation.

Factors: Authorization parity; archival

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL

Authorize owner-scoped CRUD for properties, units and gallery selection. Route linked-content writes through property content lock/revision/audit action. No property approval, document-evidence review or image-review endpoints.

- FR41-AC01 [Positive] Owner edits own unit through API → Validated update and audit; increment appropriate revisions.
- FR41-AC02 [Security] Caller alters foreign property/unit or protected moderation fields → 403/422.
- FR41-AC03 [Race] Stale content revision submitted → 409; no lost update.

## FR42 Rental request tenancy and renewal action APIs

Module: `M06-tenancies-contracts`. Priority: P0 Must. Actors: Tenant; Owner. Dependencies: Shared foundation.

Factors: Explicit transitions; idempotence

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints

Provide authenticated request submit/withdraw/reject, tenancy propose/correct/cancel/end/move-in, exact-version confirm/decline and renewal request/propose actions. Shared actions enforce policies, idempotency and transaction rules. No viewings endpoints.

- FR42-AC01 [Positive] Next.js invokes proposal/confirmation APIs → Documented statuses and UUID links returned; private resources authorized.
- FR42-AC02 [Security] User forges actor_role/version owner → Role derived from tenancy parties; 403.
- FR42-AC03 [Race] Client sends stale tenancy revision or superseded version UUID → 409 without changing confirmations or blocked span.
- FR42-AC04 [Integrity] Equivalent HTTP and worker actions run → Both use same business locks/constraints.

## FR43 Verify Supabase JWT in Laravel

Module: `M01-identity-access`. Priority: P0 Must. Actors: API client. Dependencies: Shared foundation.

Factors: Signature and claims; single identity authority

Tools: Supabase Auth + Next.js auth client + Laravel JWT guard using project JWKS

Validate Supabase access JWT using allowed asymmetric algorithm and project JWKS; verify issuer, audience, expiry, subject and account/profile eligibility. Use trusted sub as profile UUID. No Sanctum personal_access_tokens in chosen auth path.

- FR43-AC01 [Positive] Valid project access token → Laravel resolves current profile and then runs Policies.
- FR43-AC02 [Security] Tampered payload, alg none, wrong issuer/audience/key or expired token → 401, no protected action.
- FR43-AC03 [Security] Body contains a different user_id → Never replaces verified sub.
- FR43-AC04 [Failure] Unknown kid/key rotation or JWKS refresh failure → Bounded key refresh, fail closed and safe error; no arbitrary token-supplied key URL.
- FR43-AC05 [Race] Multiple first API calls bootstrap same confirmed profile → One profile row with no overwritten privilege flags.

## FR44 OpenAPI documentation

Module: `M10-operations-delivery`. Priority: P1 Should. Actors: Developer. Dependencies: FR40 FR41 FR42 FR43.

Factors: Usable API contract

Tools: Scramble/OpenAPI + Laravel middleware annotation

Document endpoints, payloads, responses, UUIDs, expected revisions, idempotency and Supabase bearer security. Do not label JWT as Sanctum token.

- FR44-AC01 [Positive] Open generated docs → Auth and action routes include examples for401/403/404/409/422.
- FR44-AC02 [Validation] Try documented request flow → Matches implemented field names and state enums.
- FR44-AC03 [Security] Published specification → No secrets or live private document URLs.

## FR45 Asynchronous domain notifications

Module: `M09-notifications-audit`. Priority: P1 Should. Actors: System. Dependencies: Shared foundation.

Factors: After-commit reliability; retry semantics

Tools: Laravel Queue(database) + Workers + Scheduler + transactional outbox + Supabase PostgreSQL

Write notification_outbox atomically with request/moderation/proposal/confirmation/renewal outcomes. Laravel queue workers deliver notifications after commit, with retry/event deduplication. Use database-backed Laravel Queue on Supabase PostgreSQL for MVP; no Kafka/RabbitMQ or viewing reminders.

- FR45-AC01 [Positive] Owner creates proposal → Tenant notification links exact version/deadline after commit.
- FR45-AC02 [Failure] Delivery service unavailable → Business transaction remains committed; bounded worker retries and observable failure.
- FR45-AC03 [Race] Worker repeats event → Recipient inbox event uniqueness prevents duplicate inbox items.
- FR45-AC04 [Integrity] Proposal replaced before delayed notice delivered → Notice points to historical version and current UI flags superseded; no stale confirm action allowed.

## FR46 Cache public listing content with fresh visibility checks

Module: `M04-discovery-favourites`. Priority: P1 Should. Actors: System. Dependencies: Shared foundation.

Factors: Visibility invalidation; no authority from cache

Tools: Laravel Cache database store + TanStack Query + next/image

Next.js/TanStack Query may cache public reads. Invalidate on content, media, policy, suspension and allocation changes. Public detail/API must gate current hidden/suspended status; availability remains indicative until transactional proposal creation.

- FR46-AC01 [Positive] Owner edits approved content → Cache invalidated; refreshed content appears without reapproval.
- FR46-AC02 [Race] Admin suspends while stale cache exists → Current visibility gate prevents serving suspended listing from normal app routes.
- FR46-AC03 [Integrity] Search cache says available but reservation has committed → Proposal fails with conflict; cache never authorizes allocation.

## FR47 Structured logs and critical alerts

Module: `M10-operations-delivery`. Priority: P1 Should. Actors: System; Developer. Dependencies: Shared foundation.

Factors: Traceability; privacy

Tools: Laravel Logging/Monolog + configured alert destination

Log request/event ID, actor/resource UUIDs, operation and failure duration/context. Alert configured admin/developer on critical storage, transaction or exhausted job failures. Business audit remains separate.

- FR47-AC01 [Failure] Simulate storage or exhausted notification failure → Useful structured log with correlation ID; critical alert emitted with deduplication.
- FR47-AC02 [Security] Inspect log payload → No passwords, access/refresh tokens, full contracts or signed URLs.
- FR47-AC03 [Integrity] Notification provider fails while alerting → Log fallback; do not roll back completed business action.

## FR48 Development monitoring and slow query alerts

Module: `M10-operations-delivery`. Priority: P1 Should. Actors: Developer; authorized admin. Dependencies: Shared foundation.

Factors: Performance; restricted diagnostics

Tools: Laravel Telescope + DB query listener + cumulative query monitoring

Use Telescope in development with restricted access. Capture slow query duration and cumulative query time and configure explicit developer alert thresholds; Telescope display alone is not an alert.

- FR48-AC01 [Positive] Slow query exceeds configured threshold → Record duration/query fingerprint/correlation; deliver alert once per dedupe window.
- FR48-AC02 [Security] Public visitor requests Telescope → Unavailable or403; query bindings redact sensitive information.
- FR48-AC03 [Failure] Monitor/alert service down → App continues; local diagnostic fallback.

## FR49 Password reset and email confirmation

Module: `M01-identity-access`. Priority: P0 Must. Actors: User. Dependencies: Shared foundation.

Factors: Account recovery; provider-managed credentials

Tools: Supabase Auth + Next.js auth client + Laravel JWT guard using project JWKS

Use Supabase confirmation/recovery links with configured allowed redirects. Reset password through provider; never store plaintext or recovery tokens in application tables.

- FR49-AC01 [Positive] User follows valid recovery link and chooses valid password → Provider resets password; user can authenticate normally.
- FR49-AC02 [Security] Expired/replayed recovery link or disallowed redirect → Rejected by provider/application; no arbitrary account reset.
- FR49-AC03 [Privacy] Reset requested for an unknown email → Generic response avoids account enumeration.

## FR50 Create and bulk create units

Module: `M02-property-units-media`. Priority: P0 Must. Actors: Owner. Dependencies: Shared foundation.

Factors: Inventory identity; structured input

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints + Next.js + React + Tailwind + TanStack Query

SEPARATE_UNITS allows manual or structured bulk creation: count, prefix, starting number and defaults. Generate editable preview rows in Next.js; save final JSON array transactionally. No LLM/SQL generation. Unit amenity defaults use the same controlled JSONB structure as FR87; each preview row gets its own copied value, not linked mutable defaults.

- FR50-AC01 [Positive] Generate5 studios prefixS start201 → Preview S201–S205; individually edit S205 before save.
- FR50-AC02 [Validation] Duplicate normalized labels, invalid prices/areas or batch over configured cap → Reject entire batch with row errors; no partial rows.
- FR50-AC03 [Race] Concurrent batches overlap labels → Unique(property_id, normalized label) rejects duplicates; one batch succeeds, other rolls back.
- FR50-AC04 [Integrity] WHOLE_SPACE owner invokes Add units → Reject second unit; backend auto-unit remains sole unit.

## FR51 Edit unit details and advertised terms

Module: `M02-property-units-media`. Priority: P0 Must. Actors: Owner. Dependencies: Shared foundation.

Factors: Unit versus template; stale writes

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints

Owner edits specifications, marketed price/deposit, minimum duration and controlled policy overrides. Valid post-approval edits appear directly with audit; current or proposed contract snapshots are immutable. Unit amenities use units.amenities with allowlisted scope-aware catalog keys and custom text per FR87; no owner-created global amenity key.

- FR51-AC01 [Positive] Advertised rent changes 4m to 4.5m → Listing shows new price; existing version rent stays unchanged.
- FR51-AC02 [Validation] Area/rent <=0 or minimum duration below 3 months → 422; unchanged.
- FR51-AC03 [Race] Two tabs update same unit revision → One succeeds; stale tab receives 409.
- FR51-AC04 [Integrity] Existing contracts have different policy/rent → Never synchronize live unit values into contract versions.

## FR52 Manage operational status independently of availability

Module: `M02-property-units-media`. Priority: P0 Must. Actors: Owner. Dependencies: Shared foundation.

Factors: Availability derivation; maintenance

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints

units.operational_status is READY, MAINTENANCE or RETIRED. Rental availability is derived for a requested interval from blocking tenancy ranges, not an OCCUPIED flag. is_marketed controls advertisement only. Maintenance stops new proposals but does not cancel agreements.

- FR52-AC01 [Positive] READY unit has active tenancy for January-June → Unavailable for overlapping dates; potentially available from July for a valid period.
- FR52-AC02 [Positive] Owner marks MAINTENANCE → Exclude from new proposals/public qualifying inventory without mutating existing contracts.
- FR52-AC03 [Race] Maintenance races with new proposal → Shared locks yield serialized eligibility decision.
- FR52-AC04 [Integrity] Owner unmarkets unit → Existing tenancy/reservation remains; operational and occupancy data unchanged.

## FR55 Audit property unit and policy updates

Module: `M02-property-units-media`. Priority: P0 Must. Actors: Owner; System. Dependencies: Shared foundation.

Factors: Source-linked public content; revision propagation

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints

Increment property.content_revision for changes to any initial-review content, including units, selected photos and policies. Before first approval invalidate pending snapshot. After approval retain approval and show changes directly; append safe audit before/after with actor/time. Amenity changes increment property content_revision, retain normal post-approval editing and record before/after audit. Standard label changes in the code catalog do not rewrite saved keys (FR87).

- FR55-AC01 [Positive] Approved property policy/media changes → Public content updates directly; initial approval retained; audit available to admin.
- FR55-AC02 [Race] Initial approval and linked-content edit compete → Common property content lock plus captured revisions prevent stale first approval.
- FR55-AC03 [Security] Owner attempts audit deletion or admin flag update → Denied.
- FR55-AC04 [Integrity] Photo file changed → Use new unique storage object; retain audit metadata/hash rather than overwriting reviewed bytes.

## FR56 Select reorder and remove gallery images

Module: `M02-property-units-media`. Priority: P0 Must. Actors: Owner. Dependencies: Shared foundation.

Factors: Selection versus approval; cover references

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints + Next.js upload UI + Laravel HTTP client + Supabase private Storage + PostgreSQL

Owner selects media, sets order and cover, or soft-deletes unused photos. Selected nondeleted property/unit media may appear without review. Cover must be selected, same-property shared media; deleting cover requires replacement or explicit hide.

- FR56-AC01 [Positive] Select newly uploaded image on approved published listing → Appears immediately; no review state involved.
- FR56-AC02 [Validation] Delete cover while keeping listing published without replacement → 422 or explicit hide choice; never broken required cover.
- FR56-AC03 [Race] Reorder/removal and caption save compete → Media revision prevents stale resurrection; audited changes.
- FR56-AC04 [Integrity] Deselect photo → Hide from gallery; do not physically delete merely because unselected.

## FR57 Update photos without a replacement-review workflow

Module: `M02-property-units-media`. Priority: P0 Must. Actors: Owner. Dependencies: Shared foundation.

Factors: Immutable storage; predecessor consistency

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints + Next.js upload UI + Laravel HTTP client + Supabase private Storage + PostgreSQL

To change photo bytes, upload a new object/media row and switch gallery/cover references in a transaction after upload succeeds; optionally soft-delete old media. No replaces_image_id, image approvals or waiting-choice dialog.

- FR57-AC01 [Positive] Owner uploads new photo and saves gallery change → New image immediately eligible; old image unselected/deleted as requested; audit references both UUIDs.
- FR57-AC02 [Failure] Upload fails before reference swap → Existing gallery/cover remains valid.
- FR57-AC03 [Race] Two updates target same gallery/cover revision → One wins; other reloads; no loss of a referenced object.
- FR57-AC04 [Security] Owner overwrites a shared object path → Reject path reuse; issue unique object path.

## FR59 Safely clean orphaned and deleted media

Module: `M02-property-units-media`. Priority: P1 Should. Actors: System. Dependencies: Shared foundation.

Factors: Reference integrity; asynchronous storage

Tools: Scheduled Laravel cleanup + Supabase Storage + PostgreSQL

Scheduled cleanup deletes incomplete unreferenced uploads and soft-deleted media after configured retention. Recheck cover/gallery/audit retention references before deleting. Contract documents are excluded from public-photo cleanup.

- FR59-AC01 [Positive] Deleted unreferenced media reaches retention cutoff → Delete object and set purged_at idempotently.
- FR59-AC02 [Race] Cleanup races with cover selection → Shared lock/recheck prevents deletion of newly referenced live object.
- FR59-AC03 [Integrity] Photo only unselected → Retain unless explicitly deleted/eligible orphan; no automatic purge.
- FR59-AC04 [Security] Cleanup scans contracts bucket → Do not purge immutable agreements under media policy.

## FR60 Manage controlled property JSONB policies

Module: `M02-property-units-media`. Priority: P0 Must. Actors: Owner. Dependencies: Shared foundation.

Factors: Validated schema; reusable defaults

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + PostgreSQL JSONB + Next.js + React + Tailwind + TanStack Query

properties.policies contains schema_version, defaults for predefined pets/smoking, and shared_rules array. Owner uses form fields; backend validates allowlisted keys/enums and limits. No independent policy table in MVP; later migration can preserve stable keys. Approved listings update immediately with audit.

- FR60-AC01 [Positive] Owner sets pets NOT_ALLOWED and quiet hours → Store controlled JSONB; display defaults/shared rules.
- FR60-AC02 [Validation] Unknown key, invalid enum, oversized rule or executable markup → Reject invalid structure; safely render plain text.
- FR60-AC03 [Integrity] Owner changes advertised rule after agreement → Immutable contract policies_snapshot/document unchanged.
- FR60-AC04 [Race] Policy edit races with initial listing approval → Stale initial approval rejected; after approval no reapproval.

## FR61 Resolve unit policy overrides and additional rules

Module: `M02-property-units-media`. Priority: P0 Must. Actors: Owner; Guest; Tenant. Dependencies: Shared foundation.

Factors: Inheritance; consistency; historical terms

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + JSONB resolver + Next.js + React + Tailwind + TanStack Query

units.policy_overrides contains optional predefined enum overrides and additional_rules array. Missing key inherits property default; shared_rules always retained. Preserve resolved actually agreed policies in immutable version snapshot at proposal, editable only through new version.

- FR61-AC01 [Positive] Property pets NOT_ALLOWED, unit override ASK_OWNER → Display ASK_OWNER plus shared rules and additional unit rules.
- FR61-AC02 [Validation] Unit tries removing shared_rules or injects arbitrary policy key → Reject; unit override schema cannot remove mandatory building rules.
- FR61-AC03 [Integrity] Tenant negotiated cat permission → Contract snapshot stores actual negotiated allowance, distinct from current advertising.
- FR61-AC04 [Race] Property changes while proposal snapshots terms → Transaction reads coherent agreed values; explicit negotiated form wins, not later live data.

## FR66 Cancel proposals and end confirmed tenancies

Module: `M06-tenancies-contracts`. Priority: P0 Must. Actors: Owner. Dependencies: Shared foundation.

Factors: Actual occupancy; history; reopening

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints

Initial proposal decline releases reservation and sets AWAITING_REVISION; owner may issue corrected version under same tenancy after rechecking availability. Expired initial proposal becomes EXPIRED. Owner may cancel pre-start confirmed tenancy or record actual end with reason; preserve accepted enquiry/history and immutable agreements. Ending cancels pending renewal work and releases only the remaining blocked portion.

- FR66-AC01 [Positive] Initial proposed version declined → Record tenant decline; clear pending pointer/deadline and blocked dates; AWAITING_REVISION.
- FR66-AC02 [Positive] Confirmed occupancy ends early → Set ENDED and actual_ended_at; released future dates available if READY/marketed.
- FR66-AC03 [Race] Cancel/end races with final confirmation/renewal → One serialized legal outcome; no resurrected tenancy or orphan reservation.
- FR66-AC04 [Integrity] Request was ACCEPTED before proposal cancellation → Keep historical ACCEPTED; show linked cancelled/expired tenancy, not a fabricated completed rental.
- FR66-AC05 [Boundary] Contract date ends with no physical move-out confirmation → Do not fabricate actual_ended_at; scheduling follows agreed range. Overstay requires an explicit audited operational block/maintenance action.

## FR67 Record original immutable agreement version

Module: `M06-tenancies-contracts`. Priority: P0 Must. Actors: Owner. Dependencies: Shared foundation.

Factors: Document privacy; dated evidence

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints + private Storage

Store version_number, ORIGINAL type, dates/rent/deposit, negotiated policies, private unique document_path, SHA256, optional owner-reported signed_on and created_by/created_at. No signing service. Owner explicitly confirms exact version on submit; tenant must independently confirm same UUID/hash. Store owner_confirmed_at, tenant_confirmed_at, tenant_rejected_at and tenant_rejection_reason on tenancy_contracts; there is no separate confirmation entity.

- FR67-AC01 [Positive] Offline signed June20, uploaded June23, starts July1 → Keep signed_on, created_at and start_date distinct.
- FR67-AC02 [Validation] Signing date unknown → Allow null; never fabricate it from created_at.
- FR67-AC03 [Security] Update/delete terms or replace document bytes after version inserted → Database privileges/triggers reject; new version and new path required.
- FR67-AC04 [Race] Two inserts choose same tenancy version_number → Unique (tenancy_id,version_number) rejects duplicate; action retries safely.

## FR68 Submit one pending renewal request

Module: `M07-renewals`. Priority: P0 Must. Actors: Tenant. Dependencies: Shared foundation.

Factors: One pending request; original proposal integrity

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints + Next.js + React + Tailwind + TanStack Query

Tenant on CONFIRMED/ACTIVE tenancy requests a later end date and proposed monthly rent. At most one PENDING renewal request per tenancy. Request alone changes no dates/availability. Allow one upcoming renewal workflow at a time; request proposal values remain immutable.

- FR68-AC01 [Positive] Tenant requests continuation through December → PENDING renewal request; original term/range unchanged.
- FR68-AC02 [Race] Concurrent renewal requests → Partial unique index permits one PENDING row.
- FR68-AC03 [Validation] Wrong tenant, ended tenancy, invalid date/rent or upcoming confirmed renewal exists → Reject with clear reason.
- FR68-AC04 [Integrity] Owner discusses different final rent offline → Keep requested value; final version stores separately negotiated amount.

## FR69 Withdraw or reject pending renewal request

Module: `M07-renewals`. Priority: P0 Must. Actors: Tenant; Owner. Dependencies: Shared foundation.

Factors: Explicit final states; no approval-only extension

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints + Next.js + React + Tailwind + TanStack Query

Tenant cancels or owner rejects PENDING renewal request with reason. If a pending renewal contract exists, invalidate its pending pointer and restore blocked envelope to confirmed dates in same transaction; old version/confirmations remain history.

- FR69-AC01 [Positive] Tenant withdraws renewal with reserved extension → CANCELLED; pending pointer cleared; only unconfirmed extension released.
- FR69-AC02 [Positive] Owner rejects request → REJECTED with reason, no change to confirmed original contract.
- FR69-AC03 [Race] Withdrawal/rejection competes with final mutual confirmation → One terminal result; accepted renewal cannot be silently cancelled as pending.
- FR69-AC04 [Integrity] Old notification refers to cancelled renewal version → Confirmation endpoint rejects stale/terminal workflow.

## FR70 Propose renewal as new immutable version

Module: `M07-renewals`. Priority: P0 Must. Actors: Owner. Dependencies: Shared foundation.

Factors: Atomic agreement linkage; consecutive terms

Tools: Laravel FormRequest + Policies + DB transaction/lockForUpdate + PostgreSQL constraints + private document Storage

Owner records negotiated consecutive continuation dates/rent/document from PENDING renewal request. Add RENEWAL contract version under same tenancy and owner confirmation, reserve extension via blocked envelope. Renewal request remains PENDING until tenant confirms same version; then mark ACCEPTED atomically with confirmed span expansion.

- FR70-AC01 [Positive] Original Jan-June; proposed July-Dec at4.2m → New RENEWAL version, temporary July-Dec extension reservation; current rent unchanged.
- FR70-AC02 [Validation] Start is not confirmed_end+1day or end not later → Reject; no gaps/overlaps or altered original term.
- FR70-AC03 [Race] Future tenancy already reserves overlapping extension → Exclusion constraint fails; request stays PENDING; original agreement remains.
- FR70-AC04 [Race] Two owners tabs propose or correct renewal → One pending version under tenancy lock/revision; no parallel effective renewal.
- FR70-AC05 [Integrity] Tenant confirms version after owner confirmation → Request ACCEPTED, extension confirmed; future rent activates only on renewal start.
- FR70-AC06 [Failure] Mutual confirmation transaction fails → No partial ACCEPTED renewal or confirmed extension.

## FR71 Keep immutable versions and effective agreement history

Module: `M06-tenancies-contracts`. Priority: P0 Must. Actors: Owner; Tenant. Dependencies: Shared foundation.

Factors: Historical truth; current vs future terms

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + Next.js + React + Tailwind + TanStack Query

tenancy_contracts stores immutable submitted agreement versions, agreed terms/document/hash and write-once participant confirmation metadata. ORIGINAL and consecutive RENEWAL segments represent agreed periods; corrections create new rows with supersedes_contract_id. Current agreed rent comes only from the mutually confirmed segment covering the date. No separate contract_confirmations table. Confirmed mid-term amendments remain deferred.

- FR71-AC01 [Positive] Original v1 rejected, corrected v2 mutually confirmed, renewal v3 later confirmed → Keep all three; v2 covers original dates; v3 covers continuation; v1 has no contractual effect.
- FR71-AC02 [Integrity] Owner edits advertised terms/policies → Existing version/document/hash/snapshot remains unchanged.
- FR71-AC03 [Security] Attempt database UPDATE/DELETE on contract terms or existing confirmation metadata → Denied by trigger/privileges, not API convention alone.
- FR71-AC04 [Boundary] No confirmed segment covers queried date → Show no confirmed terms for this date; proposed terms separately labeled.

## FR72 Reporter outcome and rate limits

Module: `M08-reports-admin`. Priority: P0 Must. Actors: Authenticated reporter; Admin. Dependencies: Shared foundation.

Factors: Abuse prevention; confidentiality

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + Laravel rate limiter + Notifications

Reporter can view own reports and sanitized status/outcome. Admin notes remain private. Enforce configured per-user/IP submission limits and one live report per reporter/listing.

- FR72-AC01 [Positive] Reporter views resolved report → Own status and safe outcome only.
- FR72-AC02 [Security] Reporter guesses another report or requests internal notes → 403/404; notes omitted.
- FR72-AC03 [Abuse] Configured limit exceeded → 429 without creating report/outbox.
- FR72-AC04 [Race] Duplicate report while report is REVIEWING → Return existing live report/conflict; no duplicate.

## FR73 Private notification inbox

Module: `M09-notifications-audit`. Priority: P1 Should. Actors: User. Dependencies: FR45.

Factors: Recipient isolation; idempotent read state

Tools: Next.js + React + Tailwind + TanStack Query + Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + notifications

Persist event-keyed in-app messages with safe links; unread/read state per recipient. Email links navigate through authorized application routes, not permanent document URLs.

- FR73-AC01 [Positive] User marks own notification read twice → Idempotent read_at; no duplicate rows.
- FR73-AC02 [Security] Other user reads/marks it → 403/404.
- FR73-AC03 [Race] Same event delivered twice → Unique recipient/event_key yields one notification.

## FR74 Idempotent writes and stale revisions

Module: `M06-tenancies-contracts`. Priority: P0 Must. Actors: System. Dependencies: Shared foundation.

Factors: Retry safety; optimistic concurrency

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints + PostgreSQL unique keys

Use client_operation_id UUID on creates and revision checks on mutable resources. Scope operation key to actor/parent. Reusing key with different canonical payload returns409; terminal action replay never repeats side effects.

- FR74-AC01 [Race] Network retry after successful commit → Existing resource/result returned without duplicate audit or notification intent.
- FR74-AC02 [Security] Other actor uses guessed operation UUID → No cross-actor result disclosure.
- FR74-AC03 [Race] Two updates with same expected revision → Only one succeeds; losing write409.
- FR74-AC04 [Integrity] Concurrency acceptance tests run → Use independent PostgreSQL connections/barrier, not only sequential mocks.

## FR75 Transactional locking audit and consistency

Module: `M06-tenancies-contracts`. Priority: P0 Must. Actors: System. Dependencies: Shared foundation.

Factors: Deadlocks; coordinated critical paths

Tools: Laravel FormRequest + Policies + DB transaction/lockForUpdate + PostgreSQL constraints

All writes use shared Laravel actions, fixed lock order property then units sorted by UUID then rental request/tenancy/renewal rows. Persist domain/audit/outbox/idempotency in same transaction. Direct clients cannot write application tables. Cross-table invariants use composite FKs and deferred constraint triggers as specified.

- FR75-AC01 [Race] Two proposal/renewal/expiry actions use independent connections → Consistent locks avoid lost changes; deadlocks retried boundedly.
- FR75-AC02 [Failure] Action fails after adding version before reservation acceptance → Whole action rolls back; only staged orphan file may remain.
- FR75-AC03 [Integrity] Direct SQL attempts invalid pending pointer or confirmation actor → Composite FK/check/constraint trigger rejects invalid committed state.
- FR75-AC04 [Security] Frontend anon key attempts app table writes → Denied by grants/RLS; Laravel verified actions enforce domain rules.

## FR76 Deferred and excluded MVP scope

Module: `M10-operations-delivery`. Priority: P3 Exclude. Actors: Team. Dependencies: Shared foundation.

Factors: Feasible five-week scope

Tools: No new service

No phone OTP, property/image moderation, image replacement review, in-app viewing calendar, platform e-signature engine, payment collection, mid-term confirmed-contract amendment, Kafka/RabbitMQ, Elasticsearch or custom thumbnail AI in initial MVP. Supabase Auth email confirmation remains. Maps/Google sign-in/property reviews retain separately marked deferred priorities.

- FR76-AC01 [Integrity] Review MVP screens/API/schema → No mandatory phone verification or removed review/scheduling workflow.
- FR76-AC02 [Integrity] Contract confirmation shown → Describe participant acknowledgement of stored version; do not claim verified legal e-signature.
- FR76-AC03 [Positive] Later extension added → Use explicit requirements/migration rather than reviving removed states implicitly.

## FR77 Calculate availability counts and rent ranges

Module: `M04-discovery-favourites`. Priority: P0 Must. Actors: System. Dependencies: Shared foundation.

Factors: No stale counters; same-unit search

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + PostgreSQL queries

For each selected interval, eligible unit has complete required listing data, is READY, marketed, nonarchived, minimum-duration compliant and has no overlap with blocking tenancy envelope. Pending-confirmation holds count as blocked until explicit expiry release. Count and rent range derive from same qualifying query. Without dates use each unit minimum term from today.

- FR77-AC01 [Positive] One of two units reserved for requested period → Available count2→1 and range from remaining unit.
- FR77-AC02 [Boundary] Two tenancies on same unit occupy distinct future intervals → Only intersecting searches exclude it; do not treat any tenancy row as permanent occupation.
- FR77-AC03 [Race] Reservation expires concurrently with inventory read → Committed query gives coherent before/after; proposal action rechecks/reaps due holds under lock.
- FR77-AC04 [Integrity] Last unit unavailable → Hide from available search for that interval; do not change stored publication_status or auto-republish owner-hidden content.

## FR78 Suspend and restore listings after reports or inspection

Module: `M03-listings-moderation`. Priority: P0 Must. Actors: Admin. Dependencies: Shared foundation.

Factors: Reports supplement prior review; immediate safety

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints

Admin can suspend published listing directly after inspection or authenticated report with reason, audit and notice. admin_suspended_at/by/reason independent of initial moderation/publication. Owner edits cannot remove suspension. Admin may explicitly restore after checking corrections; no repeated ordinary content approval process.

- FR78-AC01 [Positive] Admin sees harmful new image → Suspend whole listing immediately; no media review-status machinery.
- FR78-AC02 [Race] Owner edits/republishes while admin suspends → Admin flag remains; all normal public listing routes deny exposure.
- FR78-AC03 [Security] Owner clears suspension field → Reject by field allowlist/policy.
- FR78-AC04 [Positive] Admin restores after investigation → Clear suspension with audit; public visibility still requires owner PUBLISHED and all eligibility gates.
- FR78-AC05 [Integrity] Previously public photo URL was downloaded → Normal public listing hidden; remove offending object if needed. Do not claim ability to recall downloaded copies.

## FR79 Moderate optional property reviews

Module: `M08-reports-admin`. Priority: P2 Defer. Actors: Admin. Dependencies: FR36.

Factors: Public content consistency

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + Next.js + React + Tailwind + TanStack Query

If reviews are implemented, approve/reject exact submitted revision and allow reported harmful review removal. Required rejection/removal reasons.

- FR79-AC01 [Positive] Approve PENDING review → Visible and included in aggregate.
- FR79-AC02 [Race] Review edited during moderation → Expected revision prevents stale approval.
- FR79-AC03 [Security] Normal user moderates review → 403.

## FR80 Confirm move-in after mutual contract confirmation

Module: `M06-tenancies-contracts`. Priority: P0 Must. Actors: Owner. Dependencies: Shared foundation.

Factors: Lifecycle clarity; no duplicate allocation

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints + Next.js + React + Tailwind + TanStack Query

Owner records move-in on/after first confirmed start date for CONFIRMED tenancy, changes to ACTIVE and audits. PENDING_CONFIRMATION never activates on date arrival. Future nonoverlapping tenancies remain permitted; activation does not extend blocked range.

- FR80-AC01 [Positive] Both parties confirmed v2, start date reached → Owner marks ACTIVE, same UUID/confirmed span; no duplicate acceptance.
- FR80-AC02 [Validation] Version unconfirmed, before start, or tenancy cancelled → 409/422; no activation.
- FR80-AC03 [Race] Move-in races with cancel/end → One legal transition commits.
- FR80-AC04 [Integrity] Date arrives without move-in action → Show awaiting move-in; do not invent actual occupancy.

## FR81 Confirm the exact contract version mutually

Module: `M06-tenancies-contracts`. Priority: P0 Must. Actors: Owner; Tenant. Dependencies: Shared foundation.

Factors: Authorization; immutable versions; concurrent transitions

Tools: Laravel FormRequest + Policies + DB transaction/lockForUpdate + PostgreSQL constraints

Both parties acknowledge the same tenancy_contracts.id and immutable document_sha256. owner_confirmed_at is set only through explicit owner submission; tenant_confirmed_at is set once by the related tenant before deadline on the current pending contract. Tenant may instead set tenant_rejected_at with reason, never both outcomes. The final confirmation promotes confirmed dates and clears the pending pointer/deadline atomically. A new contract version requires fresh confirmation fields.

- FR81-AC01 [Positive] Owner confirmed v2; tenant confirms v2/hash → Both confirmation timestamps; initial tenancy CONFIRMED; confirmed dates set; no pending deadline.
- FR81-AC02 [Validation] Owner confirmed v1 but tenant confirms v2 → No agreement until both independently confirm v2; never mix version decisions.
- FR81-AC03 [Race] Tenant confirms v1 while owner publishes corrected v2 → Same tenancy lock yields one winner; superseded confirmation rejected 409 or correction disallowed after agreement.
- FR81-AC04 [Race] Final confirm competes with deadline worker → Compare server now under lock; at/after deadline no confirmation. Worker cannot undo already confirmed agreement.
- FR81-AC05 [Race] Double-click confirmation → Write-once confirmation fields gives one write-once decision; same replay returns result.
- FR81-AC06 [Integrity] Renewal final confirmation succeeds → Renewal request ACCEPTED and confirmed end extended in same transaction; old documents remain.

## FR82 Decline and correct unconfirmed versions

Module: `M06-tenancies-contracts`. Priority: P0 Must. Actors: Owner; Tenant. Dependencies: Shared foundation.

Factors: Authorization; immutable versions; concurrent transitions

Tools: Laravel FormRequest + Policies + DB transaction/lockForUpdate + PostgreSQL constraints

Tenant can decline exact current version with reason. Initial tenancy becomes AWAITING_REVISION and releases hold; renewal decline keeps confirmed tenancy/range and request PENDING. Owner creates corrected immutable version linked to superseded version, obtains new explicit owner confirmation and new reservation/deadline after rechecking availability. No correction of already mutually confirmed terms in MVP.

- FR82-AC01 [Positive] Tenant spots wrong rent in v1 and declines → Record REJECTED decision/reason; immutable v1 retained; release proposed span only.
- FR82-AC02 [Positive] Owner corrects rent as v2 → New UUID/hash/version_number; new owner confirmation; tenant must confirm v2.
- FR82-AC03 [Race] Correction tries reacquiring dates now reserved elsewhere → 409; no new active hold or false acceptance.
- FR82-AC04 [Validation] Owner attempts correction after mutual confirmation → Reject; amendments to confirmed terms are deferred.
- FR82-AC05 [Race] Tenant confirms while owner corrects → Same pending pointer/revision lock; no mismatched version or retroactive change.

## FR83 Expire temporary confirmation reservations

Module: `M06-tenancies-contracts`. Priority: P0 Must. Actors: Owner; Tenant. Dependencies: Shared foundation.

Factors: Authorization; immutable versions; concurrent transitions

Tools: Laravel Scheduler + Queue Workers + Laravel FormRequest + Policies + DB transaction/lockForUpdate + PostgreSQL constraints

Store confirmation_expires_at using server clock; proposed default48h configurable. Scheduler scans due holds and action paths reap them under locks. No now() in exclusion predicate. Initial expiry sets EXPIRED and clears hold; pending renewal expiry restores confirmed envelope, clears pending pointer and leaves renewal request PENDING for discussion. Accepted enquiry history stays accepted.

- FR83-AC01 [Boundary] Server time reaches deadline exactly → Confirmation disallowed; due hold released transactionally.
- FR83-AC02 [Race] Two workers expire same hold → One state change/audit/outbox event; retries no-op.
- FR83-AC03 [Race] Expiry competes with final confirmation or correction → Lock/recheck exact pending version/deadline; stale worker cannot expire newer hold.
- FR83-AC04 [Failure] Scheduler delayed → Hold remains conservatively blocked until reaped; proposal path can reap due conflicts under locks before retry.
- FR83-AC05 [Integrity] Renewal expires → Original confirmed range/rent unchanged; release extension only.

## FR84 Reserve renewal extension without releasing current occupancy

Module: `M06-tenancies-contracts`. Priority: P0 Must. Actors: Owner; Tenant. Dependencies: Shared foundation.

Factors: Authorization; immutable versions; concurrent transitions

Tools: Laravel FormRequest + Policies + DB transaction/lockForUpdate + PostgreSQL constraints

tenancies stores confirmed_start/end and blocked_start/end as transactional projections. Original unconfirmed proposal has only blocked dates. Confirmed tenancy with pending renewal expands blocked_end while confirmed_end stays unchanged. Decline/cancel/expiry restores blocked span to confirmed span; successful agreement promotes confirmed span.

- FR84-AC01 [Positive] Confirmed ends June30; pending renewal ends Dec31 → Block Jan1-Dec31 envelope while original confirmed ends June30.
- FR84-AC02 [Race] Another tenant requests July1-Dec31 while renewal pending → Exclusion denies overlapping second tenancy.
- FR84-AC03 [Integrity] Renewal rejected/expired → Restore Jan1-June30 only; keep original agreement and status.
- FR84-AC04 [Race] Two future adjacent bookings and renewal compete → Database exclusion decides valid committed schedule; no renewal overrides existing booking.

## FR85 Apply 15-day rejection using actual availability

Module: `M05-rental-requests`. Priority: P0 Must. Actors: Owner; Tenant. Dependencies: Shared foundation.

Factors: Authorization; immutable versions; concurrent transitions

Tools: Laravel Scheduler + database queue worker + shared availability query + Laravel FormRequest + Policies + DB transaction/lockForUpdate + PostgreSQL constraints

Assumption: a PENDING rental request becomes eligible for auto-rejection at created_at+15 days. Reject with NO_AVAILABLE_UNIT only if no READY/marketed/nonarchived eligible unit in the listing property covers the complete desired interval. A preferred unit is a preference, so consider alternatives. Do not reject only because request aged15 days or another request accepted. Exclude admin/publication visibility from physical availability test; hiding is not occupation.

- FR85-AC01 [Boundary] Request age14d23h59m and all units blocked → Keep PENDING; not due.
- FR85-AC02 [Positive] Age>=15d and no qualifying unit for complete requested period → REJECTED with system reason and availability evaluation timestamp; audit/notify once.
- FR85-AC03 [Positive] Age>=15d and alternative unit available although preferred unit blocked → Keep PENDING.
- FR85-AC04 [Positive] Age>=15d and reservation just expired → Reap expired hold under lock; retain request if unit now available.
- FR85-AC05 [Race] Scheduler rejects while owner creates proposal or tenant withdraws → Shared property/unit/request locks; one terminal transition; no rejected accepted request.
- FR85-AC06 [Race] New unit or maintenance release competes with availability scan → Property lock across inventory-changing actions produces a coherent decision.
- FR85-AC07 [Integrity] Listing manually hidden but suitable unit available → Do not infer no availability from publication state; keep request pending.
- FR85-AC08 [Boundary] Desired move-in already in past → Do not silently shift dates; use stored interval, flag for discussion. Stale-date expiry is deferred.

## FR86 Enforce immutable contract terms and write-once confirmations

Module: `M06-tenancies-contracts`. Priority: P0 Must. Actors: Owner; Tenant. Dependencies: Shared foundation.

Factors: Authorization; immutable versions; concurrent transitions

Tools: PostgreSQL FKs/CHECKs/UNIQUE/GiST + deferred constraint triggers + Laravel migrations

Database triggers protect tenancy_contracts terms/document/hash from update/delete while permitting one authorized null-to-value tenant confirmation or rejection update. Existing confirmation timestamps and reasons cannot be overwritten. Composite FKs keep pending/latest/superseded/basis contract references in the same tenancy. Deferred invariant checks enforce exact-contract mutual confirmation, request outcomes and date projections. No separate confirmation table.

- FR86-AC01 [Integrity] Direct SQL changes version rent/document or overwrites a recorded confirmation → Database trigger denies write.
- FR86-AC02 [Integrity] Direct insert points tenancy to another tenancy version → Composite FK rejects.
- FR86-AC03 [Integrity] Direct insert confirmation by unrelated profile or conflicting confirmation/rejection → Party-validation/write-once trigger rejects.
- FR86-AC04 [Integrity] Transaction commits ACCEPTED request without tenancy or confirmed span without matching mutual versions → Deferred constraint trigger rejects inconsistent committed state.
- FR86-AC05 [Race] Two transactions mutate pointers/confirmations → Unique constraints, row locks and commit-time invariant checks preserve one current workflow.

## FR87 Manage consistent standard and custom amenities

Module: `M02-property-units-media`. Priority: P0 Must. Actors: Owner; Guest; System. Dependencies: FR07 FR20 FR21 FR50 FR51 FR55.

Factors: Canonical identifiers; shared/private scope; Unicode; search consistency; concurrent edits

Tools: Next.js forms + Laravel catalog endpoint/config + FormRequest/Policies + PostgreSQL JSONB + revision/audit actions

Owners select standard amenities or add custom text directly in Create/Edit Property and Unit forms. Laravel owns a code-managed catalog with stable keys, localized canonical labels, explicit aliases and allowed PROPERTY/UNIT scopes, exposed through GET /amenities. Both amenity columns use controlled JSONB {schema_version:1,standard:{key:{enabled:boolean,details?:text}},custom:[text]}. Standard search matches canonical key and enabled=true; custom text is descriptive only. Backend allowlist/type/limit validation; NFC+trim+whitespace normalization for custom display, case folding only for local duplicate detection. No automatic global slug creation, semantic synonym inference, owner_label or amenity tables in MVP. Catalog changes later require explicit migrations only if keys/meaning change.

- FR87-AC01 [Positive] Owner selects Wi-Fi and Elevator in property form and AC in unit form → Save canonical wifi/elevator/air_conditioning keys in correct JSONB scope; labels come from code catalog.
- FR87-AC02 [Validation] Payload has unknown standard key, owner_label, wrong scope/type, oversized text or malformed root → Laravel rejects with field errors; no partial change. Validate configured limits, schema_version, enabled boolean and optional details.
- FR87-AC03 [Positive] Owner enters composed/decomposed Vietnamese text with extra whitespace → NFC-normalize, trim and collapse whitespace; retain Vietnamese accents/display spelling. Deduplicate same-resource custom text via case-folded comparison only.
- FR87-AC04 [Integrity] Owner enters EV Charger but catalog has no matching standard option → Save as custom text after explicit Add additional feature action; do not generate a global slug or automatically match an EV-charging filter.
- FR87-AC05 [Positive] Owner searches AC or aircon through explicitly maintained aliases → Suggest catalog air_conditioning; selection stores canonical key. Do not infer synonyms by slugification or automatically select without owner choice.
- FR87-AC06 [Integrity] Shared laundry exists but no washing machine inside requested unit → Show shared feature separately; in-unit washing-machine filter does not match the shared facility. Apply all unit filters to same available unit.
- FR87-AC07 [Integrity] Catalog display label changes or standard enabled=false/absent → Existing stable keys need no row migration; enabled=false/absent does not qualify for filter; absent means not advertised, not verified absent.
- FR87-AC08 [Race] Two tabs edit amenity JSONB from same property/unit revision → Only one expected-revision update commits; other409. No silent JSON document replacement losing selected/custom entries; audit consistent.
- FR87-AC09 [Race] Initial listing admin approval races with amenity edit → Common property content lock/revision rejects stale first approval. Later approved-listing edits need no reapproval; suspension still respected.
- FR87-AC10 [Integrity] Migrate old amenity arrays into new JSONB structure → Preserve recognized canonical codes under standard; map legacy labels only via reviewed explicit aliases, keep unknown descriptions under custom and audit migration. Do not conflate shared/private scope or blindly slugify labels.

## FR88 Save and manage favourite properties

Module: `M04-discovery-favourites`. Priority: P0 Must. Actors: Authenticated user. Dependencies: FR05 FR19 FR21 FR43 FR74 FR78.

Factors: Stable property identity; private data; idempotency; race-safe UI; visibility

Tools: Next.js heart/list UI + TanStack Query + Laravel Policies/REST + PostgreSQL unique pair

Authenticated users save properties through the heart on listing cards/details, remove saved properties and view a private paginated favourites list and count. Persist favourite_properties keyed to user_profiles and properties, not listings or units. Guests are prompted to sign in. Use PUT desired saved state and DELETE desired unsaved state, not a toggle endpoint. Keep unavailable relations as generic placeholders without hidden listing content. Favouriting is not an enquiry, subscription or reservation. User reports this feature has been added; actual implementation completeness must be checked in the local repository.

- FR88-AC01 [Positive] Authenticated user hearts a public property card → Persist favourite_properties for verified user and property; red heart and private badge reflect saved state after reload.
- FR88-AC02 [Authorization] Guest hearts a card or calls private endpoint → UI invites sign-in and returns safely; API401. No anonymous server record; no automatic queued save in MVP.
- FR88-AC03 [Integrity] Same property appears through different unit cards or a new current listing → One saved property identity; do not key favourite by unit_id or listing_id.
- FR88-AC04 [Race] Two independent PUT requests save same user/property → UNIQUE(user_id,property_id) yields one row; first201, existing200; no500 or duplicate count.
- FR88-AC05 [Race] User double-clicks or add/remove responses arrive out of order → Client serializes per-property intended-state writes and refetches after settle; no stale response flips latest intent. Concurrent devices converge to last committed server state.
- FR88-AC06 [Privacy] Different account opens favourites or user switches accounts → Private endpoints derive actor from JWT; no foreign rows or shared-cache personalised state; user-scoped cache cleared on logout/switch.
- FR88-AC07 [Visibility] Saved property listing becomes hidden, suspended or archived → Retain saved relation but return generic unavailable placeholder with no title, photos, address or moderation reason; no private-content bypass. Removal still allowed.
- FR88-AC08 [Positive] User removes favourite twice → DELETE204 idempotently; only own pair removed; heart/badge/list reconcile.
- FR88-AC09 [Failure] Network write fails during optimistic UI update → Restore/refetch actual saved state, show retry feedback; do not report success or create offline queue.
- FR88-AC10 [Boundary] Property has no unit available for chosen dates, but listing remains owner-published and unsuspended → Keep favourite; availability is not a reservation or permanent deletion. Show availability only through authorized/current visibility response. No query holds a unit.
