# M02 Product requirements

## Purpose
Owner physical inventory, whole-space auto-unit, editable bulk units, image lifecycle and controlled JSONB policies/amenities.

## Actors and permissions
Use actor/resource Policies from each FR below; UI guards never replace backend checks.

## Functional requirements

### FR07 Create property draft without moderation
Priority: P0 Must. Actors: Owner. Dependencies: Shared identity/resource foundation.

Factors: Physical inventory; owner linkage

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + Next.js + React + Tailwind + TanStack Query

Owner creates physical property, address, amenities and controlled policies. WHOLE_SPACE atomically creates one backend unit; SEPARATE_UNITS uses explicit unit creation. Incomplete drafts can be saved. No property approval state or mandatory ownership evidence/phone verification in MVP. Amenities use properties.shared_amenities JSONB with schema_version, allowlisted standard key/object entries and custom text array; select or add custom features directly in the property form (FR87).

Acceptance criteria:

- FR07-AC01 [Positive] Owner creates whole apartment → One property and one Entire apartment unit are saved atomically.
- FR07-AC02 [Validation] Owner saves incomplete draft → Save permitted; initial listing submission later validates completeness.
- FR07-AC03 [Security] Caller supplies owner_id belonging to another user → Ignore/reject forged ownership; derive owner from verified JWT.
- FR07-AC04 [Race] Repeated create with same operation UUID → One property/unit result, or 409 if payload changed.

### FR08 Manage and archive own property
Priority: P0 Must. Actors: Owner. Dependencies: Shared identity/resource foundation.

Factors: History preservation; optimistic concurrency

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + Next.js + React + Tailwind + TanStack Query

Owner edits own property and archives unused resources. Existing tenancy, request, contract and audit references are preserved. Archive prevents new marketing/proposals but does not erase active agreements.

Acceptance criteria:

- FR08-AC01 [Positive] Owner archives property → Its listing leaves public scope; history remains accessible to participants.
- FR08-AC02 [Security] Different owner edits property → 403/404 without changing records.
- FR08-AC03 [Race] Archive competes with proposal creation → Common property lock gives one valid serial outcome; proposal cannot commit against archived property.
- FR08-AC04 [Integrity] Property has referenced units or agreements → No destructive cascading deletion of business history.

### FR09 Upload property and unit photos
Priority: P0 Must. Actors: Owner. Dependencies: Shared identity/resource foundation.

Factors: Validation; private staging; durable file references

Tools: Next.js upload UI + Laravel validation/Policies + Supabase Storage

Upload validated images and create one property_media row with optional same-property unit_id. No review_status, approval, replacement chain or admin photo queue. Upload completes before media becomes selectable. Initial listing review sees selected photos; later additions appear directly when selected on an eligible listing.

Acceptance criteria:

- FR09-AC01 [Positive] Owner uploads valid room image → Completed object linked to correct unit; selected image appears without per-photo reapproval.
- FR09-AC02 [Validation] Wrong MIME, undecodable file or configured size/count exceeded → Reject; no broken gallery row. Validate bytes, not extension alone.
- FR09-AC03 [Security] Upload references another owner property/unit → 403/422; no cross-property association.
- FR09-AC04 [Race] Upload retry uses same operation UUID → One media record; partial object failure never creates a public broken record.

### FR24 Geocode address
Priority: P2 Defer. Actors: System; Owner. Dependencies: FR07.

Factors: External service failure; stale jobs

Tools: Laravel Queue database driver + geocoding API

Optional asynchronous address-to-coordinate conversion after saving address. Manual address remains authoritative when provider fails.

Acceptance criteria:

- FR24-AC01 [Positive] Geocode succeeds for current address revision → Save valid latitude/longitude.
- FR24-AC02 [Race] Old address job completes after newer edit → Discard stale result using revision.
- FR24-AC03 [Failure] Rate limit/provider failure → Address remains saved; retry bounded and logged.

