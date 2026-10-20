<!-- rentos-task: RENT-064 -->

## Outcome
The admin can mark a report reviewing, resolve it, or dismiss it. Resolve and dismiss require a reason and send the report revision. Optional suspension is a checkbox that posts suspend true and a suspension reason, and the server still performs the transaction. A 409 asks for a reload.

## References
- Requirement IDs: FR39
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR39-AC01, FR39-AC02, FR39-AC03, FR39-AC04
- Module: M08
- Rubric IDs: None
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M08-*` when that directory exists.

## Current repository evidence
Write routes belong to RENT-061. D owns the form and its tests.

## Scope and non-goals
Forms on the detail page. Disable while submitting. Show 422 and 409. Do not compute the new status locally as the saved state; refetch.

Non-goals:
- Do not lock rows in the browser.
- Do not allow a blank terminal reason.
- Do not restore a listing from this form.
- Do not send internal notes as the reporter summary unless the admin typed that summary in the public field.

## Implementation checklist
- [ ] Wire review, resolve, and dismiss.
- [ ] Require reasons.
- [ ] Send expected_revision from the loaded report.

## API and data contract
Bodies match RENT-061. Public resolution_summary and suspension_reason are separate fields. No reviewer id in the body.

## Acceptance criteria
- [ ] Resolve sends the revision and shows the refetched terminal status.
- [ ] 409 shows reload.
- [ ] The suspend checkbox adds the boolean and reason rather than calling a different client-side status.
- [ ] Double click sends one request from the disabled form.

## Tests and evidence
UI tests for blank reason, resolve payload, and 409.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #95
- RENT-063 (GitHub #30)
- RENT-061 (GitHub #60)

## Ownership and review
- Planning owner: Member D
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: medium
- Tentative estimate: 0.5 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M08`, priority `P0`, risk `medium`
- Publication: GitHub issue #67

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

