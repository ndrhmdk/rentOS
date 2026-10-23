<!-- rentos-backlog-v2: RNT-11 -->

# RNT-11: Apply the 15-day request rule, cache public search results and refresh them after listing changes

## Outcome

Aged rental requests are rejected only when no eligible full-period unit exists; cached discovery remains fresh and private.

## Ownership and order

- Phase 3: Renewals, automatic rules, background jobs and monitoring
- Implementation: **Hien** (frontend + backend + own tests).
- Reviewer: **Khai**.
- Prerequisites for final integration: [RNT-06](RNT-06.md) (GitHub #101), [RNT-07](RNT-07.md) (GitHub #102), [RNT-09](RNT-09.md) (GitHub #107).
- Publication: Draft; delivery: Planned; actual GitHub URL: https://github.com/ndrhmdk/rentOS/issues/109.

A prerequisite gates closure/integration, not all early work: use agreed contracts, factories and local fixtures after the shared schema/auth checkpoint. This is one grouped issue; internal checklists/multiple PRs do not require extra micro-issues.

## Functional requirements

- **FR46 — Cache public listing content with fresh visibility checks** (P1 Should): Next.js/TanStack Query may cache public reads. Invalidate on content, media, policy, suspension and allocation changes. Public detail/API must gate current hidden/suspended status; availability remains indicative until transactional proposal creation.
  - Full cases: [FR46 (3 cases)](../../docs/06-acceptance/test-scenarios.md#fr46)
- **FR85 — Apply 15-day rejection using actual availability** (P0 Must): Assumption: a PENDING rental request becomes eligible for auto-rejection at created_at+15 days. Reject with NO_AVAILABLE_UNIT only if no READY/marketed/nonarchived eligible unit in the listing property covers the complete desired interval. A preferred unit is a preference, so consider alternatives. Do not reject only because request aged15 days or another request accepted. Exclude admin/publication visibility from physical availability test; hiding is not occupation.
  - Full cases: [FR85 (8 cases)](../../docs/06-acceptance/test-scenarios.md#fr85)

## Backend deliverables

- [ ] Implement the >=15-day pending-rental request job using current full-interval availability across eligible alternatives, after reaping due holds under the common lock order. Preferred unit is soft; visibility is not proof of occupation.
- [ ] Implement public response caching/revalidation with fresh visibility checks and invalidation after publish/hide/archive/suspend/edit; keep private contacts/favourites/contracts in account-scoped private responses.
- [ ] Measure/eager-load/index listing queries and bound pagination; record local query counts/plans and validate hosted timing separately without inventing latency budgets.

## Frontend deliverables

- [ ] Show auto-rejection reason/status in tenant/owner rental-request lists and refresh availability/counts after relevant mutations.
- [ ] Implement responsive images, lazy noncritical resources, race-safe filter/search responses and account-private heart hydration with failure/retry states.

## Acceptance criteria

- [ ] Age alone or another tenant’s acceptance never rejects a pending rental request if an eligible alternate unit fits the whole desired interval.
- [ ] Partial availability, maintenance and real blocking reservations prevent false matches; hidden listing status alone cannot establish occupation.
- [ ] Ageing versus withdrawal/proposal/expiry races produce one valid audited outcome and retried jobs are idempotent.
- [ ] Hidden/suspended content is not served through a stale shared cache; owner restore does not bypass owner publication.
- [ ] No private heart/contact/contract fields enter a shared listing cache and switching accounts clears private state.
- [ ] On the same seeded dataset, record listing query counts and query plans, remove repeated per-unit lookups, and verify pagination. Repeating the same public search uses its cache; a listing hide/edit invalidates or revalidates it so stale public details are not returned.

## Tests/evidence owned by this member

- [ ] Unit/component tests for boundary ages, availability alternatives, cached/search race handling and UI rejection states.
- [ ] PostgreSQL worker/API tests for full interval, alternate units and independent ageing/proposal/withdrawal races.
- [ ] Cache invalidation/privacy integration tests and recorded query counts/plans on the same seed; manually inspect resource downloads in browser developer tools.

## NFRs, boundaries and coordination

NFR-01, NFR-02, NFR-03, NFR-04, NFR-05, NFR-07; T6b, T6c, T6d, T3g, T4d
15-day interpretation and proposed 48h expiry are explicit product defaults. Do not silently turn either into unconditional rejection or time-dependent exclusion predicates.

## Definition of done

- [ ] Implement the related frontend, backend and meaningful unit/component/API integration tests under this issue; test PostgreSQL constraints/concurrency on actual PostgreSQL.
- [ ] Private product routes require auth:sanctum, approved abilities and resource Policies. Test actual bearer expiry/revocation/permission behavior where relevant.
- [ ] Update FormRequests/Resources/API docs and explicit frontend response types with contract changes. Future TypeScript generation is documentation only.
- [ ] Apply shared transaction/revision/idempotency/audit rules to the affected actions. Schema changes are new reviewed migrations tested locally; never reset/reseed a hosted environment.
- [ ] Use a short manual checklist for changed screens; automated browser/E2E suites are not required.
- [ ] Attach actual test commands/results and relevant screenshots/provider/query/alert evidence; record personal sprint contribution. A document or fixture screenshot is not proof of implemented behavior.

RNT-11 is a planning key, not a GitHub issue number. Deleted issues are not reused.
