<!-- rentos-backlog-v2: RNT-10 -->

# RNT-10: Run background jobs, delete unreferenced photo files after retention and deliver notifications

## Outcome

Deliver private notifications through Laravel workers and delete stored photo files left by abandoned uploads or owner removals, only after the retention period and a final reference check.

## Ownership and order

- Phase 3.
- Implementation: **Khai** (frontend + backend + own tests).
- Reviewer: **Kien**.
- Prerequisites: [RNT-02](RNT-02.md), [RNT-05](RNT-05.md), [RNT-08](RNT-08.md).
- Publication: Draft; actual GitHub issue URL not recorded.

Dependencies gate final integration; fixtures and agreed contracts allow earlier independent work. This remains one grouped issue with internal checklists and multiple PRs if useful.

## Functional requirements

- **FR45 — Asynchronous domain notifications** (P1 Should): Write notification_outbox atomically with request/moderation/proposal/confirmation/renewal outcomes. Laravel queue workers deliver notifications after commit, with retry/event deduplication. Use database-backed Laravel Queue on Supabase PostgreSQL for MVP; no Kafka/RabbitMQ or viewing reminders.
  - [All 4 acceptance cases](../../docs/06-acceptance/test-scenarios.md#fr45)
- **FR59 — Delete unreferenced photo files after retention** (P1 Should): A scheduled job deletes stored photo files left by abandoned uploads or owner removals only after the configured retention period. Recheck all live property/unit/cover and retained-history references immediately before deletion. Preserve referenced files. Contract documents are excluded from this job.
  - [All 4 acceptance cases](../../docs/06-acceptance/test-scenarios.md#fr59)
- **FR73 — Private notification inbox** (P1 Should): Persist event-keyed in-app messages with safe links; unread/read state per recipient. Email links navigate through authorized application routes, not permanent document URLs.
  - [All 3 acceptance cases](../../docs/06-acceptance/test-scenarios.md#fr73)

## Backend deliverables

- [ ] Configure database-backed Laravel Queue, worker/scheduler startup and deployment/restart guidance; process transactional outbox with stable event/recipient keys, leases and bounded retries/backoff.
- [ ] Implement private notification list/read API and authorized resource links; retain no tokens, private contracts or contact payloads in notification data.
- [ ] Add a scheduled job that finds photo files uploaded but never attached to a property/unit, or removed by an owner. After the documented retention period, lock/recheck references and delete only unreferenced files from Storage. Preserve photos used by any property/unit, listing cover, retained contract/history or other protected record; contract documents are outside this deletion job. Retry failed deletions safely.

## Frontend deliverables

- [ ] Build private notification inbox/badge/read states and deep-link navigation with reauthorization; clear cache on account switching.
- [ ] Show upload failure/retry and photo-removal results on owner screens. Removing a photo from the screen is separate from the scheduled deletion of its unused Storage file; no separate photo-review or deletion dashboard is required.

## Acceptance criteria

- [ ] A running worker delivers a committed event once per recipient; transaction rollback creates no delivered notification.
- [ ] Duplicate/retried/crashed delivery recovers with no duplicate inbox entries; provider failure does not roll back committed business.
- [ ] Only the recipient can list/read notifications or open an authorized target; repeated read is idempotent.
- [ ] After the documented retention period, the job deletes an abandoned/unreferenced photo file; re-running is safe. A file still referenced, or referenced again before deletion, is preserved. Existing cover photos and contract/history records remain accessible.
- [ ] The scheduler and worker actually run in the chosen environment and have documented restart/failed-job recovery.
- [ ] Notification list/read states and owner photo upload/removal states show loading/failure/retry correctly and do not expose another account’s data.

## Tests/evidence owned by this member

- [ ] Unit/component tests for event mapping, payload redaction, inbox/read states and links.
- [ ] Worker/DB integration tests for rollback, duplicate delivery, abandoned leases, retry and media-reference races.
- [ ] Worker/Storage integration tests for an expired abandoned upload, removed unreferenced photo, still-referenced cover, retained-history reference, reattachment versus deletion, missing file and retry. Manually verify one delivered notification.

## NFRs, boundaries and coordination

NFR-02, NFR-03, NFR-04, NFR-05, NFR-06, NFR-07

NFR-02, NFR-03, NFR-04, NFR-05, NFR-06, NFR-07; T6a, T3g, T4d
Do not add Kafka/RabbitMQ or a separate queue platform to satisfy course async requirements. Scheduler-driven domain decisions remain in their owning feature actions.

## Definition of done

- [ ] Implement related frontend, backend and meaningful unit/component/API/PostgreSQL integration tests; all feature owners test their own changes.
- [ ] Private routes use auth:sanctum and current account/resource Policies. Browser writes require CSRF; approved PAT endpoints additionally enforce abilities. Session-only endpoints reject PAT-only callers.
- [ ] Update FormRequests/Resources/OpenAPI and explicit frontend types. Future TypeScript generation remains documentation only.
- [ ] Apply transaction/revision/idempotency/audit rules to domain actions. Never store token secrets in replay records. Use reviewed migrations locally; never reset/reseed a hosted environment.
- [ ] Use a short manual changed-screen checklist; no required automated browser/E2E suite.
- [ ] Attach actual test commands/results and relevant evidence; specifications do not prove implementation.

RNT-10 is a planning key, not a GitHub number. Deleted issues are not reused.