### FR41 Property and unit REST CRUD
Priority: P0 Must. Actors: Owner; Admin where explicitly allowed. Dependencies: Shared identity/resource foundation.

Factors: Authorization parity; archival

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL

Authorize owner-scoped CRUD for properties, units and gallery selection. Route linked-content writes through property content lock/revision/audit action. No property approval, document-evidence review or image-review endpoints.

Acceptance criteria:

- FR41-AC01 [Positive] Owner edits own unit through API → Validated update and audit; increment appropriate revisions.
- FR41-AC02 [Security] Caller alters foreign property/unit or protected moderation fields → 403/422.
- FR41-AC03 [Race] Stale content revision submitted → 409; no lost update.

### FR50 Create and bulk create units
Priority: P0 Must. Actors: Owner. Dependencies: Shared identity/resource foundation.

Factors: Inventory identity; structured input

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints + Next.js + React + Tailwind + TanStack Query

SEPARATE_UNITS allows manual or structured bulk creation: count, prefix, starting number and defaults. Generate editable preview rows in Next.js; save final JSON array transactionally. No LLM/SQL generation. Unit amenity defaults use the same controlled JSONB structure as FR87; each preview row gets its own copied value, not linked mutable defaults.

Acceptance criteria:

- FR50-AC01 [Positive] Generate5 studios prefixS start201 → Preview S201–S205; individually edit S205 before save.
- FR50-AC02 [Validation] Duplicate normalized labels, invalid prices/areas or batch over configured cap → Reject entire batch with row errors; no partial rows.
- FR50-AC03 [Race] Concurrent batches overlap labels → Unique(property_id, normalized label) rejects duplicates; one batch succeeds, other rolls back.
- FR50-AC04 [Integrity] WHOLE_SPACE owner invokes Add units → Reject second unit; backend auto-unit remains sole unit.

### FR51 Edit unit details and advertised terms
Priority: P0 Must. Actors: Owner. Dependencies: Shared identity/resource foundation.

Factors: Unit versus template; stale writes

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints

Owner edits specifications, marketed price/deposit, minimum duration and controlled policy overrides. Valid post-approval edits appear directly with audit; current or proposed contract snapshots are immutable. Unit amenities use units.amenities with allowlisted scope-aware catalog keys and custom text per FR87; no owner-created global amenity key.

Acceptance criteria:

- FR51-AC01 [Positive] Advertised rent changes 4m to 4.5m → Listing shows new price; existing version rent stays unchanged.
- FR51-AC02 [Validation] Area/rent <=0 or minimum duration below 3 months → 422; unchanged.
- FR51-AC03 [Race] Two tabs update same unit revision → One succeeds; stale tab receives 409.
- FR51-AC04 [Integrity] Existing contracts have different policy/rent → Never synchronize live unit values into contract versions.

### FR52 Manage operational status independently of availability
Priority: P0 Must. Actors: Owner. Dependencies: Shared identity/resource foundation.

Factors: Availability derivation; maintenance

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints

units.operational_status is READY, MAINTENANCE or RETIRED. Rental availability is derived for a requested interval from blocking tenancy ranges, not an OCCUPIED flag. is_marketed controls advertisement only. Maintenance stops new proposals but does not cancel agreements.

Acceptance criteria:

- FR52-AC01 [Positive] READY unit has active tenancy for January-June → Unavailable for overlapping dates; potentially available from July for a valid period.
- FR52-AC02 [Positive] Owner marks MAINTENANCE → Exclude from new proposals/public qualifying inventory without mutating existing contracts.
- FR52-AC03 [Race] Maintenance races with new proposal → Shared locks yield serialized eligibility decision.
- FR52-AC04 [Integrity] Owner unmarkets unit → Existing tenancy/reservation remains; operational and occupancy data unchanged.

### FR55 Audit property unit and policy updates
Priority: P0 Must. Actors: Owner; System. Dependencies: Shared identity/resource foundation.

Factors: Source-linked public content; revision propagation

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints

