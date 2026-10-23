<!-- rentos-backlog-v2: RNT-13 -->

# RNT-13: Verify contract permissions, conflicting updates and deployment failure recovery

## Outcome

Agreement flows survive hostile/stale/concurrent input, and reviewed merges migrate/deploy the same tested revision safely.

## Ownership and order

- Phase 4: Final testing, fixes and submission
- Implementation: **Khai** (frontend + backend + own tests).
- Reviewer: **Kien**.
- Prerequisites for final integration: [RNT-09](RNT-09.md) (GitHub #107), [RNT-10](RNT-10.md) (GitHub #106), [RNT-12](RNT-12.md) (GitHub #105).
- Publication: Draft; delivery: Planned; actual GitHub URL: https://github.com/ndrhmdk/rentOS/issues/110.

A prerequisite gates closure/integration, not all early work: use agreed contracts, factories and local fixtures after the shared schema/auth checkpoint. This is one grouped issue; internal checklists/multiple PRs do not require extra micro-issues.

## Functional requirements

- **FR05 — Enforce Sanctum abilities and resource authorization** (P0 Must): Private product APIs require auth:sanctum, required token abilities and resource Policies. Use trusted current user_profiles.is_admin for admin actions and ownership/participant relationships for resources. An ability never grants access to another user’s records.
  - Full cases: [FR05 (4 cases)](../../docs/06-acceptance/test-scenarios.md#fr05)
- **FR33 — Enforce nonoverlapping unit rental periods** (P0 Must): PostgreSQL GiST exclusion constraint on tenancies(unit_id, daterange(blocked_start_date, blocked_end_date+1, [))) for PENDING_CONFIRMATION/CONFIRMED/ACTIVE. Different nonoverlapping future tenancies on one unit are permitted. Blocking envelope includes confirmed span plus any proposed renewal extension.
  - Full cases: [FR33 (5 cases)](../../docs/06-acceptance/test-scenarios.md#fr33)
- **FR43 — Verify Supabase identity and secure APIs with Sanctum** (P0 Must): Verify the Supabase JWT only at the protected identity-to-token issuance boundary. Issue hashed, expiring Laravel Sanctum tokens linked to the same UUID profile; enforce auth:sanctum, server-approved token abilities, rotation and revocation on private product APIs. Supabase JWT alone is not accepted there. No second password store.
  - Full cases: [FR43 (8 cases)](../../docs/06-acceptance/test-scenarios.md#fr43)
- **FR74 — Idempotent writes and stale revisions** (P0 Must): Use client_operation_id UUID on creates and revision checks on mutable resources. Scope operation key to actor/parent. Reusing key with different canonical payload returns409; terminal action replay never repeats side effects.
  - Full cases: [FR74 (4 cases)](../../docs/06-acceptance/test-scenarios.md#fr74)
- **FR75 — Transactional locking audit and consistency** (P0 Must): All writes use shared Laravel actions, fixed lock order property then units sorted by UUID then rental request/tenancy/renewal rows. Persist domain/audit/outbox/idempotency in same transaction. Direct clients cannot write application tables. Cross-table invariants use composite FKs and deferred constraint triggers as specified.
  - Full cases: [FR75 (4 cases)](../../docs/06-acceptance/test-scenarios.md#fr75)
- **FR81 — Confirm the exact contract version mutually** (P0 Must): Both parties acknowledge the same tenancy_contracts.id and immutable document_sha256. owner_confirmed_at is set only through explicit owner submission; tenant_confirmed_at is set once by the related tenant before deadline on the current pending contract. Tenant may instead set tenant_rejected_at with reason, never both outcomes. The final confirmation promotes confirmed dates and clears the pending pointer/deadline atomically. A new contract version requires fresh confirmation fields.
  - Full cases: [FR81 (6 cases)](../../docs/06-acceptance/test-scenarios.md#fr81)
- **FR84 — Reserve renewal extension without releasing current occupancy** (P0 Must): tenancies stores confirmed_start/end and blocked_start/end as transactional projections. Original unconfirmed proposal has only blocked dates. Confirmed tenancy with pending renewal expands blocked_end while confirmed_end stays unchanged. Decline/cancel/expiry restores blocked span to confirmed span; successful agreement promotes confirmed span.
  - Full cases: [FR84 (4 cases)](../../docs/06-acceptance/test-scenarios.md#fr84)
- **FR86 — Enforce immutable contract terms and write-once confirmations** (P0 Must): Database triggers protect tenancy_contracts terms/document/hash from update/delete while permitting one authorized null-to-value tenant confirmation or rejection update. Existing confirmation timestamps and reasons cannot be overwritten. Composite FKs keep pending/latest/superseded/basis contract references in the same tenancy. Deferred invariant checks enforce exact-contract mutual confirmation, request outcomes and date projections. No separate confirmation table.
  - Full cases: [FR86 (5 cases)](../../docs/06-acceptance/test-scenarios.md#fr86)

## Backend deliverables

- [ ] Close observed security/integrity defects across original and renewal APIs using real participant, hash, lock, revision and replay rules; review private storage/download grants and public Data API exposure.
- [ ] Verify Khai’s RNT-01 CI/CD to test schema rebuild plus upgrade of the prior state; merged deployment uses environment secrets, direct DB connectivity preflight, one database concurrency group with cancel-in-progress=false and migrate --force before matching app/worker deployment.
- [ ] Document compatible additive/backfill/remove releases, failed-migration recovery and backup/restore rehearsal in a disposable environment; do not assume batch-wide rollback or auto-run destructive resets.
- [ ] Verify private routes use auth:sanctum with required abilities and Policies; test actual bearer token expiry/revocation and rejection of the wrong token type. Do not accept Supabase JWTs directly on private product routes or treat JWT verification as replacing Sanctum.

## Frontend deliverables

- [ ] Check account/session recovery, stale contract forms and participant-only contract links; fix confirmed errors with frontend component and API regression tests.
- [ ] Ensure old contract/history views and forms recover safely when a deployed API/schema changes compatibly.

## Acceptance criteria

- [ ] Targeted hostile, stale and concurrent contract tests pass without permitting hidden writes or mismatched acknowledgement.
- [ ] A PR test or migration failure prevents hosted deployment; production credentials are unavailable to PR test code.
- [ ] Two hosted deployment attempts cannot migrate concurrently or cancel a migration in progress.
- [ ] Hosted deployment runs only reviewed migrations and matching code; no migrate:fresh/reset/demo reseed occurs.
- [ ] A fresh setup and previous-schema upgrade both pass; backup/restore and migration failure recovery are documented with actual rehearsal evidence.
- [ ] Security fixes include backend and frontend regression tests and updated API documentation and response types.

## Tests/evidence owned by this member

- [ ] Feature unit tests for any changed authorization/state logic plus frontend recovery components.
- [ ] Real PostgreSQL concurrency and upgrade tests, API negative tests and manual checks of owner/tenant contract screens.
- [ ] CI/deployment failure rehearsal, connection preflight and disposable restore evidence.

## NFRs, boundaries and coordination

NFR-02, NFR-03, NFR-06, NFR-07; T1d, T2a, T3g, T4d, T4b
Do not postpone RNT-01/05/09 tests to this phase. This issue fixes integrated-release defects and proves the release process, rather than collecting untested code.

## Definition of done

- [ ] Implement the related frontend, backend and meaningful unit/component/API integration tests under this issue; test PostgreSQL constraints/concurrency on actual PostgreSQL.
- [ ] Private product routes require auth:sanctum, approved abilities and resource Policies. Test actual bearer expiry/revocation/permission behavior where relevant.
- [ ] Update FormRequests/Resources/API docs and explicit frontend response types with contract changes. Future TypeScript generation is documentation only.
- [ ] Apply shared transaction/revision/idempotency/audit rules to the affected actions. Schema changes are new reviewed migrations tested locally; never reset/reseed a hosted environment.
- [ ] Use a short manual checklist for changed screens; automated browser/E2E suites are not required.
- [ ] Attach actual test commands/results and relevant screenshots/provider/query/alert evidence; record personal sprint contribution. A document or fixture screenshot is not proof of implemented behavior.

RNT-13 is a planning key, not a GitHub issue number. Deleted issues are not reused.
