<!-- rentos-backlog-v2: RNT-16 -->

# RNT-16: Verify admin approval/report permissions and prepare reproducible setup/demo evidence

## Outcome

Admin workflows are secure and accessible, and the marker/team can reproduce the application and inspect genuine implementation evidence.

## Ownership and order

- Phase 4: Final testing, fixes and submission
- Implementation: **Tri** (frontend + backend + own tests).
- Reviewer: **Hien**.
- Prerequisites for final integration: [RNT-04](RNT-04.md) (GitHub #99), [RNT-08](RNT-08.md) (GitHub #103), [RNT-12](RNT-12.md) (GitHub #105), [RNT-13](RNT-13.md) (GitHub #110), [RNT-14](RNT-14.md) (GitHub #108), [RNT-15](RNT-15.md) (GitHub #112).
- Publication: Draft; delivery: Planned; actual GitHub URL: https://github.com/ndrhmdk/rentOS/issues/111.

A prerequisite gates closure/integration, not all early work: use agreed contracts, factories and local fixtures after the shared schema/auth checkpoint. This is one grouped issue; internal checklists/multiple PRs do not require extra micro-issues.

## Functional requirements

- **FR13 — Review initial listing packages** (P0 Must): Admin queue displays only initial PENDING listings with property/unit details, selected photos, policies and captured revisions. Show owner and completeness; admin approves or rejects with reason.
  - Full cases: [FR13 (3 cases)](../../docs/06-acceptance/test-scenarios.md#fr13)
- **FR14 — Approve initial listing package** (P0 Must): Admin approves the exact submitted listing/property content revisions. Store reviewer/time and approved_content_revision. Approval permits publication but does not publish automatically.
  - Full cases: [FR14 (4 cases)](../../docs/06-acceptance/test-scenarios.md#fr14)
- **FR15 — Reject initial listing with reason** (P0 Must): Admin rejects initial submission with a required reason. Owner corrects data and resubmits; later content violations use suspension rather than resetting initial approval.
  - Full cases: [FR15 (3 cases)](../../docs/06-acceptance/test-scenarios.md#fr15)
- **FR38 — Report public listing** (P0 Must): Submit reason code and description for suspicious published listing. Save OPEN report synchronously; queue admin alert after commit. Do not use Kafka/RabbitMQ for report creation.
  - Full cases: [FR38 (5 cases)](../../docs/06-acceptance/test-scenarios.md#fr38)
- **FR39 — Investigate reports and suspend listings** (P0 Must): Admin moves OPEN report to REVIEWING then RESOLVED/DISMISSED with required reason. An optional suspension is atomic with resolution and audit; notify reporter with sanitized outcome. Restoration is an explicit admin restriction action, not a new ordinary property/photo review.
  - Full cases: [FR39 (4 cases)](../../docs/06-acceptance/test-scenarios.md#fr39)
- **FR47 — Structured logs and critical alerts** (P1 Should): Log request/event ID, actor/resource UUIDs, operation and failure duration/context. Alert configured admin/developer on critical storage, transaction or exhausted job failures. Business audit remains separate.
  - Full cases: [FR47 (3 cases)](../../docs/06-acceptance/test-scenarios.md#fr47)
- **FR48 — Development monitoring and slow query alerts** (P1 Should): Use Telescope in development with restricted access. Capture slow query duration and cumulative query time and configure explicit developer alert thresholds; Telescope display alone is not an alert.
  - Full cases: [FR48 (3 cases)](../../docs/06-acceptance/test-scenarios.md#fr48)
- **FR72 — Reporter outcome and rate limits** (P0 Must): Reporter can view own reports and sanitized status/outcome. Admin notes remain private. Enforce configured per-user/IP submission limits and one live report per reporter/listing.
  - Full cases: [FR72 (4 cases)](../../docs/06-acceptance/test-scenarios.md#fr72)
- **FR78 — Suspend and restore listings after reports or inspection** (P0 Must): Admin can suspend published listing directly after inspection or authenticated report with reason, audit and notice. admin_suspended_at/by/reason independent of initial moderation/publication. Owner edits cannot remove suspension. Admin may explicitly restore after checking corrections; no repeated ordinary content approval process.
  - Full cases: [FR78 (5 cases)](../../docs/06-acceptance/test-scenarios.md#fr78)

## Backend deliverables

- [ ] Fix discovered moderation/report validation, authorization, stale-decision and privacy defects; keep reviewed transitions/audit consistent with owner/public eligibility.
- [ ] Finish root README covering actual tools/setup, env names, schema/migration/seed/worker/scheduler, ERD, API types/docs, tests, monitoring and lecturer evidence.
- [ ] Collect evidence links from all four members and verify each member’s own five sprint self-reports. Document deadline/penalty policy rather than creating fake contribution records.

## Frontend deliverables

- [ ] Repair admin queue/detail/forms across keyboard/mobile and server failure states, integrating actual endpoints rather than fixture-only demos.
- [ ] Capture actual sanitized screens and assemble <=10-minute >=720p MP4 demo with each member’s real feature/test contributions and accessible public/unlisted link.

## Acceptance criteria

- [ ] Admin UI and direct API calls pass normal-user denial, stale revision, reason validation and reporter privacy regressions.
- [ ] Keyboard focus/labels, loading/empty/error/retry states and pagination work on implemented review/report screens.
- [ ] A clean-machine setup rehearsal follows the README successfully, with resolving ERD/docs/type/test links and no secret values.
- [ ] The video meets duration/quality/access rules and shows implemented workflows plus real tests/alerts/performance evidence.
- [ ] Each of four members provides five truthful sprint reports; D checks links/completeness but does not write or claim others’ contributions.
- [ ] Submission and known limitations match actual code/test/evidence state, including any unresolved printed-rubric substitutions.

## Tests/evidence owned by this member

- [ ] Focused unit/component tests for final admin/accessibility defects.
- [ ] Backend moderation/privacy integration and real admin-to-public visibility API/component regression tests and manual UI checks.
- [ ] Clean setup rehearsal, link/access verification and actual demo/individual report checklist.

## NFRs, boundaries and coordination

NFR-02, NFR-03, NFR-04, NFR-05, NFR-06, NFR-07; T1a, T3g, T4d
Admin backend remains D-owned with Khai reviewing risky changes. Evidence work does not replace backend/frontend implementation or its tests.

## Definition of done

- [ ] Implement the related frontend, backend and meaningful unit/component/API integration tests under this issue; test PostgreSQL constraints/concurrency on actual PostgreSQL.
- [ ] Private product routes require auth:sanctum, approved abilities and resource Policies. Test actual bearer expiry/revocation/permission behavior where relevant.
- [ ] Update FormRequests/Resources/API docs and explicit frontend response types with contract changes. Future TypeScript generation is documentation only.
- [ ] Apply shared transaction/revision/idempotency/audit rules to the affected actions. Schema changes are new reviewed migrations tested locally; never reset/reseed a hosted environment.
- [ ] Use a short manual checklist for changed screens; automated browser/E2E suites are not required.
- [ ] Attach actual test commands/results and relevant screenshots/provider/query/alert evidence; record personal sprint contribution. A document or fixture screenshot is not proof of implemented behavior.

RNT-16 is a planning key, not a GitHub issue number. Deleted issues are not reused.
