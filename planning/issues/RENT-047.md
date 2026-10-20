<!-- rentos-task: RENT-047 -->

## Outcome
The owner opens a list of enquiries, reads the contact details, and rejects a pending enquiry with a reason. The screen says acceptance happens only when a tenancy proposal is sent. It links to that later flow without implementing it.

## References
- Requirement IDs: FR29, FR31
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR29-AC01, FR29-AC02, FR29-AC03, FR29-AC04, FR31-AC01, FR31-AC02, FR31-AC03
- Module: M05
- Rubric IDs: None
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M05-*` when that directory exists.

## Current repository evidence
No owner enquiry UI exists. Reject API is RENT-046.

## Scope and non-goals
Route /app/owner/requests. List, detail, and reject form. Loading, empty, and error states.

Non-goals:
- Do not show an Accept button.
- Do not display other owners' inboxes.
- Do not collect proposal rent here.

## Implementation checklist
- [ ] Build list and reject form.
- [ ] Copy explains offline discussion.
- [ ] Show 422 and 409.

## API and data contract
Uses the owner inbox and reject routes. The UI does not post to an accept URL.

## Acceptance criteria
- [ ] Reject with a blank reason shows an error and does not send, and a server 422 is also shown.
- [ ] Empty inbox has an empty state.
- [ ] No accept control is rendered.

## Tests and evidence
UI tests for the list, blank reason, and absence of an accept control.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #93
- RENT-015 (GitHub #24)
- RENT-046 (GitHub #58)

## Ownership and review
- Planning owner: Member C
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: low
- Tentative estimate: 0.5 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M05`, priority `P0`, risk `low`
- Publication: GitHub issue #65

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