Increment property.content_revision for changes to any initial-review content, including units, selected photos and policies. Before first approval invalidate pending snapshot. After approval retain approval and show changes directly; append safe audit before/after with actor/time. Amenity changes increment property content_revision, retain normal post-approval editing and record before/after audit. Standard label changes in the code catalog do not rewrite saved keys (FR87).

Acceptance criteria:

- FR55-AC01 [Positive] Approved property policy/media changes → Public content updates directly; initial approval retained; audit available to admin.
- FR55-AC02 [Race] Initial approval and linked-content edit compete → Common property content lock plus captured revisions prevent stale first approval.
- FR55-AC03 [Security] Owner attempts audit deletion or admin flag update → Denied.
- FR55-AC04 [Integrity] Photo file changed → Use new unique storage object; retain audit metadata/hash rather than overwriting reviewed bytes.

### FR56 Select reorder and remove gallery images
Priority: P0 Must. Actors: Owner. Dependencies: Shared identity/resource foundation.

Factors: Selection versus approval; cover references

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints + Next.js upload UI + Laravel HTTP client + Supabase private Storage + PostgreSQL

Owner selects media, sets order and cover, or soft-deletes unused photos. Selected nondeleted property/unit media may appear without review. Cover must be selected, same-property shared media; deleting cover requires replacement or explicit hide.

Acceptance criteria:

- FR56-AC01 [Positive] Select newly uploaded image on approved published listing → Appears immediately; no review state involved.
- FR56-AC02 [Validation] Delete cover while keeping listing published without replacement → 422 or explicit hide choice; never broken required cover.
- FR56-AC03 [Race] Reorder/removal and caption save compete → Media revision prevents stale resurrection; audited changes.
- FR56-AC04 [Integrity] Deselect photo → Hide from gallery; do not physically delete merely because unselected.

### FR57 Update photos without a replacement-review workflow
Priority: P0 Must. Actors: Owner. Dependencies: Shared identity/resource foundation.

Factors: Immutable storage; predecessor consistency

Tools: Laravel shared action + DB transaction + lockForUpdate + PostgreSQL constraints + Next.js upload UI + Laravel HTTP client + Supabase private Storage + PostgreSQL

To change photo bytes, upload a new object/media row and switch gallery/cover references in a transaction after upload succeeds; optionally soft-delete old media. No replaces_image_id, image approvals or waiting-choice dialog.

Acceptance criteria:

- FR57-AC01 [Positive] Owner uploads new photo and saves gallery change → New image immediately eligible; old image unselected/deleted as requested; audit references both UUIDs.
- FR57-AC02 [Failure] Upload fails before reference swap → Existing gallery/cover remains valid.
- FR57-AC03 [Race] Two updates target same gallery/cover revision → One wins; other reloads; no loss of a referenced object.
- FR57-AC04 [Security] Owner overwrites a shared object path → Reject path reuse; issue unique object path.

### FR59 Safely clean orphaned and deleted media
Priority: P1 Should. Actors: System. Dependencies: Shared identity/resource foundation.

Factors: Reference integrity; asynchronous storage

Tools: Scheduled Laravel cleanup + Supabase Storage + PostgreSQL

Scheduled cleanup deletes incomplete unreferenced uploads and soft-deleted media after configured retention. Recheck cover/gallery/audit retention references before deleting. Contract documents are excluded from public-photo cleanup.

Acceptance criteria:

- FR59-AC01 [Positive] Deleted unreferenced media reaches retention cutoff → Delete object and set purged_at idempotently.
- FR59-AC02 [Race] Cleanup races with cover selection → Shared lock/recheck prevents deletion of newly referenced live object.
- FR59-AC03 [Integrity] Photo only unselected → Retain unless explicitly deleted/eligible orphan; no automatic purge.
- FR59-AC04 [Security] Cleanup scans contracts bucket → Do not purge immutable agreements under media policy.

### FR60 Manage controlled property JSONB policies
Priority: P0 Must. Actors: Owner. Dependencies: Shared identity/resource foundation.

