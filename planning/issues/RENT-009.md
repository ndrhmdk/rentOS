<!-- rentos-task: RENT-009 -->

## Outcome
listing_reports, audit_logs, notifications, and notification_outbox exist. One live OPEN or REVIEWING report is allowed per reporter and listing. Audit rows are append-only. Outbox event_key is unique so a replay does not insert a second row.

## References
- Requirement IDs: FR32, FR45
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR32-AC01, FR32-AC02, FR32-AC03, FR32-AC04, FR45-AC01, FR45-AC02, FR45-AC03, FR45-AC04
- Module: M09
- Rubric IDs: T2a, T6a
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M09-*` when that directory exists.

## Current repository evidence
None of these tables exist. Dictionary rows for listing_reports, audit_logs, notification_outbox, and notifications are in docs/07-architecture/data-dictionary.md. ADR-004 describes notification processing.

## Scope and non-goals
Migrations and models only. Partial unique index for one live report. audit_logs has no update path in application code. notifications unique (recipient_id, event_key).

Non-goals:
- Do not build the worker.
- Do not build admin screens.
- Do not add Kafka or RabbitMQ.
- Do not store tokens or document bytes in outbox payload.

## Implementation checklist
- [ ] Add the four migrations.
- [ ] Add the partial unique report index.
- [ ] Revoke casual update of audit_logs from the application user guidance in the migration comment.

## API and data contract
listing_reports.reason_code in FRAUD, MISLEADING, HARMFUL, OTHER. notification_outbox.status in PENDING, PROCESSING, DELIVERED, FAILED. audit_logs.actor_id nullable for system actions.

## Acceptance criteria
- [ ] Two OPEN reports for the same reporter and listing fail the unique index.
- [ ] A second outbox row with the same event_key fails.
- [ ] Notifications for two recipients can share an event type with different event keys.
- [ ] Audit table has no updated_at requirement beyond created_at.

## Tests and evidence
Postgres constraint tests for the live-report index and outbox event_key.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #89
- RENT-006 (GitHub #9)
- RENT-007 (GitHub #14)

## Ownership and review
- Planning owner: Member B
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: medium
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M09`, priority `P0`, risk `medium`
- Publication: GitHub issue #17

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

