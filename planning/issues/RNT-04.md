<!-- rentos-backlog-v2: RNT-04 -->

# RNT-04: Admin reviews and approves listings before first publication

## Outcome

Admins inspect the complete first listing package and approve or reject the exact submitted content safely.

## Ownership and order

- Phase 1: Shared setup, accounts, properties and admin approval
- Implementation: **Tri** (frontend + backend + own tests).
- Reviewer: **Khai**.
- Prerequisites for final integration: [RNT-01](RNT-01.md) (GitHub #97), [RNT-03](RNT-03.md) (GitHub #98).
- Publication: Draft; delivery: Planned; actual GitHub URL: https://github.com/ndrhmdk/rentOS/issues/99.

A prerequisite gates closure/integration, not all early work: use agreed contracts, factories and local fixtures after the shared schema/auth checkpoint. This is one grouped issue; internal checklists/multiple PRs do not require extra micro-issues.

## Functional requirements

- **FR13 — Review initial listing packages** (P0 Must): Admin queue displays only initial PENDING listings with property/unit details, selected photos, policies and captured revisions. Show owner and completeness; admin approves or rejects with reason.
  - Full cases: [FR13 (3 cases)](../../docs/06-acceptance/test-scenarios.md#fr13)
- **FR14 — Approve initial listing package** (P0 Must): Admin approves the exact submitted listing/property content revisions. Store reviewer/time and approved_content_revision. Approval permits publication but does not publish automatically.
  - Full cases: [FR14 (4 cases)](../../docs/06-acceptance/test-scenarios.md#fr14)
- **FR15 — Reject initial listing with reason** (P0 Must): Admin rejects initial submission with a required reason. Owner corrects data and resubmits; later content violations use suspension rather than resetting initial approval.
  - Full cases: [FR15 (3 cases)](../../docs/06-acceptance/test-scenarios.md#fr15)

## Backend deliverables

- [ ] Implement protected admin queue/detail and approve/reject endpoints using Hien’s authentication/Policies and Khai’s revision helpers. Return listing, property, units, selected photos and policies as one package.
- [ ] Lock and check expected listing/content revisions; require rejection reason; atomically persist review/audit/outbox outcomes. Seed pending/approved/rejected/stale examples independently of the owner UI.
- [ ] Maintain the Resource/FormRequest/OpenAPI contract and pagination/filter rules. Khai reviews privilege and locking decisions; Tri owns the implementation and tests.

## Frontend deliverables

- [ ] Build admin queue/filter/pagination, package detail, approval confirmation and required-reason rejection form.
- [ ] Cover keyboard access, loading/empty/error/403 states, 409 reload and 422 field feedback; integrate real local endpoints after fixture layout work.

## Acceptance criteria

- [ ] Admin can review a seeded complete package and commit approve or reject with a reason through the UI.
- [ ] A normal user cannot read the queue/detail or invoke the actions by calling the API directly.
- [ ] An owner content edit after submission makes the old admin decision fail with 409 and requires reloading current content.
- [ ] Duplicate or competing decisions cannot create contradictory transitions or duplicated audit/outbox results.
- [ ] No property-review queue, photo-review queue or changes-requested MVP state is introduced.
- [ ] UI sends the loaded revision, disables duplicate submission and handles server validation; fixture-only screenshots do not satisfy completion.

## Tests/evidence owned by this member

- [ ] Unit/component tests for required-reason forms, pagination and reload/error behavior.
- [ ] PostgreSQL/API integration tests for privilege, stale approval, duplicate decisions and transaction rollback.
- [ ] Manually check admin approval/rejection against seeded listing data; automate the action/authorization assertions at API level.

## NFRs, boundaries and coordination

NFR-02, NFR-03, NFR-04, NFR-07; T4a, T3g, T4d
Tri works both frontend and backend with Khai as reviewer. Owner listing submission/publication is RNT-06; Tri can finish against deterministic fixtures before that UI exists.

## Definition of done

- [ ] Implement the related frontend, backend and meaningful unit/component/API integration tests under this issue; test PostgreSQL constraints/concurrency on actual PostgreSQL.
- [ ] Private product routes require auth:sanctum, approved abilities and resource Policies. Test actual bearer expiry/revocation/permission behavior where relevant.
- [ ] Update FormRequests/Resources/API docs and explicit frontend response types with contract changes. Future TypeScript generation is documentation only.
- [ ] Apply shared transaction/revision/idempotency/audit rules to the affected actions. Schema changes are new reviewed migrations tested locally; never reset/reseed a hosted environment.
- [ ] Use a short manual checklist for changed screens; automated browser/E2E suites are not required.
- [ ] Attach actual test commands/results and relevant screenshots/provider/query/alert evidence; record personal sprint contribution. A document or fixture screenshot is not proof of implemented behavior.

RNT-04 is a planning key, not a GitHub issue number. Deleted issues are not reused.
