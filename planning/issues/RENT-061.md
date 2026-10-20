<!-- rentos-task: RENT-061 -->

## Outcome
An admin can move an OPEN report to REVIEWING, then resolve or dismiss it with a reason. Resolve can suspend the listing in the same transaction. Suspend and restore also exist as explicit admin actions. Restore clears the suspension and does not set publication_status back to PUBLISHED. Owner edits cannot clear the suspension.

## References
- Requirement IDs: FR39, FR78
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR39-AC01, FR39-AC02, FR39-AC03, FR39-AC04, FR78-AC01, FR78-AC02, FR78-AC03, FR78-AC04, FR78-AC05
- Module: M08
- Rubric IDs: T4d
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M08-*` when that directory exists.

## Current repository evidence
Admin report and suspend routes are in api-design.md and absent. BR03 separates suspension from initial review and from owner publication.

## Scope and non-goals
Admin report index and the review, resolve, dismiss, suspend, and restore actions. Lock report and listing. Required reason on terminal decisions and on suspend. Audit plus a sanitized reporter outbox event in the same transaction. expected_revision on the report and listing.

Non-goals:
- Do not let D implement these writes.
- Do not auto-suspend from a count.
- Do not republish on restore.
- Do not reopen a terminal report.
- Do not expose internal notes to the reporter notification.

## Implementation checklist
- [ ] Add the admin controller and policies.
- [ ] Make suspend atomic with resolve when requested.
- [ ] Restore only the suspension fields.
- [ ] Return 409 on stale revision or a second terminal decision.

## API and data contract
POST review 200 REVIEWING. POST resolve and dismiss require reason. Optional suspend true on resolve sets admin_suspended_at, admin_suspended_by, and suspension_reason. POST suspend and restore are separate. 403 for non-admin. 409 for stale or terminal replay. Owner publish still fails while suspended.

## Acceptance criteria
- [ ] A failed audit rolls back the suspension.
- [ ] Two admins resolving one report produce one terminal state and one 409.
- [ ] Owner title edit leaves admin_suspended_at set.
- [ ] Restore leaves a HIDDEN listing HIDDEN.
- [ ] Dismiss without reason returns 422.

## Tests and evidence
Postgres transaction tests for atomic suspend, double resolve, owner edit, and restore. These are privilege tests, not UI tests.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #95
- RENT-059 (GitHub #53)
- RENT-033 (GitHub #47)

## Ownership and review
- Planning owner: Member B
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: high
- Tentative estimate: 1.5 days
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M08`, priority `P0`, risk `high`
- Publication: GitHub issue #60

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

