<!-- rentos-backlog-v2: RNT-07 -->

# RNT-07: Submit/manage rental requests and save favourite properties

## Outcome

A tenant saves properties and submits a pending rental request; owners discuss offline and manage the rental-request list without premature acceptance.

## Ownership and order

- Phase 2: Listing browsing, rental requests, contracts and reports
- Implementation: **Tri** (frontend + backend + own tests).
- Reviewer: **Khai**.
- Prerequisites for final integration: [RNT-01](RNT-01.md) (GitHub #97), [RNT-03](RNT-03.md) (GitHub #98), [RNT-06](RNT-06.md) (GitHub #101).
- Publication: Draft; delivery: Planned; actual GitHub URL: https://github.com/ndrhmdk/rentOS/issues/102.

A prerequisite gates closure/integration, not all early work: use agreed contracts, factories and local fixtures after the shared schema/auth checkpoint. This is one grouped issue; internal checklists/multiple PRs do not require extra micro-issues.

## Functional requirements

- **FR25 — Submit rental request with contact details** (P0 Must): Authenticated tenant submits contact_name, contact_phone, desired_move_in_date, desired_end_date, optional preferred_unit_id and message. Store contact snapshots. Status PENDING throughout offline discussion. No calendar, manual discussion acceptance or unit reservation at rental request creation.
  - Full cases: [FR25 (5 cases)](../../docs/06-acceptance/test-scenarios.md#fr25)
- **FR26 — Prevent duplicate pending rental requests** (P0 Must): At most one PENDING request per tenant/listing; accepted/rejected/withdrawn history remains. Unique partial index is authoritative; retries compare payload.
  - Full cases: [FR26 (3 cases)](../../docs/06-acceptance/test-scenarios.md#fr26)
- **FR27 — Tenant rental request dashboard** (P0 Must): Display private submitted contacts, desired dates, request status/outcome and linked tenancy confirmation state. ACCEPTED means proposal created, not that tenancy contract is mutually confirmed.
  - Full cases: [FR27 (4 cases)](../../docs/06-acceptance/test-scenarios.md#fr27)
- **FR28 — Withdraw pending rental request** (P0 Must): Tenant may withdraw own PENDING request with audit and owner notification. Accepted requests are handled through tenancy proposal actions instead.
  - Full cases: [FR28 (3 cases)](../../docs/06-acceptance/test-scenarios.md#fr28)
- **FR29 — Owner rental request inbox** (P0 Must): Owner sees own property requests and private tenant contact snapshots, dates and preferred unit. Discuss offline while PENDING. Actions are Reject and Create tenancy proposal; no viewing/calendar or stand-alone Accept.
  - Full cases: [FR29 (4 cases)](../../docs/06-acceptance/test-scenarios.md#fr29)
- **FR31 — Reject pending rental request** (P0 Must): Owner can reject PENDING rental request with reason; no viewing cancellation or automatic rejection merely because another rental request was accepted. System auto-rejection uses FR85.
  - Full cases: [FR31 (3 cases)](../../docs/06-acceptance/test-scenarios.md#fr31)
- **FR32 — Audit request and tenancy outcomes** (P0 Must): Append-only audit events record request status, proposal/confirmation/version changes and automatic decisions with actor/system identity, safe before/after, reason and correlation UUID.
  - Full cases: [FR32 (4 cases)](../../docs/06-acceptance/test-scenarios.md#fr32)
- **FR88 — Save and manage favourite properties** (P0 Must): Private authenticated property-level persistent saves, idempotent intended-state writes, safe hidden placeholders and private list/count. Saving creates no rental request/reservation.
  - Full cases: [FR88 (10 cases)](../../docs/06-acceptance/test-scenarios.md#fr88)

## Backend deliverables

- [ ] Implement authenticated rental request submit/own list/withdraw and owner rental-request list/reject with contact snapshots, complete desired start/end, same-property preferred-unit scope, one pending tenant/listing request, reasons and audit.
- [ ] Keep requests PENDING throughout offline discussion; only RNT-05 proposal transaction marks ACCEPTED. Rental requests and favourites allocate no properties and units.
- [ ] Implement private favourite_properties PUT/DELETE/list/count/ids with actor from the Sanctum-authenticated profile, unique user/property pair, first-save 201/repeat 200 and repeated DELETE 204; unavailable targets return safe generic placeholders and remain removable.

## Frontend deliverables

- [ ] Build rental request form, tenant request dashboard, owner rental-request list and reject/withdraw controls with reason/conflict feedback.
- [ ] Build persistent property hearts, private badge and paginated saved list; guest login prompt without queued save; serialize per-property intended-state writes and reconcile failures/account switches.

## Acceptance criteria

- [ ] A valid rental request stores private contact snapshots and full interval, remains PENDING and does not reserve the preferred unit.
- [ ] Duplicate submit, stale withdrawal/reject and foreign-user contact access are rejected consistently; owner discussion never requires clicking Accept.
- [ ] Heart state survives reload, one user/property relation exists under repeated/concurrent saves and intended DELETE is idempotent even when the target becomes hidden.
- [ ] Hidden/suspended/archived saved targets disclose no title/photo/address/moderation reason; date unavailability alone does not delete the save.
- [ ] Out-of-order/network responses and account switches cannot show stale hearts or another user’s private list.
- [ ] Request status and private count/list reconcile with server state; badge counts stored relations including placeholders as a documented proposed default.

## Tests/evidence owned by this member

- [ ] Unit/component tests for rental request validation, heart intent serialization, error recovery and guest/account-switch behavior.
- [ ] PostgreSQL/API tests for duplicate pending rental requests, ownership, reject/withdraw races, unique favourite saves and hidden-content privacy.
- [ ] API integration tests for saved property, rental request and owner request-list actions; manually check changed screens and confirm there is no standalone Accept action or reservation on request submission.

## NFRs, boundaries and coordination

NFR-02, NFR-03, NFR-04, NFR-07; T3c, T3e, T4a, T3g, T4d
Audit already-implemented favourites code and retain compatible work. Rebuild tasks from requirements rather than recreating deleted issue references.

## Definition of done

- [ ] Implement the related frontend, backend and meaningful unit/component/API integration tests under this issue; test PostgreSQL constraints/concurrency on actual PostgreSQL.
- [ ] Private product routes require auth:sanctum, approved abilities and resource Policies. Test actual bearer expiry/revocation/permission behavior where relevant.
- [ ] Update FormRequests/Resources/API docs and explicit frontend response types with contract changes. Future TypeScript generation is documentation only.
- [ ] Apply shared transaction/revision/idempotency/audit rules to the affected actions. Schema changes are new reviewed migrations tested locally; never reset/reseed a hosted environment.
- [ ] Use a short manual checklist for changed screens; automated browser/E2E suites are not required.
- [ ] Attach actual test commands/results and relevant screenshots/provider/query/alert evidence; record personal sprint contribution. A document or fixture screenshot is not proof of implemented behavior.

RNT-07 is a planning key, not a GitHub issue number. Deleted issues are not reused.
