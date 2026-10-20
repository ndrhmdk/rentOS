<!-- rentos-task: RENT-037 -->

## Outcome
On the detail page, an admin can approve the package or reject it with a required reason. The form sends the expected revisions from the detail payload. A 409 tells the admin the package changed and must be reloaded. A 422 keeps the reason field and shows the error. The form does not decide the transition locally.

## References
- Requirement IDs: FR14, FR15
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR14-AC01, FR14-AC02, FR14-AC03, FR14-AC04, FR15-AC01, FR15-AC02, FR15-AC03
- Module: M08
- Rubric IDs: None
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M08-*` when that directory exists.

## Current repository evidence
Decision routes are specified in api-design.md and implemented in RENT-032. D owns the form, not the lock.

## Scope and non-goals
Approve button with confirmation. Reject form with a required reason textarea. Disable buttons while the request is in flight. Reload detail after success.

Non-goals:
- Do not reimplement revision comparison in the client as the source of truth.
- Do not clear suspension.
- Do not allow an empty reason by disabling HTML validation only.
- Do not add changes-requested.

## Implementation checklist
- [ ] Wire POST approve and POST reject.
- [ ] Show 409 and 422.
- [ ] Prevent a double submit in the component while still allowing the server to reject a true race.

## API and data contract
POST bodies contain expected_revision, expected_content_revision, and reason for reject. No is_admin field.

## Acceptance criteria
- [ ] Approve sends the revisions from the loaded detail and shows the approved state from the response.
- [ ] Empty reject reason does not call the API and shows a field error; a server 422 is also shown.
- [ ] 409 shows a reload message and leaves the previous status visible.
- [ ] A second click while saving does not fire a second request from the same view.

## Tests and evidence
UI tests with a mocked API for success, 422, and 409. Assert the request body contains the expected revisions.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #91
- RENT-036 (GitHub #29)
- RENT-032 (GitHub #46)

## Ownership and review
- Planning owner: Member D
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: medium
- Tentative estimate: 0.5 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M08`, priority `P0`, risk `medium`
- Publication: GitHub issue #48

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

