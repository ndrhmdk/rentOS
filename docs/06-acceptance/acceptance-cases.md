# Detailed acceptance cases

324 proposed cases; application execution status remains Not executed.

| Case | FR | Type | Given/when | Expected | Execution |
| --- | --- | --- | --- | --- | --- |
| FR01-AC01 | FR01 | Positive | Register a valid email/password and confirm email | One Auth identity and one profile exist; is_admin=false. | Not executed |
| FR01-AC02 | FR01 | Validation | Invalid email or weak password | Provider errors are mapped to field feedback without creating a privileged profile. | Not executed |
| FR01-AC03 | FR01 | Privacy | Register an already registered email | Handle provider response without promising disclosure of whether the account exists; offer sign-in/reset guidance. | Not executed |
| FR01-AC04 | FR01 | Race | Two signup/profile callbacks run for the same Auth UUID | Unique profile PK/upsert creates one profile; retries do not reset an existing name or admin flag. | Not executed |
| FR02-AC01 | FR02 | Positive | Confirmed user submits correct credentials | Protected dashboard loads the linked profile. | Not executed |
| FR02-AC02 | FR02 | Negative | Wrong password or unconfirmed account | Clear safe error; no protected data returned. | Not executed |
| FR02-AC03 | FR02 | Security | Expired token with valid refresh session | Refresh through Supabase then retry safe reads once; never blindly replay a non-idempotent write. | Not executed |
| FR02-AC04 | FR02 | Negative | Refresh fails or session expires | Clear private client cache and require sign-in; API returns 401. | Not executed |
| FR03-AC01 | FR03 | Positive | User completes allowed Google callback | Provider identity maps to one application profile. | Not executed |
| FR03-AC02 | FR03 | Security | Invalid callback/state or attempted client-created admin flag | Reject flow or ignore forbidden privilege input. | Not executed |
| FR03-AC03 | FR03 | Race | Callback is delivered twice | No duplicate profile or duplicated onboarding notification. | Not executed |
| FR04-AC01 | FR04 | Positive | User logs out | Current browser loses credentials and private cached data; protected navigation requires sign-in. | Not executed |
| FR04-AC02 | FR04 | Security | Another user signs in on same browser | No previous user private data appears. | Not executed |
| FR04-AC03 | FR04 | Boundary | Previously copied unexpired access token is replayed | Do not claim instant token revocation; state expiry-bound behavior unless a server-side revocation check is deliberately added. | Not executed |
| FR05-AC01 | FR05 | Security | Owner B guesses Owner A property/unit/request UUID | Return 403/404 without private data or mutation. | Not executed |
| FR05-AC02 | FR05 | Security | Normal user submits is_admin or another owner_id | Reject restricted input; actor comes from verified identity. | Not executed |
| FR05-AC03 | FR05 | Security | Normal user calls an admin moderation endpoint | 403; no audit outcome or notification is committed. | Not executed |
| FR05-AC04 | FR05 | Security | Browser directly calls Supabase Data API/storage | Business tables are not writable/readable through unintended grants; storage rules restrict private files. Laravel authorization remains enforced even if DB connection bypasses RLS. | Not executed |
| FR06-AC01 | FR06 | Positive | User edits allowed contact fields | Validated values saved; dashboard uses current profile. | Not executed |
| FR06-AC02 | FR06 | Security | Profile PATCH includes admin flag, identity UUID or verification fields | Rejected; privilege fields unchanged. | Not executed |
| FR06-AC03 | FR06 | Race | Two tabs edit the same profile version | Expected version rejects stale write with 409 rather than silently overwriting. | Not executed |
| FR07-AC01 | FR07 | Positive | Owner creates whole apartment | One property and one Entire apartment unit are saved atomically. | Not executed |
| FR07-AC02 | FR07 | Validation | Owner saves incomplete draft | Save permitted; initial listing submission later validates completeness. | Not executed |
| FR07-AC03 | FR07 | Security | Caller supplies owner_id belonging to another user | Ignore/reject forged ownership; derive owner from verified JWT. | Not executed |
| FR07-AC04 | FR07 | Race | Repeated create with same operation UUID | One property/unit result, or 409 if payload changed. | Not executed |
| FR08-AC01 | FR08 | Positive | Owner archives property | Its listing leaves public scope; history remains accessible to participants. | Not executed |
| FR08-AC02 | FR08 | Security | Different owner edits property | 403/404 without changing records. | Not executed |
| FR08-AC03 | FR08 | Race | Archive competes with proposal creation | Common property lock gives one valid serial outcome; proposal cannot commit against archived property. | Not executed |
| FR08-AC04 | FR08 | Integrity | Property has referenced units or agreements | No destructive cascading deletion of business history. | Not executed |
| FR09-AC01 | FR09 | Positive | Owner uploads valid room image | Completed object linked to correct unit; selected image appears without per-photo reapproval. | Not executed |
| FR09-AC02 | FR09 | Validation | Wrong MIME, undecodable file or configured size/count exceeded | Reject; no broken gallery row. Validate bytes, not extension alone. | Not executed |
| FR09-AC03 | FR09 | Security | Upload references another owner property/unit | 403/422; no cross-property association. | Not executed |
| FR09-AC04 | FR09 | Race | Upload retry uses same operation UUID | One media record; partial object failure never creates a public broken record. | Not executed |
| FR10-AC01 | FR10 | Positive | Complete property with several units | Draft references existing records without duplicating images or policies. | Not executed |
| FR10-AC02 | FR10 | Validation | Property is incomplete | Draft may save; submission identifies missing details. | Not executed |
| FR10-AC03 | FR10 | Race | Two creates target same property | Partial unique index permits one current listing. | Not executed |
| FR10-AC04 | FR10 | Security | Owner selects another property photo as cover | Reject invalid scope. | Not executed |
| FR11-AC01 | FR11 | Positive | Approved published listing title/photos/policies edited | Valid changes appear; initial approval remains; audit records before/after. | Not executed |
| FR11-AC02 | FR11 | Race | Admin approves while owner edits a pending submission | Content revision check rejects stale approval; admin reloads latest complete package. | Not executed |
| FR11-AC03 | FR11 | Race | Owner edit races with admin suspension | Suspension wins public eligibility regardless of successful content save. | Not executed |
| FR11-AC04 | FR11 | Validation | Update removes required cover/last unit data | Reject invalid published update or explicitly hide it; no invalid public listing. | Not executed |
| FR12-AC01 | FR12 | Positive | Complete draft submitted | Initial moderation PENDING; no separate property/image approval. | Not executed |
| FR12-AC02 | FR12 | Validation | Missing required address, image, unit or policy values | 422 with field issues; not publicly published. | Not executed |
| FR12-AC03 | FR12 | Race | Linked unit/photo changes during submit | Property content lock/revision ensures submission refers to one consistent package. | Not executed |
| FR12-AC04 | FR12 | Integrity | Already initially approved listing updated | Do not submit to initial moderation again; retain audit/reporting flow. | Not executed |
| FR13-AC01 | FR13 | Positive | Admin opens pending listing | All linked advertised content is visible in one review screen. | Not executed |
| FR13-AC02 | FR13 | Security | Non-admin opens queue | 403; no private review data. | Not executed |
| FR13-AC03 | FR13 | Race | Content changes after admin opens screen | Approval compares both listing and property revisions; stale decision returns 409. | Not executed |
| FR14-AC01 | FR14 | Positive | Admin approves unchanged pending package | APPROVED and approval metadata saved; owner may publish. | Not executed |
| FR14-AC02 | FR14 | Race | Property/unit/media/policy edit precedes decision commit | Stale revision rejected; no approval of unreviewed initial content. | Not executed |
| FR14-AC03 | FR14 | Race | Two admins approve/reject concurrently | Only first legal transition commits; second gets current result/409. | Not executed |
| FR14-AC04 | FR14 | Integrity | Approved listing edited later | Approval retained; no perpetual equality requirement with current revision. | Not executed |
| FR15-AC01 | FR15 | Positive | Admin rejects incomplete/misleading package | REJECTED; owner sees reason; no public publication. | Not executed |
| FR15-AC02 | FR15 | Validation | Reason empty | 422; unchanged. | Not executed |
| FR15-AC03 | FR15 | Race | Approve and reject compete | One decision commits with matching audit/outbox. | Not executed |
| FR16-AC01 | FR16 | Scope | Admin requests changes in MVP | Use FR15 and owner resubmission; no unsupported state in API/UI. | Not executed |
| FR17-AC01 | FR17 | Positive | Initially approved complete listing has available unit | Publication PUBLISHED; public search/details can return it. | Not executed |
| FR17-AC02 | FR17 | Validation | Initial moderation not approved or admin_suspended_at present | Reject publication. | Not executed |
| FR17-AC03 | FR17 | Race | Publish races with suspension or last unit reservation | Recheck locked current state; unavailable listing never shown as available. | Not executed |
| FR17-AC04 | FR17 | Boundary | Future tenancy leaves a nonoverlapping earlier period | Unit may qualify only if entire requested interval fits. | Not executed |
| FR18-AC01 | FR18 | Positive | Owner hides listing | Remove from public search and normal public details; preserve enquiries/contracts. | Not executed |
| FR18-AC02 | FR18 | Security | Owner attempts to clear admin suspension | 403/422. | Not executed |
| FR18-AC03 | FR18 | Race | Publish competes with hide/archive | Revision and shared locks produce consistent final state; stale cache does not expose hidden content. | Not executed |
| FR19-AC01 | FR19 | Positive | Two units, one occupied for requested interval | Return listing with only qualifying unit count/prices. | Not executed |
| FR19-AC02 | FR19 | Boundary | Unit booked July onward and search requests April-June | Return if operational/marketing conditions and minimum term are met. | Not executed |
| FR19-AC03 | FR19 | Integrity | One unit meets price and another meets room filter | Listing qualifies only if the same eligible unit meets combined filters. | Not executed |
| FR19-AC04 | FR19 | Race | Reservation commits between search and proposal | Search is indicative; proposal rechecks database exclusion and returns conflict if needed. | Not executed |
| FR20-AC01 | FR20 | Positive | User filters pets allowed and rent below 5m | Apply inherited effective pet policy and rent to same eligible unit. | Not executed |
| FR20-AC02 | FR20 | Validation | Missing one boundary, reversed dates or period below unit minimum | Return clear validation/empty qualification as applicable. | Not executed |
| FR20-AC03 | FR20 | Boundary | One tenancy ends June30 and next starts July1 | Adjacent intervals do not overlap. | Not executed |
| FR20-AC04 | FR20 | Race | Operational status changes during pagination | Fresh query respects new status; no authoritative reservation inferred. | Not executed |
| FR21-AC01 | FR21 | Positive | Open published listing for date range | Show qualifying unit cards and effective policies; dates visible. | Not executed |
| FR21-AC02 | FR21 | Security | Direct URL targets suspended/hidden/unapproved listing | 404 or unavailable page with no hidden content payload. | Not executed |
| FR21-AC03 | FR21 | Integrity | Current advertised policies differ from signed contract | Label advertising separately; no rewrite of contractual rules. | Not executed |
| FR21-AC04 | FR21 | Race | Listing suspended after cache was populated | Public resource gate checks current visibility before returning sensitive/hidden listing data. | Not executed |
| FR22-AC01 | FR22 | Positive | Map enabled with valid coordinates | Only eligible filtered properties displayed. | Not executed |
| FR22-AC02 | FR22 | Failure | Provider unavailable or coordinates missing | List search remains usable. | Not executed |
| FR23-AC01 | FR23 | Positive | Filters change | Map/list apply identical visibility and unit criteria. | Not executed |
| FR23-AC02 | FR23 | Race | Map requests finish out of order | Stale result discarded. | Not executed |
| FR24-AC01 | FR24 | Positive | Geocode succeeds for current address revision | Save valid latitude/longitude. | Not executed |
| FR24-AC02 | FR24 | Race | Old address job completes after newer edit | Discard stale result using revision. | Not executed |
| FR24-AC03 | FR24 | Failure | Rate limit/provider failure | Address remains saved; retry bounded and logged. | Not executed |
| FR25-AC01 | FR25 | Positive | Tenant submits valid three-month request | PENDING request stored and owner notified with private contact snapshots. | Not executed |
| FR25-AC02 | FR25 | Validation | Missing/invalid phone or dates, own listing, or unit outside property | Reject with field errors; phone syntax validation is not verification. | Not executed |
| FR25-AC03 | FR25 | Security | Other tenant reads contact details | Denied; only requester, owning manager and authorized admin may access. | Not executed |
| FR25-AC04 | FR25 | Race | Same request submitted twice | Idempotency key and one PENDING tenant/listing index yield one thread. | Not executed |
| FR25-AC05 | FR25 | Integrity | Tenant later changes profile phone | Submitted contact snapshot remains unchanged. | Not executed |
| FR26-AC01 | FR26 | Race | Two independent connections submit same tenant/listing | One PENDING row; loser returns existing thread or 409. | Not executed |
| FR26-AC02 | FR26 | Positive | Prior enquiry is terminal and user submits new valid one | New PENDING request permitted. | Not executed |
| FR26-AC03 | FR26 | Integrity | Owner calls tenant or views message | Request remains PENDING; no implied acceptance or allocation. | Not executed |
| FR27-AC01 | FR27 | Positive | Proposal created from pending enquiry | Show ACCEPTED plus Awaiting your contract confirmation. | Not executed |
| FR27-AC02 | FR27 | Integrity | Tenant rejects contract version later | Request acceptance history retained; tenancy shows Awaiting revision. | Not executed |
| FR27-AC03 | FR27 | Security | Another tenant requests dashboard row | 403/404. | Not executed |
| FR27-AC04 | FR27 | Positive | Owner discusses by phone | Request stays PENDING until proposal created. | Not executed |
| FR28-AC01 | FR28 | Positive | Withdraw pending thread | WITHDRAWN; no unit to release. | Not executed |
| FR28-AC02 | FR28 | Race | Withdraw competes with proposal creation | Same request lock; either withdrawn with no tenancy or accepted with tenancy, never both. | Not executed |
| FR28-AC03 | FR28 | Validation | Withdraw accepted thread | 409 with link to tenancy workflow. | Not executed |
| FR29-AC01 | FR29 | Positive | Owner opens pending enquiry | Phone/contact visible; no reservation created by reading/calling. | Not executed |
| FR29-AC02 | FR29 | Security | Different owner accesses inbox row | 403/404. | Not executed |
| FR29-AC03 | FR29 | Integrity | Owner records valid proposal | Request becomes ACCEPTED only within proposal transaction. | Not executed |
| FR29-AC04 | FR29 | Race | Inbox stale after tenant withdraws | Create action rechecks request PENDING and fails safely. | Not executed |
| FR30-AC01 | FR30 | Positive | Owner submits valid proposal with explicit confirmation | One PENDING_CONFIRMATION tenancy; request ACCEPTED; owner confirmation refers to exact version. | Not executed |
| FR30-AC02 | FR30 | Failure | Database overlap constraint or file validation fails | Rollback acceptance, tenancy/version, audit/outbox and reservation. | Not executed |
| FR30-AC03 | FR30 | Race | Reject/withdraw competes with proposal | One valid terminal request transition; no accepted request without tenancy. | Not executed |
| FR30-AC04 | FR30 | Integrity | Other requests concern same or alternative units | Do not immediately reject them; apply 15-day availability policy. | Not executed |
| FR31-AC01 | FR31 | Positive | Owner rejects with reason | REJECTED, history and tenant notice committed. | Not executed |
| FR31-AC02 | FR31 | Validation | Blank reason or terminal request | 422/409; unchanged. | Not executed |
| FR31-AC03 | FR31 | Race | Reject races with Create tenancy proposal | One terminal transition; no duplicate tenancy/outcome. | Not executed |
| FR32-AC01 | FR32 | Positive | Request accepted through proposal | Audit links request, tenancy and version identities. | Not executed |
| FR32-AC02 | FR32 | Integrity | Proposal later rejected/expired | Acceptance event retained; separate tenancy outcome appended. | Not executed |
| FR32-AC03 | FR32 | Failure | Business transaction rolls back | No success audit/outbox survives. | Not executed |
| FR32-AC04 | FR32 | Security | User tries editing/deleting audit event | Denied by API and database privilege/trigger policy. | Not executed |
| FR33-AC01 | FR33 | Race | Two transactions propose overlapping periods for same unit | At most one commits; other gets SQLSTATE 23P01 mapped to 409. | Not executed |
| FR33-AC02 | FR33 | Positive | Same unit proposed for adjacent June30/July1 periods | Both may commit if each otherwise eligible. | Not executed |
| FR33-AC03 | FR33 | Integrity | Direct SQL inserts overlapping blocking rows | Exclusion constraint rejects even if API locks are bypassed. | Not executed |
| FR33-AC04 | FR33 | Race | Renewal expansion overlaps another future tenancy | Expansion fails atomically; current confirmed agreement remains. | Not executed |
| FR33-AC05 | FR33 | Integrity | Old unique one-active-tenancy-per-unit index exists | Remove it; date exclusion replaces lifetime allocation restriction. | Not executed |
| FR34-AC01 | FR34 | Positive | Owner proposes July1-December31 | PENDING_CONFIRMATION reserves only that period; enquiry ACCEPTED; tenant invited to review exact version. | Not executed |
| FR34-AC02 | FR34 | Validation | Tenant mismatch, invalid dates/rent, original period below3calendar months (including month-end/leap-year boundaries), unit unavailable or missing private file | 422/409 and no accepted request. | Not executed |
| FR34-AC03 | FR34 | Race | Two owners tabs propose same request | Unique rental_request_id permits one tenancy; idempotent identical replay returns it. | Not executed |
| FR34-AC04 | FR34 | Race | Unit put in maintenance while proposal submitted | Shared property/unit locks and eligibility recheck prevent ineligible proposal. | Not executed |
| FR34-AC05 | FR34 | Integrity | Move-in date arrives before both confirmations | No automatic activation; reservation expiry still applies. | Not executed |
| FR35-AC01 | FR35 | Positive | Version1 rejected, version2 confirmed | Both visible with distinct document/terms/decisions; current points to version2. | Not executed |
| FR35-AC02 | FR35 | Security | Unrelated user requests document URL | 403/404; short-lived private download only after authorization. | Not executed |
| FR35-AC03 | FR35 | Integrity | Future renewal is mutually confirmed | Show current original rent until renewal start, then renewal rent. | Not executed |
| FR35-AC04 | FR35 | Boundary | Date beyond last confirmed term | Show no confirmed term for date; never substitute proposed rent. | Not executed |
| FR36-AC01 | FR36 | Positive | Eligible tenant submits valid review | PENDING review linked to tenancy/property. | Not executed |
| FR36-AC02 | FR36 | Security | Non-tenant or invalid rating | Reject. | Not executed |
| FR36-AC03 | FR36 | Race | Two submissions for same tenancy | Unique tenancy_id permits one review. | Not executed |
| FR37-AC01 | FR37 | Positive | Approved review exists | Shown with correct aggregate; pending/rejected excluded. | Not executed |
| FR37-AC02 | FR37 | Race | Review hidden while aggregate cached | Invalidate aggregate and details; no fabricated reviews. | Not executed |
| FR38-AC01 | FR38 | Positive | Authenticated user reports visible listing | Report, reporter and listing recorded; not auto-hidden solely from one report. | Not executed |
| FR38-AC02 | FR38 | Security | Guest submits or client forges reporter/status | 401/restricted input rejected. | Not executed |
| FR38-AC03 | FR38 | Validation | Invalid reason/empty required explanation | 422. | Not executed |
| FR38-AC04 | FR38 | Race | Same reporter concurrently reports same listing | At most one OPEN/REVIEWING report; unique constraint returns existing/conflict. | Not executed |
| FR38-AC05 | FR38 | Race | Listing hidden between view and submit | 404/unavailable; existing reports preserved; server rechecks eligibility under property lock. | Not executed |
| FR39-AC01 | FR39 | Positive | Admin resolves valid report and suspends listing | Report outcome, suspension fields, audit and notice intent commit together. | Not executed |
| FR39-AC02 | FR39 | Validation | Final decision lacks reason | 422; unchanged. | Not executed |
| FR39-AC03 | FR39 | Race | Two admins resolve/dismiss report | One terminal outcome; second stale action gets409. | Not executed |
| FR39-AC04 | FR39 | Race | Owner publishes while admin suspends | Shared lock retains suspension; owner cannot clear it. | Not executed |
| FR40-AC01 | FR40 | Positive | Valid search/detail requests | 200 and documented JSON shape. | Not executed |
| FR40-AC02 | FR40 | Negative | Unavailable/nonexistent UUID | 404; invalid filter422. | Not executed |
| FR40-AC03 | FR40 | Security | Public response serialized | No private documents, tokens, admin flags or tenant contacts. | Not executed |
| FR41-AC01 | FR41 | Positive | Owner edits own unit through API | Validated update and audit; increment appropriate revisions. | Not executed |
| FR41-AC02 | FR41 | Security | Caller alters foreign property/unit or protected moderation fields | 403/422. | Not executed |
| FR41-AC03 | FR41 | Race | Stale content revision submitted | 409; no lost update. | Not executed |
| FR42-AC01 | FR42 | Positive | Next.js invokes proposal/confirmation APIs | Documented statuses and UUID links returned; private resources authorized. | Not executed |
| FR42-AC02 | FR42 | Security | User forges actor_role/version owner | Role derived from tenancy parties; 403. | Not executed |
| FR42-AC03 | FR42 | Race | Client sends stale tenancy revision or superseded version UUID | 409 without changing confirmations or blocked span. | Not executed |
| FR42-AC04 | FR42 | Integrity | Equivalent HTTP and worker actions run | Both use same business locks/constraints. | Not executed |
| FR43-AC01 | FR43 | Positive | Valid project access token | Laravel resolves current profile and then runs Policies. | Not executed |
| FR43-AC02 | FR43 | Security | Tampered payload, alg none, wrong issuer/audience/key or expired token | 401, no protected action. | Not executed |
| FR43-AC03 | FR43 | Security | Body contains a different user_id | Never replaces verified sub. | Not executed |
| FR43-AC04 | FR43 | Failure | Unknown kid/key rotation or JWKS refresh failure | Bounded key refresh, fail closed and safe error; no arbitrary token-supplied key URL. | Not executed |
| FR43-AC05 | FR43 | Race | Multiple first API calls bootstrap same confirmed profile | One profile row with no overwritten privilege flags. | Not executed |
| FR44-AC01 | FR44 | Positive | Open generated docs | Auth and action routes include examples for401/403/404/409/422. | Not executed |
| FR44-AC02 | FR44 | Validation | Try documented request flow | Matches implemented field names and state enums. | Not executed |
| FR44-AC03 | FR44 | Security | Published specification | No secrets or live private document URLs. | Not executed |
| FR45-AC01 | FR45 | Positive | Owner creates proposal | Tenant notification links exact version/deadline after commit. | Not executed |
| FR45-AC02 | FR45 | Failure | Delivery service unavailable | Business transaction remains committed; bounded worker retries and observable failure. | Not executed |
| FR45-AC03 | FR45 | Race | Worker repeats event | Recipient inbox event uniqueness prevents duplicate inbox items. | Not executed |
| FR45-AC04 | FR45 | Integrity | Proposal replaced before delayed notice delivered | Notice points to historical version and current UI flags superseded; no stale confirm action allowed. | Not executed |
| FR46-AC01 | FR46 | Positive | Owner edits approved content | Cache invalidated; refreshed content appears without reapproval. | Not executed |
| FR46-AC02 | FR46 | Race | Admin suspends while stale cache exists | Current visibility gate prevents serving suspended listing from normal app routes. | Not executed |
| FR46-AC03 | FR46 | Integrity | Search cache says available but reservation has committed | Proposal fails with conflict; cache never authorizes allocation. | Not executed |
| FR47-AC01 | FR47 | Failure | Simulate storage or exhausted notification failure | Useful structured log with correlation ID; critical alert emitted with deduplication. | Not executed |
| FR47-AC02 | FR47 | Security | Inspect log payload | No passwords, access/refresh tokens, full contracts or signed URLs. | Not executed |
| FR47-AC03 | FR47 | Integrity | Notification provider fails while alerting | Log fallback; do not roll back completed business action. | Not executed |
| FR48-AC01 | FR48 | Positive | Slow query exceeds configured threshold | Record duration/query fingerprint/correlation; deliver alert once per dedupe window. | Not executed |
| FR48-AC02 | FR48 | Security | Public visitor requests Telescope | Unavailable or403; query bindings redact sensitive information. | Not executed |
| FR48-AC03 | FR48 | Failure | Monitor/alert service down | App continues; local diagnostic fallback. | Not executed |
| FR49-AC01 | FR49 | Positive | User follows valid recovery link and chooses valid password | Provider resets password; user can authenticate normally. | Not executed |
| FR49-AC02 | FR49 | Security | Expired/replayed recovery link or disallowed redirect | Rejected by provider/application; no arbitrary account reset. | Not executed |
| FR49-AC03 | FR49 | Privacy | Reset requested for an unknown email | Generic response avoids account enumeration. | Not executed |
| FR50-AC01 | FR50 | Positive | Generate5 studios prefixS start201 | Preview S201–S205; individually edit S205 before save. | Not executed |
| FR50-AC02 | FR50 | Validation | Duplicate normalized labels, invalid prices/areas or batch over configured cap | Reject entire batch with row errors; no partial rows. | Not executed |
| FR50-AC03 | FR50 | Race | Concurrent batches overlap labels | Unique(property_id, normalized label) rejects duplicates; one batch succeeds, other rolls back. | Not executed |
| FR50-AC04 | FR50 | Integrity | WHOLE_SPACE owner invokes Add units | Reject second unit; backend auto-unit remains sole unit. | Not executed |
| FR51-AC01 | FR51 | Positive | Advertised rent changes 4m to 4.5m | Listing shows new price; existing version rent stays unchanged. | Not executed |
| FR51-AC02 | FR51 | Validation | Area/rent <=0 or minimum duration below 3 months | 422; unchanged. | Not executed |
| FR51-AC03 | FR51 | Race | Two tabs update same unit revision | One succeeds; stale tab receives 409. | Not executed |
| FR51-AC04 | FR51 | Integrity | Existing contracts have different policy/rent | Never synchronize live unit values into contract versions. | Not executed |
| FR52-AC01 | FR52 | Positive | READY unit has active tenancy for January-June | Unavailable for overlapping dates; potentially available from July for a valid period. | Not executed |
| FR52-AC02 | FR52 | Positive | Owner marks MAINTENANCE | Exclude from new proposals/public qualifying inventory without mutating existing contracts. | Not executed |
| FR52-AC03 | FR52 | Race | Maintenance races with new proposal | Shared locks yield serialized eligibility decision. | Not executed |
| FR52-AC04 | FR52 | Integrity | Owner unmarkets unit | Existing tenancy/reservation remains; operational and occupancy data unchanged. | Not executed |
| FR55-AC01 | FR55 | Positive | Approved property policy/media changes | Public content updates directly; initial approval retained; audit available to admin. | Not executed |
| FR55-AC02 | FR55 | Race | Initial approval and linked-content edit compete | Common property content lock plus captured revisions prevent stale first approval. | Not executed |
| FR55-AC03 | FR55 | Security | Owner attempts audit deletion or admin flag update | Denied. | Not executed |
| FR55-AC04 | FR55 | Integrity | Photo file changed | Use new unique storage object; retain audit metadata/hash rather than overwriting reviewed bytes. | Not executed |
| FR56-AC01 | FR56 | Positive | Select newly uploaded image on approved published listing | Appears immediately; no review state involved. | Not executed |
| FR56-AC02 | FR56 | Validation | Delete cover while keeping listing published without replacement | 422 or explicit hide choice; never broken required cover. | Not executed |
| FR56-AC03 | FR56 | Race | Reorder/removal and caption save compete | Media revision prevents stale resurrection; audited changes. | Not executed |
| FR56-AC04 | FR56 | Integrity | Deselect photo | Hide from gallery; do not physically delete merely because unselected. | Not executed |
| FR57-AC01 | FR57 | Positive | Owner uploads new photo and saves gallery change | New image immediately eligible; old image unselected/deleted as requested; audit references both UUIDs. | Not executed |
| FR57-AC02 | FR57 | Failure | Upload fails before reference swap | Existing gallery/cover remains valid. | Not executed |
| FR57-AC03 | FR57 | Race | Two updates target same gallery/cover revision | One wins; other reloads; no loss of a referenced object. | Not executed |
| FR57-AC04 | FR57 | Security | Owner overwrites a shared object path | Reject path reuse; issue unique object path. | Not executed |
| FR59-AC01 | FR59 | Positive | Deleted unreferenced media reaches retention cutoff | Delete object and set purged_at idempotently. | Not executed |
| FR59-AC02 | FR59 | Race | Cleanup races with cover selection | Shared lock/recheck prevents deletion of newly referenced live object. | Not executed |
| FR59-AC03 | FR59 | Integrity | Photo only unselected | Retain unless explicitly deleted/eligible orphan; no automatic purge. | Not executed |
| FR59-AC04 | FR59 | Security | Cleanup scans contracts bucket | Do not purge immutable agreements under media policy. | Not executed |
| FR60-AC01 | FR60 | Positive | Owner sets pets NOT_ALLOWED and quiet hours | Store controlled JSONB; display defaults/shared rules. | Not executed |
| FR60-AC02 | FR60 | Validation | Unknown key, invalid enum, oversized rule or executable markup | Reject invalid structure; safely render plain text. | Not executed |
| FR60-AC03 | FR60 | Integrity | Owner changes advertised rule after agreement | Immutable contract policies_snapshot/document unchanged. | Not executed |
| FR60-AC04 | FR60 | Race | Policy edit races with initial listing approval | Stale initial approval rejected; after approval no reapproval. | Not executed |
| FR61-AC01 | FR61 | Positive | Property pets NOT_ALLOWED, unit override ASK_OWNER | Display ASK_OWNER plus shared rules and additional unit rules. | Not executed |
| FR61-AC02 | FR61 | Validation | Unit tries removing shared_rules or injects arbitrary policy key | Reject; unit override schema cannot remove mandatory building rules. | Not executed |
| FR61-AC03 | FR61 | Integrity | Tenant negotiated cat permission | Contract snapshot stores actual negotiated allowance, distinct from current advertising. | Not executed |
| FR61-AC04 | FR61 | Race | Property changes while proposal snapshots terms | Transaction reads coherent agreed values; explicit negotiated form wins, not later live data. | Not executed |
| FR66-AC01 | FR66 | Positive | Initial proposed version declined | Record tenant decline; clear pending pointer/deadline and blocked dates; AWAITING_REVISION. | Not executed |
| FR66-AC02 | FR66 | Positive | Confirmed occupancy ends early | Set ENDED and actual_ended_at; released future dates available if READY/marketed. | Not executed |
| FR66-AC03 | FR66 | Race | Cancel/end races with final confirmation/renewal | One serialized legal outcome; no resurrected tenancy or orphan reservation. | Not executed |
| FR66-AC04 | FR66 | Integrity | Request was ACCEPTED before proposal cancellation | Keep historical ACCEPTED; show linked cancelled/expired tenancy, not a fabricated completed rental. | Not executed |
| FR66-AC05 | FR66 | Boundary | Contract date ends with no physical move-out confirmation | Do not fabricate actual_ended_at; scheduling follows agreed range. Overstay requires an explicit audited operational block/maintenance action. | Not executed |
| FR67-AC01 | FR67 | Positive | Offline signed June20, uploaded June23, starts July1 | Keep signed_on, created_at and start_date distinct. | Not executed |
| FR67-AC02 | FR67 | Validation | Signing date unknown | Allow null; never fabricate it from created_at. | Not executed |
| FR67-AC03 | FR67 | Security | Update/delete terms or replace document bytes after version inserted | Database privileges/triggers reject; new version and new path required. | Not executed |
| FR67-AC04 | FR67 | Race | Two inserts choose same tenancy version_number | Unique (tenancy_id,version_number) rejects duplicate; action retries safely. | Not executed |
| FR68-AC01 | FR68 | Positive | Tenant requests continuation through December | PENDING renewal request; original term/range unchanged. | Not executed |
| FR68-AC02 | FR68 | Race | Concurrent renewal requests | Partial unique index permits one PENDING row. | Not executed |
| FR68-AC03 | FR68 | Validation | Wrong tenant, ended tenancy, invalid date/rent or upcoming confirmed renewal exists | Reject with clear reason. | Not executed |
| FR68-AC04 | FR68 | Integrity | Owner discusses different final rent offline | Keep requested value; final version stores separately negotiated amount. | Not executed |
| FR69-AC01 | FR69 | Positive | Tenant withdraws renewal with reserved extension | CANCELLED; pending pointer cleared; only unconfirmed extension released. | Not executed |
| FR69-AC02 | FR69 | Positive | Owner rejects request | REJECTED with reason, no change to confirmed original contract. | Not executed |
| FR69-AC03 | FR69 | Race | Withdrawal/rejection competes with final mutual confirmation | One terminal result; accepted renewal cannot be silently cancelled as pending. | Not executed |
| FR69-AC04 | FR69 | Integrity | Old notification refers to cancelled renewal version | Confirmation endpoint rejects stale/terminal workflow. | Not executed |
| FR70-AC01 | FR70 | Positive | Original Jan-June; proposed July-Dec at4.2m | New RENEWAL version, temporary July-Dec extension reservation; current rent unchanged. | Not executed |
| FR70-AC02 | FR70 | Validation | Start is not confirmed_end+1day or end not later | Reject; no gaps/overlaps or altered original term. | Not executed |
| FR70-AC03 | FR70 | Race | Future tenancy already reserves overlapping extension | Exclusion constraint fails; request stays PENDING; original agreement remains. | Not executed |
| FR70-AC04 | FR70 | Race | Two owners tabs propose or correct renewal | One pending version under tenancy lock/revision; no parallel effective renewal. | Not executed |
| FR70-AC05 | FR70 | Integrity | Tenant confirms version after owner confirmation | Request ACCEPTED, extension confirmed; future rent activates only on renewal start. | Not executed |
| FR70-AC06 | FR70 | Failure | Mutual confirmation transaction fails | No partial ACCEPTED renewal or confirmed extension. | Not executed |
| FR71-AC01 | FR71 | Positive | Original v1 rejected, corrected v2 mutually confirmed, renewal v3 later confirmed | Keep all three; v2 covers original dates; v3 covers continuation; v1 has no contractual effect. | Not executed |
| FR71-AC02 | FR71 | Integrity | Owner edits advertised terms/policies | Existing version/document/hash/snapshot remains unchanged. | Not executed |
| FR71-AC03 | FR71 | Security | Attempt database UPDATE/DELETE on contract terms or existing confirmation metadata | Denied by trigger/privileges, not API convention alone. | Not executed |
| FR71-AC04 | FR71 | Boundary | No confirmed segment covers queried date | Show no confirmed terms for this date; proposed terms separately labeled. | Not executed |
| FR72-AC01 | FR72 | Positive | Reporter views resolved report | Own status and safe outcome only. | Not executed |
| FR72-AC02 | FR72 | Security | Reporter guesses another report or requests internal notes | 403/404; notes omitted. | Not executed |
| FR72-AC03 | FR72 | Abuse | Configured limit exceeded | 429 without creating report/outbox. | Not executed |
| FR72-AC04 | FR72 | Race | Duplicate report while report is REVIEWING | Return existing live report/conflict; no duplicate. | Not executed |
| FR73-AC01 | FR73 | Positive | User marks own notification read twice | Idempotent read_at; no duplicate rows. | Not executed |
| FR73-AC02 | FR73 | Security | Other user reads/marks it | 403/404. | Not executed |
| FR73-AC03 | FR73 | Race | Same event delivered twice | Unique recipient/event_key yields one notification. | Not executed |
| FR74-AC01 | FR74 | Race | Network retry after successful commit | Existing resource/result returned without duplicate audit or notification intent. | Not executed |
| FR74-AC02 | FR74 | Security | Other actor uses guessed operation UUID | No cross-actor result disclosure. | Not executed |
| FR74-AC03 | FR74 | Race | Two updates with same expected revision | Only one succeeds; losing write409. | Not executed |
| FR74-AC04 | FR74 | Integrity | Concurrency acceptance tests run | Use independent PostgreSQL connections/barrier, not only sequential mocks. | Not executed |
| FR75-AC01 | FR75 | Race | Two proposal/renewal/expiry actions use independent connections | Consistent locks avoid lost changes; deadlocks retried boundedly. | Not executed |
| FR75-AC02 | FR75 | Failure | Action fails after adding version before reservation acceptance | Whole action rolls back; only staged orphan file may remain. | Not executed |
| FR75-AC03 | FR75 | Integrity | Direct SQL attempts invalid pending pointer or confirmation actor | Composite FK/check/constraint trigger rejects invalid committed state. | Not executed |
| FR75-AC04 | FR75 | Security | Frontend anon key attempts app table writes | Denied by grants/RLS; Laravel verified actions enforce domain rules. | Not executed |
| FR76-AC01 | FR76 | Integrity | Review MVP screens/API/schema | No mandatory phone verification or removed review/scheduling workflow. | Not executed |
| FR76-AC02 | FR76 | Integrity | Contract confirmation shown | Describe participant acknowledgement of stored version; do not claim verified legal e-signature. | Not executed |
| FR76-AC03 | FR76 | Positive | Later extension added | Use explicit requirements/migration rather than reviving removed states implicitly. | Not executed |
| FR77-AC01 | FR77 | Positive | One of two units reserved for requested period | Available count2→1 and range from remaining unit. | Not executed |
| FR77-AC02 | FR77 | Boundary | Two tenancies on same unit occupy distinct future intervals | Only intersecting searches exclude it; do not treat any tenancy row as permanent occupation. | Not executed |
| FR77-AC03 | FR77 | Race | Reservation expires concurrently with inventory read | Committed query gives coherent before/after; proposal action rechecks/reaps due holds under lock. | Not executed |
| FR77-AC04 | FR77 | Integrity | Last unit unavailable | Hide from available search for that interval; do not change stored publication_status or auto-republish owner-hidden content. | Not executed |
| FR78-AC01 | FR78 | Positive | Admin sees harmful new image | Suspend whole listing immediately; no media review-status machinery. | Not executed |
| FR78-AC02 | FR78 | Race | Owner edits/republishes while admin suspends | Admin flag remains; all normal public listing routes deny exposure. | Not executed |
| FR78-AC03 | FR78 | Security | Owner clears suspension field | Reject by field allowlist/policy. | Not executed |
| FR78-AC04 | FR78 | Positive | Admin restores after investigation | Clear suspension with audit; public visibility still requires owner PUBLISHED and all eligibility gates. | Not executed |
| FR78-AC05 | FR78 | Integrity | Previously public photo URL was downloaded | Normal public listing hidden; remove offending object if needed. Do not claim ability to recall downloaded copies. | Not executed |
| FR79-AC01 | FR79 | Positive | Approve PENDING review | Visible and included in aggregate. | Not executed |
| FR79-AC02 | FR79 | Race | Review edited during moderation | Expected revision prevents stale approval. | Not executed |
| FR79-AC03 | FR79 | Security | Normal user moderates review | 403. | Not executed |
| FR80-AC01 | FR80 | Positive | Both parties confirmed v2, start date reached | Owner marks ACTIVE, same UUID/confirmed span; no duplicate acceptance. | Not executed |
| FR80-AC02 | FR80 | Validation | Version unconfirmed, before start, or tenancy cancelled | 409/422; no activation. | Not executed |
| FR80-AC03 | FR80 | Race | Move-in races with cancel/end | One legal transition commits. | Not executed |
| FR80-AC04 | FR80 | Integrity | Date arrives without move-in action | Show awaiting move-in; do not invent actual occupancy. | Not executed |
| FR81-AC01 | FR81 | Positive | Owner confirmed v2; tenant confirms v2/hash | Both confirmation timestamps; initial tenancy CONFIRMED; confirmed dates set; no pending deadline. | Not executed |
| FR81-AC02 | FR81 | Validation | Owner confirmed v1 but tenant confirms v2 | No agreement until both independently confirm v2; never mix version decisions. | Not executed |
| FR81-AC03 | FR81 | Race | Tenant confirms v1 while owner publishes corrected v2 | Same tenancy lock yields one winner; superseded confirmation rejected 409 or correction disallowed after agreement. | Not executed |
| FR81-AC04 | FR81 | Race | Final confirm competes with deadline worker | Compare server now under lock; at/after deadline no confirmation. Worker cannot undo already confirmed agreement. | Not executed |
| FR81-AC05 | FR81 | Race | Double-click confirmation | Write-once confirmation fields gives one write-once decision; same replay returns result. | Not executed |
| FR81-AC06 | FR81 | Integrity | Renewal final confirmation succeeds | Renewal request ACCEPTED and confirmed end extended in same transaction; old documents remain. | Not executed |
| FR82-AC01 | FR82 | Positive | Tenant spots wrong rent in v1 and declines | Record REJECTED decision/reason; immutable v1 retained; release proposed span only. | Not executed |
| FR82-AC02 | FR82 | Positive | Owner corrects rent as v2 | New UUID/hash/version_number; new owner confirmation; tenant must confirm v2. | Not executed |
| FR82-AC03 | FR82 | Race | Correction tries reacquiring dates now reserved elsewhere | 409; no new active hold or false acceptance. | Not executed |
| FR82-AC04 | FR82 | Validation | Owner attempts correction after mutual confirmation | Reject; amendments to confirmed terms are deferred. | Not executed |
| FR82-AC05 | FR82 | Race | Tenant confirms while owner corrects | Same pending pointer/revision lock; no mismatched version or retroactive change. | Not executed |
| FR83-AC01 | FR83 | Boundary | Server time reaches deadline exactly | Confirmation disallowed; due hold released transactionally. | Not executed |
| FR83-AC02 | FR83 | Race | Two workers expire same hold | One state change/audit/outbox event; retries no-op. | Not executed |
| FR83-AC03 | FR83 | Race | Expiry competes with final confirmation or correction | Lock/recheck exact pending version/deadline; stale worker cannot expire newer hold. | Not executed |
| FR83-AC04 | FR83 | Failure | Scheduler delayed | Hold remains conservatively blocked until reaped; proposal path can reap due conflicts under locks before retry. | Not executed |
| FR83-AC05 | FR83 | Integrity | Renewal expires | Original confirmed range/rent unchanged; release extension only. | Not executed |
| FR84-AC01 | FR84 | Positive | Confirmed ends June30; pending renewal ends Dec31 | Block Jan1-Dec31 envelope while original confirmed ends June30. | Not executed |
| FR84-AC02 | FR84 | Race | Another tenant requests July1-Dec31 while renewal pending | Exclusion denies overlapping second tenancy. | Not executed |
| FR84-AC03 | FR84 | Integrity | Renewal rejected/expired | Restore Jan1-June30 only; keep original agreement and status. | Not executed |
| FR84-AC04 | FR84 | Race | Two future adjacent bookings and renewal compete | Database exclusion decides valid committed schedule; no renewal overrides existing booking. | Not executed |
| FR85-AC01 | FR85 | Boundary | Request age14d23h59m and all units blocked | Keep PENDING; not due. | Not executed |
| FR85-AC02 | FR85 | Positive | Age>=15d and no qualifying unit for complete requested period | REJECTED with system reason and availability evaluation timestamp; audit/notify once. | Not executed |
| FR85-AC03 | FR85 | Positive | Age>=15d and alternative unit available although preferred unit blocked | Keep PENDING. | Not executed |
| FR85-AC04 | FR85 | Positive | Age>=15d and reservation just expired | Reap expired hold under lock; retain request if unit now available. | Not executed |
| FR85-AC05 | FR85 | Race | Scheduler rejects while owner creates proposal or tenant withdraws | Shared property/unit/request locks; one terminal transition; no rejected accepted request. | Not executed |
| FR85-AC06 | FR85 | Race | New unit or maintenance release competes with availability scan | Property lock across inventory-changing actions produces a coherent decision. | Not executed |
| FR85-AC07 | FR85 | Integrity | Listing manually hidden but suitable unit available | Do not infer no availability from publication state; keep request pending. | Not executed |
| FR85-AC08 | FR85 | Boundary | Desired move-in already in past | Do not silently shift dates; use stored interval, flag for discussion. Stale-date expiry is deferred. | Not executed |
| FR86-AC01 | FR86 | Integrity | Direct SQL changes version rent/document or overwrites a recorded confirmation | Database trigger denies write. | Not executed |
| FR86-AC02 | FR86 | Integrity | Direct insert points tenancy to another tenancy version | Composite FK rejects. | Not executed |
| FR86-AC03 | FR86 | Integrity | Direct insert confirmation by unrelated profile or conflicting confirmation/rejection | Party-validation/write-once trigger rejects. | Not executed |
| FR86-AC04 | FR86 | Integrity | Transaction commits ACCEPTED request without tenancy or confirmed span without matching mutual versions | Deferred constraint trigger rejects inconsistent committed state. | Not executed |
| FR86-AC05 | FR86 | Race | Two transactions mutate pointers/confirmations | Unique constraints, row locks and commit-time invariant checks preserve one current workflow. | Not executed |
| FR87-AC01 | FR87 | Positive | Owner selects Wi-Fi and Elevator in property form and AC in unit form | Save canonical wifi/elevator/air_conditioning keys in correct JSONB scope; labels come from code catalog. | Not executed |
| FR87-AC02 | FR87 | Validation | Payload has unknown standard key, owner_label, wrong scope/type, oversized text or malformed root | Laravel rejects with field errors; no partial change. Validate configured limits, schema_version, enabled boolean and optional details. | Not executed |
| FR87-AC03 | FR87 | Positive | Owner enters composed/decomposed Vietnamese text with extra whitespace | NFC-normalize, trim and collapse whitespace; retain Vietnamese accents/display spelling. Deduplicate same-resource custom text via case-folded comparison only. | Not executed |
| FR87-AC04 | FR87 | Integrity | Owner enters EV Charger but catalog has no matching standard option | Save as custom text after explicit Add additional feature action; do not generate a global slug or automatically match an EV-charging filter. | Not executed |
| FR87-AC05 | FR87 | Positive | Owner searches AC or aircon through explicitly maintained aliases | Suggest catalog air_conditioning; selection stores canonical key. Do not infer synonyms by slugification or automatically select without owner choice. | Not executed |
| FR87-AC06 | FR87 | Integrity | Shared laundry exists but no washing machine inside requested unit | Show shared feature separately; in-unit washing-machine filter does not match the shared facility. Apply all unit filters to same available unit. | Not executed |
| FR87-AC07 | FR87 | Integrity | Catalog display label changes or standard enabled=false/absent | Existing stable keys need no row migration; enabled=false/absent does not qualify for filter; absent means not advertised, not verified absent. | Not executed |
| FR87-AC08 | FR87 | Race | Two tabs edit amenity JSONB from same property/unit revision | Only one expected-revision update commits; other409. No silent JSON document replacement losing selected/custom entries; audit consistent. | Not executed |
| FR87-AC09 | FR87 | Race | Initial listing admin approval races with amenity edit | Common property content lock/revision rejects stale first approval. Later approved-listing edits need no reapproval; suspension still respected. | Not executed |
| FR87-AC10 | FR87 | Integrity | Migrate old amenity arrays into new JSONB structure | Preserve recognized canonical codes under standard; map legacy labels only via reviewed explicit aliases, keep unknown descriptions under custom and audit migration. Do not conflate shared/private scope or blindly slugify labels. | Not executed |
| FR88-AC01 | FR88 | Positive | Authenticated user hearts a public property card | Persist favourite_properties for verified user and property; red heart and private badge reflect saved state after reload. | Not executed |
| FR88-AC02 | FR88 | Authorization | Guest hearts a card or calls private endpoint | UI invites sign-in and returns safely; API401. No anonymous server record; no automatic queued save in MVP. | Not executed |
| FR88-AC03 | FR88 | Integrity | Same property appears through different unit cards or a new current listing | One saved property identity; do not key favourite by unit_id or listing_id. | Not executed |
| FR88-AC04 | FR88 | Race | Two independent PUT requests save same user/property | UNIQUE(user_id,property_id) yields one row; first201, existing200; no500 or duplicate count. | Not executed |
| FR88-AC05 | FR88 | Race | User double-clicks or add/remove responses arrive out of order | Client serializes per-property intended-state writes and refetches after settle; no stale response flips latest intent. Concurrent devices converge to last committed server state. | Not executed |
| FR88-AC06 | FR88 | Privacy | Different account opens favourites or user switches accounts | Private endpoints derive actor from JWT; no foreign rows or shared-cache personalised state; user-scoped cache cleared on logout/switch. | Not executed |
| FR88-AC07 | FR88 | Visibility | Saved property listing becomes hidden, suspended or archived | Retain saved relation but return generic unavailable placeholder with no title, photos, address or moderation reason; no private-content bypass. Removal still allowed. | Not executed |
| FR88-AC08 | FR88 | Positive | User removes favourite twice | DELETE204 idempotently; only own pair removed; heart/badge/list reconcile. | Not executed |
| FR88-AC09 | FR88 | Failure | Network write fails during optimistic UI update | Restore/refetch actual saved state, show retry feedback; do not report success or create offline queue. | Not executed |
| FR88-AC10 | FR88 | Boundary | Property has no unit available for chosen dates, but listing remains owner-published and unsuspended | Keep favourite; availability is not a reservation or permanent deletion. Show availability only through authorized/current visibility response. No query holds a unit. | Not executed |
