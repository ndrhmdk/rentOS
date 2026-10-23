<!-- rentos-backlog-v2: RNT-09 -->

# RNT-09: Request tenancy renewals, add contract versions and release expired reservations

## Outcome

A tenancy continues through new immutable renewal segments; failed/expired negotiations release only the temporary reservation they own.

## Ownership and order

- Phase 3: Renewals, automatic rules, background jobs and monitoring
- Implementation: **Kien** (frontend + backend + own tests).
- Reviewer: **Khai**.
- Prerequisites for final integration: [RNT-05](RNT-05.md) (GitHub #104), [RNT-10](RNT-10.md) (GitHub #106).
- Publication: Draft; delivery: Planned; actual GitHub URL: https://github.com/ndrhmdk/rentOS/issues/107.

A prerequisite gates closure/integration, not all early work: use agreed contracts, factories and local fixtures after the shared schema/auth checkpoint. This is one grouped issue; internal checklists/multiple PRs do not require extra micro-issues.

## Functional requirements

- **FR68 — Submit one pending renewal request** (P0 Must): Tenant on CONFIRMED/ACTIVE tenancy requests a later end date and proposed monthly rent. At most one PENDING renewal request per tenancy. Request alone changes no dates/availability. Allow one upcoming renewal workflow at a time; request proposal values remain immutable.
  - Full cases: [FR68 (4 cases)](../../docs/06-acceptance/test-scenarios.md#fr68)
- **FR69 — Withdraw or reject pending renewal request** (P0 Must): Tenant cancels or owner rejects PENDING renewal request with reason. If a pending renewal contract exists, invalidate its pending pointer and restore blocked envelope to confirmed dates in same transaction; old version/confirmations remain history.
  - Full cases: [FR69 (4 cases)](../../docs/06-acceptance/test-scenarios.md#fr69)
- **FR70 — Propose renewal as new immutable version** (P0 Must): Owner records negotiated consecutive continuation dates/rent/document from PENDING renewal request. Add RENEWAL contract version under same tenancy and owner confirmation, reserve extension via blocked envelope. Renewal request remains PENDING until tenant confirms same version; then mark ACCEPTED atomically with confirmed span expansion.
  - Full cases: [FR70 (6 cases)](../../docs/06-acceptance/test-scenarios.md#fr70)
- **FR83 — Expire temporary confirmation reservations** (P0 Must): Store confirmation_expires_at using server clock; proposed default48h configurable. Scheduler scans due holds and action paths reap them under locks. No now() in exclusion predicate. Initial expiry sets EXPIRED and clears hold; pending renewal expiry restores confirmed envelope, clears pending pointer and leaves renewal request PENDING for discussion. Accepted rental request history stays accepted.
  - Full cases: [FR83 (5 cases)](../../docs/06-acceptance/test-scenarios.md#fr83)
- **FR84 — Reserve renewal extension without releasing current occupancy** (P0 Must): tenancies stores confirmed_start/end and blocked_start/end as transactional projections. Original unconfirmed proposal has only blocked dates. Confirmed tenancy with pending renewal expands blocked_end while confirmed_end stays unchanged. Decline/cancel/expiry restores blocked span to confirmed span; successful agreement promotes confirmed span.
  - Full cases: [FR84 (4 cases)](../../docs/06-acceptance/test-scenarios.md#fr84)

## Backend deliverables

- [ ] Implement one pending renewal request, tenant withdrawal/owner reasoned rejection, owner consecutive RENEWAL proposals and corrections; versions reference the same tenancy and exact basis contract.
- [ ] Reserve only the extension while keeping confirmed occupancy/current agreed terms; accept renewal request only after exact mutual version confirmation. Many unconfirmed corrections may share renewal_request_id.
- [ ] Implement scheduled/action-triggered expiry with exact current-version/deadline lock recheck, configured proposed 48h default and idempotent recovery. Original expired proposals become terminal; renewal expiry restores confirmed span and leaves negotiation pending.

## Frontend deliverables

- [ ] Build tenant renewal modal/list and owner proposal/correction actions within the existing tenancy history; label current agreement versus pending extension.
- [ ] Display deadlines, expired/declined recovery and conflict messages without overwriting current rent or end date.

## Acceptance criteria

- [ ] Renewal negotiation stays PENDING until final mutual acknowledgement; no replacement of the current agreement row occurs.
- [ ] Confirmed/active occupancy remains protected while an extension is awaiting confirmation.
- [ ] A future conflicting booking prevents an extension; adjacent consecutive periods succeed.
- [ ] Expired/rejected/withdrawn renewal work releases only unconfirmed extension dates; agreed occupancy and immutable terms remain.
- [ ] A stale/repeated expiry job cannot expire a newer proposal; confirmation at or after deadline fails and the confirm/expiry race has one result.
- [ ] UI shows correct current/pending history and can recover through a new permitted version without reusing old confirmations.

## Tests/evidence owned by this member

- [ ] Unit/component tests for renewal dates, state transitions, labels and failure recovery.
- [ ] Independent PostgreSQL tests for renewal overlap, projection invariants, correction chains and exact-deadline/expiry races.
- [ ] Worker/scheduler retry integration tests and API tests for renewal request/proposal/confirmation/expiry; manually check owner/tenant status labels.

## NFRs, boundaries and coordination

NFR-02, NFR-03, NFR-04, NFR-06, NFR-07; T6a, T4a, T3g, T4d
No confirmed mid-term amendment or legal e-signature engine. Use the worker/scheduler delivery contract from RNT-10.

## Definition of done

- [ ] Implement the related frontend, backend and meaningful unit/component/API integration tests under this issue; test PostgreSQL constraints/concurrency on actual PostgreSQL.
- [ ] Private product routes require auth:sanctum, approved abilities and resource Policies. Test actual bearer expiry/revocation/permission behavior where relevant.
- [ ] Update FormRequests/Resources/API docs and explicit frontend response types with contract changes. Future TypeScript generation is documentation only.
- [ ] Apply shared transaction/revision/idempotency/audit rules to the affected actions. Schema changes are new reviewed migrations tested locally; never reset/reseed a hosted environment.
- [ ] Use a short manual checklist for changed screens; automated browser/E2E suites are not required.
- [ ] Attach actual test commands/results and relevant screenshots/provider/query/alert evidence; record personal sprint contribution. A document or fixture screenshot is not proof of implemented behavior.

RNT-09 is a planning key, not a GitHub issue number. Deleted issues are not reused.
