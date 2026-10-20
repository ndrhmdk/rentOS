<!-- rentos-task: RENT-045 -->

## Outcome
From a listing, a signed-in tenant submits an enquiry and then sees it as pending on a private list. The copy says the owner will discuss by phone and that the dates are not reserved. The tenant can withdraw a pending row. Guests are asked to sign in.

## References
- Requirement IDs: FR25, FR27, FR28
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR25-AC01, FR25-AC02, FR25-AC03, FR25-AC04, FR25-AC05, FR27-AC01, FR27-AC02, FR27-AC03, FR27-AC04, FR28-AC01, FR28-AC02, FR28-AC03
- Module: M05
- Rubric IDs: T3e
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M05-*` when that directory exists.

## Current repository evidence
No enquiry form exists. The API is RENT-044.

## Scope and non-goals
Form on the listing detail and /app/tenant/requests. Show status, dates, and withdraw. Empty, loading, and error states. Do not show other tenants.

Non-goals:
- Do not add an accept button.
- Do not show owner private notes.
- Do not reserve a unit in the optimistic UI.

## Implementation checklist
- [ ] Build the form and list.
- [ ] Explain pending versus reserved.
- [ ] Handle duplicate 409 by showing the existing request.

## API and data contract
Posts the RENT-044 body including client_operation_id. Lists only the caller's requests.

## Acceptance criteria
- [ ] Guest is redirected to sign in.
- [ ] Withdraw updates the row to withdrawn.
- [ ] A duplicate submit shows the conflict message.
- [ ] Empty list has an empty state.

## Tests and evidence
UI tests for guest, success, duplicate, and withdraw.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #93
- RENT-040 (GitHub #55)
- RENT-044 (GitHub #52)

## Ownership and review
- Planning owner: Member C
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: medium
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M05`, priority `P0`, risk `medium`
- Publication: GitHub issue #62

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

