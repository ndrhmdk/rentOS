<!-- rentos-backlog-v2: RNT-12 -->

# RNT-12: Monitor errors and slow queries, send alerts and show useful error screens

## Outcome

Developers/admins can diagnose real failures and receive critical, slow-query and server-resource alerts without exposing private data.

## Ownership and order

- Phase 3: Renewals, automatic rules, background jobs and monitoring
- Implementation: **Tri** (frontend + backend + own tests).
- Reviewer: **Khai**.
- Prerequisites for final integration: [RNT-01](RNT-01.md) (GitHub #97), [RNT-03](RNT-03.md) (GitHub #98), [RNT-08](RNT-08.md) (GitHub #103).
- Publication: Draft; delivery: Planned; actual GitHub URL: https://github.com/ndrhmdk/rentOS/issues/105.

A prerequisite gates closure/integration, not all early work: use agreed contracts, factories and local fixtures after the shared schema/auth checkpoint. This is one grouped issue; internal checklists/multiple PRs do not require extra micro-issues.

## Functional requirements

- **FR47 — Structured logs and critical alerts** (P1 Should): Log request/event ID, actor/resource UUIDs, operation and failure duration/context. Alert configured admin/developer on critical storage, transaction or exhausted job failures. Business audit remains separate.
  - Full cases: [FR47 (3 cases)](../../docs/06-acceptance/test-scenarios.md#fr47)
- **FR48 — Development monitoring and slow query alerts** (P1 Should): Use Telescope in development with restricted access. Capture slow query duration and cumulative query time and configure explicit developer alert thresholds; Telescope display alone is not an alert.
  - Full cases: [FR48 (3 cases)](../../docs/06-acceptance/test-scenarios.md#fr48)

## Backend deliverables

- [ ] Use Khai’s RNT-01 Telescope setup to investigate errors, slow queries and failed jobs. Add structured correlation IDs across HTTP/jobs/audit and verify sensitive data remains filtered; do not duplicate package installation/configuration here.
- [ ] Implement critical-error reporting and configurable deduplicated individual slow-query alerts; distinguish these from cumulative request DB-time warnings.
- [ ] Configure CPU/memory/disk/network monitoring and threshold alerts for the actual app/worker host; document managed-provider visibility limits, worker health, fallback logging and actionable recovery guidance.

## Frontend deliverables

- [ ] Implement consistent safe error pages/toasts/field feedback with correlation reference and appropriate retry/re-authentication actions.
- [ ] Integrate authorized diagnostics navigation for admin/developer use; normal users see no diagnostics or internal exception detail.

## Acceptance criteria

- [ ] Normal users cannot access Telescope/diagnostic routes, and diagnostics do not expose protected resource contents.
- [ ] A controlled actual application failure produces friendly UI feedback, correlated structured log and delivered critical alert.
- [ ] A controlled slow query produces a real rate-limited alert; query display alone is not treated as alert evidence.
- [ ] CPU, memory, disk and network monitoring and at least one controlled threshold delivery are demonstrated on the chosen host.
- [ ] Alert delivery failure does not recurse indefinitely or corrupt business state; fallback handling is observable and redacted.
- [ ] Loading/empty/network/validation/session-expiry failures recover through tested UI behavior without exposing stack traces.

## Tests/evidence owned by this member

- [ ] Unit/component tests for error mapping/redaction, threshold/dedup logic and UI recovery.
- [ ] Backend integration tests for restricted diagnostics, exception paths and alert-adapter failure.
- [ ] Record actual critical-error/slow-query/resource alert deliveries and manually check that a displayed request error links to its restricted diagnostic record.

## NFRs, boundaries and coordination

NFR-01, NFR-02, NFR-03, NFR-04, NFR-05, NFR-06, NFR-07; T5b, T5c, T5d
Tri owns correlation/error diagnostics, real critical/slow-query/server-resource alerts and safe error UI, with Khai reviewing. Initial Telescope package/config/migrations/watchers/access/filtering/pruning are RNT-01 (Khai). Telescope query display is diagnostic evidence, not proof that an alert was sent.

## Definition of done

- [ ] Implement the related frontend, backend and meaningful unit/component/API integration tests under this issue; test PostgreSQL constraints/concurrency on actual PostgreSQL.
- [ ] Private product routes require auth:sanctum, approved abilities and resource Policies. Test actual bearer expiry/revocation/permission behavior where relevant.
- [ ] Update FormRequests/Resources/API docs and explicit frontend response types with contract changes. Future TypeScript generation is documentation only.
- [ ] Apply shared transaction/revision/idempotency/audit rules to the affected actions. Schema changes are new reviewed migrations tested locally; never reset/reseed a hosted environment.
- [ ] Use a short manual checklist for changed screens; automated browser/E2E suites are not required.
- [ ] Attach actual test commands/results and relevant screenshots/provider/query/alert evidence; record personal sprint contribution. A document or fixture screenshot is not proof of implemented behavior.

RNT-12 is a planning key, not a GitHub issue number. Deleted issues are not reused.
