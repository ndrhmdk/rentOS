<!-- rentos-task: RENT-046 -->

## Outcome
An owner sees pending enquiries for managed properties, including the private contact snapshot, and can reject one with a required reason. There is no accept endpoint. Rejection does not create or release a hold, because none exists.

## References
- Requirement IDs: FR29, FR31
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR29-AC01, FR29-AC02, FR29-AC03, FR29-AC04, FR31-AC01, FR31-AC02, FR31-AC03
- Module: M05
- Rubric IDs: T4a
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M05-*` when that directory exists.

## Current repository evidence
api-design.md lists GET /api/v1/owner/rental-requests and POST reject, and says acceptance happens only inside the proposal transaction. No owner inbox exists.

## Scope and non-goals
Owner index scoped by properties.owner_id. Reject requires reason and expected_revision, from PENDING only. Audit the rejection when the audit writer is available.

Non-goals:
- Do not add POST accept.
- Do not show enquiries for other owners.
- Do not include the proposal form in this issue.
- Do not email the tenant synchronously as the only record.

## Implementation checklist
- [ ] Add the owner index and reject action.
- [ ] Authorize through property ownership.
- [ ] Require the reason.
- [ ] Leave status PENDING for rows the owner does not reject.

## API and data contract
GET 200 own contacts only. POST reject 200 REJECTED. 422 without reason. 409 if not PENDING or revision is stale. 404 for another owner's request id.

## Acceptance criteria
- [ ] Another owner receives 404.
- [ ] Reject stores the reason.
- [ ] A route named accept is absent.
- [ ] Stale revision returns 409.

## Tests and evidence
Feature tests for scope, reason, stale revision, and the missing accept route.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #93
- RENT-044 (GitHub #52)

## Ownership and review
- Planning owner: Member A
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: high
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M05`, priority `P0`, risk `high`
- Publication: GitHub issue #58

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

