<!-- rentos-task: RENT-056 -->

## Outcome
The tenant of a CONFIRMED or ACTIVE tenancy can submit one PENDING renewal request with a later end date and a positive proposed rent. It does not extend the confirmed span. The tenant can withdraw it. The owner can reject it with a reason. A second pending request for the same tenancy is rejected by the unique rule.

## References
- Requirement IDs: FR68, FR69, FR42
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR68-AC01, FR68-AC02, FR68-AC03, FR68-AC04, FR69-AC01, FR69-AC02, FR69-AC03, FR69-AC04, FR42-AC01, FR42-AC02, FR42-AC03, FR42-AC04
- Module: M07
- Rubric IDs: None
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M07-*` when that directory exists.

## Current repository evidence
tenancy_renewal_requests is migrated in RENT-008 and has no HTTP actions. BR13 says a pending request is not yet a new segment.

## Scope and non-goals
POST /api/v1/tenancies/{tenancy}/renewal-requests, withdraw, and owner reject. No blocked-date change in this issue.

Non-goals:
- Do not insert a renewal contract here.
- Do not change confirmed_end_date.
- Do not allow two PENDING rows.
- Do not accept the renewal in this issue.

## Implementation checklist
- [ ] Add the three actions.
- [ ] Validate the requested end is after the confirmed end.
- [ ] Enforce one pending row.

## API and data contract
POST 201 PENDING. Duplicate 409. Withdraw 200 CANCELLED. Owner reject 200 REJECTED with review_reason. 422 for a non-later date or non-positive rent. 403 for a non-party.

## Acceptance criteria
- [ ] Second pending create returns 409.
- [ ] Withdraw and reject require the pending status.
- [ ] Blank owner reason returns 422.
- [ ] A tenancy that is only PENDING_CONFIRMATION cannot request renewal.

## Tests and evidence
Feature tests for create, duplicate, withdraw, reject, and unchanged confirmed dates.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #94
- RENT-052 (GitHub #76)

## Ownership and review
- Planning owner: Member A
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: high
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M07`, priority `P0`, risk `high`
- Publication: GitHub issue #82

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

