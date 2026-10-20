<!-- rentos-task: RENT-044 -->

## Outcome
A tenant can submit one pending enquiry for a visible listing with contact name, phone, desired dates, message, and optional preferred unit. The request stays PENDING and reserves nothing. A second pending enquiry for the same pair is rejected. The tenant can withdraw only while it is PENDING.

## References
- Requirement IDs: FR25, FR26, FR28, FR42
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR25-AC01, FR25-AC02, FR25-AC03, FR25-AC04, FR25-AC05, FR26-AC01, FR26-AC02, FR26-AC03, FR28-AC01, FR28-AC02, FR28-AC03, FR42-AC01, FR42-AC02, FR42-AC03, FR42-AC04
- Module: M05
- Rubric IDs: T4a
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M05-*` when that directory exists.

## Current repository evidence
No rental request controller exists. api-design.md forbids a manual accept route. BR07 says discussion stays pending.

## Scope and non-goals
POST /api/v1/listings/{listing}/rental-requests, GET /api/v1/me/rental-requests, POST withdraw. Idempotency via client_operation_id. Preferred unit must belong to the listing property. Hidden or suspended listing returns 404.

Non-goals:
- Do not set ACCEPTED here.
- Do not insert a tenancy or blocked dates.
- Do not let the owner withdraw.
- Do not run the 15-day job here.

## Implementation checklist
- [ ] Add the controller, requests, and policy.
- [ ] Unique pending pair returns the existing conflict behavior.
- [ ] Withdraw checks status and expected_revision.

## API and data contract
POST 201 PENDING. Duplicate pending 409. Withdraw 200 WITHDRAWN. 409 if not pending. 422 for missing phone, reversed dates, or a period that the client sent incomplete. Dates are desires, not a hold. 401 for guests.

## Acceptance criteria
- [ ] Create stores the contact snapshot and does not write tenancies.
- [ ] Second pending create returns 409.
- [ ] Withdraw from PENDING succeeds and a second withdraw returns 409.
- [ ] Suspended listing returns 404.
- [ ] Preferred unit from another property returns 422.

## Tests and evidence
Feature tests for create, duplicate, withdraw, and no tenancy row. Include an idempotent replay.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #93
- RENT-017 (GitHub #25)
- RENT-008 (GitHub #16)
- RENT-033 (GitHub #47)

## Ownership and review
- Planning owner: Member A
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: high
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M05`, priority `P0`, risk `high`
- Publication: GitHub issue #52

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

