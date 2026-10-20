<!-- rentos-task: RENT-068 -->

## Outcome
Proposal, rejection, confirmation, report, and suspension actions that already commit an outbox row are delivered by a worker into the notifications table. A crash after the business commit retries delivery. A duplicate event_key does not create a second inbox row. Delivery failure does not roll back the tenancy or report.

## References
- Requirement IDs: FR32, FR45
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR32-AC01, FR32-AC02, FR32-AC03, FR32-AC04, FR45-AC01, FR45-AC02, FR45-AC03, FR45-AC04
- Module: M09
- Rubric IDs: T6a
- Product priority: P1
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M09-*` when that directory exists.

## Current repository evidence
notification_outbox and notifications are schema-only after RENT-009. ADR-004 says workers run after commit. No worker exists.

## Scope and non-goals
Worker claims PENDING rows with locked_until, writes the inbox row, and marks DELIVERED. Failures increment attempts, set last_error without secrets, and stop after a configured maximum. Hook the existing transaction writers to insert the outbox row.

Non-goals:
- Do not use the queue as the only record of the business event.
- Do not put document bytes or tokens in the payload.
- Do not build the inbox UI here.
- Do not send SMS.

## Implementation checklist
- [ ] Add the claim and delivery job.
- [ ] Cover crash-before-delivered and duplicate event_key.
- [ ] Redact last_error.

## API and data contract
Outbox insert is in the business transaction. Worker is after commit. notifications unique on recipient and event_key. Status moves PENDING to PROCESSING to DELIVERED or FAILED.

## Acceptance criteria
- [ ] Retry after a crash delivers one inbox row.
- [ ] Two workers cannot deliver the same event_key twice.
- [ ] The payload test fixture contains ids only.
- [ ] A permanently failed row is FAILED and visible to the log.

## Tests and evidence
Postgres tests for rollback isolation, retry, and the unique inbox row.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #96
- RENT-009 (GitHub #17)
- RENT-067 (GitHub #10)
- RENT-048 (GitHub #66)

## Ownership and review
- Planning owner: Member B
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: high
- Tentative estimate: 1.5 days
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M09`, priority `P1`, risk `high`
- Publication: GitHub issue #72

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

