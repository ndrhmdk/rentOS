<!-- rentos-backlog-v2: RNT-08 -->

# RNT-08: Report listings and let admins investigate, hide or restore them

## Outcome

Authenticated users report listings, and admins investigate and hide harmful content using reasoned, audited decisions.

## Ownership and order

- Phase 2: Listing browsing, rental requests, contracts and reports
- Implementation: **Hien** (frontend + backend + own tests).
- Reviewer: **Khai**.
- Prerequisites for final integration: [RNT-01](RNT-01.md) (GitHub #97), [RNT-04](RNT-04.md) (GitHub #99), [RNT-06](RNT-06.md) (GitHub #101).
- Publication: Draft; delivery: Planned; actual GitHub URL: https://github.com/ndrhmdk/rentOS/issues/103.

A prerequisite gates closure/integration, not all early work: use agreed contracts, factories and local fixtures after the shared schema/auth checkpoint. This is one grouped issue; internal checklists/multiple PRs do not require extra micro-issues.

## Functional requirements

- **FR38 — Report public listing** (P0 Must): Submit reason code and description for suspicious published listing. Save OPEN report synchronously; queue admin alert after commit. Do not use Kafka/RabbitMQ for report creation.
  - Full cases: [FR38 (5 cases)](../../docs/06-acceptance/test-scenarios.md#fr38)
- **FR39 — Investigate reports and suspend listings** (P0 Must): Admin moves OPEN report to REVIEWING then RESOLVED/DISMISSED with required reason. An optional suspension is atomic with resolution and audit; notify reporter with sanitized outcome. Restoration is an explicit admin restriction action, not a new ordinary property/photo review.
  - Full cases: [FR39 (4 cases)](../../docs/06-acceptance/test-scenarios.md#fr39)
- **FR72 — Reporter outcome and rate limits** (P0 Must): Reporter can view own reports and sanitized status/outcome. Admin notes remain private. Enforce configured per-user/IP submission limits and one live report per reporter/listing.
  - Full cases: [FR72 (4 cases)](../../docs/06-acceptance/test-scenarios.md#fr72)
- **FR78 — Suspend and restore listings after reports or inspection** (P0 Must): Admin can suspend published listing directly after inspection or authenticated report with reason, audit and notice. admin_suspended_at/by/reason independent of initial moderation/publication. Owner edits cannot remove suspension. Admin may explicitly restore after checking corrections; no repeated ordinary content approval process.
  - Full cases: [FR78 (5 cases)](../../docs/06-acceptance/test-scenarios.md#fr78)

## Backend deliverables

- [ ] Implement reporter submit/own outcomes, required category/reason, throttling and unique live report; reporter can see only sanitized own outcomes.
- [ ] Implement admin report queue/detail/OPEN-REVIEWING-RESOLVED-DISMISSED actions and separate suspend/restore actions with protected Policies, expected revisions, reason/audit/outbox and public-cache invalidation hooks.
- [ ] Keep suspension independent of first approval and owner publication; no automatic takedown based only on report count. Coordinate state changes through shared locking/actions.

## Frontend deliverables

- [ ] Build report modal and reporter list, admin investigation/filter/detail and reasoned resolve/dismiss/suspend/restore forms.
- [ ] Show status/reason appropriately for reporter versus admin; preserve entered text on failures and handle 403/409/422/429, loading/empty/retry and keyboard focus.

## Acceptance criteria

- [ ] Guest and forged reporter/admin requests fail; duplicate live reports and rate-limit cases have clear feedback.
- [ ] Only admins inspect private investigation detail and perform decisions; reporter sees only their own sanitized outcome.
- [ ] Admin suspension removes public eligibility immediately across routes; owner edits cannot restore visibility.
- [ ] Restore clears the admin restriction explicitly but does not republish owner-hidden content.
- [ ] Competing/stale decisions commit one consistent outcome and audit/outbox; reason is required for rejection/suspension and terminal decisions.
- [ ] No image-status moderation, property-review queue or report-count-only takedown is introduced.

## Tests/evidence owned by this member

- [ ] Unit/component tests for all report/reason forms, pagination, status rendering and failure states.
- [ ] PostgreSQL/API tests for privacy, rate limit, unique live report, stale decisions and owner-edit versus suspension race.
- [ ] API integration tests for report/investigate/suspend/restore and public visibility; manually check reporter/admin forms and status feedback.

## NFRs, boundaries and coordination

NFR-02, NFR-03, NFR-04, NFR-07; T3c, T4a, T3g, T4d
Tri owns both layers and writes all relevant tests; Khai reviews privilege and transaction rules. Do not split admin backend into another member’s implementation issue.

## Definition of done

- [ ] Implement the related frontend, backend and meaningful unit/component/API integration tests under this issue; test PostgreSQL constraints/concurrency on actual PostgreSQL.
- [ ] Private product routes require auth:sanctum, approved abilities and resource Policies. Test actual bearer expiry/revocation/permission behavior where relevant.
- [ ] Update FormRequests/Resources/API docs and explicit frontend response types with contract changes. Future TypeScript generation is documentation only.
- [ ] Apply shared transaction/revision/idempotency/audit rules to the affected actions. Schema changes are new reviewed migrations tested locally; never reset/reseed a hosted environment.
- [ ] Use a short manual checklist for changed screens; automated browser/E2E suites are not required.
- [ ] Attach actual test commands/results and relevant screenshots/provider/query/alert evidence; record personal sprint contribution. A document or fixture screenshot is not proof of implemented behavior.

RNT-08 is a planning key, not a GitHub issue number. Deleted issues are not reused.