Factors: Validated schema; reusable defaults

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + PostgreSQL JSONB + Next.js + React + Tailwind + TanStack Query

properties.policies contains schema_version, defaults for predefined pets/smoking, and shared_rules array. Owner uses form fields; backend validates allowlisted keys/enums and limits. No independent policy table in MVP; later migration can preserve stable keys. Approved listings update immediately with audit.

Acceptance criteria:

- FR60-AC01 [Positive] Owner sets pets NOT_ALLOWED and quiet hours → Store controlled JSONB; display defaults/shared rules.
- FR60-AC02 [Validation] Unknown key, invalid enum, oversized rule or executable markup → Reject invalid structure; safely render plain text.
- FR60-AC03 [Integrity] Owner changes advertised rule after agreement → Immutable contract policies_snapshot/document unchanged.
- FR60-AC04 [Race] Policy edit races with initial listing approval → Stale initial approval rejected; after approval no reapproval.

### FR61 Resolve unit policy overrides and additional rules
Priority: P0 Must. Actors: Owner; Guest; Tenant. Dependencies: Shared identity/resource foundation.

Factors: Inheritance; consistency; historical terms

Tools: Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + JSONB resolver + Next.js + React + Tailwind + TanStack Query

units.policy_overrides contains optional predefined enum overrides and additional_rules array. Missing key inherits property default; shared_rules always retained. Preserve resolved actually agreed policies in immutable version snapshot at proposal, editable only through new version.

Acceptance criteria:

- FR61-AC01 [Positive] Property pets NOT_ALLOWED, unit override ASK_OWNER → Display ASK_OWNER plus shared rules and additional unit rules.
- FR61-AC02 [Validation] Unit tries removing shared_rules or injects arbitrary policy key → Reject; unit override schema cannot remove mandatory building rules.
- FR61-AC03 [Integrity] Tenant negotiated cat permission → Contract snapshot stores actual negotiated allowance, distinct from current advertising.
- FR61-AC04 [Race] Property changes while proposal snapshots terms → Transaction reads coherent agreed values; explicit negotiated form wins, not later live data.

### FR87 Manage consistent standard and custom amenities
Priority: P0 Must. Actors: Owner; Guest; System. Dependencies: FR07 FR20 FR21 FR50 FR51 FR55.

Factors: Canonical identifiers; shared/private scope; Unicode; search consistency; concurrent edits

Tools: Next.js forms + Laravel catalog endpoint/config + FormRequest/Policies + PostgreSQL JSONB + revision/audit actions

Owners select standard amenities or add custom text directly in Create/Edit Property and Unit forms. Laravel owns a code-managed catalog with stable keys, localized canonical labels, explicit aliases and allowed PROPERTY/UNIT scopes, exposed through GET /amenities. Both amenity columns use controlled JSONB {schema_version:1,standard:{key:{enabled:boolean,details?:text}},custom:[text]}. Standard search matches canonical key and enabled=true; custom text is descriptive only. Backend allowlist/type/limit validation; NFC+trim+whitespace normalization for custom display, case folding only for local duplicate detection. No automatic global slug creation, semantic synonym inference, owner_label or amenity tables in MVP. Catalog changes later require explicit migrations only if keys/meaning change.

Acceptance criteria:

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

## Data and API boundary
Use the shared data dictionary and versioned API contract; do not invent tables/enums to suit one screen. Every issue identifies exact routes, schema fields, stale-state behavior and cache invalidation that it changes.

## Failure and concurrency
Same-property references, complete published data, upload failures and stale content revisions. Ordinary permission/validation/empty/network states are part of completion, alongside the specific race cases above. PostgreSQL invariants require real database tests.

## Definition of done
UI and API integrated where applicable; unit and integration tests; private/public DTO checks; Scramble and source docs synchronized; audit/outbox only where required; issue-linked PR and reviewer evidence. No implementation is claimed here.

## Out of scope
No property or per-image moderation; no amenity/policy management tables; geocoding remains domain-deferred unless separately selected for course evidence.
