<!-- rentos-task: RENT-069 -->

## Outcome
A user can list only their notifications and mark one read. Marking read is idempotent. Another user's notification id returns 404.

## References
- Requirement IDs: FR73
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR73-AC01, FR73-AC02, FR73-AC03
- Module: M09
- Rubric IDs: None
- Product priority: P1
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M09-*` when that directory exists.

## Current repository evidence
GET /api/v1/me/notifications is specified and absent. Delivery is RENT-068.

## Scope and non-goals
Index and read action. Pagination. No admin broadcast endpoint.

Non-goals:
- Do not let a user mark someone else's row.
- Do not delete notifications in this slice.
- Do not include outbox last_error in the resource.

## Implementation checklist
- [ ] Add the controller and policy.
- [ ] Filter by recipient_id from the token.
- [ ] Make read idempotent.

## API and data contract
GET 200 private, no-store. POST /api/v1/me/notifications/{notification}/read 200. Second read stays read. 404 for another recipient. 401 unauthenticated.

## Acceptance criteria
- [ ] Read twice returns 200 and one read timestamp.
- [ ] The JSON omits last_error and internal report notes.
- [ ] Empty inbox is an empty page, not an error.

## Tests and evidence
Feature tests for isolation, idempotent read, and the empty page.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #96
- RENT-068 (GitHub #72)

## Ownership and review
- Planning owner: Member B
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: medium
- Tentative estimate: 0.5 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M09`, priority `P1`, risk `medium`
- Publication: GitHub issue #80

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

